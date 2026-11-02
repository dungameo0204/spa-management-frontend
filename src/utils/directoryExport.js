import { listResource } from '../api/resources'
import { formatSpaDate, today } from './format'

const text = (key, label) => ({ label, value: row => row[key] == null ? '' : String(row[key]) })
const number = (key, label, money = false) => ({ label, money, value: row => row[key] == null || row[key] === '' ? null : Number(row[key]) })
const date = (key, label) => ({ label, value: row => row[key] ? formatSpaDate(row[key]) : '' })

export const directoryExports = {
  staffs: {
    title: 'Hồ sơ nhân viên', filename: 'ho-so-nhan-vien',
    columns: [text('fullname', 'Họ tên'), text('phone_number', 'Số điện thoại'), text('role_name', 'Chức vụ'), text('branch_name', 'Chi nhánh'), text('address', 'Địa chỉ')],
  },
  customers: {
    title: 'Khách hàng', filename: 'khach-hang',
    columns: [text('fullname', 'Họ tên'), text('phone_number', 'Số điện thoại'), date('date_of_birth', 'Ngày sinh'), text('address', 'Địa chỉ'), number('wallet_balance', 'Số dư ví', true), number('total_debt', 'Công nợ', true), text('note', 'Ghi chú')],
  },
  products: {
    title: 'Sản phẩm & dịch vụ', filename: 'san-pham-dich-vu',
    columns: [text('name', 'Tên sản phẩm / dịch vụ'), { label: 'Loại', value: row => Number(row.is_product) === 1 ? 'Sản phẩm' : 'Dịch vụ' }, text('unit', 'Đơn vị'), number('price', 'Giá niêm yết', true), number('sale_price', 'Giá bán', true), { label: 'Là liệu trình', value: row => Number(row.is_treatment_combo) === 1 ? 'Có' : 'Không' }, number('default_sessions', 'Số buổi tự tạo'), number('next_appointment_days', 'Ngày tới lần hẹn kế tiếp')],
  },
  inventory: {
    title: 'Tồn kho', filename: 'ton-kho',
    columns: [text('name', 'Sản phẩm'), text('branch_name', 'Cơ sở'), number('quantity', 'Tồn kho'), text('unit', 'Đơn vị')],
  },
  treatments: {
    title: 'Thẻ liệu trình', filename: 'lieu-trinh',
    columns: [text('id', 'Mã thẻ'), text('customer_name', 'Khách hàng'), text('product_name', 'Dịch vụ'), number('total_sessions', 'Tổng số buổi'), number('remaining_sessions', 'Số buổi còn lại'), { label: 'Trạng thái', value: row => Number(row.remaining_sessions) > 0 ? 'Còn buổi' : 'Đã hoàn thành' }, date('created_at', 'Ngày tạo'), number('matching_execution_count', 'Số buổi khớp bộ lọc thực hiện'), date('latest_matching_execution_date', 'Ngày thực hiện khớp gần nhất')],
  },
  debts: {
    title: 'Thu công nợ', filename: 'thu-cong-no',
    columns: [text('customer_name', 'Khách hàng'), text('invoice_id', 'Mã hóa đơn'), number('amount', 'Số tiền thu', true), text('payment_method', 'Phương thức thanh toán'), date('payment_date', 'Ngày thu'), text('collection_branch_name', 'Cơ sở thu'), text('note', 'Ghi chú')],
  },
  wallet: {
    title: 'Nạp ví khách hàng', filename: 'nap-vi-khach-hang',
    columns: [text('customer_name', 'Khách hàng'), number('paid_amount', 'Tiền nạp', true), number('bonus_amount', 'Tiền thưởng', true), number('total_received', 'Tổng nhận', true), text('payment_method', 'Phương thức thanh toán'), date('created_at', 'Ngày tạo'), text('branch_name', 'Chi nhánh'), text('note', 'Ghi chú')],
  },
  expenses: {
    title: 'Phiếu chi', filename: 'phieu-chi',
    columns: [text('note', 'Nội dung'), number('amount', 'Số tiền', true), date('expense_date', 'Ngày chi'), text('branch_name', 'Chi nhánh')],
  },
  imports: {
    title: 'Nhập kho', filename: 'nhap-kho',
    columns: [text('import_code', 'Mã phiếu'), text('supplier_name', 'Nhà cung cấp'), number('total_amount', 'Thành tiền', true), date('import_date', 'Ngày nhập'), text('branch_name', 'Chi nhánh'), text('note', 'Ghi chú')],
  },
  invoices: {
    title: 'Bán hàng & hóa đơn', filename: 'ban-hang-hoa-don',
    columns: [text('id', 'Mã hóa đơn'), text('customer_name', 'Khách hàng'), number('total_amount', 'Thành tiền', true), number('paid_amount', 'Khách thanh toán', true), number('wallet_used', 'Dùng ví', true), number('debt_amount', 'Công nợ', true), date('invoice_date', 'Ngày bán'), text('branch_name', 'Chi nhánh'), text('note', 'Ghi chú')],
  },
  consultants: {
    title: 'Doanh số tư vấn', filename: 'doanh-so-tu-van',
    columns: [text('staff_name', 'Nhân viên tư vấn'), text('customer_name', 'Khách hàng'), text('product_name', 'Sản phẩm / dịch vụ'), number('revenue_amount', 'Doanh số tư vấn', true), date('invoice_date', 'Ngày bán'), text('branch_name', 'Chi nhánh')],
  },
}

// Fetch sequentially to avoid a burst of requests on large customer directories.
// Let errors propagate: never download an incomplete workbook after a failed page.
export async function loadDirectoryRows(resource, filters = {}) {
  const first = await listResource(resource, filters, 1, 100)
  const rows = [...first.data]
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await listResource(resource, filters, page, 100)
    rows.push(...next.data)
  }
  return rows
}

export async function loadReportRows(type, filters = {}) {
  const { getReportDetails } = await import('../api/resources')
  const first = await getReportDetails(type, filters, 1, 100)
  const rows = [...first.data]
  for (let page = 2; page <= first.totalPages; page += 1) rows.push(...(await getReportDetails(type, filters, page, 100)).data)
  return rows
}

export function inventoryExportRows(products, branchId) {
  return products.flatMap(product => {
    const entries = branchId ? (product.inventory || []).filter(entry => Number(entry.branch_id) === Number(branchId)) : product.inventory || []
    return (entries.length ? entries : [{ branch_name: branchId ? 'Cơ sở của bạn' : 'Chưa có tồn kho', quantity: 0 }]).map(entry => ({ name: product.name, unit: product.unit, branch_name: entry.branch_name || 'Cơ sở của bạn', quantity: entry.quantity ?? 0 }))
  })
}

export function directoryExportOptions(resource, rows, context = []) {
  const { title, columns } = directoryExports[resource]
  return { title, columns, rows, context: ['Ngày xuất', today(), ...context] }
}

export const directoryExportFilename = resource => `ROSA-${directoryExports[resource].filename}-${today()}.xlsx`