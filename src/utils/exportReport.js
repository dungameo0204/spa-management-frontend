import { getReportDetails, getStaffTotals } from '../api/resources'
import { fieldLabels, isMoneyField, labelFor } from './fieldLabels'

const kinds = { invoices: 'Hóa đơn', debt_payments: 'Thu nợ', wallet_logs: 'Nạp ví', expenses: 'Phiếu chi', inventory_imports: 'Nhập kho', commissions: 'Công ca', consultants: 'Tư vấn' }
const incomeFields = { invoices: 'total_amount', debt_payments: 'amount', wallet_logs: 'paid_amount', expenses: 'amount', inventory_imports: 'total_amount', commissions: 'commission_amount_snapshot', consultants: 'revenue_amount' }
const numeric = value => Number(value || 0)
const safeCell = value => typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
async function allPages(loader) {
  const first = await loader(1)
  const rows = [...(first.data || first.staffTotals || [])]
  for (let page = 2; page <= first.totalPages; page++) { const result = await loader(page); rows.push(...(result.data || result.staffTotals || [])) }
  return { rows, totalAmount: first.totalAmount }
}
export async function exportReport(range) {
  const ExcelJS = (await import('exceljs')).default
  const book = new ExcelJS.Workbook()
  book.creator = 'Xuly Spa'
  for (const [kind, name] of Object.entries(kinds)) {
    const people = ['commissions', 'consultants'].includes(kind)
    const { rows, totalAmount } = await allPages(page => people ? getStaffTotals(kind, range, page, 100) : getReportDetails(kind, range, page, 100))
    const sheet = book.addWorksheet(name)
    sheet.addRow([`XULY · ${name.toUpperCase()}`])
    sheet.addRow(['Từ ngày', range.startDate, 'Đến ngày', range.endDate, 'Mã chi nhánh', range.branchId || 'Tất cả'])
    sheet.addRow(['Tổng tiền toàn kỳ', numeric(totalAmount), 'Số dòng/nhóm', rows.length])
    sheet.getCell('B3').numFmt = '#,##0" đ"'
    sheet.addRow([])
    const keys = people ? ['staff_name', 'branch_name', 'record_count', 'total_amount'] : ['id', ...new Set(rows.flatMap(row => Object.keys(row)))].filter((key, index) => index === 0 || (key !== 'id' && fieldLabels[key] && !key.endsWith('_id') && !['created_by', 'updated_by', 'deleted_at'].includes(key)))
    sheet.addRow(keys.map(labelFor))
    for (const row of rows) sheet.addRow(keys.map(key => isMoneyField(key) || key === 'total_amount' ? numeric(row[key]) : safeCell(row[key] ?? '')))
    if (people) {
      sheet.addRow([])
      sheet.addRow(['CHI TIẾT NGÀY LÀM THEO NHÂN VIÊN'])
      sheet.addRow(['Nhân viên', 'Cơ sở', 'Ngày', 'Khách hàng', 'Dịch vụ', 'Số tiền'])
      for (const person of rows) {
        const detail = await allPages(page => getReportDetails(kind, { ...range, ...(person.branch_id ? { branchId: person.branch_id } : {}) }, page, 100, person.staff_id))
        for (const line of detail.rows) sheet.addRow([safeCell(person.staff_name), safeCell(person.branch_name), line.execution_date || line.invoice_date || line.created_at || '', safeCell(line.customer_name || ''), safeCell(line.product_name || ''), numeric(line[incomeFields[kind]] ?? line.amount)])
      }
      sheet.getColumn(6).numFmt = '#,##0" đ"'
    }
    sheet.columns = Array.from({ length: Math.max(6, keys.length) }, (_, index) => ({ width: index < keys.length ? Math.max(18, Math.min(38, labelFor(keys[index]).length + 14)) : 22 }))
    sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF315E50' } }
    sheet.getRow(5).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF315E50' } }
    sheet.views = [{ state: 'frozen', ySplit: 5 }]
    sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: Math.max(1, keys.length) } }
    keys.forEach((key, index) => { if (isMoneyField(key) || key === 'total_amount') sheet.getColumn(index + 1).numFmt = '#,##0" đ"' })
  }
  const bytes = await book.xlsx.writeBuffer()
  const link = document.createElement('a')
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  link.href = url
  link.download = `Xuly-bao-cao-${range.startDate}-${range.endDate}.xlsx`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}