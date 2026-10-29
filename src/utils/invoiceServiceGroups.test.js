import { describe, expect, it } from 'vitest'
import { hasInvoiceSessionsToPerform, invoiceServiceGroupPayload, serviceGroupForProduct, validateInvoiceServiceGroups, validateInvoiceSessionMetadata } from './invoiceServiceGroups'
import { invoiceLineFromApi } from './invoice'
import { invoiceTotal, priceLineForProduct } from './invoice'

describe('invoice service groups', () => {
  const product = { id: 20, name: 'Trị nám', is_product: 0, price: 30000000, child_service_ids: [12, 15] }
  const line = { quantity: 1, serviceChildren: [{ product_id: 12, total_sessions: '5' }, { product_id: 15, total_sessions: null }] }
  it('initializes ordered child allocations independently for each purchase', () => {
    const first = serviceGroupForProduct(product), second = serviceGroupForProduct(product)
    first[0].total_sessions = null
    expect(second).toEqual([{ product_id: 12, total_sessions: 1, performNow: true }, { product_id: 15, total_sessions: 1, performNow: true }])
    expect(serviceGroupForProduct({ ...product, is_product: 1 })).toEqual([])
  })
  it('preserves JSON null, sends no child prices and does not change legacy lines', () => {
    expect(JSON.parse(JSON.stringify(invoiceServiceGroupPayload(line)))).toEqual({ treatment: { total_sessions: null, children: [{ product_id: 12, total_sessions: 5 }, { product_id: 15, total_sessions: null }] } })
    expect(invoiceServiceGroupPayload({})).toEqual({})
  })
  it.each(['', undefined, -1, 0, '1.5', 'abc', 2147483648])('rejects invalid finite sessions: %s', value => {
    expect(validateInvoiceServiceGroups([{ ...line, serviceChildren: [{ product_id: 12, total_sessions: value }] }])).not.toBe('')
  })
  it('accepts explicit lifetime and requires one package per line', () => {
    expect(validateInvoiceServiceGroups([line])).toBe('')
    expect(validateInvoiceServiceGroups([{ ...line, quantity: 2 }])).toMatch(/số lượng 1/)
  })
  it('allows quantity equal to finite standalone sessions, not child packages or lifetime', () => {
    const standalone = { quantity:10, treatmentConfigured:true, treatmentTotalSessions:10, serviceChildren:[] }
    expect(validateInvoiceServiceGroups([standalone])).toBe('')
    expect(validateInvoiceServiceGroups([{ ...standalone, quantity:9 }])).not.toBe('')
    expect(validateInvoiceServiceGroups([{ ...standalone, treatmentTotalSessions:null }])).not.toBe('')
    expect(validateInvoiceServiceGroups([{ ...standalone, serviceChildren:[{ product_id:12, total_sessions:10 }] }])).not.toBe('')
    expect(invoiceServiceGroupPayload(standalone)).toEqual({ treatment:{ total_sessions:10, children:[] } })
  })
  it('allows increasing parent price without charging children or changing catalog', () => {
    const priced = { ...priceLineForProduct(line, product), unit_price: 40000000 }
    expect(invoiceTotal({ items: [priced] })).toBe(40000000)
    expect(product.price).toBe(30000000)
  })
  it('hydrates actual cards and preserves parent/child totals and invoice item identity for PUT', () => {
    const hydrated = invoiceLineFromApi({ id: 123, product_id: 20, quantity: 1, treatment: { total_sessions: 8, children: [{ product_id: 12, product_name: 'Đã mua', total_sessions: null }] } })
    expect(hydrated.invoice_item_id).toBe(123)
    expect(invoiceServiceGroupPayload(hydrated)).toEqual({ treatment: { total_sessions: 8, children: [{ product_id: 12, total_sessions: null }] } })
    expect(hasInvoiceSessionsToPerform(hydrated)).toBe(false)
  })
  it('does not silently discard note/signature when all children are pending', () => {
    expect(hasInvoiceSessionsToPerform(line)).toBe(false)
    expect(validateInvoiceSessionMetadata([{ ...line, sessionSignature: '<svg/>' }], 1, [])).toBe('')
    expect(validateInvoiceSessionMetadata([{ ...line, sessionNote: 'Lưu ý', serviceChildren: [{ performNow: true }] }], 1, [])).toBe('')
  })
  it('rejects stale staff selections after branch changes', () => {
    const group = { serviceChildren: [{ performNow: true, staffBranchId: 1, performStaffs: [{ staff_id: 2 }] }] }
    expect(validateInvoiceSessionMetadata([group], 2, [{ id: 2, branch_id: 1 }])).toMatch(/chọn lại/)
    expect(validateInvoiceSessionMetadata([group], 1, [{ id: 2, branch_id: 1 }])).toBe('')
  })
})