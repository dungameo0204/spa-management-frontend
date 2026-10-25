import { describe, expect, it } from 'vitest'
import { validateCustomerBirthDate, validateTreatmentDraft, validateInvoiceDraft, validateProductDraft, validateDateRange } from './validation'
describe('kiểm tra đầu vào', () => {
  it('kiểm tra số buổi còn lại của thẻ cũ, bao gồm số 0', () => {
    const draft = { customer_id: 1, product_id: 2, total_sessions: 10, commission_base_price: 0, commission_quantity: 1 }
    for (const remaining_sessions of [undefined, 0, 4, 10, '4']) expect(validateTreatmentDraft({ ...draft, remaining_sessions })).toBe('')
    for (const remaining_sessions of [-1, 11, 1.5, '', null, true, NaN, Infinity]) expect(validateTreatmentDraft({ ...draft, remaining_sessions })).toMatch(/Số buổi còn lại/)
    for (const total_sessions of [0, -1, 1.5, 2147483648, true]) expect(validateTreatmentDraft({ ...draft, total_sessions })).toMatch(/Số buổi/)
  })
  it('ngày sinh tùy chọn phải là ngày lịch hợp lệ và không ở tương lai', () => {
    for (const value of [undefined, null, '', '2000-02-29', '1000-01-01', '2026-10-25']) expect(validateCustomerBirthDate(value, '2026-10-25')).toBe('')
    for (const value of ['1900-02-29', '2026-02-30', '2026-13-01', '0999-01-01', '2026-10-26', '21/08/1995']) expect(validateCustomerBirthDate(value, '2026-10-25')).toMatch(/Ngày sinh/)
  })
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