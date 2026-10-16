import { expect, it } from 'vitest'
import { createTableWorkbook } from './exportTable'

it('creates numeric Excel cells with currency formatting and protects text cells', async () => {
  const book = await createTableWorkbook({ title: 'Công ca', context: ['=name', '2026-10-01'], columns: [{ label: 'Ca', value: row => row.amount, money: true }, { label: 'Số lượng', value: row => row.quantity }], rows: [{ amount: 20000, quantity: 2 }, { amount: 0, quantity: 1 }], totals: ['Tổng cộng', 3] })
  const sheet = book.worksheets[0]
  expect(sheet.getCell('A2').value).toBe("'=name")
  expect(sheet.getCell('A5').value).toBe(20000)
  expect(sheet.getCell('A5').numFmt).toBe('#,##0" đ"')
  expect(sheet.getCell('A6').value).toBe(0)
  expect(sheet.getCell('B7').value).toBe(3)
  expect(sheet.views[0].ySplit).toBe(4)
  expect((await book.xlsx.writeBuffer()).byteLength).toBeGreaterThan(0)
}, 30000)