import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SearchPicker from './SearchPicker'
import MobileSelect from './MobileSelect'
import ConfirmDialog from './ConfirmDialog'
import useDraftGuard from './useDraftGuard'
import { listResource } from '../api/resources'
import MoneyInput from './MoneyInput'
import { arrivalTimeSlots, bookingPayload, defaultBookingArrivalDate } from '../utils/customerBookings'
import { dateOnly } from '../utils/format'

export default function CustomerBookingForm({ booking, branchId, user, pending, onSave, onCancel }) {
  const manager = user.system_role === 'MANAGER'
  const initial = useRef({
    customer_type: booking?.customer_type || 'NEW', customer_id: booking?.customer_id || '',
    customer_name: booking?.customer_name || '', customer_phone: booking?.customer_phone || '',
    branch_id: booking?.branch_id || (manager ? branchId : user.branch_id) || '', product_id: booking?.product_id || '',
    arrival_date: dateOnly(booking?.arrival_date) || defaultBookingArrivalDate(), arrival_time: booking?.arrival_time?.slice(0, 5) || '',
    note: booking?.note || '', promotion_note: booking?.promotion_note || '', consultation_total: String(Math.round(Number(booking?.consultation_total || 0))), status: booking?.status || 'PENDING',
  })
  const [form, setForm] = useState(initial.current), [error, setError] = useState('')
  const [customerLabel, setCustomerLabel] = useState(booking?.registered_customer_name || booking?.customer_name || '')
  const [productLabel, setProductLabel] = useState(booking?.product_name || '')
  const ref = useRef(null)
  const guard = useDraftGuard(ref, JSON.stringify(form) !== JSON.stringify(initial.current), pending)
  const branches = useQuery({ queryKey: ['branches', 'booking-form'], queryFn: ({ signal }) => listResource('branches', {}, 1, 100, signal), enabled: manager })
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
  function submit(event) {
    event.preventDefault(); setError('')
    try { onSave(bookingPayload({ ...form, branch_id: manager ? form.branch_id : user.branch_id })) } catch (err) { setError(err.message) }
  }
  return <><form ref={ref} className="booking-editor" onSubmit={submit}>
    {error && <p className="form-alert" role="alert">{error}</p>}
    <fieldset disabled={pending}>
      <legend>1. Thông tin khách hàng</legend>
      <div className="booking-customer-types" role="group" aria-label="Loại khách hàng">{[['NEW', 'Khách mới'], ['EXISTING', 'Khách cũ']].map(([type, label]) => <button type="button" key={type} aria-pressed={form.customer_type === type} className={`btn ${form.customer_type === type ? 'primary' : 'secondary'}`} onClick={() => { setForm(current => ({ ...current, customer_type: type, customer_id: '', customer_name: '', customer_phone: '' })); setCustomerLabel('') }}>{label}</button>)}</div>
      {form.customer_type === 'EXISTING' && <SearchPicker resource="customers" label="Khách hàng đã đăng ký" value={form.customer_id} initialLabel={customerLabel} onChange={item => { setForm(current => ({ ...current, customer_id: item?.id || '', customer_name: item?.fullname || item?.name || '', customer_phone: item?.phone_number || '' })); setCustomerLabel(item?.fullname || item?.name || '') }} />}
      <div className="booking-form-grid"><label className="field"><span>Họ và tên</span><input maxLength={255} required={form.customer_type === 'NEW'} value={form.customer_name} onChange={event => set('customer_name', event.target.value)} /></label><label className="field"><span>Số điện thoại</span><input type="tel" maxLength={50} required={form.customer_type === 'NEW'} value={form.customer_phone} onChange={event => set('customer_phone', event.target.value)} /></label></div>
      {form.customer_type === 'NEW' && <p className="small-muted">Đặt lịch không tự tạo hồ sơ khách hàng.</p>}
    </fieldset>
    <fieldset disabled={pending}>
      <legend>2. Lịch hẹn và dịch vụ</legend>
      <div className="booking-form-grid"><label className="field"><span>Ngày đến</span><input type="date" required value={form.arrival_date} onChange={event => set('arrival_date', event.target.value)} /></label><label className="field booking-time-field"><span>Giờ đến (không bắt buộc)</span><MobileSelect aria-label="Giờ đến (không bắt buộc)" value={form.arrival_time} onChange={event => set('arrival_time', event.target.value)}><option value="">Chưa chọn giờ</option>{arrivalTimeSlots.map(time => <option key={time} value={time}>{time}</option>)}</MobileSelect></label></div>
      {manager ? <label className="field"><span>Chi nhánh tiếp nhận</span><select required value={form.branch_id} onChange={event => set('branch_id', event.target.value)}><option value="">Chọn chi nhánh</option>{branches.data?.data?.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label> : <p className="small-muted">Chi nhánh tiếp nhận: {booking?.branch_name || `Cơ sở #${user.branch_id}`} (theo tài khoản)</p>}
      {branches.isError && <p role="alert" className="form-alert">{branches.error.message} <button type="button" onClick={() => branches.refetch()}>Thử lại</button></p>}
      <SearchPicker resource="products" label="Dịch vụ quan tâm" value={form.product_id} initialLabel={productLabel} onChange={item => { set('product_id', item?.id || ''); setProductLabel(item?.name || '') }} />
    </fieldset>
    <fieldset disabled={pending}><legend>3. Thông tin tư vấn</legend>
      <label className="field booking-soft-field"><span>Nhu cầu / ưu đãi</span><textarea rows={2} placeholder="Ví dụ: Quan tâm ưu đãi khách mới…" value={form.promotion_note} onChange={event => set('promotion_note', event.target.value)} /></label>
      <label className="field booking-soft-field"><span>Ghi chú cho nhân viên</span><textarea rows={3} placeholder="Thông tin cần lưu ý khi tư vấn…" value={form.note} onChange={event => set('note', event.target.value)} /></label>
      <label className="field"><span>Giá trị tư vấn dự kiến (VNĐ)</span><MoneyInput min="0" maxLength={17} value={form.consultation_total} onChange={value => set('consultation_total', value)} placeholder="0" /></label>
      <p className="small-muted">Chỉ ghi nhận giá trị tư vấn, không phát sinh thanh toán.</p>
    </fieldset>
    <div className="drawer-actions booking-editor-actions"><button type="button" className="btn secondary" disabled={pending} onClick={() => guard.request(onCancel)}>Hủy</button><button className="btn primary" disabled={pending}>{pending ? 'Đang lưu…' : 'Lưu lịch đặt'}</button></div>
  </form>{guard.discard && <ConfirmDialog title="Bỏ thay đổi?" message="Thông tin đang nhập chưa được lưu." onCancel={guard.keep} onConfirm={guard.confirm} confirmLabel="Bỏ thay đổi" />}</>
}