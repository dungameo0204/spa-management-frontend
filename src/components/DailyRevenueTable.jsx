import { dailyRevenueMoneyColumns as columns, dailyRevenueColumns } from '../utils/dailyRevenue'
import { formatCurrency, formatSpaDate } from '../utils/format'
import './DailyRevenueTable.css'
import ExportTableButton from './ExportTableButton'


export default function DailyRevenueTable({ data, loading, error, valid, range }) {
  const rows = Array.isArray(data) ? data : []
  return <section className="section-card daily-revenue" aria-labelledby="daily-revenue-title">
    <div className="section-heading"><div><span className="eyebrow">CHI TIẾT THEO NGÀY</span><h2 id="daily-revenue-title">Báo cáo theo ngày</h2><p>Tiền thực thu không cộng lại ví đã dùng. Dòng tiền thuần = tiền thực thu − tổng chi, không phải lợi nhuận.</p></div><ExportTableButton label="Xuất Excel theo ngày" disabled={!valid || loading || Boolean(error) || !rows.length} filename={`Xuly-doanh-thu-theo-ngay-${range.startDate}-${range.endDate}.xlsx`} options={{ title: 'Doanh thu theo ngày', context: ['Từ ngày', range.startDate, 'Đến ngày', range.endDate, 'Mã chi nhánh', range.branchId || 'Tất cả'], columns: dailyRevenueColumns, rows }} /></div>
    {!valid ? <p role="status">Vui lòng chọn khoảng ngày hợp lệ.</p>
      : loading ? <p role="status">Đang tải báo cáo theo ngày...</p>
        : error ? <p role="status">Không tải được báo cáo theo ngày.</p>
          : !rows.length ? <p role="status">Chưa có dữ liệu theo ngày trong khoảng thời gian đã chọn.</p>
            : <div className="daily-revenue-scroll" role="region" aria-label="Bảng báo cáo theo ngày, cuộn ngang để xem các cột" tabIndex={0}>
              <table aria-label="Báo cáo theo ngày">
                <thead><tr><th scope="col">Ngày</th>{columns.map(col => <th scope="col" key={col.label}>{col.label}</th>)}</tr></thead>
                <tbody>{rows.map(row => <tr key={row.date}><th scope="row">{formatSpaDate(row.date)}</th>{columns.map(col => <td key={col.label}>{formatCurrency(col.value(row))}</td>)}</tr>)}</tbody>
              </table>
            </div>}
  </section>
}