import { expect, it } from 'vitest'
import { canExecuteCard, todayTreatmentRows } from './todayTreatments'

const day = '2026-10-29'
const history = { id: 50, execution_date: day, branch_id: 2, staffs: [{ staff_id: 9, staff_name: 'Lan' }] }
const root = { id: 1, product_name: 'Gói', customer_name: 'Khách A', created_at: '2020-01-01', branch_id: 1 }
const detail = { data: { ...root, children: [{ id: 2, product_name: 'Laser', remaining_sessions: null, histories: [history] }, { id: 3, product_name: 'Điện di', remaining_sessions: 1, histories: [] }] } }

it('includes an old group through child execution and preserves child-specific history and staff', () => {
  const rows = todayTreatmentRows([root], [detail], day, 2)
  expect(rows).toHaveLength(3)
  expect(rows[0].group).toBe(true)
  expect(rows[1]).toMatchObject({ child: true, card: { id: 2, customer_name: 'Khách A' }, history })
  expect(rows[2].history).toBeNull()
  expect(todayTreatmentRows([root], [detail], day, 3)).toEqual([])
})

it('shows new groups even if no child was performed', () => {
  const fresh = { ...root, created_at: day }
  const rows = todayTreatmentRows([fresh], [{ data: { ...detail.data, created_at: day, children: [{ id: 2, histories: [] }] } }], day, 1)
  expect(rows).toHaveLength(2)
  expect(rows[0].group).toBe(true)
  expect(rows[1].history).toBeNull()
})

it('allows open lifetime cards but not exhausted, closed or parent cards', () => {
  expect(canExecuteCard({ remaining_sessions: null })).toBe(true)
  expect(canExecuteCard({ remaining_sessions: 0 })).toBe(false)
  expect(canExecuteCard({ remaining_sessions: null, closed_at: day })).toBe(false)
  expect(canExecuteCard({ remaining_sessions: null, children: [{ id: 2 }] })).toBe(false)
})