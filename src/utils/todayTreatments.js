import { dateOnly, formatSpaDate } from './format'

export function treatmentCards(root) {
  return [root, ...(root.children || []).flatMap(treatmentCards)]
}

export function todayTreatmentRows(roots, details, day, branchId) {
  const matchesBranch = id => !branchId || Number(id) === Number(branchId)
  return roots.flatMap((root, index) => {
    const detail = details[index]
    const card = { ...root, ...detail?.data }
    const cards = treatmentCards(card)
    const historiesFor = item => (item.histories || []).filter(history => dateOnly(history.execution_date) === day && matchesBranch(history.branch_id) && !history.deleted_at)

    const wasCreatedToday = dateOnly(card.created_at) === day && (!card.branch_id || matchesBranch(card.branch_id))
    const hasHistoriesToday = cards.some(item => historiesFor(item).length > 0)
    if (!wasCreatedToday && !hasHistoriesToday) return []

    // Combo liệu trình có các liệu trình con
    if (card.children?.length) {
      const todayGroups = treatmentHistoryGroups(card).filter(g => g.day === day && matchesBranch(g.branch_id))
      const sortedGroups = [...todayGroups].sort((a, b) => {
        const tA = new Date(a.firstCreatedAt || a.day).getTime()
        const tB = new Date(b.firstCreatedAt || b.day).getTime()
        return tA - tB
      })

      const unperformedChildren = cards.slice(1).filter(child => historiesFor(child).length === 0)

      // Chưa có lượt thực hiện nào hôm nay nhưng thẻ tạo hôm nay
      if (sortedGroups.length === 0) {
        const groupRow = {
          card,
          detail,
          group: true,
          groupKey: `${card.id}-new`,
          groupTitle: card.product_name,
          sessions: []
        }
        const childRows = cards.slice(1).map(child => ({
          card: { ...child, customer_name: card.customer_name, branch_id: child.branch_id ?? card.branch_id },
          detail,
          history: null,
          child: true,
          groupKey: `${card.id}-new`
        }))
        return [groupRow, ...childRows]
      }

      // Có đúng 1 nhóm thực hiện hôm nay
      if (sortedGroups.length === 1) {
        const g = sortedGroups[0]
        const groupRow = {
          card,
          detail,
          group: true,
          groupKey: g.key,
          groupTitle: card.product_name,
          sessions: g.sessions,
          signatureSvg: g.signatureSvg
        }
        const executedRows = g.sessions.map(({ card: childCard, history }) => ({
          card: childCard,
          detail,
          history,
          child: true,
          groupKey: g.key
        }))
        const unperformedRows = unperformedChildren.map(child => ({
          card: { ...child, customer_name: card.customer_name, branch_id: child.branch_id ?? card.branch_id },
          detail,
          history: null,
          child: true,
          groupKey: g.key
        }))
        return [groupRow, ...executedRows, ...unperformedRows]
      }

      // Có nhiều lượt thực hiện hôm nay (khách đến làm nhiều lần) -> tách riêng từng lượt
      const result = []
      sortedGroups.forEach((g) => {
        const title = card.product_name
        result.push({
          card,
          detail,
          group: true,
          groupKey: g.key,
          groupTitle: title,
          sessions: g.sessions,
          signatureSvg: g.signatureSvg
        })
        g.sessions.forEach(({ card: childCard, history }) => {
          result.push({
            card: childCard,
            detail,
            history,
            child: true,
            groupKey: g.key
          })
        })
      })

      // Nếu có các dịch vụ con chưa từng làm hôm nay và thẻ tạo hôm nay, tách nhóm chưa thực hiện
      if (unperformedChildren.length > 0 && wasCreatedToday) {
        result.push({
          card,
          detail,
          group: true,
          groupKey: `${card.id}-unperformed`,
          groupTitle: `${card.product_name} · Chưa thực hiện hôm nay`,
          sessions: []
        })
        unperformedChildren.forEach(child => {
          result.push({
            card: { ...child, customer_name: card.customer_name, branch_id: child.branch_id ?? card.branch_id },
            detail,
            history: null,
            child: true,
            groupKey: `${card.id}-unperformed`
          })
        })
      }

      return result
    }

    // Thẻ đơn (không có liệu trình con)
    const histories = historiesFor(card)
    const inherited = { ...card, customer_name: card.customer_name, branch_id: card.branch_id }
    return histories.length
      ? histories.map(history => ({ card: inherited, detail, history, multiple: histories.length > 1, child: false }))
      : [{ card: inherited, detail, history: null, child: false }]
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

function hasTime(val) {
  if (!val) return false
  const s = String(val)
  return s.includes(':') && !s.includes('T00:00:00') && !s.includes(' 00:00:00')
}

export function treatmentHistoryGroups(card) {
  const childCards = treatmentCards(card)
  const childOrderMap = new Map()
  childCards.forEach((c, idx) => childOrderMap.set(c.id, idx))

  const allEntries = []
  for (const item of childCards) {
    for (const history of item.histories || []) {
      if (history.deleted_at) continue
      const day = dateOnly(history.execution_date)
      const branchId = history.branch_id
      const hasRealClock = hasTime(history.created_at) || hasTime(history.execution_date)
      const time = new Date(history.created_at || history.execution_date).getTime()
      allEntries.push({
        card: { ...item, customer_name: card.customer_name },
        history,
        day,
        branchId,
        time,
        hasRealClock,
        id: Number(history.id || 0)
      })
    }
  }

  // Sắp xếp: ngày giảm dần; nếu có giờ thực tế thì giờ giảm dần; ngược lại giữ thứ tự thẻ con
  allEntries.sort((a, b) => {
    if (b.day !== a.day) return b.day.localeCompare(a.day)
    if (a.hasRealClock && b.hasRealClock && b.time !== a.time) return b.time - a.time
    const orderA = childOrderMap.get(a.card.id) ?? 999
    const orderB = childOrderMap.get(b.card.id) ?? 999
    if (orderA !== orderB) return orderA - orderB
    return a.id - b.id
  })

  const groups = []
  for (const entry of allEntries) {
    const { card: itemCard, history, day, branchId, time, hasRealClock, id } = entry
    const sig = history.customer_signature_svg || null

    const match = groups.find(g => {
      if (g.day !== day || Number(g.branch_id) !== Number(branchId)) return false
      // Một lượt làm không thể có 2 lần cùng một liệu trình con
      if (g.sessions.some(s => s.card.id === itemCard.id)) return false
      if (sig && g.signatureSvg && sig !== g.signatureSvg) return false
      if (hasRealClock && g.hasRealClock) {
        const diff = Math.abs(time - g.anchorTime)
        if (diff > 120 * 1000) return false
      }
      return true
    })

    if (match) {
      match.sessions.push({ card: itemCard, history })
      if (history.branch_name && !match.branch_name) match.branch_name = history.branch_name
      if (sig && !match.signatureSvg) match.signatureSvg = sig
      if (id > match.maxId) match.maxId = id
      if (id < match.minId) match.minId = id
    } else {
      groups.push({
        key: `${day}:${branchId ?? 'unknown'}:${hasRealClock ? Math.round(time / 1000) : groups.length}`,
        day,
        branch_id: branchId,
        branch_name: history.branch_name,
        signatureSvg: sig,
        anchorTime: time,
        hasRealClock,
        firstCreatedAt: history.created_at || null,
        maxId: id,
        minId: id,
        sessions: [{ card: itemCard, history }]
      })
    }
  }

  // Nhóm mới nhất luôn ở đầu (ngày giảm dần, giờ giảm dần)
  groups.sort((a, b) => {
    if (b.day !== a.day) return b.day.localeCompare(a.day)
    if (a.hasRealClock && b.hasRealClock && b.anchorTime !== a.anchorTime) {
      return b.anchorTime - a.anchorTime
    }
    return 0
  })

  // Định danh key và sắp xếp các dịch vụ con bên trong mỗi nhóm theo thứ tự cấu hình cố định của liệu trình
  for (const g of groups) {
    g.sessions.sort((a, b) => {
      const orderA = childOrderMap.get(a.card.id) ?? 999
      const orderB = childOrderMap.get(b.card.id) ?? 999
      if (orderA !== orderB) return orderA - orderB
      return (a.card.product_name || '').localeCompare(b.card.product_name || '')
    })
  }

  return groups
}
