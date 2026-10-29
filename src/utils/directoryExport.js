import { listResource } from '../api/resources'
import { formatSpaDate, today } from './format'

const text = (key, label) => ({ label, value: row => row[key] == null ? '' : String(row[key]) })
const number = (key, label, money = false) => ({ label, money, value: row => row[key] == null || row[key] === '' ? null : Number(row[key]) })
const date = (key, label) => ({ label, value: row => row[key] ? formatSpaDate(row[key]) : '' })

export const directoryExports = {
  customers: {
    title: 'Khách hàng', filename: 'khach-hang',
    columns: [text('fullname', 'Họ tên'), text('phone_number', 'Số điện thoại'), date('date_of_birth', 'Ngày sinh'), text('address', 'Địa chỉ'), number('wallet_balance', 'Số dư ví', true), number('total_debt', 'Công nợ', true), text('note', 'Ghi chú')],
  },
  products: {
    title: 'Sản phẩm & dịch vụ', filename: 'san-pham-dich-vu',
    columns: [text('name', 'Tên sản phẩm / dịch vụ'), { label: 'Loại', value: row => Number(row.is_product) === 1 ? 'Sản phẩm' : 'Dịch vụ' }, text('unit', 'Đơn vị'), { ...number('price', 'Giá niêm yết', true), value: row => Number(row.is_product) === 0 ? null : number('price', 'Giá niêm yết', true).value(row) }, number('sale_price', 'Giá bán', true), { label: 'Là liệu trình', value: row => Number(row.is_treatment_combo) === 1 ? 'Có' : 'Không' }, number('default_sessions', 'Số buổi tự tạo'), number('next_appointment_days', 'Ngày tới lần hẹn kế tiếp')],
  },
  inventory: {
    title: 'Tồn kho', filename: 'ton-kho',
    columns: [text('name', 'Sản phẩm'), text('branch_name', 'Cơ sở'), number('quantity', 'Tồn kho'), text('unit', 'Đơn vị')],
  },
  treatments: {
    title: 'Thẻ liệu trình', filename: 'lieu-trinh',
    columns: [text('id', 'Mã thẻ'), text('customer_name', 'Khách hàng'), text('product_name', 'Dịch vụ'), number('total_sessions', 'Tổng số buổi'), number('remaining_sessions', 'Số buổi còn lại'), { label: 'Trạng thái', value: row => Number(row.remaining_sessions) > 0 ? 'Còn buổi' : 'Đã hoàn thành' }, date('created_at', 'Ngày tạo')],
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

export const directoryExportFilename = resource => `KAS-${directoryExports[resource].filename}-${today()}.xlsx`