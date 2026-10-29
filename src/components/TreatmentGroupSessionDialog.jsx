import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { canFollowUpTreatmentHistory } from '../auth/permissions'
import { getResource, signTreatmentHistory, updateTreatmentGroupNote } from '../api/resources'
import SignaturePad from './SignaturePad'
import useDialogFocus from './useDialogFocus'
import './TreatmentSessionDialog.css'

const isSigned = history => Boolean(history.customer_signature_svg || history.customer_signed_at)

export default function TreatmentGroupSessionDialog({ card, sessions, user, onClose }) {
  const [entries, setEntries] = useState(sessions)
  const [note, setNote] = useState(card.note || '')
  const savedNote = useRef(card.note?.trim() || null)
  const [signature, setSignature] = useState(null)
  const [pending, setPending] = useState(false), [message, setMessage] = useState('')
  const busy = useRef(false), ref = useRef(null), qc = useQueryClient()
  const close = () => { if (!busy.current) onClose() }
  useDialogFocus(ref, close)
  const unsigned = entries.filter(({ history }) => !isSigned(history) && canFollowUpTreatmentHistory(user, history))
  const preview = entries.find(({ history }) => history.customer_signature_svg)?.history.customer_signature_svg
  const canEditNote = user?.system_role === 'MANAGER' || entries.some(({ history }) => canFollowUpTreatmentHistory(user, history))
  async function save(withSignature) {
    if (busy.current || (withSignature && !signature)) return
    if (new TextEncoder().encode(note).length > 65535) { setMessage('Ghi chú tối đa 65535 byte UTF-8.'); return }
    busy.current = true; setPending(true); setMessage('')
    const updated = [...entries]
    let signedCount = 0
    try {
      const normalizedNote = note.trim() || null
      if (canEditNote && normalizedNote !== savedNote.current) {
        await updateTreatmentGroupNote(card.id, normalizedNote)
        savedNote.current = normalizedNote
      }
      if (!withSignature) { setMessage('Đã lưu ghi chú chung liệu trình.'); return }
      // Re-read each card before writing, including after a partial failure. Never
      // overwrite a signature or accidentally execute another session on retry.
      const details = new Map()
      for (let index = 0; index < updated.length; index++) {
        const entry = updated[index]
        if (!details.has(entry.card.id)) details.set(entry.card.id, await getResource('treatments', entry.card.id))
        const latest = details.get(entry.card.id).histories?.find(history => Number(history.id) === Number(entry.history.id))
        if (!latest || latest.deleted_at) throw new Error(`Buổi #${entry.history.id} không còn khả dụng. Đóng và mở lại để kiểm tra.`)
        updated[index] = { ...entry, history: latest }
      }
      setEntries([...updated])
      for (let index = 0; index < updated.length; index++) {
        const entry = updated[index]
        if (!canFollowUpTreatmentHistory(user, entry.history)) continue
        let history = entry.history
        if (withSignature && !isSigned(history)) {
          const result = await signTreatmentHistory(history.id, signature)
          history = { ...history, ...result.data, customer_signature_svg: result.data?.customer_signature_svg || signature }
          updated[index] = { ...entry, history }; setEntries([...updated]); signedCount++
        }
      }
      setSignature(null)
      setMessage(withSignature ? 'Đã ký xác nhận các dịch vụ đã thực hiện.' : 'Đã lưu ghi chú.')
    } catch (error) {
      setMessage(`${signedCount ? `Đã ký ${signedCount} buổi. ` : ''}${error.message} Các buổi đã ký được giữ nguyên; có thể thử lại cho phần chưa lưu.`)
    } finally {
      await Promise.allSettled([qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }), qc.invalidateQueries({ queryKey: ['treatments'] })])
      busy.current = false; setPending(false)
    }
  }
  return <div className="confirm-layer session-dialog-layer"><div className="confirm-backdrop" onClick={close} /><section ref={ref} className="confirm-card session-dialog" role="dialog" aria-modal="true" aria-label="Ghi chú và chữ ký nhóm dịch vụ">
    <span className="eyebrow">XÁC NHẬN CÁC DỊCH VỤ ĐÃ LÀM</span><h2>Ghi chú và chữ ký</h2>
    <p>{card.customer_name} · {card.product_name}</p>
    <label className="field session-note-field"><span>Ghi chú chung liệu trình</span><textarea aria-label="Ghi chú chung liệu trình" rows={3} value={note} disabled={pending || !canEditNote} onChange={event => setNote(event.target.value)} /></label>
     
    {entries.map(({ card: child, history }) => <div className="session-note-field" key={history.id}><strong>{child.product_name} · Buổi #{history.id} · {isSigned(history) ? 'Đã ký' : 'Chưa ký'}</strong>{history.note && <p className="small-muted">Ghi chú riêng đã lưu của buổi: {history.note}</p>}</div>)}
    {preview && <div className="session-saved-signature"><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview)}`} alt="Chữ ký đã lưu cho buổi thực hiện trong nhóm" /></div>}
    {unsigned.length > 0 && <SignaturePad customerName={card.customer_name} productName={card.product_name} disabled={pending} onChange={setSignature} />}
    {message && <p role="status" className="session-dialog-message">{message}</p>}
    <div className="drawer-actions"><button type="button" className="btn secondary" disabled={pending} onClick={close}>Đóng</button><button type="button" className="btn secondary" disabled={pending || !canEditNote || !navigator.onLine} onClick={() => save(false)}>Lưu ghi chú</button>{unsigned.length > 0 && <button type="button" className="btn primary" disabled={pending || !signature || !navigator.onLine} onClick={() => save(true)}>Lưu và ký xác nhận</button>}</div>
  </section></div>
}