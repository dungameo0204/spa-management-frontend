import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FilePenLine } from 'lucide-react'
import useDialogFocus from './useDialogFocus'

export default function InvoiceSessionActions({ line, onChange }) {
  const [open, setOpen] = useState(false)
  const canRecord = line.serviceChildren?.length ? line.serviceChildren.some(child => child.performNow) : Boolean(line.performNow)
  return <div className="invoice-session-actions"><button type="button" disabled={!canRecord} className={line.sessionNote ? 'has-value' : ''} title={canRecord ? 'Ghi chú lần thực hiện' : 'Chọn ít nhất một dịch vụ làm ngay để ghi chú lần thực hiện'} onClick={() => setOpen(true)}><FilePenLine size={13} />Ghi chú{line.sessionNote ? ' ✓' : ''}</button>{open && createPortal(<NoteDialog value={line.sessionNote || ''} name={line.product_name} onClose={() => setOpen(false)} onSave={value => { onChange('sessionNote', value); setOpen(false) }} />, document.body)}</div>
}

function NoteDialog({ value, name, onClose, onSave }) {
  const [note, setNote] = useState(value), ref = useRef(null)
  useDialogFocus(ref, onClose)
  return <div className="consultant-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section ref={ref} className="consultant-dialog invoice-note-dialog" role="dialog" aria-modal="true" aria-label="Ghi chú lần thực hiện"><header><strong>Ghi chú lần thực hiện · {name}</strong><button type="button" className="btn secondary" onClick={onClose}>Hủy</button></header><div className="consultant-dialog-body"><label className="field">Ghi chú lần thực hiện<textarea rows={4} value={note} onChange={event => setNote(event.target.value)} /></label><p className="small-muted">Khi lưu hóa đơn, ghi chú được lưu trên lần thực hiện. Với nhóm dịch vụ, đây là ghi chú của parent visit.</p></div><footer><button type="button" className="btn primary" onClick={() => onSave(note)}>Dùng ghi chú</button></footer></section></div>
}