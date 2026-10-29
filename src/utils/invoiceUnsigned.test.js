import { expect, it } from 'vitest'
import { invoiceServiceGroupPayload, unsignedInvoiceSessions, validateInvoiceServiceGroups } from './invoiceServiceGroups'

it('only warns for unsigned active services, with one entry per parent', () => {
  expect(unsignedInvoiceSessions([
    { product_name: 'Đơn lẻ', performNow: true },
    { product_name: 'Gói', serviceChildren: [{ performNow: true }, { performNow: true }] },
    { product_name: 'Đã ký', performNow: true, sessionSignature: '<svg/>' },
    { product_name: 'Chưa làm', performNow: false },
    { product_name: 'Sản phẩm', is_product: 1, performNow: true },
    { product_name: 'Con chưa làm', serviceChildren: [{ performNow: false }] },
  ])).toEqual(['Đơn lẻ', 'Gói'])
})

it('serializes lifetime and finite standalone services without children', () => {
  const line = { quantity: 1, treatmentConfigured: true, treatmentTotalSessions: null }
  expect(validateInvoiceServiceGroups([line])).toBe('')
  expect(invoiceServiceGroupPayload(line)).toEqual({ treatment: { total_sessions: null, children: [] } })
  expect(invoiceServiceGroupPayload({ ...line, treatmentTotalSessions: '5' })).toEqual({ treatment: { total_sessions: 5, children: [] } })
})