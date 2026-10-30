import { afterEach, describe, expect, it, vi } from 'vitest'
import { appointmentDate, dateOnly, formatCurrency, parseMoneyInput, formatSpaDate, today, toSqlDateTime } from './format'
afterEach(() => vi.useRealTimers())
describe('hiển thị dữ liệu', () => {
  it('hiển thị DECIMAL dạng chuỗi và không cộng tổng trong trình duyệt', () => {
    expect(formatCurrency('1200000.00')).toContain('1.200.000')
    expect(parseMoneyInput('1.200.000')).toBe(1200000)
  })
  it('từ chối giá trị tiền không hợp lệ', () => { expect(parseMoneyInput('-12')).toBeNull(); expect(parseMoneyInput('abc')).toBeNull() })
  it('nhận ngày tháng hợp lệ', () => { expect(formatSpaDate('2026-10-09')).not.toBe('—') })
})

describe('ngày giờ Việt Nam', () => {
  it.each([
    ['2026-10-27T16:59:59.999Z', '2026-10-27', '27/10/2026'],
    ['2026-10-27T17:00:00.000Z', '2026-10-28', '28/10/2026'],
    ['2026-10-28T16:59:59.999Z', '2026-10-28', '28/10/2026'],
    ['2026-10-28T17:00:00.000Z', '2026-10-29', '29/10/2026'],
    ['2026-10-28', '2026-10-28', '28/10/2026'],
    ['2026-10-28 00:00:00', '2026-10-28', '28/10/2026'],
    ['2026-10-28T00:00', '2026-10-28', '28/10/2026'],
    ['2026-10-27T10:00:00-07:00', '2026-10-28', '28/10/2026'],
    ['2026-10-28T00:00:00+07:00', '2026-10-28', '28/10/2026'],
    [new Date('2026-10-27T17:00:00Z'), '2026-10-28', '28/10/2026'],
  ])('chuẩn hóa %s thành ngày %s', (value, day, display) => {
    expect(dateOnly(value)).toBe(day)
    expect(formatSpaDate(value)).toBe(display)
  })
  it('tính hôm nay tại ranh giới nửa đêm Việt Nam', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-27T16:59:59Z'))
    expect(today()).toBe('2026-10-27')
    vi.setSystemTime(new Date('2026-10-27T17:00:00Z'))
    expect(today()).toBe('2026-10-28')
  })
  it('hiển thị cả giờ theo Việt Nam khi truyền options', () => {
    const options = { timeStyle: 'medium' }
    expect(formatSpaDate('2026-10-27T17:00:00Z', options)).toBe(formatSpaDate('2026-10-28 00:00:00', options))
    expect(formatSpaDate('2026-10-27T17:00:00Z', options)).toContain('00:00:00')
  })
  it('giữ giờ nhập, chuyển timestamp và đặt ngày hẹn đúng ngày Việt Nam', () => {
    expect(toSqlDateTime('2026-10-27T17:00:00Z')).toBe('2026-10-28 00:00:00')
    expect(toSqlDateTime('2026-10-28T09:30')).toBe('2026-10-28 09:30:00')
    expect(toSqlDateTime('2026-10-28 09:30:15')).toBe('2026-10-28 09:30:15')
    expect(appointmentDate('2026-10-27T17:00:00Z')).toBe('2026-10-28 09:00:00')
    expect(appointmentDate('2026-10-28')).toBe('2026-10-28 09:00:00')
  })
  it.each([undefined, null, '', 'invalid', '2026-02-30', '2026-10-28T25:00:00', new Date(NaN)])('không dùng ngày không hợp lệ: %s', value => {
    expect(dateOnly(value)).toBe('')
    expect(formatSpaDate(value)).toBe('—')
    expect(toSqlDateTime(value)).toBeUndefined()
    expect(appointmentDate(value)).toBeUndefined()
  })
})