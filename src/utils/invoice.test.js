import { describe, expect, it } from 'vitest'
import { discountPayload, invoiceConsultants, invoiceLineFromApi, invoiceTotal, lineTotal, pairedDiscount, paymentAmounts, paymentFromInput, priceLineForProduct, refreshLineDiscount, synchronizeInvoiceDiscount, syncInvoicePayment, updateInvoiceLine, validateConsultants } from './invoice'
import { appointmentDate, toSqlDateTime } from './format'

describe('Ngày giờ gửi MySQL', () => {
  it('đổi timestamp sang giờ Việt Nam và giữ giờ nhập không có offset', () => {
    expect(toSqlDateTime('2026-10-09T15:02:13.000Z')).toBe('2026-10-09 22:02:13')
    expect(toSqlDateTime('2026-10-09T09:30')).toBe('2026-10-09 09:30:00')
  })
  it('giữ ngày hẹn đã chọn và đặt giờ mặc định theo schema DATETIME', () => {
    expect(appointmentDate('2026-10-10')).toBe('2026-10-10 09:00:00')
  })
})

describe('Chiết khấu và thanh toán', () => {
  it('tính đơn giá theo số buổi hữu hạn, cập nhật giảm giá và tiền khách trả', () => {
    let line = { quantity:1, unit_price:2000000, treatmentConfigured:true, treatmentTotalSessions:1, discount_mode:'percent', discount_percent:10 }
    line = updateInvoiceLine(line, 'treatmentTotalSessions', '10')
    expect(line).toMatchObject({ quantity:'10', discount_amount:2000000 })
    expect(lineTotal(line)).toBe(18000000)
    expect(invoiceTotal({ items:[line] })).toBe(18000000)
    expect(discountPayload(line)).toEqual({ discount_percent:10, discount_amount:0 })
    expect(paymentFromInput(invoiceTotal({ items:[line] }), 0, false).paid_amount).toBe(18000000)
    expect(lineTotal(updateInvoiceLine(line, 'treatmentTotalSessions', '5'))).toBe(9000000)
    const byAmount = updateInvoiceLine(line, 'discount_amount', 1000000)
    expect(lineTotal(byAmount)).toBe(19000000)
    expect(lineTotal(updateInvoiceLine(byAmount, 'treatmentTotalSessions', '5'))).toBe(9000000)
    const sale = { ...line, discount_mode:'unit_amount', unit_discount:200000 }
    expect(updateInvoiceLine(sale, 'treatmentTotalSessions', '10').discount_amount).toBe(2000000)
    expect(lineTotal(updateInvoiceLine(line, 'treatmentTotalSessions', null))).toBe(1800000)
  })
  it('mặc định dùng tối đa ví nhưng giữ đúng số tiền ví nhập thủ công, kể cả 0', () => {
    expect(paymentFromInput(1000000, 800000, true, undefined)).toEqual({ wallet_used: 800000, paid_amount: 200000, debt_amount: 0 })
    expect(paymentFromInput(1000000, 800000, true, undefined, '400000')).toEqual({ wallet_used: 400000, paid_amount: 600000, debt_amount: 0 })
    expect(paymentFromInput(1000000, 800000, true, 100000, '400000')).toEqual({ wallet_used: 400000, paid_amount: 100000, debt_amount: 500000 })
    expect(paymentFromInput(1000000, 800000, true, undefined, 0).wallet_used).toBe(0)
    expect(paymentFromInput(1000000, 800000, false, undefined, 400000).wallet_used).toBe(0)
    expect(paymentFromInput(300000, 800000, true, undefined).wallet_used).toBe(300000)
    expect(paymentFromInput(300000, 800000, true, undefined, 900000).wallet_used).toBe(900000)
  })
  it('đồng bộ khách trả khi tổng tiền thay đổi, trừ khi đã nhập tiền trả thủ công', () => {
    const old = { items: [{ quantity: 1, unit_price: 100000 }], paid_amount: 100000 }
    const next = { ...old, items: [{ quantity: 1, unit_price: 150000 }] }
    expect(syncInvoicePayment(old, next).paid_amount).toBeUndefined()
    expect(paymentFromInput(150000, 0, false, syncInvoicePayment(old, next).paid_amount).paid_amount).toBe(150000)
    expect(syncInvoicePayment({ ...old, paidAmountEdited: true, paid_amount: '50000' }, { ...next, paid_amount: '50000' }).paid_amount).toBe('50000')
    expect(syncInvoicePayment(old, { ...old, note: 'không đổi giá' }).paid_amount).toBe(100000)
  })
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
    const line = priceLineForProduct({ quantity: 2, discount_percent: 10 }, { id: 2, name: 'Dịch vụ', price: 200000, sale_price: 180000 })
    expect(line.discount_amount).toBe(40000)
    const form = synchronizeInvoiceDiscount({ items: [line], discount_percent: 10 })
    expect(invoiceTotal(form)).toBe(324000)
    expect(paymentAmounts(324000, 100000, true, false, undefined)).toEqual({ wallet_used: 100000, paid_amount: 224000, debt_amount: 0 })
    expect(paymentAmounts(324000, 100000, true, true, 50000).debt_amount).toBe(174000)
    expect(paymentFromInput(324000, 100000, true, '50000')).toEqual({ wallet_used: 100000, paid_amount: 50000, debt_amount: 174000 })
    expect(paymentFromInput(324000, 100000, true, undefined).debt_amount).toBe(0)
  })
  it('giữ snapshot là giá niêm yết, giảm tự động theo từng sản phẩm khi tăng số lượng', () => {
    const line = priceLineForProduct({ quantity: 1 }, { id: 3, name: 'Laser', price: 2000000, sale_price: 1800000 })
    expect(line).toMatchObject({ unit_price: 2000000, discount_percent: 10, discount_amount: 200000, discount_mode: 'unit_amount' })
    const four = refreshLineDiscount({ ...line, quantity: 4 })
    expect(four).toMatchObject({ discount_percent: 10, discount_amount: 800000 })
    expect(lineTotal(four)).toBe(7200000)
    expect(discountPayload(four)).toEqual({ discount_percent: 0, discount_amount: 800000 })
    const manual = { ...four, ...pairedDiscount(8000000, 300000, 'amount') }
    expect(refreshLineDiscount({ ...manual, quantity: 2 }).discount_amount).toBe(300000)
    const percent = { ...four, ...pairedDiscount(8000000, 15, 'percent') }
    expect(refreshLineDiscount({ ...percent, quantity: 2 }).discount_amount).toBe(600000)
  })
  it('giá bán lẻ vẫn chính xác khi phần trăm hiển thị bị làm tròn và hóa đơn cũ không bị tính lại', () => {
    const line = priceLineForProduct({ quantity: 3 }, { id: 4, name: 'Lẻ', price: 1000000, sale_price: 833333 })
    expect(line.discount_amount).toBe(500001)
    expect(lineTotal(line)).toBe(2499999)
    expect(discountPayload(line)).toEqual({ discount_percent: 0, discount_amount: 500001 })
    expect(priceLineForProduct({ quantity: 2 }, { id: 5, name: 'Cũ', price: 100 }).discount_amount).toBe(0)
    const existing = invoiceLineFromApi({ id: 1, product_id: 4, snapshot_name: 'Lẻ', snapshot_price: 1000000, quantity: 3, discount_percent: 0, discount_amount: 500001 })
    expect(lineTotal(existing)).toBe(2499999)
    expect(discountPayload(existing)).toEqual({ discount_percent: 0, discount_amount: 500001 })
    expect(refreshLineDiscount({ ...existing, quantity: 4 }).discount_amount).toBe(500001)
    const legacy = invoiceLineFromApi({ id: 2, product_id: 4, snapshot_price: 1000000, quantity: 1, discount_percent: 10, discount_amount: 10000 })
    expect(refreshLineDiscount({ ...legacy, quantity: 2 }).discount_amount).toBe(10000)
    expect(discountPayload(legacy)).toEqual({ discount_percent: 10, discount_amount: 10000 })
  })
})