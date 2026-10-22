import { describe, expect, it } from 'vitest'
import { validateInvoiceDraft, validateProductDraft, validateDateRange } from './validation'
describe('kiểm tra đầu vào', () => {
  it('chặn tiền ví không hợp lệ, vượt số dư hoặc vượt tổng hóa đơn', () => {
    const draft = { customer_id: 1, items: [{ product_id: 3, quantity: 1 }], total_amount: 1000000, wallet_balance: 800000, paid_amount: 0 }
    for (const wallet_used of [-1, NaN, Infinity, 900000]) expect(validateInvoiceDraft({ ...draft, wallet_used })).toMatch(/Tiền dùng ví/)
    expect(validateInvoiceDraft({ ...draft, total_amount: 300000, wallet_used: 400000 })).toMatch(/Tiền dùng ví/)
    expect(validateInvoiceDraft({ ...draft, wallet_used: 400000 })).toBe('')
    expect(validateInvoiceDraft({ ...draft, wallet_used: 0 })).toBe('')
  })
  it('không gửi kỳ báo cáo ngược', () => expect(validateDateRange({ startDate: '2026-10-10', endDate: '2026-10-09' })).toBeTruthy())
  it('yêu cầu hóa đơn có khách và mặt hàng', () => { expect(validateInvoiceDraft({ items: [] })).toBeTruthy(); expect(validateInvoiceDraft({ customer_id: 1, items: [{ product_id: 3, quantity: 1 }] })).toBe('') })
  it('không cho khách trả quá tổng tiền sau ví', () => { expect(validateInvoiceDraft({ customer_id: 1, items: [{ product_id: 3, quantity: 1 }], total_amount: 100, wallet_used: 30, paid_amount: 80 })).toBeTruthy() })
  it('chặn giá sản phẩm âm, bỏ trống hoặc giá bán vượt giá niêm yết', () => {
    expect(validateProductDraft({ name: 'Tinh dầu', price: -1, sale_price: 0 })).toBeTruthy()
    expect(validateProductDraft({ name: 'Tinh dầu', price: 100, sale_price: '' })).toBeTruthy()
    expect(validateProductDraft({ name: 'Tinh dầu', price: 100, sale_price: 101 })).toBeTruthy()
    expect(validateProductDraft({ name: 'Tinh dầu', price: 100, sale_price: 80 })).toBe('')
  })
})