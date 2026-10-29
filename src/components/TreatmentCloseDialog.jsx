import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { closeTreatment, getResource } from '../api/resources'
import SignaturePad from './SignaturePad'
import ConfirmDialog from './ConfirmDialog'
import useDialogFocus from './useDialogFocus'
import './TreatmentSessionDialog.css'

export default function TreatmentCloseDialog({ card, onClose, onUpdated }) {
  const [signature, setSignature] = useState(null), [note, setNote] = useState('')
  const [confirm, setConfirm] = useState(false), [pending, setPending] = useState(false), [message, setMessage] = useState('')
  const busy = useRef(false), ref = useRef(null), qc = useQueryClient()
  const close = () => { if (!busy.current) onClose() }
  useDialogFocus(ref, close)
  async function submit() {
    if (busy.current || !signature || !navigator.onLine) return
    if (new TextEncoder().encode(note).length > 65535) { setMessage('Ghi chú tối đa 65535 byte UTF-8.'); setConfirm(false); return }
    busy.current = true; setPending(true); setMessage('')
    let saved = false
    try {
      await closeTreatment(card.id, { closure_note: note.trim() || null, closure_signature_svg: signature })
      saved = true
      await onUpdated?.(await getResource('treatments', card.id))
      onClose()
    } catch (error) {
      // A lost response may follow a committed close. Reconcile before permitting retry.
      try {
        const latest = await getResource('treatments', card.id)
        if (latest.closed_at) { await onUpdated?.(latest); onClose(); return }
      } catch { /* Keep the warning visible; never silently re-submit. */ }
      setMessage(`${saved ? 'Đã kết thúc nhưng chưa tải lại được dữ liệu.' : 'Chưa xác nhận được trạng thái kết thúc.'} ${error.message} Đóng và kiểm tra lại lịch sử trước khi thử lại.`)
      setSignature(null)
    } finally {
      await Promise.allSettled(['treatments', 'dashboard-treatments', 'appointments'].map(key => qc.invalidateQueries({ queryKey: [key] })))
      busy.current = false; setPending(false); setConfirm(false)
    }
  }
  return <div className="confirm-layer session-dialog-layer"><div className="confirm-backdrop" onClick={close} /><section ref={ref} className="confirm-card session-dialog" role="dialog" aria-modal="true" aria-label="Ký kết thúc liệu trình">
    <h2>Ký kết thúc liệu trình</h2><p>{card.customer_name} · {card.product_name}</p>
    <p className="form-alert">Kết thúc thẻ cha và toàn bộ liệu trình con, kể cả thẻ còn buổi hoặc trọn đời. Không thể thực hiện thêm hoặc tự mở lại. Lịch sử và tiền công đã ghi nhận được giữ nguyên.</p>
    <label className="field">Ghi chú kết thúc<textarea rows={3} value={note} disabled={pending} onChange={event => setNote(event.target.value)} /></label>
    <SignaturePad customerName={card.customer_name} productName={`Kết thúc: ${card.product_name}`} disabled={pending} onChange={setSignature} />
    <p className="small-muted">Bắt buộc chữ ký mới xác nhận kết thúc; không sử dụng chữ ký buổi cũ.</p>
    {message && <p role="alert">{message}</p>}
    <div className="drawer-actions"><button className="btn secondary" disabled={pending} onClick={close}>Đóng</button><button className="btn danger" disabled={pending || !signature || !navigator.onLine} onClick={() => setConfirm(true)}>Xác nhận kết thúc</button></div>
    {confirm && <ConfirmDialog title="Bạn có thật sự muốn kết thúc liệu trình này không?" message="Toàn bộ thẻ con sẽ kết thúc và số buổi còn lại về 0, bao gồm thẻ trọn đời. Sau khi kết thúc sẽ không thể thực hiện thêm." pending={pending} cancelLabel="Quay lại" confirmLabel="Kết thúc toàn bộ liệu trình" onCancel={() => setConfirm(false)} onConfirm={submit} />}
  </section></div>
}