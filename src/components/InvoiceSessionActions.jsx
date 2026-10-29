import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FilePenLine, PenLine } from 'lucide-react'
import SignatureDialog from './SignatureDialog'
import useDialogFocus from './useDialogFocus'
import './SignaturePad.css'

export default function InvoiceSessionActions({ line, customerName, onChange }) {
  const [dialog, setDialog] = useState(null)
  return <div className="invoice-session-actions">
    <button type="button" className={line.sessionNote ? 'has-value' : ''} title="Ghi chú cho các buổi được chọn làm" onClick={() => setDialog('note')}><FilePenLine size={13} />Ghi chú{line.sessionNote ? ' ✓' : ''}</button>
    <button type="button" className={line.sessionSignature ? 'has-value' : ''} title="Chữ ký xác nhận các buổi được chọn làm, không kết thúc liệu trình" onClick={() => setDialog('signature')}><PenLine size={13} />{line.sessionSignature ? 'Đã ký ✓' : 'Chữ ký'}</button>
    {dialog === 'note' && createPortal(<NoteDialog value={line.sessionNote || ''} name={line.product_name} onClose={() => setDialog(null)} onSave={value => { onChange('sessionNote', value); setDialog(null) }} />, document.body)}
    {dialog === 'signature' && createPortal(<SignatureDialog customerName={customerName} productName={line.product_name} onClose={() => setDialog(null)} onConfirm={value => { onChange('sessionSignature', value); setDialog(null) }} />, document.body)}
    {line.sessionSignature && <button type="button" aria-label="Xóa chữ ký buổi" onClick={() => onChange('sessionSignature', null)}>×</button>}
  </div>
}

function NoteDialog({ value, name, onClose, onSave }) {
  const [note, setNote] = useState(value)
  const ref = useRef(null)
  useDialogFocus(ref, onClose)
  return <div className="consultant-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section ref={ref} className="consultant-dialog invoice-note-dialog" role="dialog" aria-modal="true" aria-label="Ghi chú buổi thực hiện">
    <header><strong>Ghi chú · {name}</strong><button type="button" className="btn secondary" onClick={onClose}>Hủy</button></header>
    <div className="consultant-dialog-body"><label className="field">Ghi chú buổi thực hiện<textarea rows={4} value={note} onChange={event => setNote(event.target.value)} /></label><p className="small-muted">Áp dụng cho các dịch vụ được chọn làm trong lần lưu này, không phải ghi chú kết thúc liệu trình.</p></div>
    <footer><button type="button" className="btn primary" onClick={() => onSave(note)}>Dùng ghi chú</button></footer>
  </section></div>
}