import { useCallback, useId, useRef } from 'react'
import useDialogFocus from './useDialogFocus'

export default function ConfirmDialog({ title = 'Xác nhận thao tác', message, onConfirm, onCancel, pending = false, cancelLabel = 'Giữ lại', confirmLabel = 'Xác nhận' }) {
  const ref = useRef(null)
  const id = useId()
  const cancel = useCallback(() => { if (!pending) onCancel() }, [pending, onCancel])
  useDialogFocus(ref, cancel)
  return <div className="confirm-layer" role="presentation"><div className="confirm-backdrop" onClick={cancel} /><section ref={ref} className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}><span className="eyebrow">XÁC NHẬN</span><h2 id={`${id}-title`}>{title}</h2><p id={`${id}-message`}>{message}</p><div className="drawer-actions"><button className="btn secondary" type="button" onClick={cancel} disabled={pending}>{cancelLabel}</button><button className="btn danger" type="button" onClick={onConfirm} disabled={pending}>{pending ? 'Đang xử lý...' : confirmLabel}</button></div></section></div>
}