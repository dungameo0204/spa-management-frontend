import { dateOnly, SPA_TIME_ZONE } from './format'
import { isDigitsOnly } from './phone'

export const arrivalTimeSlots = Array.from({ length: 34 }, (_, index) => {
  const hour = String(7 + Math.floor(index / 2)).padStart(2, '0')
  return `${hour}:${index % 2 ? '30' : '00'}`
})

function shiftBookingDay(day, offset) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function defaultBookingArrivalDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: SPA_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(({ type, value }) => [type, value]))
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute)
  const currentDay = dateOnly(now)
  return currentMinutes >= 17 * 60 ? shiftBookingDay(currentDay, 1) : currentDay
}

export function defaultBookingFilters(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: SPA_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(({ type, value }) => [type, value]))
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute)
  const currentDay = dateOnly(now)
  const day = currentMinutes >= 19 * 60 + 30 ? shiftBookingDay(currentDay, 1) : currentDay
  return { search: '', startDate: day, endDate: day, startTime: '', endTime: '', productId: '' }
}

export function compareBookings(a, b) {
  return dateOnly(a.arrival_date).localeCompare(dateOnly(b.arrival_date)) ||
    Number(a.arrival_time == null) - Number(b.arrival_time == null) ||
    String(a.arrival_time || '').localeCompare(String(b.arrival_time || '')) ||
    String(a.created_at || '').localeCompare(String(b.created_at || '')) || Number(a.id) - Number(b.id)
}

export function validateBookingFilters(filters) {
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'
  if (filters.startTime && filters.endTime && filters.startTime > filters.endTime) return 'Giờ bắt đầu phải trước hoặc bằng giờ kết thúc.'
  return ''
}

export function bookingPayload(form) {
  const name = String(form.customer_name || '').trim(), phone = String(form.customer_phone || '').trim()
  if (form.customer_type === 'NEW' && (!name || !phone)) throw new Error('Nhập họ tên và số điện thoại của khách mới.')
  if (form.customer_type === 'NEW' && !isDigitsOnly(phone)) throw new Error('Số điện thoại chỉ được chứa chữ số.')
  if (form.customer_type === 'EXISTING' && !form.customer_id) throw new Error('Chọn khách hàng đã đăng ký.')
  if (!form.branch_id) throw new Error('Chọn chi nhánh tiếp nhận.')
  if (!form.arrival_date || dateOnly(form.arrival_date) !== form.arrival_date) throw new Error('Chọn ngày đến hợp lệ.')
  if (form.arrival_time && !/^([01]\d|2[0-3]):(?:00|30)$/.test(form.arrival_time)) throw new Error('Giờ đến chỉ chọn theo mốc 30 phút.')
  const amount = String(form.consultation_total || '0')
  if (!/^\d+$/.test(amount) || Number(amount) > 9999999999999) throw new Error('Giá trị tư vấn phải là số tiền nguyên từ 0 đến 9.999.999.999.999 VNĐ.')
  if (name.length > 255 || phone.length > 50) throw new Error('Tên tối đa 255 ký tự, số điện thoại tối đa 50 ký tự.')
  for (const value of [form.note, form.promotion_note]) {
    if (new TextEncoder().encode(String(value || '').trim()).length > 65535) throw new Error('Ghi chú quá dài (tối đa 65.535 byte).')
  }
  return {
    customer_type: form.customer_type, customer_id: form.customer_type === 'EXISTING' ? Number(form.customer_id) : null,
    ...(form.customer_type === 'NEW' || name ? { customer_name: name } : {}),
    ...(form.customer_type === 'NEW' || phone ? { customer_phone: phone } : {}),
    branch_id: Number(form.branch_id), product_id: form.product_id ? Number(form.product_id) : null,
    arrival_date: form.arrival_date, arrival_time: form.arrival_time || null,
    consultation_total: amount, promotion_note: String(form.promotion_note || '').trim() || null,
    note: String(form.note || '').trim() || null, status: form.status || 'PENDING',
  }
}