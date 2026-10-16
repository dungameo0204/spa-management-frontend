import { formatCurrency, formatSpaDate } from '../utils/format'
import './DailyRevenueTable.css'

const columns = [
  { label: 'Doanh thu bán hàng', value: row => row.totalRevenue },
  { label: 'Doanh thu dịch vụ', value: row => row.serviceRevenue },
  { label: 'Doanh thu sản phẩm', value: row => row.productRevenue },
  { label: 'Thu hóa đơn', value: row => row.receipts?.invoiceCash },
  { label: 'Thu nợ', value: row => row.receipts?.debtPayments },
  { label: 'Nạp ví', value: row => row.receipts?.walletTopups },
  { label: 'Tiền thực thu', value: row => row.receipts?.total },
  { label: 'Ví đã dùng (không cộng thu)', value: row => row.receipts?.walletUsedExcluded },
  { label: 'Phiếu chi', value: row => row.expenses?.expenseVouchers },
  { label: 'Nhập kho', value: row => row.expenses?.inventoryImports },
  { label: 'Tổng chi', value: row => row.expenses?.total },
  { label: 'Dòng tiền thuần', value: row => row.netCashFlow },
]

export default function DailyRevenueTable({ data, loading, error, valid }) {
  const rows = Array.isArray(data) ? data : []
  return <section className="section-card daily-revenue" aria-labelledby="daily-revenue-title">
    <div className="section-heading"><div><span className="eyebrow">CHI TIẾT THEO NGÀY</span><h2 id="daily-revenue-title">Báo cáo theo ngày</h2><p>Tiền thực thu không cộng lại ví đã dùng. Dòng tiền thuần = tiền thực thu − tổng chi, không phải lợi nhuận.</p></div></div>
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