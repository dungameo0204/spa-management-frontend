const safeCell = value => typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

export async function createTableWorkbook({ title, context, columns, rows, totals }) {
  const ExcelJS = (await import('exceljs')).default
  const book = new ExcelJS.Workbook()
  book.creator = "O'HINA"
  addTableSheet(book, { title, context, columns, rows, totals })
  return book
}

export function addTableSheet(book, { title, context, columns, rows, totals }) {
  const sheet = book.addWorksheet(title)
  sheet.addRow([title])
  sheet.addRow(context.map(safeCell))
  sheet.addRow([])
  sheet.addRow(columns.map(col => col.label))
  rows.forEach(row => sheet.addRow(columns.map(col => safeCell(col.value(row) ?? null))))
  if (totals) sheet.addRow(totals)
  columns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = Math.max(18, Math.min(38, col.label.length + 8))
    if (col.money) sheet.getColumn(index + 1).numFmt = '#,##0" đ"'
  })
  sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF315E50' } }
  sheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF315E50' } }
  if (totals) sheet.lastRow.font = { bold: true }
  sheet.views = [{ state: 'frozen', ySplit: 4 }]
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: columns.length } }
  return sheet
}

export async function exportTable(options, filename) {
  const book = await createTableWorkbook(options)
  await downloadWorkbook(book, filename)
}

export async function downloadWorkbook(book, filename) {
  const bytes = await book.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}