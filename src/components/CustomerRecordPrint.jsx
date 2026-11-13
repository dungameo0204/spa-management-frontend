import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency, formatSpaDate } from '../utils/format'
import { dateInputDisplay } from './DateInput'
import { historyFields, referralSources } from '../utils/customerForm'
import { cardName, paymentRecordRows, treatmentRecordRows } from '../utils/customerRecord'
import './CustomerRecordPrint.css'

const gender = { FEMALE: 'Nữ', MALE: 'Nam', OTHER: 'Khác' }
const optionLabel = (values, options) => (values || []).map(value => options.find(([key]) => key === value)?.[1] || value)
const blankRows = count => Array.from({ length: count }, (_, index) => ({ id: `blank-${index}` }))
const sessions = card => card?.total_sessions === null ? 'Không giới hạn' : card?.total_sessions != null ? `${card.total_sessions} buổi` : ''
const signatureSource = svg => {
  if (!svg) return ''
  const normalized = /<svg\b[^>]*\bxmlns=/i.test(svg) ? svg : svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalized)}`
}

function treatmentCards(timeline) {
  const cards = [], visited = new Set()
  const add = card => {
    if (!card || visited.has(String(card.id))) return
    visited.add(String(card.id)); cards.push(card)
    ;(card.children || []).forEach(add)
  }
  timeline.forEach(entry => add(entry.type === 'purchase' ? entry.item?.treatment : entry.treatment))
  return cards
}

function purchasedItems(timeline) {
  return timeline.filter(entry => entry.type === 'purchase' && entry.item)
    .map(entry => ({ ...entry.item, purchase_date: entry.date || entry.item.invoice_date }))
    .sort((a, b) => String(a.purchase_date || '').localeCompare(String(b.purchase_date || '')) || Number(a.invoice_item_id || 0) - Number(b.invoice_item_id || 0))
}

function PurchaseList({ title, items }) {
  if (!items.length) return null
  return <section className="customer-record-purchases">
    <h2>{title}</h2>
    <ul>{items.map((item, index) => {
      const children = (item.treatment?.children || []).filter(child => child.total_sessions === null || Number(child.total_sessions) > 0)
      const detail = children.map(child => `${cardName(child)} × ${sessions(child)}`).join(', ')
      return <li key={item.invoice_item_id ?? `${item.invoice_id}-${index}`}>
        <span><b>{item.product_name || item.snapshot_name || cardName(item.treatment)} × {Number(item.quantity || 1)}</b>{detail && <> <em>({detail})</em></>}{item.purchase_date && <small>Ngày mua: {formatSpaDate(item.purchase_date)}</small>}</span>
        <strong>{formatCurrency(item.final_price ?? Number(item.quantity || 0) * Number(item.unit_price || item.snapshot_price || 0))}</strong>
      </li>
    })}</ul>
  </section>
}

function WritingLine({ label, value, large = false }) {
  return <p className={large ? 'is-large' : ''}><b>{label}:</b><span>{value || ''}</span></p>
}
function PaymentHistory({ invoices, debtPayments }) {
  const rows = paymentRecordRows(invoices, debtPayments)
  if (!rows.length) return null
  return <section className="customer-record-payments"><h2>LỊCH SỬ THANH TOÁN</h2><table><thead><tr><th>Ngày</th><th>Nội dung</th><th>Số tiền</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{formatSpaDate(row.date)}</td><td>{row.content}</td><td>{formatCurrency(row.amount)}</td></tr>)}</tbody></table></section>
}

function TreatmentSheet({ customer, cards }) {
  const rowsWithHistory = treatmentRecordRows(cards)
  const total = Math.max(12, rowsWithHistory.length + 5)
  const rows = [...rowsWithHistory, ...blankRows(Math.max(0, total - rowsWithHistory.length))]
  return <section className="customer-record-page customer-record-treatment-page">
    <h1>PHIẾU THEO DÕI ĐIỀU TRỊ</h1>
    <div className="customer-record-line"><b>Họ và tên chủ thẻ:</b><span>{customer.fullname}</span></div>
    <div className="customer-record-line"><b>SĐT:</b><span>{customer.phone_number}</span></div>
    <table className="customer-record-treatment-table"><thead><tr><th>Ngày</th><th>Dịch vụ thực hiện</th><th>Số lần</th><th>Nhân viên thực hiện</th><th>Chữ ký KH</th></tr></thead><tbody>{rows.map((history, index) => <tr key={history.id || `blank-${index}`}><td>{history.execution_date ? formatSpaDate(history.execution_date) : ''}</td><td>{history.services?.join(', ') || ''}{history.notes?.map((note, noteIndex) => <div className="customer-record-treatment-note" key={`${history.id}-note-${noteIndex}`}><b>Ghi chú:</b> {note}</div>)}</td><td>{history.visitNumber || ''}</td><td>{history.staff?.map((staff, staffIndex) => <div key={`${history.id}-staff-${staffIndex}`}>{staff}</div>)}</td><td>{history.signature && <img className="customer-record-signature-image" src={signatureSource(history.signature)} alt="Chữ ký khách hàng" />}</td></tr>)}</tbody></table>
  </section>
}

export default function CustomerRecordPrint({ record, onDone, mode = 'print' }) {
  useEffect(() => {
    if (!record || mode !== 'print') return
    let timer
    const done = () => { clearTimeout(timer); onDone() }
    window.addEventListener('afterprint', done)
    const frame = requestAnimationFrame(() => { timer = setTimeout(done, 30000); window.print() })
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); window.removeEventListener('afterprint', done) }
  }, [record, onDone, mode])
  if (!record) return null
  const { customer, timeline = [], treatments, invoices = [], debtPayments = [] } = record
  const referral = optionLabel(customer.referral_sources, referralSources)
  const cards = treatments || treatmentCards(timeline)
  const purchases = purchasedItems(timeline)
  const services = purchases.filter(item => !Number(item.is_product))
  const products = purchases.filter(item => Number(item.is_product))
  const id = mode === 'share' ? 'customer-record-share' : 'customer-record-print'
  return createPortal(<div id={id} className={`customer-record-print${mode === 'share' ? ' is-share' : ''}`} aria-label={mode === 'share' ? 'Hồ sơ khách hàng để chia sẻ' : 'Hồ sơ khách hàng in'}>
    <style media="print">{'@page { size: A4 portrait; margin: var(--customer-record-page-margin-top, 12mm) var(--customer-record-page-margin-right, 11mm) var(--customer-record-page-margin-bottom, 15mm) var(--customer-record-page-margin-left, 11mm); }'}</style>
    <section className="customer-record-page customer-record-cover">
      <header><img className="customer-record-mark" src="/icons/icon.svg" alt="ROSA" width="60" height="60" /><div><strong>HỒ SƠ KHÁCH HÀNG</strong><small>THEO DÕI VÀ CHĂM SÓC KHÁCH HÀNG</small></div></header>
      <div className="customer-record-code"><span>Mã hồ sơ: <b>{customer.profile_code || `KH-${customer.id}`}</b></span><span>Ngày lập: <b>{customer.profile_date ? formatSpaDate(customer.profile_date) : formatSpaDate(new Date())}</b></span></div>
      <h1>THÔNG TIN KHÁCH HÀNG</h1>
      <div className="customer-record-details"><p><b>Họ tên khách hàng:</b><span>{customer.fullname}</span></p><p><b>Giới tính:</b><span>{gender[customer.gender] || ''}</span></p><p><b>Ngày sinh / Tuổi:</b><span>{dateInputDisplay(customer.date_of_birth, true)}</span></p><p><b>Điện thoại:</b><span>{customer.phone_number}</span></p><p className="wide"><b>Địa chỉ:</b><span>{customer.address}</span></p></div>
      <h3>Biết đến spa qua đâu?</h3><div className="customer-record-referrals">{referralSources.map(([key, label]) => <div key={key}><i className={referral.includes(label) ? 'checked' : ''}>✓</i>{label}</div>)}</div>
      <section className="customer-record-history"><h1>KHAI THÁC TIỀN SỬ</h1><ol>{historyFields.map(([key, label]) => <li key={label}><b>{label}?</b><span>{customer[key] || ''}</span></li>)}</ol></section>
      <section className="customer-record-consultation"><h2>THÔNG TIN TƯ VẤN</h2><div className="customer-record-writing"><WritingLine label="Công nợ còn lại" value={formatCurrency(customer.total_debt ?? 0)} /><WritingLine label="Kết luận tình trạng da" value={customer.skin_assessment} large /><WritingLine label="Dịch vụ điều trị" value={customer.consultation_note} large /></div></section>
    </section>
    <section className="customer-record-page customer-record-consultation">
      <PurchaseList title="DỊCH VỤ ĐÃ MUA" items={services} />
      <PurchaseList title="SẢN PHẨM ĐÃ MUA" items={products} />
      <PaymentHistory invoices={invoices} debtPayments={debtPayments} />
    </section>
    <TreatmentSheet customer={customer} cards={cards} />
  </div>, document.body)
}