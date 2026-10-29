import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getResource, signTreatmentHistory, updateTreatmentHistoryNote } from '../api/resources'
import { canFollowUpTreatmentHistory } from '../auth/permissions'
import { formatSpaDate } from '../utils/format'
import SignaturePad from './SignaturePad'
import useDialogFocus from './useDialogFocus'
import './TreatmentSessionDialog.css'

export default function TreatmentSessionDialog({ history, card, user, onClose, onUpdated }) {
  const [session, setSession] = useState(history), [note, setNote] = useState(history.note || '')
  const [signature, setSignature] = useState(null), [pending, setPending] = useState(false), [message, setMessage] = useState('')
  const busy = useRef(false), ref = useRef(null), id = useId(), qc = useQueryClient()
  const close = () => { if (!busy.current) onClose() }
  useDialogFocus(ref, close)
  const allowed = canFollowUpTreatmentHistory(user, session)
  const signed = Boolean(session.customer_signature_svg || session.customer_signed_at)
  const changed = (note.trim() || null) !== (session.note?.trim() || null)
  const refresh = async updated => {
    qc.invalidateQueries({ queryKey: ['dashboard-treatments'] })
    qc.invalidateQueries({ queryKey: ['treatments'] })
    await onUpdated?.(updated)
  }
  async function save(withSignature) {
    if (busy.current || !allowed || (withSignature && (signed || !signature))) return
    if (new TextEncoder().encode(note).length > 65535) { setMessage('Ghi chú tối đa 65535 byte UTF-8.'); return }
    busy.current = true; setPending(true); setMessage('')
    let updated = session, noteSaved = false, signing = false
    try {
      if (changed) {
        const result = await updateTreatmentHistoryNote(session.id, note.trim() || null)
        updated = { ...updated, ...result.data, note: note.trim() || null }
        noteSaved = true; setSession(updated)
      }
      if (withSignature) {
        signing = true
        const result = await signTreatmentHistory(session.id, signature)
        updated = { ...updated, ...result.data, customer_signature_svg: result.data?.customer_signature_svg || signature }
        setSession(updated); setSignature(null)
      }
      setMessage(withSignature ? 'Đã ký xác nhận buổi.' : 'Đã lưu ghi chú.')
      try { await refresh(updated) } catch (error) { setMessage(`Đã lưu thành công nhưng chưa tải lại được dữ liệu: ${error.message}. Không cần lưu lại.`) }
    } catch (error) {
      setMessage(`${noteSaved ? 'Ghi chú đã lưu. ' : ''}${signing ? 'Chưa lưu được chữ ký. ' : ''}${error.message}`)
      if (noteSaved) { try { await refresh(updated) } catch { /* Keep the saved note in this dialog. */ } }
      if (error.status === 409 || error.status === 404) {
        try {
          const detail = await getResource('treatments', card.id)
          const latest = detail.histories?.find(item => Number(item.id) === Number(session.id))
          setSession(latest || { ...updated, deleted_at: true })
          if (latest?.customer_signature_svg || latest?.customer_signed_at) setSignature(null)
          try { await refresh(latest) } catch { /* The session state above is still authoritative. */ }
        } catch (refreshError) {
          if (refreshError.status === 404) setSession({ ...updated, deleted_at: true })
          else setMessage(current => `${current} Chưa tải lại được buổi; đóng và mở lại để kiểm tra trạng thái trước khi thử lại.`)
        }
      }
    } finally { busy.current = false; setPending(false) }
  }
  return <div className="confirm-layer session-dialog-layer"><div className="confirm-backdrop" onClick={close} /><section ref={ref} className="confirm-card session-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
    <span className="eyebrow">BUỔI THỰC HIỆN #{session.id}</span><h2 id={`${id}-title`}>Ghi chú và chữ ký</h2>
    <p>{card.customer_name} · {card.product_name}<br />{formatSpaDate(session.execution_date)} · {session.branch_name || `Cơ sở #${session.branch_id ?? '—'}`}</p>
    <label className="field session-note-field"><span>Ghi chú buổi thực hiện</span><textarea rows={4} value={note} disabled={pending || !allowed} onChange={event => setNote(event.target.value)} placeholder="Tình trạng da, cảm nhận hoặc lưu ý cho buổi sau…" /></label>
    {signed ? <div className="session-saved-signature"><strong>Đã ký xác nhận</strong>{session.customer_signature_svg && <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(session.customer_signature_svg)}`} alt="Chữ ký khách hàng xác nhận buổi thực hiện" />}{session.customer_signed_at && <p>Đã ký: {formatSpaDate(session.customer_signed_at, { timeStyle: 'short' })}</p>}<p className="small-muted">Chữ ký không thể thay đổi. Ghi chú vẫn có thể chỉnh sửa theo quyền.</p></div> : allowed ? <><SignaturePad customerName={card.customer_name} productName={card.product_name} disabled={pending} onChange={setSignature} /><p className="small-muted">Chữ ký đã xác nhận sẽ không thể thay đổi.</p></> : <p className="small-muted">Chưa có chữ ký khách hàng.</p>}
    {!allowed && <p className="small-muted">Buổi này chỉ được xem hoặc không còn khả dụng.</p>}
    {message && <p role="status" className="session-dialog-message">{message}</p>}
    <div className="drawer-actions"><button type="button" className="btn secondary" disabled={pending} onClick={close}>Đóng</button>{allowed && <button type="button" className="btn secondary" disabled={pending || !changed || !navigator.onLine} onClick={() => save(false)}>Lưu ghi chú</button>}{allowed && !signed && <button type="button" className="btn primary" disabled={pending || !signature || !navigator.onLine} onClick={() => save(true)}>Lưu và ký xác nhận</button>}</div>{pending && <p role="status">Đang lưu...</p>}
  </section></div>
}