import { expect, it } from 'vitest'
import { dailyRevenueColumns } from './dailyRevenue'

it('uses backend totals once and exports receipt payment methods', () => {
  const row = { totalRevenue: 150, serviceRevenue: 80, productRevenue: 20, legacyDebtRevenue: 50, receipts: { total: 200, debtPayments: 70, byPaymentMethod: { CASH: 80, TRANSFER: 70, CARD: 50, OTHER: 0 } }, netCashFlow: 180 }
  const read = label => dailyRevenueColumns([row]).find(column => column.label === label).value(row)
  expect(read('Tổng doanh thu')).toBe(150)
  expect(read('Doanh thu thu nợ cũ')).toBe(50)
  expect(read('Tiền thực thu')).toBe(200)
  expect(read('Thực thu tiền mặt')).toBe(80)
  expect(read('Thực thu chuyển khoản')).toBe(70)
  expect(read('Thực thu thẻ')).toBe(50)
  expect(read('Thu nợ')).toBe(70)
  expect(read('Dòng tiền thuần')).toBe(180)
  expect(dailyRevenueColumns([row]).map(column => column.label)).not.toContain('Thực thu khác / chưa xác định')
})

it('adds the other receipt column only when the period contains legacy payment data', () => {
  const row = { receipts: { byPaymentMethod: { OTHER: 25 } } }
  expect(dailyRevenueColumns([row]).find(column => column.label === 'Thực thu khác / chưa xác định').value(row)).toBe(25)
})