import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Users, X } from 'lucide-react'
import MoneyInput from './MoneyInput'

export default function InvoiceConsultantPicker({ consultants = [], staffs = [], onChange }) {
  const [open, setOpen] = useState(false)
  const closeButton = useRef(null)
  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const onKeyDown = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return <>
    <button type="button" className="consultant-picker" onClick={() => setOpen(true)} aria-haspopup="dialog"><Users size={15} /> Tư vấn{consultants.length > 0 && <span className="consultant-count">{consultants.length}</span>}</button>
    {open && createPortal(<div className="consultant-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className="consultant-dialog" role="dialog" aria-modal="true" aria-label="Nhân viên tư vấn">
        <header><div><strong>Nhân viên tư vấn</strong><p>Chọn người tư vấn cho sản phẩm / dịch vụ này</p></div><button ref={closeButton} type="button" className="icon-btn" aria-label="Đóng chọn tư vấn" onClick={() => setOpen(false)}><X size={18} /></button></header>
        <div className="consultant-dialog-body">
          <div className="consultant-options">{staffs.map(staff => <label key={staff.id}><input type="checkbox" checked={consultants.some(c => Number(c.staff_id) === Number(staff.id))} onChange={event => onChange(event.target.checked ? [...consultants, { staff_id: staff.id, revenue_amount: 0 }] : consultants.filter(c => Number(c.staff_id) !== Number(staff.id)))} /><span>{staff.fullname}</span></label>)}{staffs.length === 0 && <p className="helper-text">Chưa có nhân viên để chọn.</p>}</div>
          {consultants.length === 1 && <p className="consultant-note">Doanh số tư vấn tự lấy bằng giá sau chiết khấu.</p>}
          {consultants.length > 1 && <div className="consultant-revenues"><strong>Doanh số tư vấn</strong>{consultants.map(c => { const staff = staffs.find(s => Number(s.id) === Number(c.staff_id)); return <label className="field" key={c.staff_id}>{staff?.fullname || c.staff_id}<MoneyInput value={c.revenue_amount ?? 0} onChange={value => onChange(consultants.map(entry => Number(entry.staff_id) === Number(c.staff_id) ? { ...entry, revenue_amount: value } : entry))} /></label> })}</div>}
        </div>
        <footer><button type="button" className="btn primary" onClick={() => setOpen(false)}>Xong</button></footer>
      </section>
    </div>, document.body)}
  </>
}