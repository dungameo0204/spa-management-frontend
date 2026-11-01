import SearchPicker from './SearchPicker'
import MobileSelect from './MobileSelect'
import { today } from '../utils/format'
import { arrivalTimeSlots, validateBookingFilters } from '../utils/customerBookings'

export const emptyBookingFilters = () => ({ search: '', startDate: '', endDate: '', startTime: '', endTime: '', productId: '' })
export function shiftBookingDay(day, offset) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export default function CustomerBookingFilters({ value, onChange, productLabel, onProductLabel }) {
  const set = (key, next) => onChange({ ...value, [key]: next })
  const error = validateBookingFilters(value)
  function quickDay(offset, span = 0) {
    const startDate = shiftBookingDay(today(), offset)
    const next = { ...value, startDate, endDate: shiftBookingDay(startDate, span) }
    onChange(next)
  }
  return <form className="booking-filters" aria-label="Lọc lịch đặt" onSubmit={event => event.preventDefault()}>
    <div className="booking-filter-actions" role="group" aria-label="Chọn ngày nhanh"><button type="button" className="btn secondary" onClick={() => quickDay(0)}>Hôm nay</button><button type="button" className="btn secondary" onClick={() => quickDay(1)}>Ngày mai</button><button type="button" className="btn secondary" onClick={() => quickDay(0, 6)}>7 ngày tiếp</button></div>
    <div className="booking-filter-grid">
      <label className="field booking-search"><span>Tìm kiếm</span><input type="search" placeholder="Tên, số điện thoại, ghi chú…" value={value.search} onChange={event => set('search', event.target.value)} /></label>
      <label className="field booking-date-field"><span>Từ ngày</span><input type="date" value={value.startDate} onChange={event => set('startDate', event.target.value)} /></label>
      <label className="field booking-date-field"><span>Đến ngày</span><input type="date" value={value.endDate} onChange={event => set('endDate', event.target.value)} /></label>
      <label className="field booking-time-field"><span>Từ giờ</span><MobileSelect aria-label="Từ giờ" value={value.startTime} onChange={event => set('startTime', event.target.value)}><option value="">Tất cả giờ</option>{arrivalTimeSlots.map(time => <option key={time} value={time}>{time}</option>)}</MobileSelect></label>
      <label className="field booking-time-field"><span>Đến giờ</span><MobileSelect aria-label="Đến giờ" value={value.endTime} onChange={event => set('endTime', event.target.value)}><option value="">Tất cả giờ</option>{[...arrivalTimeSlots, '23:59'].map(time => <option key={time} value={time}>{time}</option>)}</MobileSelect></label>
      <SearchPicker resource="products" label="Dịch vụ quan tâm" value={value.productId} initialLabel={productLabel} emptyOptionLabel="Tất cả dịch vụ" onChange={item => { set('productId', item?.id || ''); onProductLabel(item?.name || '') }} />
    </div>
    <div className="booking-filter-reset"><button type="button" className="btn secondary" onClick={() => { onChange(emptyBookingFilters()); onProductLabel('') }}>Xóa bộ lọc</button></div>
    {error && <p role="alert" className="form-alert">{error}</p>}
  </form>
}