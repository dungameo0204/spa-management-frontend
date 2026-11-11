import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency, formatSpaDate } from '../utils/format'
import { dateInputDisplay } from './DateInput'
import { historyFields, referralSources } from '../utils/customerForm'
import './CustomerRecordPrint.css'

const gender = { FEMALE: 'Nữ', MALE: 'Nam', OTHER: 'Khác' }
const optionLabel = (values, options) => (values || []).map(value => options.find(([key]) => key === value)?.[1] || value)
const blankRows = count => Array.from({ length: count }, (_, index) => ({ id: `blank-${index}` }))
const cardName = card => card?.product_name || card?.name || `Dịch vụ #${card?.product_id}`
const sessions = card => card?.total_sessions === null ? 'Trọn đời' : card?.total_sessions != null ? `${card.total_sessions} buổi` : ''
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
  return timeline.filter(entry => entry.type === 'purchase' && entry.item).map(entry => ({ ...entry.item, purchase_date: entry.date || entry.item.invoice_date }))
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

function TreatmentSheet({ customer, cards }) {
  const histories = treatmentCards(cards.map(treatment => ({ type: 'treatment', treatment }))).flatMap(card => (card.histories || []).map(history => ({ ...history, card })))
    .sort((a, b) => String(a.execution_date).localeCompare(String(b.execution_date)) || Number(a.id || 0) - Number(b.id || 0))
  const sessionsByTreatment = new Map()
  const grouped = new Map()
  histories.forEach(history => {
    const isLifetime = history.card.total_sessions === null
    const session = isLifetime ? null : (sessionsByTreatment.get(history.card.id) || 0) + 1
    if (!isLifetime) sessionsByTreatment.set(history.card.id, session)
    const date = String(history.execution_date || '').slice(0, 10)
    const row = grouped.get(date) || { id: `date-${date}`, execution_date: history.execution_date, services: [], signatures: [] }
    row.services.push(`${cardName(history.card)}${session ? ` (lần ${session})` : ''}`)
    grouped.set(date, row)
  })
  const rowsWithHistory = [...grouped.values()].map((row, index) => ({ ...row, visitNumber: index + 1 }))
  const total = Math.max(12, rowsWithHistory.length + 5)
  const rows = [...rowsWithHistory, ...blankRows(Math.max(0, total - rowsWithHistory.length))]
  return <section className="customer-record-page customer-record-treatment-page">
    <h1>PHIẾU THEO DÕI ĐIỀU TRỊ</h1>
    <div className="customer-record-line"><b>Họ và tên chủ thẻ:</b><span>{customer.fullname}</span></div>
    <div className="customer-record-line"><b>SĐT:</b><span>{customer.phone_number}</span></div>
    <table className="customer-record-treatment-table"><thead><tr><th>Ngày</th><th>Dịch vụ thực hiện</th><th>Số lần</th></tr></thead><tbody>{rows.map((history, index) => <tr key={history.id ?? `blank-${index}`}><td>{history.execution_date ? formatSpaDate(history.execution_date) : ''}</td><td>{history.services?.join(', ') || ''}</td><td>{history.visitNumber || ''}</td></tr>)}</tbody></table>
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
  const { customer, timeline = [], treatments } = record
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
    </section>
    <section className="customer-record-page customer-record-consultation">
      <PurchaseList title="DỊCH VỤ ĐÃ MUA" items={services} />
      <PurchaseList title="SẢN PHẨM ĐÃ MUA" items={products} />
      <h2>THÔNG TIN TƯ VẤN</h2>
      <div className="customer-record-writing"><WritingLine label="Công nợ còn lại" value={formatCurrency(customer.total_debt ?? 0)} /><WritingLine label="Kết luận tình trạng da" value={customer.skin_assessment} large /><WritingLine label="Nội dung tư vấn" value={customer.consultation_note} large /></div>
      <p className="customer-record-confirmation">Tôi đã được tư vấn, giải thích tình trạng da và các phương pháp kết hợp trong quá trình điều trị; đồng ý thực hiện theo chỉ định liệu trình và hướng dẫn chăm sóc.</p>
    </section>
    <TreatmentSheet customer={customer} cards={cards} />
  </div>, document.body)
}