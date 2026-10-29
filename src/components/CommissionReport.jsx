import { useQuery } from '@tanstack/react-query'
import { getReportDetails } from '../api/resources'
import { loadCommissionReport } from '../utils/commissionReport'
import { formatCurrency, formatSpaDate } from '../utils/format'
import ExportTableButton from './ExportTableButton'

export default function CommissionReport({ range, person }) {
  const filters = { ...range, ...(person.branch_id ? { branchId: person.branch_id } : {}) }
  const query = useQuery({
    queryKey: ['commission-breakdown', filters, person.staff_id],
    queryFn: () => loadCommissionReport(page => getReportDetails('commissions', filters, page, 100, person.staff_id)),
  })
  const rows = query.data || []
  const quantity = rows.reduce((sum, row) => sum + row.quantity, 0)
  const total = rows.reduce((sum, row) => sum + row.total, 0)
  return <section aria-label={`Báo cáo công ca ${person.staff_name}`}>
    <div className="section-heading"><h3>Báo cáo công ca</h3><ExportTableButton disabled={query.isLoading || query.isError || !rows.length} filename={`KAS-cong-ca-${person.staff_id}-${person.branch_id || 'tat-ca'}-${range.startDate}-${range.endDate}.xlsx`} options={{ title: 'Báo cáo công ca', context: [person.staff_name, person.branch_name || 'Cơ sở', range.startDate, range.endDate], columns: [{ label: 'Ca', value: row => row.amount, money: true }, { label: 'Số lượng', value: row => row.quantity }, { label: 'Tổng tiền', value: row => row.total, money: true }], rows, totals: ['Tổng cộng', quantity, total] }} /></div>
    <p className="helper-text">{person.branch_name || 'Cơ sở'} · {formatSpaDate(range.startDate)} – {formatSpaDate(range.endDate)}</p>
    {query.isLoading ? <p role="status">Đang tổng hợp công ca toàn kỳ...</p>
      : query.isError ? <div className="form-alert" role="alert"><p>{query.error.message}</p><button className="btn secondary" onClick={() => query.refetch()}>Thử lại</button></div>
        : !rows.length ? <p role="status">Chưa có công ca trong khoảng thời gian đã chọn.</p>
          : <><div className="report-total"><span>Tổng cộng · {quantity} ca</span><strong>{formatCurrency(total)}</strong></div>
            <div className="table-scroll"><table aria-label="Công ca theo mức tiền"><thead><tr><th scope="col">Ca</th><th scope="col">Số lượng</th><th scope="col">Tổng tiền</th></tr></thead><tbody>{rows.map(row => <tr key={row.amount}><td data-label="Ca">{formatCurrency(row.amount)}</td><td data-label="Số lượng">{row.quantity}</td><td data-label="Tổng tiền">{formatCurrency(row.total)}</td></tr>)}</tbody></table></div></>}
  </section>
}