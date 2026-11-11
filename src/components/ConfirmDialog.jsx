import { useRef } from 'react'
import useDialogFocus from './useDialogFocus'

export default function ConfirmDialog({ title = 'Xác nhận thao tác', message, onConfirm, onCancel, pending = false, confirmLabel = 'Xác nhận', cancelLabel = 'Giữ lại' }) {
  const ref = useRef(null)
  const cancel = () => { if (!pending) onCancel() }
  useDialogFocus(ref, cancel)
  return <div className="confirm-layer" role="presentation"><div className="confirm-backdrop" onClick={cancel} /><section ref={ref} className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"><span className="eyebrow">XÁC NHẬN</span><h2 id="confirm-title">{title}</h2><p id="confirm-message">{message}</p><div className="drawer-actions"><button className="btn secondary" type="button" onClick={cancel} disabled={pending}>{cancelLabel}</button><button className="btn danger" type="button" onClick={onConfirm} disabled={pending}>{pending ? 'Đang xử lý...' : confirmLabel}</button></div></section></div>
}