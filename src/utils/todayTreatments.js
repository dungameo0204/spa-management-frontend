import { dateOnly } from './format'

export function treatmentCards(root) {
  return [root, ...(root.children || []).flatMap(treatmentCards)]
}

export function todayTreatmentRows(roots, details, day, branchId, includeCreated = true) {
  const matchesBranch = id => !branchId || Number(id) === Number(branchId)
  return roots.flatMap((root, index) => {
    const detail = details[index]
    const card = { ...root, ...detail?.data }
    const historiesFor = item => (item.histories || []).filter(history => dateOnly(history.execution_date) === day && matchesBranch(history.branch_id) && !history.deleted_at)
    const createdToday = includeCreated && dateOnly(card.created_at) === day && (!card.branch_id || matchesBranch(card.branch_id))

    if (card.children?.length) {
      const visits = treatmentHistoryGroups(card).filter(group => group.day === day && matchesBranch(group.branch_id))
      if (!visits.length && !createdToday) return []
      if (!visits.length) {
        const groupKey = `${card.id}-new`
        return [{ card, detail, group: true, groupKey, groupTitle: card.product_name, history: null, sessions: [] }, ...card.children.map(child => ({ card: { ...child, customer_name: child.customer_name || card.customer_name, branch_id: child.branch_id ?? card.branch_id }, detail, history: null, child: true, groupKey, parentHistory: null }))]
      }
      return visits.flatMap(visit => {
        const groupRow = { card, detail, group: true, groupKey: visit.key, groupTitle: card.product_name, history: visit.history, sessions: visit.sessions }
        const children = card.children.map(child => {
          const session = visit.sessions.find(entry => Number(entry.card.id) === Number(child.id))
          return { card: { ...child, customer_name: child.customer_name || card.customer_name, branch_id: child.branch_id ?? card.branch_id }, detail, history: session?.history || null, child: true, groupKey: visit.key, parentHistory: visit.history }
        })
        return [groupRow, ...children]
      })
    }

    const histories = historiesFor(card)
    if (!histories.length && !createdToday) return []
    return histories.length ? histories.map(history => ({ card, detail, history, child: false, multiple: histories.length > 1 })) : [{ card, detail, history: null, child: false }]
  })
}

export function canExecuteCard(card) {
  return !card.closed_at && !card.children?.length && (card.remaining_sessions === null || Number(card.remaining_sessions) > 0)
}

export function isTreatmentComplete(card) {
  if (card.closed_at) return true
  if (card.children?.length) return card.children.every(isTreatmentComplete)
  return card.remaining_sessions != null && Number(card.remaining_sessions) <= 0
}

export function canCloseTreatment(card) {
  return !isTreatmentComplete(card) && treatmentCards(card).some(item => !item.closed_at && (item.total_sessions === null || item.remaining_sessions === null))
}

function historyTime(history) {
  return String(history.created_at || history.execution_date || '')
}

function legacyHistoryGroups(card, parentChildHistoryIds) {
  const buckets = new Map()
  for (const child of card.children || []) {
    for (const history of child.histories || []) {
      if (history.deleted_at || history.parent_history_id != null || parentChildHistoryIds.has(Number(history.id))) continue
      const session = { card: { ...child, customer_name: child.customer_name || card.customer_name }, history }
      // Older grouped executions copied the exact SVG onto each selected child.
      // Unsigned legacy rows were inserted together, so their contiguous database
      // IDs are the only available shared marker. Never bridge an ID gap.
      const key = [dateOnly(history.execution_date), history.branch_id ?? '', history.customer_signature_svg || '__unsigned__'].join('|')
      const bucket = buckets.get(key) || []
      bucket.push(session)
      buckets.set(key, bucket)
    }
  }

  const groups = []

  for (const [bucketKey, sessions] of buckets) {
    const visits = []
    for (const session of [...sessions].sort((a, b) => historyTime(a.history).localeCompare(historyTime(b.history)) || Number(a.history.id) - Number(b.history.id))) {
      const historyId = Number(session.history.id)
      // A repeated child or a discontinuous ID starts a new customer visit.
      // Do not infer across gaps: unrelated legacy executions can share a day.
      let visit = visits.find(candidate => candidate.lastHistoryId === historyId - 1 && !candidate.childIds.has(Number(session.card.id)))
      if (!visit) {
        visit = { childIds: new Set(), sessions: [], lastHistoryId: null }
        visits.push(visit)
      }
      visit.childIds.add(Number(session.card.id))
      visit.sessions.push(session)
      visit.lastHistoryId = historyId
    }
    visits.forEach((visit, index) => {
      const history = visit.sessions[0].history
      groups.push({
        key: `legacy:${bucketKey}:${index}`,
        history,
        historyId: history.id,
        day: dateOnly(history.execution_date),
        branch_id: history.branch_id,
        branch_name: history.branch_name,
        firstCreatedAt: historyTime(history),
        sessions: visit.sessions,
        legacy: true,
      })
    })
  }
  return groups
}

// New visits are explicit parent treatment-history records. Child-only legacy rows
// use the copied SVG, or contiguous IDs for unsigned rows, as display-only markers.
export function treatmentHistoryGroups(card) {
  const cards = treatmentCards(card)
  const childOrder = new Map((card.children || []).map((child, index) => [Number(child.id), index]))
  const parentVisits = (card.histories || []).filter(history => !history.deleted_at && Array.isArray(history.children))
  const parentChildHistoryIds = new Set(parentVisits.flatMap(history => history.children || []).map(history => Number(history.id)))
  const groups = parentVisits.map(history => ({
    key: `history:${history.id}`,
    history,
    historyId: history.id,
    day: dateOnly(history.execution_date),
    branch_id: history.branch_id,
    branch_name: history.branch_name,
    firstCreatedAt: history.created_at || history.execution_date,
    sessions: history.children.filter(child => !child.deleted_at).map(child => {
      const childCard = cards.find(candidate => Number(candidate.id) === Number(child.treatment_id))
      return { card: { ...(childCard || { id: child.treatment_id, product_name: `Dịch vụ #${child.treatment_id}` }), customer_name: card.customer_name }, history: child }
    }),
  }))

  groups.push(...legacyHistoryGroups(card, parentChildHistoryIds))
  for (const group of groups) group.sessions.sort((a, b) => (childOrder.get(Number(a.card.id)) ?? 999) - (childOrder.get(Number(b.card.id)) ?? 999))
  return groups.sort((a, b) => String(b.firstCreatedAt).localeCompare(String(a.firstCreatedAt)) || Number(b.historyId) - Number(a.historyId))
}