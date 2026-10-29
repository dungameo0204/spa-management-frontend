import { expect, it } from 'vitest'
import { dailyRevenueColumns } from './dailyRevenue'

it('uses backend totals once and exports a separate legacy revenue column', () => {
  const row = { totalRevenue: 150, serviceRevenue: 80, productRevenue: 20, legacyDebtRevenue: 50, receipts: { total: 200, debtPayments: 70 }, netCashFlow: 180 }
  const read = label => dailyRevenueColumns.find(column => column.label === label).value(row)
  expect(read('Tổng doanh thu')).toBe(150)
  expect(read('Doanh thu thu nợ cũ')).toBe(50)
  expect(read('Tiền thực thu')).toBe(200)
  expect(read('Thu nợ')).toBe(70)
  expect(read('Dòng tiền thuần')).toBe(180)
})