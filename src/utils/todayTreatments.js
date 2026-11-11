import { dateOnly } from './format'

export function treatmentCards(root) {
  return [root, ...(root.children || []).flatMap(treatmentCards)]
}

export function findTreatmentHistory(card, historyId) {
  for (const treatment of treatmentCards(card)) {
    for (const history of treatment.histories || []) {
      if (Number(history.id) === Number(historyId)) return history
      const child = history.children?.find(entry => Number(entry.id) === Number(historyId))
      if (child) return child
    }
  }
  return null
}

export function todayTreatmentRows(roots, details, day, branchId) {
  const matchesBranch = id => !branchId || Number(id) === Number(branchId)
  return roots.flatMap((root, index) => {
    const detail = details[index]
    // The execution-date list is the authoritative snapshot for a real visit.
    // Do not merge a stale detail cache back over an explicit histories array,
    // otherwise a child removed by a grouped PUT can reappear in the table.
    const card = Array.isArray(root.histories) ? root : mergeTreatmentCards([root], detail?.data ? [detail.data] : [])[0]
    const cards = treatmentCards(card)
    const historiesFor = item => (item.histories || []).filter(history => dateOnly(history.execution_date) === day && matchesBranch(history.branch_id) && !history.deleted_at)

    const hasHistoriesToday = cards.some(item => historiesFor(item).length > 0)
    if (!hasHistoriesToday) return []

    // Group histories are explicit API relationships. Legacy histories without a parent remain separate rows.
    if (card.children?.length) {
      const childCards = card.children || []
      const groups = treatmentHistoryGroups(card).filter(group => group.day === day && matchesBranch(group.branch_id))
      return groups.flatMap(group => {
        const parentVisit = Array.isArray(group.history?.children)
        const visitChildren = parentVisit
          ? childCards.map(child => {
              const session = group.sessions.find(entry => Number(entry.card.id) === Number(child.id))
              return { card: { ...child, customer_name: child.customer_name || card.customer_name, branch_id: child.branch_id ?? card.branch_id }, detail, history: session?.history || null, child: true, groupKey: group.key, parentHistoryId: group.history.id }
            })
          : group.sessions.map(({ card: child, history }) => ({ card: child, detail, history, child: true, groupKey: group.key, parentHistoryId: null }))
        return [{ card, detail, group: true, groupKey: group.key, groupTitle: card.product_name, history: group.history, sessions: group.sessions }, ...visitChildren]
      })
    }

    // Thẻ đơn (không có liệu trình con)
    const histories = historiesFor(card)
    const inherited = { ...card, customer_name: card.customer_name, branch_id: card.branch_id }
    return histories.length
      ? histories.map(history => ({ card: inherited, detail, history, multiple: histories.length > 1, child: false }))
      : []
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

// API returns a treatment tree, not a relationship between execution histories.
// Keep the presentation wrapper, but every wrapper represents exactly one ID.
export function treatmentHistoryGroups(card) {
  const cards = treatmentCards(card)
  const groups = []
  for (const item of cards) {
    for (const history of item.histories || []) {
      if (history.deleted_at) continue
      if (Array.isArray(history.children)) {
        groups.push({
          key: `history:${history.id}`,
          history,
          historyId: history.id,
          day: dateOnly(history.execution_date),
          branch_id: history.branch_id,
          branch_name: history.branch_name,
          sessions: history.children.filter(child => !child.deleted_at).map(child => {
            const childCard = cards.find(candidate => Number(candidate.id) === Number(child.treatment_id))
            return { card: { ...(childCard || { id: child.treatment_id, product_name: `Dịch vụ #${child.treatment_id}` }), customer_name: card.customer_name }, history: child }
          }),
        })
      } else if (history.parent_history_id == null) {
        groups.push({ key: `history:${history.id}`, history, historyId: history.id, day: dateOnly(history.execution_date), branch_id: history.branch_id, branch_name: history.branch_name, sessions: [{ card: { ...item, customer_name: item.customer_name || card.customer_name }, history }] })
      }
    }
  }
  return groups
    .sort((a, b) => b.day.localeCompare(a.day) || Number(b.historyId) - Number(a.historyId))
}

// Merge partial list/detail responses recursively without discarding histories.
export function mergeTreatmentCards(...lists) {
  const result = new Map()
  for (const card of lists.flat()) {
    const previous = result.get(String(card.id))
    result.set(String(card.id), previous ? {
      ...previous, ...card,
      ...(Array.isArray(previous.histories) || Array.isArray(card.histories) ? {
        histories: [...new Map([...(previous.histories || []), ...(card.histories || [])].map(history => [String(history.id), history])).values()],
      } : {}),
      children: mergeTreatmentCards(previous.children || [], card.children || []),
    } : card)
  }
  return [...result.values()]
}