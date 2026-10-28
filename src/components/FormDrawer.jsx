import { X } from 'lucide-react'
import { useCallback, useRef } from 'react'
import useDialogFocus from './useDialogFocus'

export default function FormDrawer({ title, children, onClose, className = '' }) {
  const ref = useRef(null)
  const close = useCallback(() => {
    const event = new CustomEvent('customer-request-close', { cancelable: true, detail: { element: ref.current, close: onClose } })
    if (window.dispatchEvent(event)) onClose()
  }, [onClose])
  useDialogFocus(ref, close)
  return <div className="drawer-layer"><button className="drawer-backdrop" aria-label="Đóng" onClick={close} /><section ref={ref} className={`drawer ${className}`} role="dialog" aria-modal="true" aria-label={title}><div className="drawer-header"><h2>{title}</h2><button className="icon-btn" aria-label="Đóng" onClick={close}><X size={21} /></button></div><div className="drawer-body">{children}</div></section></div>
}