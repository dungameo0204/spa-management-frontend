import { CheckCircle2, Clock3, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '../utils/format'

export default function CustomerBookingCard({ booking, writable, onOpen, onEdit, onDelete }) {
  const name = booking.customer_name || booking.registered_customer_name || 'Khách chưa có tên'
  const phone = booking.customer_phone || booking.registered_customer_phone
  return <article className={`booking-card ${booking.arrival_time == null ? 'booking-unscheduled' : ''}`}>
    <div className="booking-card-time"><Clock3 size={16} /><span>{booking.arrival_time ? booking.arrival_time.slice(0, 5) : 'Chưa chọn giờ'}</span></div>
    <div className="booking-card-main"><button className="booking-customer-link" onClick={onOpen} aria-label={`Xem lịch ${name}`}>{name}</button><span className="booking-phone">{phone || 'Chưa có số điện thoại'}</span></div>
    <div className="booking-card-service"><span>{booking.product_name || 'Chưa chọn dịch vụ'}</span></div>
    <div className="booking-card-meta"><span className="booking-consultation">{formatCurrency(booking.consultation_total ?? 0)}</span><span>{booking.branch_name || `Chi nhánh #${booking.branch_id}`}</span></div>
    <div className="booking-card-notes">
      {booking.promotion_note && <p className="booking-note"><span className="booking-note-label">Nhu cầu / ưu đãi:</span> {booking.promotion_note}</p>}
      {booking.note && <p className="booking-note"><span className="booking-note-label">Ghi chú cho nhân viên:</span> {booking.note}</p>}
      {!booking.promotion_note && !booking.note && <span className="booking-notes-empty">—</span>}
    </div>
    <span className={`booking-arrival ${booking.has_arrived ? 'is-arrived' : 'is-pending'}`}><CheckCircle2 size={15} />{booking.has_arrived ? 'Đã đến' : 'Chưa đến'}</span>
    {writable && <div className="booking-card-actions"><button className="icon-btn" aria-label={`Sửa lịch ${name}`} onClick={onEdit}><Pencil size={17} /></button><button className="icon-btn" aria-label={`Xóa lịch ${name}`} onClick={onDelete}><Trash2 size={17} /></button></div>}
  </article>
}