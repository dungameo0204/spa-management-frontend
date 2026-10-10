import { describe, expect, it } from 'vitest'
import { formatCurrency, parseMoneyInput, formatSpaDate } from './format'
describe('hiển thị dữ liệu', () => {
  it('hiển thị DECIMAL dạng chuỗi và không cộng tổng trong trình duyệt', () => {
    expect(formatCurrency('1200000.00')).toContain('1.200.000')
    expect(parseMoneyInput('1.200.000')).toBe(1200000)
  })
  it('từ chối giá trị tiền không hợp lệ', () => { expect(parseMoneyInput('-12')).toBeNull(); expect(parseMoneyInput('abc')).toBeNull() })
  it('nhận ngày tháng hợp lệ', () => { expect(formatSpaDate('2026-10-09')).not.toBe('—') })
})