import { dateOnly } from './format'

export function treatmentCards(root) {
  return [root, ...(root.children || []).flatMap(treatmentCards)]
}

export function todayTreatmentRows(roots, details, day, branchId) {
  const matchesBranch = id => !branchId || Number(id) === Number(branchId)
  return roots.flatMap((root, index) => {
    const detail = details[index]
    const card = { ...root, ...detail?.data }
    const cards = treatmentCards(card)
    const historiesFor = item => (item.histories || []).filter(history => dateOnly(history.execution_date) === day && matchesBranch(history.branch_id))
    if (!(dateOnly(card.created_at) === day && (!card.branch_id || matchesBranch(card.branch_id))) && !cards.some(item => historiesFor(item).length)) return []
    const rowsFor = item => {
      const histories = historiesFor(item)
      const inherited = { ...item, customer_name: item.customer_name || card.customer_name, branch_id: item.branch_id ?? card.branch_id }
      return histories.length ? histories.map(history => ({ card: inherited, detail, history, multiple: histories.length > 1, child: item !== card })) : [{ card: inherited, detail, history: null, child: item !== card }]
    }
    return card.children?.length
      ? [{ card, detail, group: true }, ...cards.slice(1).flatMap(rowsFor)]
      : rowsFor(card)
  })
}

export function canExecuteCard(card) {
  return !card.closed_at && !card.children?.length && (card.remaining_sessions === null || Number(card.remaining_sessions) > 0)
}