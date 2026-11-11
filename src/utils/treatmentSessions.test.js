import { describe, expect, it } from 'vitest'
import { canExecuteTreatment, treatmentSessionsLabel } from './treatmentSessions'

describe('liệu trình trọn đời', () => {
  it('hiển thị nhãn và vẫn cho thực hiện khi số buổi là null', () => {
    expect(treatmentSessionsLabel({ total_sessions: null, remaining_sessions: null })).toBe('Trọn đời')
    expect(canExecuteTreatment({ total_sessions: null, remaining_sessions: null })).toBe(true)
  })

  it('không thực hiện thẻ hữu hạn hết buổi hoặc thẻ đã đóng', () => {
    expect(canExecuteTreatment({ total_sessions: 3, remaining_sessions: 0 })).toBe(false)
    expect(canExecuteTreatment({ total_sessions: null, remaining_sessions: null, closed_at: '2026-11-07' })).toBe(false)
  })
})