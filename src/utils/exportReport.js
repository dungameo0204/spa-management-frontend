import { getReportDetails, getStaffTotals, getRevenue } from '../api/resources'
import { fieldLabels, isMoneyField, labelFor } from './fieldLabels'
import { groupCommissionRows } from './commissionReport'
import { addTableSheet, downloadWorkbook } from './exportTable'
import { dailyRevenueColumns } from './dailyRevenue'

const kinds = { invoices: 'Hóa đơn', debt_payments: 'Thu nợ', wallet_logs: 'Nạp ví', expenses: 'Phiếu chi', inventory_imports: 'Nhập kho', commissions: 'Công ca', consultants: 'Tư vấn' }
const incomeFields = { invoices: 'total_amount', debt_payments: 'amount', wallet_logs: 'paid_amount', expenses: 'amount', inventory_imports: 'total_amount', commissions: 'commission_amount', consultants: 'revenue_amount' }
const numeric = value => Number(value || 0)
const safeCell = value => typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
function staffSheetName(book, person) {
  const base = String(person.staff_name || `Nhân viên ${person.staff_id}`).replace(/[\\/*?:[\]]/g, ' ').replace(/^'+|'+$/g, '').trim() || `Nhân viên ${person.staff_id}`
  const used = new Set([...Object.values(kinds), 'Doanh thu theo ngày', ...book.worksheets.map(sheet => sheet.name)].map(name => name.toLowerCase()))
  let name = base.slice(0, 31), suffix = 1
  while (used.has(name.toLowerCase())) {
    const ending = ` (${suffix++})`
    name = `${base.slice(0, 31 - ending.length)}${ending}`
  }
  return name
}
async function allPages(loader) {
  const first = await loader(1)
  const rows = [...(first.data || first.staffTotals || [])]
  for (let page = 2; page <= first.totalPages; page++) { const result = await loader(page); rows.push(...(result.data || result.staffTotals || [])) }
  if (first.total != null && rows.length !== Number(first.total)) throw new Error('Chưa tải đủ dữ liệu báo cáo. Vui lòng thử lại.')
  return { rows, totalAmount: first.totalAmount }
}
export async function createReportWorkbook(range, commissionsOnly = false) {
  const ExcelJS = (await import('exceljs')).default
  const book = new ExcelJS.Workbook()
  book.creator = "O'HINA"
  const context = ['Từ ngày', range.startDate, 'Đến ngày', range.endDate, 'Mã chi nhánh', range.branchId || 'Tất cả']
  for (const [kind, name] of Object.entries(commissionsOnly ? { commissions: kinds.commissions } : kinds)) {
    const people = ['commissions', 'consultants'].includes(kind)
    const { rows, totalAmount } = await allPages(page => people ? getStaffTotals(kind, range, page, 100) : getReportDetails(kind, range, page, 100))
    const sheet = book.addWorksheet(name)
    sheet.addRow([`O'HINA · ${name.toUpperCase()}`])
    sheet.addRow(['Từ ngày', range.startDate, 'Đến ngày', range.endDate, 'Mã chi nhánh', range.branchId || 'Tất cả'])
    sheet.addRow(['Tổng tiền toàn kỳ', numeric(totalAmount), 'Số dòng/nhóm', rows.length])
    sheet.getCell('B3').numFmt = '#,##0" đ"'
    sheet.addRow([])
    const keys = people ? ['staff_name', 'branch_name', 'record_count', 'total_amount'] : ['id', ...new Set(rows.flatMap(row => Object.keys(row)))].filter((key, index) => index === 0 || (key !== 'id' && fieldLabels[key] && !key.endsWith('_id') && !['created_by', 'updated_by', 'deleted_at'].includes(key)))
    sheet.addRow(keys.map(labelFor))
    for (const row of rows) sheet.addRow(keys.map(key => isMoneyField(key) || key === 'total_amount' ? numeric(row[key]) : safeCell(row[key] ?? '')))
    if (people) {
      const staffReports = new Map()
      sheet.addRow([])
      sheet.addRow(['CHI TIẾT NGÀY LÀM THEO NHÂN VIÊN'])
      sheet.addRow(['Nhân viên', 'Cơ sở', 'Ngày', 'Khách hàng', 'Dịch vụ', 'Số tiền'])
      for (const person of rows) {
        const detail = await allPages(page => getReportDetails(kind, { ...range, ...(person.branch_id ? { branchId: person.branch_id } : {}) }, page, 100, person.staff_id))
        if (kind === 'commissions') {
          const report = staffReports.get(person.staff_id) || { person, rows: [], branches: new Set() }
          report.rows.push(...detail.rows)
          report.branches.add(person.branch_name || `Cơ sở ${person.branch_id || ''}`)
          staffReports.set(person.staff_id, report)
        }
        for (const line of detail.rows) sheet.addRow([safeCell(person.staff_name), safeCell(person.branch_name), line.execution_date || line.invoice_date || line.created_at || '', safeCell(line.customer_name || ''), safeCell(line.product_name || ''), numeric(line[incomeFields[kind]] ?? line.amount)])
      }
      sheet.getColumn(6).numFmt = '#,##0" đ"'
      for (const report of staffReports.values()) {
        const breakdown = groupCommissionRows(report.rows)
        const personal = addTableSheet(book, { title: staffSheetName(book, report.person), context: [report.person.staff_name, [...report.branches].join(', '), ...context], columns: [
          { label: 'Ca', value: row => row.amount, money: true }, { label: 'Số lượng', value: row => row.quantity }, { label: 'Tổng tiền', value: row => row.total, money: true },
        ], rows: breakdown, totals: ['Tổng cộng', breakdown.reduce((sum, row) => sum + row.quantity, 0), breakdown.reduce((sum, row) => sum + row.total, 0)] })
        personal.getCell('A1').value = safeCell(`Báo cáo công ca · ${report.person.staff_name}`)
      }
    }
    sheet.columns = Array.from({ length: Math.max(6, keys.length) }, (_, index) => ({ width: index < keys.length ? Math.max(18, Math.min(38, labelFor(keys[index]).length + 14)) : 22 }))
    sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF70512C' } }
    sheet.getRow(5).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70512C' } }
    sheet.views = [{ state: 'frozen', ySplit: 5 }]
    sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: Math.max(1, keys.length) } }
    keys.forEach((key, index) => { if (isMoneyField(key) || key === 'total_amount') sheet.getColumn(index + 1).numFmt = '#,##0" đ"' })
  }
  if (!commissionsOnly) {
    const revenue = await getRevenue(range)
    addTableSheet(book, { title: 'Doanh thu theo ngày', context, columns: dailyRevenueColumns, rows: revenue.daily || [] })
  }
  return book
}

export async function exportReport(range, commissionsOnly = false) {
  const book = await createReportWorkbook(range, commissionsOnly)
  await downloadWorkbook(book, `OHINA-${commissionsOnly ? 'cong-ca-tat-ca-nhan-vien' : 'bao-cao'}-${range.startDate}-${range.endDate}.xlsx`)
}