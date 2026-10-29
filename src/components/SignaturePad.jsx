import { useState } from 'react'
import { createPortal } from 'react-dom'
import SignatureDialog from './SignatureDialog'
import './SignaturePad.css'

export default function SignaturePad({ onChange, disabled = false, customerName, productName }) {
  const [signature, setSignature] = useState(null), [open, setOpen] = useState(false)
  const change = value => { setSignature(value); onChange(value) }
  return <div className="session-signature">
    <span className="field-label">Chữ ký khách hàng</span>
    {signature ? <><img className="signature-draft-preview" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(signature)}`} alt="Chữ ký nháp của khách hàng" /><p className="small-muted">Đã có chữ ký — chưa lưu</p></> : <p className="small-muted">Mở vùng ký riêng để khách hàng ký tên.</p>}
    <div className="signature-draft-actions"><button className="btn secondary" type="button" disabled={disabled} onClick={() => setOpen(true)}>{signature ? 'Ký lại' : 'Khách hàng ký tên'}</button>{signature && <button className="btn secondary" type="button" disabled={disabled} onClick={() => change(null)}>Xóa chữ ký</button>}</div>
    {open && createPortal(<SignatureDialog customerName={customerName} productName={productName} onClose={() => setOpen(false)} onConfirm={value => { change(value); setOpen(false) }} />, document.body)}
  </div>
}