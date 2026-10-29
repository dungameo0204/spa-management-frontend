import { beforeEach, expect, it, vi } from 'vitest'
import { listResource } from '../api/resources'
import { directoryExportOptions, inventoryExportRows, loadDirectoryRows } from './directoryExport'
import { createTableWorkbook } from './exportTable'

vi.mock('../api/resources', () => ({ listResource: vi.fn() }))
beforeEach(() => vi.resetAllMocks())

it('loads every page with identical filters, including an API-capped page size', async () => {
  listResource.mockImplementation(async (_, filters, page) => ({ data: [{ id: page, name: filters.search }], totalPages: 3, pageSize: 1 }))
  const filters = { search: 'Lan', branchId: 2 }
  expect(await loadDirectoryRows('customers', filters)).toEqual([1, 2, 3].map(id => ({ id, name: 'Lan' })))
  expect(listResource.mock.calls).toEqual([1, 2, 3].map(page => ['customers', filters, page, 100]))
})

it('does not return partial data when a later page fails', async () => {
  listResource.mockResolvedValueOnce({ data: [{ id: 1 }], totalPages: 2 }).mockRejectedValueOnce(new Error('Mất kết nối'))
  await expect(loadDirectoryRows('products')).rejects.toThrow('Mất kết nối')
})

it('handles an empty directory', async () => {
  listResource.mockResolvedValue({ data: [], totalPages: 0 })
  expect(await loadDirectoryRows('customers')).toEqual([])
  expect(listResource).toHaveBeenCalledTimes(1)
})

it('flattens stock by branch and keeps zero stock without exposing other branches', () => {
  const products = [{ name: 'Kem', unit: 'Hộp', inventory: [{ branch_id: 1, branch_name: 'A', quantity: '5' }, { branch_id: 2, branch_name: 'B', quantity: 0 }] }, { name: 'Sữa', unit: 'Chai' }]
  expect(inventoryExportRows(products, '2')).toEqual([{ name: 'Kem', unit: 'Hộp', branch_name: 'B', quantity: 0 }, { name: 'Sữa', unit: 'Chai', branch_name: 'Cơ sở của bạn', quantity: 0 }])
  expect(inventoryExportRows(products, null)).toHaveLength(3)
})

it('writes real customer Excel cells with phone text, numeric money, date and safe text', async () => {
  const book = await createTableWorkbook(directoryExportOptions('customers', [{ fullname: '=HYPERLINK("bad")', phone_number: '0901234567', date_of_birth: '1990-05-02', wallet_balance: '120000', total_debt: '0' }], ['Tìm kiếm', 'Lan']))
  const sheet = book.worksheets[0]
  expect(sheet.getCell('A5').value).toBe('\'=HYPERLINK("bad")')
  expect(sheet.getCell('B5').value).toBe('0901234567')
  expect(sheet.getCell('C5').value).toBe('02/05/1990')
  expect(sheet.getCell('E5').value).toBe(120000)
  expect(sheet.getCell('F5').value).toBe(0)
  expect(sheet.getCell('E5').numFmt).toBe('#,##0" đ"')
  expect((await book.xlsx.writeBuffer()).byteLength).toBeGreaterThan(0)
}, 30000)

it('exports product types, treatment flags and prices as the appropriate cell types', () => {
  const options = directoryExportOptions('products', [])
  const row = { name: 'Laser', is_product: '0', price: '1000000', sale_price: '800000', is_treatment_combo: '1', default_sessions: '5' }
  expect(options.columns.map(col => col.value(row))).toEqual(['Laser', 'Dịch vụ', '', null, 800000, 'Có', 5, null])
  expect(options.columns[3].value({ ...row, is_product: '1' })).toBe(1000000)
})

it('exports both active and completed treatment cards, preserving card identity', () => {
  const options = directoryExportOptions('treatments', [])
  const rows = [{ id: 1, customer_name: 'Lan', product_name: 'Laser', total_sessions: '5', remaining_sessions: '2', created_at: '2026-10-01' }, { id: 2, remaining_sessions: 0 }]
  expect(options.columns.map(col => col.value(rows[0]))).toEqual(['1', 'Lan', 'Laser', 5, 2, 'Còn buổi', '01/10/2026'])
  expect(options.columns[5].value(rows[1])).toBe('Đã hoàn thành')
})