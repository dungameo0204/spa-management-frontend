const number = value => Number(value || 0)
export const roundMoney = amount => Math.round((amount + Number.EPSILON) * 100) / 100
export function pairedDiscount(base, value, changed) {
  const total = Math.max(0, number(base))
  if (changed === 'percent') {
    const percent = Math.max(0, Math.min(100, number(value)))
    return { discount_percent: value, discount_amount: roundMoney(total * percent / 100), discount_mode: 'percent' }
  }
  const amount = Math.max(0, Math.min(total, number(value)))
  return { discount_amount: value, discount_percent: total ? roundMoney(amount * 100 / total) : 0, discount_mode: 'amount' }
}
export function discountValue(base, item) {
  if (item.discount_mode === 'percent') return roundMoney(base * Number(item.discount_percent || 0) / 100)
  if (item.discount_mode === 'amount') return Number(item.discount_amount || 0)
  return roundMoney(base * Number(item.discount_percent || 0) / 100 + Number(item.discount_amount || 0))
}
export function discountPayload(item) {
  return { discount_percent: item.discount_mode === 'amount' ? 0 : Number(item.discount_percent || 0), discount_amount: item.discount_mode === 'percent' ? 0 : Number(item.discount_amount || 0) }
}
export function lineTotal(item) {
  const base = Math.max(0, number(item.quantity) * number(item.unit_price))
  return roundMoney(Math.max(0, base - discountValue(base, item)))
}
export function invoiceConsultants(item) {
  const people = item.consultants || []
  return people.length === 1 ? [{ ...people[0], revenue_amount: lineTotal(item) }] : people
}
export function validateConsultants(items) {
  for (const item of items || []) {
    const people = invoiceConsultants(item)
    const amounts = people.map(person => Number(person.revenue_amount))
    if (amounts.some(value => !Number.isFinite(value) || value < 0)) return 'Tiền tư vấn phải là số không âm.'
    if (roundMoney(amounts.reduce((sum, value) => sum + value, 0)) > lineTotal(item)) return `Tổng tiền tư vấn không được vượt giá sau chiết khấu của ${item.product_name || 'dòng bán hàng'}.`
  }
  return ''
}
export function invoiceTotal(invoice) {
  const base = (invoice.items || []).reduce((sum, item) => sum + lineTotal(item), 0)
  return roundMoney(Math.max(0, base - discountValue(base, invoice)))
}
export function paymentAmounts(total, walletBalance, useWallet, allowDebt, paid) {
  const wallet = useWallet ? Math.min(Math.max(0, number(walletBalance)), total) : 0
  const remaining = roundMoney(total - wallet)
  const cash = allowDebt ? Math.min(Math.max(0, number(paid)), remaining) : remaining
  return { wallet_used: wallet, paid_amount: cash, debt_amount: roundMoney(remaining - cash) }
}
export function paymentFromInput(total, walletBalance, useWallet, paid) {
  const wallet = useWallet ? Math.min(Math.max(0, number(walletBalance)), total) : 0
  const due = roundMoney(total - wallet)
  const cash = paid === '' || paid == null ? due : number(paid)
  return { wallet_used: wallet, paid_amount: cash, debt_amount: roundMoney(Math.max(0, due - cash)) }
}
export function priceLineForProduct(line, product) {
  const next = { ...line, product_id: product.id, product_name: product.name, unit_price: product.price }
  const base = Number(next.quantity || 0) * Number(product.price || 0)
  return { ...next, ...pairedDiscount(base, next.discount_mode === 'amount' ? next.discount_amount : next.discount_percent, next.discount_mode === 'amount' ? 'amount' : 'percent') }
}
export function synchronizeInvoiceDiscount(invoice) {
  const base = (invoice.items || []).reduce((sum, item) => sum + lineTotal(item), 0)
  const mode = invoice.discount_mode === 'amount' ? 'amount' : 'percent'
  return { ...invoice, ...pairedDiscount(base, mode === 'amount' ? invoice.discount_amount : invoice.discount_percent, mode) }
}
export function syncInvoicePayment(form, next) {
  return invoiceTotal(form) !== invoiceTotal(next) && !form.paidAmountEdited ? { ...next, paid_amount: undefined } : next
}