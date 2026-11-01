import { expect, it } from 'vitest'
import { arrivalTimeSlots, bookingPayload, compareBookings, defaultBookingArrivalDate, defaultBookingFilters, validateBookingFilters } from './customerBookings'

const base = { customer_type: 'NEW', customer_name: ' Lan ', customer_phone: '0901234567', branch_id: 1, arrival_date: '2026-11-01' }

it('sắp xếp ngày rồi giờ tăng dần, NULL cuối ngày, không coi 00:00 là NULL', () => {
  const rows = [
    { id: 5, arrival_date: '2026-11-02', arrival_time: '07:00:00' },
    { id: 3, arrival_date: '2026-11-01', arrival_time: null },
    { id: 4, arrival_date: '2026-11-01', arrival_time: '08:00:00' },
    { id: 1, arrival_date: '2026-11-01', arrival_time: '00:00:00' },
    { id: 2, arrival_date: '2026-11-01', arrival_time: '07:00:00' },
  ]
  expect(rows.sort(compareBookings).map(row => row.id)).toEqual([1, 2, 4, 3, 5])
})
it('chuẩn hóa đúng payload NEW, không gửi field audit hoặc booking_time', () => {
  expect(bookingPayload({ ...base, id: 12, booking_time: 'bad', consultation_total: '30000000' })).toEqual({
    customer_type: 'NEW', customer_name: 'Lan', customer_phone: '0901234567', customer_id: null,
    branch_id: 1, product_id: null, arrival_date: '2026-11-01', arrival_time: null,
    consultation_total: '30000000', promotion_note: null, note: null, status: 'PENDING',
  })
})

it('EXISTING yêu cầu mã và có thể để backend mặc định snapshot', () => {
  expect(() => bookingPayload({ ...base, customer_type: 'EXISTING' })).toThrow('Chọn khách hàng')
  expect(bookingPayload({ ...base, customer_type: 'EXISTING', customer_id: '7', customer_name: '', customer_phone: '' })).toMatchObject({ customer_id: 7 })
  expect(bookingPayload({ ...base, customer_type: 'EXISTING', customer_id: 7, customer_name: '', customer_phone: '' })).not.toHaveProperty('customer_name')
})

it.each([
  [{ customer_name: ' ' }, 'họ tên'], [{ branch_id: '' }, 'chi nhánh'],
  [{ arrival_date: '2026-02-30' }, 'ngày đến'], [{ arrival_time: '24:00' }, 'Giờ đến'], [{ arrival_time: '09:15' }, '30 phút'],
  [{ consultation_total: '-1' }, 'Giá trị'], [{ consultation_total: '1.234' }, 'Giá trị'],
  [{ note: 'ệ'.repeat(22000) }, 'Ghi chú quá dài'],
])('chặn payload không hợp lệ %j', (override, text) => {
  expect(() => bookingPayload({ ...base, ...override })).toThrow(text)
})

it('sinh mốc giờ 30 phút và đặt khung lọc mặc định theo ca làm việc', () => {
  expect(arrivalTimeSlots).toHaveLength(48)
  expect(arrivalTimeSlots).toEqual(expect.arrayContaining(['00:00', '06:30', '23:30']))
  expect(defaultBookingFilters(new Date('2026-11-01T00:00:00+07:00'))).toMatchObject({ startDate: '2026-11-01', endDate: '2026-11-01', startTime: '', endTime: '' })
  expect(defaultBookingFilters(new Date('2026-11-01T07:29:00+07:00'))).toMatchObject({ startDate: '2026-11-01', endDate: '2026-11-01', startTime: '', endTime: '' })
  expect(defaultBookingFilters(new Date('2026-11-01T07:30:00+07:00'))).toMatchObject({ startDate: '2026-11-01', endDate: '2026-11-01', startTime: '07:30', endTime: '09:30' })
  expect(defaultBookingFilters(new Date('2026-11-01T19:00:00+07:00'))).toMatchObject({ startDate: '2026-11-01', endDate: '2026-11-01', startTime: '19:00', endTime: '21:00' })
  expect(defaultBookingFilters(new Date('2026-11-01T19:29:00+07:00'))).toMatchObject({ startDate: '2026-11-01', endDate: '2026-11-01', startTime: '19:00', endTime: '21:00' })
  expect(defaultBookingFilters(new Date('2026-11-01T19:30:00+07:00'))).toMatchObject({ startDate: '2026-11-02', endDate: '2026-11-02', startTime: '', endTime: '' })
  expect(defaultBookingFilters(new Date('2026-11-01T23:59:00+07:00'))).toMatchObject({ startDate: '2026-11-02', endDate: '2026-11-02', startTime: '', endTime: '' })
})

it('mặc định ngày đến khi tạo lịch chuyển sang ngày mai từ 17:00 giờ spa', () => {
  expect(defaultBookingArrivalDate(new Date('2026-11-01T16:59:00+07:00'))).toBe('2026-11-01')
  expect(defaultBookingArrivalDate(new Date('2026-11-01T17:00:00+07:00'))).toBe('2026-11-02')
  expect(defaultBookingArrivalDate(new Date('2026-12-31T17:00:00+07:00'))).toBe('2027-01-01')
})

it('chặn khoảng lọc đảo ngược, cho phép một đầu và hai đầu bằng nhau', () => {
  expect(validateBookingFilters({ startTime: '08:00', endTime: '07:00' })).toContain('Giờ bắt đầu')
  expect(validateBookingFilters({ startDate: '2026-11-02', endDate: '2026-11-01' })).toContain('Ngày bắt đầu')
  expect(validateBookingFilters({ startTime: '07:00' })).toBe('')
  expect(validateBookingFilters({ startTime: '07:00', endTime: '07:00' })).toBe('')
})