import { formatCurrency } from '../utils/format'

export function hasLegacyBalance(customer) {
  return customer?.legacy_debt != null && customer.legacy_debt !== '' && Number.isFinite(Number(customer.legacy_debt)) && Number(customer.legacy_debt) >= 0
}

export default function CustomerDebtSummary({ customer }) {
  const balance = value => value != null && value !== '' && Number.isFinite(Number(value)) ? formatCurrency(value) : 'Chưa xác định'
  return <div aria-label="Công nợ khách hàng">
    <p>Tổng công nợ: <strong>{balance(customer?.total_debt)}</strong></p>
    <p>Nợ hóa đơn còn lại: <strong>{balance(customer?.invoice_debt)}</strong></p>
    <p>Nợ cũ không có hóa đơn còn lại: <strong>{balance(customer?.legacy_debt)}</strong></p>
    <p className="helper-text">Công nợ toàn khách hàng, không phụ thuộc cơ sở hoặc bộ lọc ngày.</p>
    {customer?.invoice_debt != null && customer?.total_debt != null && Number(customer.invoice_debt) > Number(customer.total_debt) && <p role="alert" className="form-alert">Nợ hóa đơn đang lớn hơn tổng công nợ; cần đối soát dữ liệu.</p>}
  </div>
}