import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency, formatSpaDate } from '../utils/format'

const value = v => v || '—'
const money = v => formatCurrency(v ?? 0)
const method = v => ({ CASH: 'Tiền mặt', TRANSFER: 'Chuyển khoản', BANK_TRANSFER: 'Chuyển khoản', CARD: 'Thẻ' })[v] || value(v)
const paper = { K57: '57mm 200mm', K80: '80mm 200mm', A5: 'A5', A4: 'A4' }

export default function ReceiptPrint({ receipt, onDone }) {
  useEffect(() => {
    if (!receipt) return
    let timer
    const done = () => { clearTimeout(timer); onDone() }
    window.addEventListener('afterprint', done)
    // Let React commit the receipt before opening the native print dialog.
    const frame = requestAnimationFrame(() => { timer = setTimeout(done, 30000); window.print() })
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); window.removeEventListener('afterprint', done) }
  }, [receipt, onDone])
  if (!receipt) return null
  const { type, records } = receipt
  const first = records[0]
  const size = paper[receipt.size] ? receipt.size : 'A4'
  const title = type === 'invoices' ? 'HÓA ĐƠN BÁN HÀNG' : type === 'wallet' ? 'PHIẾU NẠP VÍ' : 'PHIẾU THU CÔNG NỢ'
  const date = first.invoice_date || first.payment_date || first.created_at
  const sheetInvoice = type === 'invoices' && !size.startsWith('K')
  const heading = <><header className="receipt-head"><span className="receipt-mark">✦</span><strong>{value((type === 'debts' && first.collection_branch_name) || first.branch_name)}</strong><small>CHĂM SÓC SẮC ĐẸP · CẢM ƠN QUÝ KHÁCH</small></header>
    <div className="receipt-title"><h2>{title}</h2><span>{records.length === 1 ? `#${first.id}` : `${records.length} khoản thu`}</span></div>
    <div className="receipt-meta"><span>Ngày: {formatSpaDate(date)}</span><span>Khách hàng: {value(first.customer_name)}</span>{first.phone_number && <span>Điện thoại: {first.phone_number}</span>}</div></>
  const lineFinal = item => Number(item.final_price ?? item.total_price ?? Number(item.quantity) * Number(item.snapshot_price ?? item.unit_price))
  const invoiceLines = first.items?.map((item, index) => {
    const base = Number(item.quantity) * Number(item.snapshot_price ?? item.unit_price)
    const discount = Math.max(0, base - lineFinal(item))
    return <div className="receipt-line" key={item.id || index}><span>{item.snapshot_name || item.product_name || 'Sản phẩm'}<small>{item.quantity} × {money(item.snapshot_price ?? item.unit_price)}</small>{discount > 0 && <small className="receipt-discount">Chiết khấu: -{money(discount)}</small>}</span><strong>{money(lineFinal(item))}</strong></div>
  })
  const invoiceDiscount = Math.max(0, (first.items || []).reduce((sum, item) => sum + lineFinal(item), 0) - Number(first.total_amount || 0))
  const invoicePayment = <><div className="receipt-row"><span>Tổng thanh toán</span><strong>{money(first.total_amount)}</strong></div>{invoiceDiscount > 0 && <div className="receipt-row"><span>Chiết khấu hóa đơn</span><strong>-{money(invoiceDiscount)}</strong></div>}<div className="receipt-row"><span>Khách trả</span><strong>{money(first.paid_amount)}</strong></div><div className="receipt-row"><span>Đã dùng ví</span><span>{money(first.wallet_used)}</span></div><div className="receipt-row"><span>Công nợ hóa đơn</span><strong>{money(first.debt_amount)}</strong></div></>
  const paymentNote = <div className="receipt-meta receipt-end"><span>Phương thức: {method(first.payment_method)}</span>{first.note && <span>Ghi chú: {first.note}</span>}</div>
  const thanks = <footer>Xin cảm ơn và hẹn gặp lại quý khách!<small>Vui lòng giữ phiếu để đối chiếu khi cần.</small></footer>
  return createPortal(<div id="receipt-print" className={`receipt-print receipt-size-${size}`} aria-label={title}>
    <style media="print">{size.startsWith('K')
      ? `@page { size: ${paper[size]}; margin: 3mm; }`
      : `@page { size: ${paper[size]}; margin: ${sheetInvoice ? '32mm' : '12mm'} 12mm 12mm; } ${sheetInvoice ? '@page :first { margin-top: 12mm; }' : ''}`}</style>
    {sheetInvoice ? <><table className="receipt-pages"><thead><tr><td>{heading}<div className="receipt-section">SẢN PHẨM / DỊCH VỤ</div></td></tr></thead><tbody>{invoiceLines?.map((line, index) => <tr key={first.items[index].id || index}><td>{line}</td></tr>)}</tbody></table><div className="receipt-summary">{invoicePayment}{paymentNote}{thanks}</div></> : <>{heading}{type === 'invoices' && <><div className="receipt-section">SẢN PHẨM / DỊCH VỤ</div>{invoiceLines}{invoicePayment}</>}
    {type === 'wallet' && <><div className="receipt-row"><span>Số tiền nạp</span><strong>{money(first.paid_amount)}</strong></div><div className="receipt-row"><span>Tiền tặng thêm</span><span>{money(first.bonus_amount)}</span></div><div className="receipt-row receipt-total"><span>TỔNG CỘNG VÀO VÍ</span><strong>{money(first.total_received)}</strong></div></>}
    {type === 'debts' && <><div className="receipt-section">CHI TIẾT THANH TOÁN</div>{records.map(row => <div className="receipt-line" key={row.id}><span>Hóa đơn #{row.invoice_id}<small>Phiếu thu #{row.id} · {formatSpaDate(row.payment_date)}</small></span><strong>{money(row.amount)}</strong></div>)}<div className="receipt-row receipt-total"><span>TỔNG ĐÃ THU</span><strong>{money(records.reduce((sum, row) => sum + Number(row.amount || 0), 0))}</strong></div></>}
    {paymentNote}{thanks}</>}
  </div>, document.body)
}