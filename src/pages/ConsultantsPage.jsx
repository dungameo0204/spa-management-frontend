import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBranch } from '../components/AppShell'
import StaffEarnings from '../components/StaffEarnings'
import DataList from '../components/DataList'
import { getReportDetails } from '../api/resources'
import { today, formatCurrency, formatSpaDate } from '../utils/format'

export default function ConsultantsPage() {
  const { branchId } = useBranch()
  const [startDate, setStartDate] = useState(`${today().slice(0, 7)}-01`), [endDate, setEndDate] = useState(today())
  const [page, setPage] = useState(1), [search, setSearch] = useState('')
  const valid = startDate <= endDate
  const details = useQuery({ queryKey: ['consultants', 'details', startDate, endDate, branchId, page], queryFn: () => getReportDetails('consultants', { startDate, endDate, ...(branchId ? { branchId } : {}) }, page), enabled: valid })
  const filtered = (details.data?.data || []).filter(row => [row.staff_name, row.customer_name, row.product_name, row.branch_name].some(value => String(value || '').toLocaleLowerCase().includes(search.toLocaleLowerCase())))
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">NHÂN SỰ</span><h1>Hoa hồng · doanh số tư vấn</h1><p>Doanh số phân bổ cho nhân viên tư vấn, không phải hoa hồng thực trả.</p></div></div><div className="report-filters"><label className="field">Từ ngày<input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} /></label><label className="field">Đến ngày<input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} /></label></div>{valid ? <><StaffEarnings key={`${startDate}-${endDate}-${branchId}`} kind="consultants" range={{ startDate, endDate, ...(branchId ? { branchId } : {}) }} /><h3>Từng lượt phân công</h3><DataList data={details.data ? { ...details.data, data: filtered } : undefined} columns={[{ key: 'staff_name', label: 'Nhân viên' }, { key: 'product_name', label: 'Sản phẩm / dịch vụ' }, { key: 'customer_name', label: 'Khách hàng' }, { key: 'revenue_amount', label: 'Doanh số tư vấn', render: row => formatCurrency(row.revenue_amount) }, { key: 'invoice_date', label: 'Ngày bán', render: row => formatSpaDate(row.invoice_date || row.created_at) }, { key: 'branch_name', label: 'Chi nhánh' }]} search={search} onSearch={setSearch} page={page} onPage={setPage} loading={details.isLoading} error={details.error} onRetry={() => details.refetch()} /></> : <p className="form-alert">Khoảng ngày không hợp lệ.</p>}</div>
}