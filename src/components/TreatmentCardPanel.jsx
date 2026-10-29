import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getResource } from '../api/resources'
import { useAuth } from '../auth/AuthProvider'
import { canExecuteCard, treatmentCards } from '../utils/todayTreatments'
import { formatSpaDate } from '../utils/format'
import TreatmentExecution from './TreatmentExecution'
import TreatmentCloseDialog from './TreatmentCloseDialog'
import TreatmentGroupSignature from './TreatmentGroupSignature'
import TreatmentHistoryList from './TreatmentHistoryList'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import './TreatmentCardPanel.css'

export function sessionLabel(card) {
  return card.closed_at ? 'Đã ký kết thúc' : card.remaining_sessions === null ? 'Trọn đời' : `${card.remaining_sessions ?? '—'}/${card.total_sessions ?? '—'} buổi${Number(card.remaining_sessions) === 0 ? ' · Hết buổi, chờ ký kết thúc' : ''}`
}

export default function TreatmentCardPanel({ card, branchId, onOpen, showHistory = false, branches, onAssign, onUndo, onUpdated }) {
  const { user } = useAuth(), qc = useQueryClient()
  const [expanded, setExpanded] = useState(showHistory), [executing, setExecuting] = useState(false), [closing, setClosing] = useState(false), [session, setSession] = useState(null)
  const detail = useQuery({ queryKey: ['treatments', 'card-detail', card.id], queryFn: () => getResource('treatments', card.id) })
  const current = { ...card, ...detail.data }, grouped = Boolean(current.children?.length)
  const cards = treatmentCards(current)
  const sessions = cards.flatMap(item => (item.histories || []).map(history => ({ card: { ...item, customer_name: current.customer_name }, history })))
  async function refresh(updated) {
    if (updated) qc.setQueryData(['treatments', 'card-detail', card.id], updated)
    else await detail.refetch()
    await onUpdated?.(updated)
  }
  return <article className="treatment-card-item treatment-root-panel">
    <div className="treatment-card-heading treatment-parent-heading">
      <button className="text-action" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{current.product_name} {grouped ? `· ${current.children.length} liệu trình con` : `· ${sessionLabel(current)}`} {expanded ? '▴' : '▾'}</button>
      {grouped && current.closed_at && <span>Đã ký kết thúc</span>}
      {onOpen && <button className="text-action" onClick={() => onOpen(current)}>Xem lịch sử</button>}
      <span className="small-muted">Ngày tạo: {formatSpaDate(current.created_at)}</span>
      {!current.closed_at && cards.some(canExecuteCard) && <button className="btn secondary" disabled={!detail.isSuccess} onClick={() => { setExpanded(true); setExecuting(!executing) }}>Thực hiện</button>}
      {!current.closed_at && !current.parent_treatment_id && ['MANAGER', 'STAFF'].includes(user.system_role) && <button className="btn secondary" disabled={!detail.isSuccess} onClick={() => setClosing(true)}>Ký kết thúc liệu trình</button>}
    </div>
    {detail.isError && <p role="alert">{detail.error.message} <button className="text-action" onClick={() => detail.refetch()}>Thử lại</button></p>}
    {current.note && <p className="session-note">{grouped ? 'Ghi chú chung hiện tại' : 'Ghi chú liệu trình'}: {current.note}</p>}
    {expanded && <>
      {grouped && cards.slice(1).map(child => <div className="treatment-child-row" key={child.id}><strong>{child.product_name}</strong><span>{sessionLabel(child)}</span></div>)}
      {grouped && <TreatmentGroupSignature card={current} sessions={sessions} user={user} />}
      {executing && <TreatmentExecution key={current.id} card={current} user={user} branchId={branchId} onUpdated={() => refresh()} onCancel={() => setExecuting(false)} />}
      {(showHistory || !onOpen) && <><h3>Lịch sử thực hiện</h3>{!sessions.length && <p>Chưa thực hiện buổi nào.</p>}{cards.filter(item => item.histories?.length).map(item => <section key={item.id} className="treatment-child-history"><h4>{item.product_name}</h4><TreatmentHistoryList histories={item.histories} branches={branches} user={user} onAssign={onAssign} onUndo={onUndo} onFollowUp={!grouped ? history => setSession({ history, card: item }) : undefined} /></section>)}</>}
    </>}
    {current.closed_at && <div className="treatment-closure"><strong>Đã kết thúc: {formatSpaDate(current.closed_at, { timeStyle: 'short' })}</strong>{current.closure_note && <p>Ghi chú kết thúc: {current.closure_note}</p>}{current.closure_signature_svg && <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(current.closure_signature_svg)}`} alt="Chữ ký khách hàng kết thúc liệu trình" />}</div>}
    {closing && <TreatmentCloseDialog card={current} onClose={() => setClosing(false)} onUpdated={refresh} />}
    {session && <TreatmentSessionDialog {...session} user={user} onClose={() => setSession(null)} onUpdated={() => refresh()} />}
  </article>
}