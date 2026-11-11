import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { canFollowUpTreatmentHistory } from '../auth/permissions'
import { updateTreatmentHistoryNote } from '../api/resources'
import useDialogFocus from './useDialogFocus'
import './TreatmentSessionDialog.css'

export default function TreatmentGroupSessionDialog({ card, history, user, onClose }) {
  const representative = history
  const [note, setNote] = useState(representative?.note || ''), [pending, setPending] = useState(false), [message, setMessage] = useState('')
  const saved = useRef(representative?.note?.trim() || null), busy = useRef(false), ref = useRef(null), qc = useQueryClient(), allowed = Boolean(history?.id) && canFollowUpTreatmentHistory(user, history)
  const close = () => { if (!busy.current) onClose() }
  useDialogFocus(ref, close)
  async function save() {
    if (busy.current || !allowed) return
    if (new TextEncoder().encode(note).length > 65535) return setMessage('Ghi chú tối đa 65535 byte UTF-8.')
    busy.current = true; setPending(true); setMessage('')
    try {
      const value = note.trim() || null
      if (value !== saved.current) {
        await updateTreatmentHistoryNote(history.id, value)
        saved.current = value
      }
      await Promise.allSettled([qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }), qc.invalidateQueries({ queryKey: ['treatments'] })])
      setMessage('Đã lưu ghi chú lần thực hiện.')
    } catch (error) { setMessage(error.message) } finally { busy.current = false; setPending(false) }
  }
  return <div className="confirm-layer session-dialog-layer"><div className="confirm-backdrop" onClick={close} /><section ref={ref} className="confirm-card session-dialog" role="dialog" aria-modal="true" aria-label="Ghi chú nhóm dịch vụ">
    <span className="eyebrow">LẦN THỰC HIỆN</span><h2>Ghi chú lần thực hiện</h2><p>{card.customer_name} · {card.product_name}</p>
    <label className="field session-note-field"><span>Ghi chú lần thực hiện</span><textarea rows={3} value={note} disabled={pending || !allowed} onChange={event => setNote(event.target.value)} /></label>
    <div className="session-note-field"><strong>Lần thực hiện #{history?.id}</strong></div>
    {message && <p role="status" className="session-dialog-message">{message}</p>}<div className="drawer-actions"><button type="button" className="btn secondary" disabled={pending} onClick={close}>Đóng</button>{allowed && <button type="button" className="btn primary" disabled={pending || !navigator.onLine} onClick={save}>Lưu ghi chú</button>}</div>
  </section></div>
}