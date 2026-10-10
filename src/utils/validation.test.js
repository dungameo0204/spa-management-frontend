import { describe, expect, it } from 'vitest'
import { validateInvoiceDraft, validateProductDraft, validateDateRange } from './validation'
describe('kiểm tra đầu vào', () => {
  it('không gửi kỳ báo cáo ngược', () => expect(validateDateRange({ startDate: '2026-10-10', endDate: '2026-10-09' })).toBeTruthy())
  it('yêu cầu hóa đơn có khách và mặt hàng', () => { expect(validateInvoiceDraft({ items: [] })).toBeTruthy(); expect(validateInvoiceDraft({ customer_id: 1, items: [{ product_id: 3, quantity: 1 }] })).toBe('') })
  it('không cho khách trả quá tổng tiền sau ví', () => { expect(validateInvoiceDraft({ customer_id: 1, items: [{ product_id: 3, quantity: 1 }], total_amount: 100, wallet_used: 30, paid_amount: 80 })).toBeTruthy() })
  it('chặn giá sản phẩm âm', () => expect(validateProductDraft({ name: 'Tinh dầu', price: -1 })).toBeTruthy())
})