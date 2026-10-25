import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRemainingDebt, listResource } from '../api/resources'
import { formatCurrency, formatSpaDate } from '../utils/format'
import MoneyInput from './MoneyInput'

export default function DebtInvoicePicker({ customer, selected, onChange, amounts = {}, onAmountChange }) {
  const [page, setPage] = useState(1)
  const invoices = useQuery({ queryKey: ['debt-invoices', customer?.id, page], queryFn: () => listResource('invoices', { search: customer.phone_number || customer.fullname, hasDebt: true }, page, 100), enabled: Boolean(customer?.id) })
  const balances = useQuery({ queryKey: ['debt-balances', customer?.id, page, invoices.data?.data?.map(i => i.id)], queryFn: async () => Promise.all((invoices.data?.data || []).filter(i => Number(i.customer_id) === Number(customer.id)).map(async invoice => ({ invoice, debt: await getRemainingDebt(invoice.id) }))), enabled: Boolean(customer?.id && invoices.data?.data), retry: false })
  if (!customer) return null
  const totalCollected = selected.reduce((sum, { invoice, debt }) => sum + Number(amounts[invoice.id] ?? debt.remainingDebtAmount), 0)
  return <>
    <p className="report-total"><span>Tổng nợ khách hàng</span><strong>{formatCurrency(customer.total_debt)}</strong></p>
    {invoices.isLoading || balances.isLoading ? <p>Đang kiểm tra công nợ từng hóa đơn...</p> : invoices.isError || balances.isError ? <p className="form-alert">{invoices.error?.message || balances.error?.message}</p> : <div className="staff-picker">
      {balances.data?.filter(({ debt }) => Number(debt.remainingDebtAmount) > 0).map(({ invoice, debt }) => <div key={invoice.id}>
        <label><input type="checkbox" checked={selected.some(item => item.invoice.id === invoice.id)} onChange={e => onChange(e.target.checked ? [...selected, { invoice, debt }] : selected.filter(item => item.invoice.id !== invoice.id))} /><span><strong>Hóa đơn #{invoice.id}</strong><br />Ngày bán: {formatSpaDate(invoice.invoice_date)} · Ngày tạo: {formatSpaDate(invoice.created_at)}<br />Cơ sở lập: {invoice.branch_name || 'Chưa có thông tin'} · Còn nợ: <strong>{formatCurrency(debt.remainingDebtAmount)}</strong></span></label>
        {selected.some(item => item.invoice.id === invoice.id) && <label className="field">Số tiền thu hóa đơn #{invoice.id}<MoneyInput required value={amounts[invoice.id] ?? debt.remainingDebtAmount} onChange={value => onAmountChange(invoice.id, value)} /></label>}
      </div>)}
      {!balances.data?.some(({ debt }) => Number(debt.remainingDebtAmount) > 0) && <p className="small-muted">Không còn hóa đơn có thể thu nợ trong kết quả tìm kiếm.</p>}
    </div>}
    {invoices.data?.totalPages > 1 && <div className="picker-pages"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page} / {invoices.data.totalPages}</span><button type="button" disabled={page >= invoices.data.totalPages} onClick={() => setPage(page + 1)}>Sau</button></div>}
    <p className="report-total" role="status" aria-label="Tổng tiền thu của khách"><span>Tổng tiền thu của khách</span><strong>{formatCurrency(totalCollected)}</strong></p>
  </>
}