import { dateOnly } from './format'
import { treatmentHistoryGroups } from './todayTreatments'

export const cardName = card => card?.product_name || card?.name || `Dịch vụ #${card?.product_id || card?.id || ''}`

export function allTreatmentCards(roots = []) {
  const cards = [], seen = new Set()
  const add = card => {
    if (!card || seen.has(String(card.id))) return
    seen.add(String(card.id))
    cards.push(card)
    ;(card.children || []).forEach(add)
  }
  roots.forEach(add)
  return cards
}

const timeOf = history => String(history?.created_at || history?.execution_date || '')
const executionTimeOf = visit => String(visit?.execution_date || '')
const cardCreatedAt = card => String(card?.created_at || card?.invoice_date || card?.purchase_date || '')
const productKey = card => card?.product_id != null ? `product:${card.product_id}` : `card:${card?.id}`
// Keep line breaks that belong to one saved note. A visit can legitimately carry
// several notes (parent and child histories), but each saved note has one label.
const notesFor = values => [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
const staffNames = history => [...new Set((history?.staffs || []).map(staff => staff.staff_name || staff.fullname).filter(Boolean))]

function standaloneVisits(card) {
  return (card.histories || [])
    .filter(history => !history.deleted_at && history.parent_history_id == null)
    .map(history => ({
      id: `history:${history.id}`,
      execution_date: history.execution_date,
      created_at: timeOf(history),
      sessions: [{ card, history }],
      note: history.note,
      signature: history.customer_signature_svg,
    }))
}

function visitsForRoot(card) {
  if (!card.children?.length) return standaloneVisits(card)
  return treatmentHistoryGroups(card).map(group => ({
    id: group.key,
    execution_date: group.history.execution_date,
    created_at: group.firstCreatedAt,
    sessions: group.sessions,
    note: group.history.note,
    signature: group.history.customer_signature_svg || group.sessions.find(session => session.history.customer_signature_svg)?.history.customer_signature_svg,
  }))
}

export function treatmentRecordRows(roots = []) {
  const cards = allTreatmentCards(roots)
  const visits = roots.flatMap(visitsForRoot)
    .filter(row => row.sessions.length)
    // Treatment sheets are chronological by the business execution time. Creation
    // time and ID only make entries with the same execution time deterministic.
    .sort((a, b) => executionTimeOf(a).localeCompare(executionTimeOf(b)) || timeOf(a).localeCompare(timeOf(b)) || String(a.id).localeCompare(String(b.id)))
  const completedByProduct = new Map()

  const sessions = visits.flatMap(visit => visit.sessions.map(session => ({ ...session, visit })))
  const sessionsByDay = new Map()
  for (const session of sessions) {
    const day = dateOnly(session.history.execution_date || session.visit.execution_date)
    if (!day) continue
    if (!sessionsByDay.has(day)) sessionsByDay.set(day, [])
    sessionsByDay.get(day).push(session)
  }

  return [...sessionsByDay.entries()].map(([day, daySessions], index) => {
    const services = new Map()
    for (const session of daySessions) {
      const key = productKey(session.card)
      const completed = (completedByProduct.get(key) || 0) + 1
      completedByProduct.set(key, completed)
      const eligibleCards = cards.filter(card => productKey(card) === key && (Number(card.id) === Number(session.card.id) || (cardCreatedAt(card) && cardCreatedAt(card) <= timeOf(session.history))))
      const lifetime = eligibleCards.some(card => card.total_sessions === null)
      const total = lifetime ? null : eligibleCards.reduce((sum, card) => sum + (Number(card.total_sessions) || 0), 0)
      const service = services.get(key) || { key, name: cardName(session.card), completed: [], total, lifetime, staff: [] }
      service.completed.push(completed)
      service.total = total
      service.lifetime = lifetime
      const names = staffNames(session.history)
      if (names.length) service.staff.push(...names)
      services.set(key, service)
    }
    const serviceValues = [...services.values()]
    return {
      visitNumber: index + 1,
      id: `day:${day}`,
      execution_date: daySessions[0].history.execution_date || day,
      day,
      services: serviceValues.map(service => `${service.name} (lần ${service.completed.join(',')}/${service.lifetime ? 'Trọn gói' : service.total || '?'})`),
      staff: [...new Set(serviceValues.flatMap(service => service.staff))],
      notes: notesFor(daySessions.flatMap(session => [session.visit.note, session.history.note])),
      signature: daySessions.map(session => session.history.customer_signature_svg || session.visit.signature).find(Boolean),
    }
  })
}

export function paymentRecordRows(invoices = [], debtPayments = []) {
  const invoiceRows = invoices.map(invoice => ({
    id: `invoice:${invoice.id}`,
    date: invoice.invoice_date,
    content: `Thanh toán hóa đơn #${invoice.id}`,
    note: String(invoice.note || '').trim(),
    amount: Number(invoice.paid_amount || 0),
  }))
  const paymentRows = debtPayments.map(payment => ({
    id: `debt-payment:${payment.id}`,
    date: payment.payment_date,
    content: payment.invoice_id ? `Thanh toán bổ sung hóa đơn #${payment.invoice_id}` : 'Thanh toán bổ sung',
    amount: Number(payment.amount || 0),
  }))
  return [...invoiceRows, ...paymentRows].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || a.id.localeCompare(b.id))
}

const invoiceLogLine = /^\s*\d{1,2}\/\d{1,2}\/\d{4}\s*\[HĐ\s*#\d+[^\]]*\]/i

export function cleanCustomerNote(note) {
  return String(note || '')
    .split(/\r?\n/)
    .filter(line => !invoiceLogLine.test(line))
    .join('\n')
    .trim()
}