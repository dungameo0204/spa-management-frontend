import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { updateTreatmentHistoryNote } from '../api/resources'
import { canFollowUpTreatmentHistory } from '../auth/permissions'
import { formatSpaDate } from '../utils/format'
import useDialogFocus from './useDialogFocus'
import './TreatmentSessionDialog.css'

export default function TreatmentSessionDialog({ history, card, user, onClose, onUpdated }) {
  const [note, setNote] = useState(history.note || ''), [pending, setPending] = useState(false), [message, setMessage] = useState('')
  const busy = useRef(false), saved = useRef(history.note?.trim() || null), ref = useRef(null), id = useId(), qc = useQueryClient()
  const allowed = canFollowUpTreatmentHistory(user, history), changed = (note.trim() || null) !== saved.current
  const close = () => { if (!busy.current) onClose() }
  useDialogFocus(ref, close)
  async function save() {
    if (busy.current || !allowed || !changed) return
    if (new TextEncoder().encode(note).length > 65535) return setMessage('Ghi chú tối đa 65535 byte UTF-8.')
    busy.current = true; setPending(true); setMessage('')
    try {
      const result = await updateTreatmentHistoryNote(history.id, note.trim() || null)
      saved.current = note.trim() || null
      await Promise.allSettled([qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }), qc.invalidateQueries({ queryKey: ['treatments'] })])
      await onUpdated?.(result.data); setMessage('Đã lưu ghi chú.')
    } catch (error) { setMessage(error.message) } finally { busy.current = false; setPending(false) }
  }
  return <div className="confirm-layer session-dialog-layer"><div className="confirm-backdrop" onClick={close} /><section ref={ref} className="confirm-card session-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
    <span className="eyebrow">BUỔI THỰC HIỆN #{history.id}</span><h2 id={`${id}-title`}>Ghi chú buổi thực hiện</h2>
    <p>{card.customer_name} · {card.product_name}<br />{formatSpaDate(history.execution_date)} · {history.branch_name || `Cơ sở #${history.branch_id ?? '—'}`}</p>
    <label className="field session-note-field"><span>Ghi chú buổi thực hiện</span><textarea rows={4} value={note} disabled={pending || !allowed} onChange={event => setNote(event.target.value)} placeholder="Tình trạng da, cảm nhận hoặc lưu ý cho buổi sau…" /></label>
    {!allowed && <p className="small-muted">Buổi này chỉ được xem hoặc không còn khả dụng.</p>}{message && <p role="status" className="session-dialog-message">{message}</p>}
    <div className="drawer-actions"><button type="button" className="btn secondary" disabled={pending} onClick={close}>Đóng</button>{allowed && <button type="button" className="btn primary" disabled={pending || !changed || !navigator.onLine} onClick={save}>Lưu ghi chú</button>}</div>
  </section></div>
}