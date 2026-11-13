import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { canFollowUpTreatmentHistory } from '../auth/permissions'
import { signTreatmentHistory, updateTreatmentHistoryNote } from '../api/resources'
import SignaturePad from './SignaturePad'
import useDialogFocus from './useDialogFocus'
import './TreatmentSessionDialog.css'

const isSigned = history => Boolean(history?.customer_signature_svg || history?.customer_signed_at)

export default function TreatmentGroupSessionDialog({ card, history, sessions, user, onClose, onUpdated }) {
  const [session, setSession] = useState(history)
  const [note, setNote] = useState(history?.note || '')
  const [signature, setSignature] = useState(null)
  const [pending, setPending] = useState(false), [message, setMessage] = useState('')
  const busy = useRef(false), ref = useRef(null), qc = useQueryClient()
  const close = () => { if (!busy.current) onClose() }
  useDialogFocus(ref, close)
  const allowed = canFollowUpTreatmentHistory(user, session)
  const signed = isSigned(session)
  const changed = (note.trim() || null) !== (session?.note?.trim() || null)
  async function save(withSignature) {
    if (busy.current || !allowed || (withSignature && (signed || !signature))) return
    if (new TextEncoder().encode(note).length > 65535) { setMessage('Ghi chú tối đa 65535 byte UTF-8.'); return }
    busy.current = true; setPending(true); setMessage('')
    let updated = session
    try {
      const normalizedNote = note.trim() || null
      if (changed) {
        const result = await updateTreatmentHistoryNote(session.id, normalizedNote)
        updated = { ...updated, ...result.data, note: normalizedNote }
        setSession(updated)
      }
      if (withSignature) {
        const result = await signTreatmentHistory(session.id, signature)
        updated = { ...updated, ...result.data, customer_signature_svg: result.data?.customer_signature_svg || signature }
        setSession(updated); setSignature(null)
      }
      setMessage(withSignature ? 'Đã ký xác nhận.' : 'Đã lưu ghi chú buổi thực hiện.')
      await onUpdated?.(updated)
    } catch (error) {
      setMessage(error.message)
    } finally {
      await Promise.allSettled([qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }), qc.invalidateQueries({ queryKey: ['treatments'] })])
      busy.current = false; setPending(false)
    }
  }
  return <div className="confirm-layer session-dialog-layer"><div className="confirm-backdrop" onClick={close} /><section ref={ref} className="confirm-card session-dialog" role="dialog" aria-modal="true" aria-label="Ghi chú và chữ ký nhóm dịch vụ">
    <span className="eyebrow">XÁC NHẬN CÁC DỊCH VỤ ĐÃ LÀM</span><h2>Ghi chú và chữ ký</h2>
    <p>{card.customer_name} · {card.product_name}</p>
    <label className="field session-note-field"><span>Ghi chú buổi thực hiện</span><textarea aria-label="Ghi chú buổi thực hiện" rows={3} value={note} disabled={pending || !allowed} onChange={event => setNote(event.target.value)} /></label>
    {sessions.map(({ card: child, history: childHistory }) => <div className="session-note-field" key={childHistory.id}><strong>{child.product_name} · Buổi #{childHistory.id}</strong></div>)}
    {session?.customer_signature_svg && <div className="session-saved-signature"><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(session.customer_signature_svg)}`} alt="Chữ ký đã lưu cho buổi thực hiện trong nhóm" /></div>}
    {!signed && allowed && <SignaturePad customerName={card.customer_name} productName={card.product_name} disabled={pending} onChange={setSignature} />}
    {message && <p role="status" className="session-dialog-message">{message}</p>}
    <div className="drawer-actions"><button type="button" className="btn secondary" disabled={pending} onClick={close}>Đóng</button>{allowed && <button type="button" className="btn secondary" disabled={pending || !changed || !navigator.onLine} onClick={() => save(false)}>Lưu ghi chú</button>}{allowed && !signed && <button type="button" className="btn primary" disabled={pending || !signature || !navigator.onLine} onClick={() => save(true)}>Lưu và ký xác nhận</button>}</div>
  </section></div>
}