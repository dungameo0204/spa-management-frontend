const number = value => Number(value || 0)
export function invoiceLineFromApi(line) {
  const base = Number(line.quantity || 0) * Number(line.snapshot_price || 0)
  const percent = Number(line.discount_percent || 0), amount = Number(line.discount_amount || 0)
  const discount = percent && amount ? { discount_percent: percent, discount_amount: amount, discount_mode: 'combined' } : amount ? pairedDiscount(base, amount, 'amount') : pairedDiscount(base, percent, 'percent')
  return { invoice_item_id: line.id, product_id: line.product_id, product_name: line.snapshot_name, quantity: line.quantity, unit_price: line.snapshot_price, ...discount, consultants: (line.consultants || []).map(c => ({ staff_id: c.staff_id, revenue_amount: c.revenue_amount, role_type: c.role_type })) }
}
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
  if (item.discount_mode === 'unit_amount') return roundMoney(Number(item.quantity || 0) * Number(item.unit_discount || 0))
  if (item.discount_mode === 'percent') return roundMoney(base * Number(item.discount_percent || 0) / 100)
  if (item.discount_mode === 'amount') return Number(item.discount_amount || 0)
  return roundMoney(base * Number(item.discount_percent || 0) / 100 + Number(item.discount_amount || 0))
}
export function discountPayload(item) {
  return { discount_percent: ['amount', 'unit_amount'].includes(item.discount_mode) ? 0 : Number(item.discount_percent || 0), discount_amount: item.discount_mode === 'percent' ? 0 : item.discount_mode === 'unit_amount' ? discountValue(Number(item.quantity || 0) * Number(item.unit_price || 0), item) : Number(item.discount_amount || 0) }
}
export function refreshLineDiscount(line) {
  const base = Number(line.quantity || 0) * Number(line.unit_price || 0)
  if (line.discount_mode === 'unit_amount') {
    const unitDiscount = Math.max(0, Math.min(Number(line.unit_price || 0), Number(line.unit_discount || 0)))
    const amount = roundMoney(Number(line.quantity || 0) * unitDiscount)
    return { ...line, unit_discount: unitDiscount, discount_amount: amount, discount_percent: base ? roundMoney(amount * 100 / base) : 0 }
  }
  if (line.discount_mode === 'combined') return line
  const mode = line.discount_mode === 'amount' ? 'amount' : 'percent'
  return { ...line, ...pairedDiscount(base, mode === 'amount' ? line.discount_amount : line.discount_percent, mode) }
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
export function paymentFromInput(total, walletBalance, useWallet, paid, walletAmount) {
  const wallet = useWallet ? (walletAmount == null ? Math.min(Math.max(0, number(walletBalance)), total) : number(walletAmount)) : 0
  const due = roundMoney(total - wallet)
  const cash = paid === '' || paid == null ? due : number(paid)
  return { wallet_used: wallet, paid_amount: cash, debt_amount: roundMoney(Math.max(0, due - cash)) }
}
export function priceLineForProduct(line, product) {
  const price = Number(product.price || 0)
  const salePrice = Number(product.sale_price ?? product.price ?? 0)
  const next = { ...line, product_id: product.id, product_name: product.name, unit_price: price, unit_discount: Math.max(0, price - salePrice), discount_mode: 'unit_amount' }
  return refreshLineDiscount(next)
}
export function synchronizeInvoiceDiscount(invoice) {
  const base = (invoice.items || []).reduce((sum, item) => sum + lineTotal(item), 0)
  const mode = invoice.discount_mode === 'amount' ? 'amount' : 'percent'
  return { ...invoice, ...pairedDiscount(base, mode === 'amount' ? invoice.discount_amount : invoice.discount_percent, mode) }
}
export function syncInvoicePayment(form, next) {
  return invoiceTotal(form) !== invoiceTotal(next) && !form.paidAmountEdited ? { ...next, paid_amount: undefined } : next
}