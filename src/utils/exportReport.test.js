import { beforeEach, expect, it, vi } from 'vitest'
import { getReportDetails, getStaffTotals, getRevenue } from '../api/resources'
import { createReportWorkbook } from './exportReport'

vi.mock('../api/resources', () => ({ getReportDetails: vi.fn(), getStaffTotals: vi.fn(), getRevenue: vi.fn() }))
const range = { startDate: '2026-10-01', endDate: '2026-10-16' }
beforeEach(() => {
  vi.clearAllMocks()
  getStaffTotals.mockImplementation(async (kind, filters, page) => kind === 'commissions' ? { staffTotals: [{ staff_id: 3, branch_id: page, staff_name: 'Nhân viên A', branch_name: `CS${page}`, total_amount: 40000, record_count: 2 }], total: 2, totalPages: 2, totalAmount: 80000 } : { staffTotals: [], total: 0, totalPages: 0 })
  getReportDetails.mockImplementation(async kind => kind === 'commissions' ? { data: [{ commission_amount: '20000.00', commission_amount_snapshot: 0, execution_date: '2026-10-01', customer_name: 'Khách A' }], total: 2, totalPages: 2 } : { data: [], total: 0, totalPages: 0 })
  getRevenue.mockResolvedValue({ daily: [{ date: '2026-10-01', totalRevenue: 50000, serviceRevenue: 0, productRevenue: 0, legacyDebtRevenue: 50000, netCashFlow: -50000 }] })
})

it('exports all staff pages into one sheet per employee, including all their branches', async () => {
  const book = await createReportWorkbook(range, true)
  expect(book.worksheets.map(sheet => sheet.name)).toEqual(['Công ca', 'Nhân viên A'])
  const sheet = book.getWorksheet('Nhân viên A')
  expect(sheet.getRow(4).values.slice(1)).toEqual(['Ca', 'Số lượng', 'Tổng tiền'])
  expect(sheet.getRow(5).values.slice(1)).toEqual([20000, 4, 80000])
  expect(sheet.getRow(6).values.slice(1)).toEqual(['Tổng cộng', 4, 80000])
  expect(sheet.getCell('B2').value).toBe('CS1, CS2')
  expect(getReportDetails.mock.calls.map(call => [call[1].branchId, call[2], call[4]])).toEqual([[1, 1, 3], [1, 2, 3], [2, 1, 3], [2, 2, 3]])
  expect(getRevenue).not.toHaveBeenCalled()
  const detailRows = book.getWorksheet('Công ca').getSheetValues().filter(row => row?.[3] === '2026-10-01')
  expect(detailRows).toHaveLength(4)
  expect(detailRows.every(row => row[6] === 20000)).toBe(true)
}, 30000)

it('includes daily revenue and staff rate breakdown in the full-period workbook', async () => {
  const book = await createReportWorkbook(range)
  expect(book.worksheets).toHaveLength(9)
  expect(book.getWorksheet('Nhân viên A')).toBeTruthy()
  expect(book.getWorksheet('Công ca theo mức tiền')).toBeUndefined()
  const daily = book.getWorksheet('Doanh thu theo ngày')
  expect(daily.getCell('A5').value).toBe('01/10/2026')
  expect(daily.getCell('B5').value).toBe(50000)
  expect(daily.getCell('E4').value).toBe('Doanh thu thu nợ cũ')
  expect(daily.getCell('E5').value).toBe(50000)
  expect(daily.getCell('N5').value).toBe(-50000)
  expect(getRevenue).toHaveBeenCalledWith(range)
}, 30000)

it('separates employees with duplicate, invalid, long or reserved sheet names', async () => {
  const names = ['Trùng tên', 'Trùng tên', 'Tên / có : ký * tự ?', 'Tên nhân viên rất dài vượt quá giới hạn tên worksheet', 'Công ca', 'Doanh thu theo ngày']
  getStaffTotals.mockResolvedValue({ staffTotals: names.map((staff_name, index) => ({ staff_id: index + 1, branch_id: 1, staff_name })), total: names.length, totalPages: 1 })
  const book = await createReportWorkbook(range, true)
  expect(book.worksheets).toHaveLength(7)
  expect(book.getWorksheet('Trùng tên').getCell('B5').value).toBe(2)
  expect(book.getWorksheet('Trùng tên (1)').getCell('B5').value).toBe(2)
  expect(book.getWorksheet('Công ca (1)')).toBeTruthy()
  expect(book.getWorksheet('Doanh thu theo ngày (1)')).toBeTruthy()
  expect(book.worksheets.every(sheet => sheet.name.length <= 31 && !/[\\/*?:[\]]/.test(sheet.name))).toBe(true)
  expect((await book.xlsx.writeBuffer()).byteLength).toBeGreaterThan(0)
}, 30000)

it('fails instead of exporting incomplete staff results', async () => {
  getStaffTotals.mockResolvedValue({ staffTotals: [], total: 2, totalPages: 1 })
  await expect(createReportWorkbook(range, true)).rejects.toThrow('Chưa tải đủ')
}, 30000)