import { describe, expect, it } from 'vitest'
import { discountPayload, invoiceConsultants, invoiceTotal, lineTotal, pairedDiscount, paymentAmounts, paymentFromInput, priceLineForProduct, synchronizeInvoiceDiscount, validateConsultants } from './invoice'
import { appointmentDate, toSqlDateTime } from './format'

describe('Ngày giờ gửi MySQL', () => {
  it('loại bỏ ISO Z khi lưu hóa đơn mà không dịch giờ do trình duyệt', () => {
    expect(toSqlDateTime('2026-10-09T15:02:13.000Z')).toBe('2026-10-09 15:02:13')
    expect(toSqlDateTime('2026-10-09T09:30')).toBe('2026-10-09 09:30:00')
  })
  it('giữ ngày hẹn đã chọn và đặt giờ mặc định theo schema DATETIME', () => {
    expect(appointmentDate('2026-10-10')).toBe('2026-10-10 09:00:00')
  })
})

describe('Chiết khấu và thanh toán', () => {
  it('một tư vấn viên nhận toàn bộ tiền dòng sau giảm, nhiều người chia riêng và không vượt giá dòng', () => {
    const item = { product_name: 'Chăm sóc da', quantity: 1, unit_price: 200000, discount_percent: 10, consultants: [{ staff_id: 2, revenue_amount: 0 }] }
    expect(invoiceConsultants(item)).toEqual([{ staff_id: 2, revenue_amount: 180000 }])
    const split = { ...item, consultants: [{ staff_id: 2, revenue_amount: '100000' }, { staff_id: 3, revenue_amount: '80000' }] }
    expect(invoiceConsultants(split)).toEqual(split.consultants)
    expect(validateConsultants([split])).toBe('')
    expect(validateConsultants([{ ...split, consultants: [{ staff_id: 2, revenue_amount: 150000 }, { staff_id: 3, revenue_amount: 80000 }] }])).toMatch(/không được vượt/)
    expect(validateConsultants([{ ...split, consultants: [{ staff_id: 2, revenue_amount: -1 }, { staff_id: 3, revenue_amount: 0 }] }])).toMatch(/không âm/)
  })
  it('đồng bộ % và tiền nhưng chỉ gửi một loại giảm để tránh trừ hai lần', () => {
    const byPercent = pairedDiscount(500000, '10', 'percent')
    expect(byPercent).toMatchObject({ discount_amount: 50000, discount_mode: 'percent' })
    expect(discountPayload(byPercent)).toEqual({ discount_percent: 10, discount_amount: 0 })
    const byAmount = pairedDiscount(500000, '125000', 'amount')
    expect(byAmount.discount_percent).toBe(25)
    expect(discountPayload(byAmount)).toEqual({ discount_percent: 0, discount_amount: 125000 })
    expect(lineTotal({ quantity: 2, unit_price: 250000, ...byAmount })).toBe(375000)
  })
  it('tính lại giảm giá khi thay sản phẩm và tự tính số nợ còn lại', () => {
    const line = priceLineForProduct({ quantity: 2, discount_percent: 10 }, { id: 2, name: 'Dịch vụ', price: 200000 })
    expect(line.discount_amount).toBe(40000)
    const form = synchronizeInvoiceDiscount({ items: [line], discount_percent: 10 })
    expect(invoiceTotal(form)).toBe(324000)
    expect(paymentAmounts(324000, 100000, true, false, undefined)).toEqual({ wallet_used: 100000, paid_amount: 224000, debt_amount: 0 })
    expect(paymentAmounts(324000, 100000, true, true, 50000).debt_amount).toBe(174000)
    expect(paymentFromInput(324000, 100000, true, '50000')).toEqual({ wallet_used: 100000, paid_amount: 50000, debt_amount: 174000 })
    expect(paymentFromInput(324000, 100000, true, undefined).debt_amount).toBe(0)
  })
})