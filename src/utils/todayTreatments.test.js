import { expect, it } from 'vitest'
import { canCloseTreatment, canExecuteCard, isTreatmentComplete, todayTreatmentRows, treatmentHistoryGroups } from './todayTreatments'

const day = '2026-10-29'
const childHistory = { id: 50, treatment_id: 2, execution_date: day, branch_id: 2, staffs: [{ staff_id: 9, staff_name: 'Lan' }] }
const parentHistory = { id: 40, execution_date: day, branch_id: 2, children: [childHistory] }
const root = { id: 1, product_name: 'Gói', customer_name: 'Khách A', created_at: '2020-01-01', branch_id: 1 }
const detail = { data: { ...root, histories: [parentHistory], children: [{ id: 2, product_name: 'Laser', remaining_sessions: null }, { id: 3, product_name: 'Điện di', remaining_sessions: 1 }] } }

it('renders an old group from explicit parent history children without timestamp inference', () => {
  const rows = todayTreatmentRows([root], [detail], day, 2)
  expect(rows).toHaveLength(3)
  expect(rows[0]).toMatchObject({ group: true, history: parentHistory })
  expect(rows[1]).toMatchObject({ child: true, card: { id: 2, customer_name: 'Khách A' }, history: childHistory, parentHistory })
  expect(rows[2].history).toBeNull()
  expect(todayTreatmentRows([root], [detail], day, 3)).toEqual([])
})

it('shows new groups even if no child was performed', () => {
  const fresh = { ...root, created_at: day }
  const rows = todayTreatmentRows([fresh], [{ data: { ...detail.data, created_at: day, histories: [], children: [{ id: 2, histories: [] }] } }], day, 1)
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

it('automatically completes finite cards and groups only when all children finish', () => {
  expect(isTreatmentComplete({ remaining_sessions: 0 })).toBe(true)
  expect(isTreatmentComplete({ remaining_sessions: null })).toBe(false)
  expect(isTreatmentComplete({ remaining_sessions: 9, children: [{ remaining_sessions: 0 }, { remaining_sessions: 0 }] })).toBe(true)
  expect(isTreatmentComplete({ remaining_sessions: 0, children: [{ remaining_sessions: 1 }] })).toBe(false)
  expect(isTreatmentComplete({ children: [{ remaining_sessions: 0 }, { remaining_sessions: null }] })).toBe(false)
  expect(isTreatmentComplete({ children: [{ remaining_sessions: 0 }, { remaining_sessions: null, closed_at: day }] })).toBe(true)
})

it('only offers closure for an open lifetime treatment or a group containing one', () => {
  expect(canCloseTreatment({ total_sessions: 2, remaining_sessions: 1 })).toBe(false)
  expect(canCloseTreatment({ total_sessions: 2, remaining_sessions: 0 })).toBe(false)
  expect(canCloseTreatment({ total_sessions: null, remaining_sessions: null })).toBe(true)
  expect(canCloseTreatment({ children: [{ remaining_sessions: 0 }, { remaining_sessions: null }] })).toBe(true)
  expect(canCloseTreatment({ children: [{ remaining_sessions: 0 }, { remaining_sessions: 1 }] })).toBe(false)
  expect(canCloseTreatment({ remaining_sessions: null, closed_at: day })).toBe(false)
})

it('keeps repeated parent visits distinct and preserves configured child order', () => {
  const card = { id: 1, product_name: 'Combo', customer_name: 'Khách', children: [{ id: 10, product_name: 'pnp' }, { id: 20, product_name: 'tan nhang' }], histories: [
    { id: 100, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T10:00:00Z', children: [{ id: 101, treatment_id: 10 }, { id: 102, treatment_id: 20 }] },
    { id: 200, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T15:00:00Z', children: [{ id: 202, treatment_id: 20 }] },
  ] }
  const groups = treatmentHistoryGroups(card)
  expect(groups.map(group => [group.historyId, group.sessions.map(session => session.card.product_name)])).toEqual([[200, ['tan nhang']], [100, ['pnp', 'tan nhang']]])
})

it('does not duplicate child histories that already belong to a real parent visit', () => {
  const child = { id: 101, treatment_id: 10, execution_date: day, branch_id: 1, customer_signature_svg: '<svg>same</svg>' }
  const card = { id: 1, product_name: 'Combo', customer_name: 'Khách', histories: [{ id: 100, execution_date: day, branch_id: 1, children: [child] }], children: [
    { id: 10, product_name: 'Laser', histories: [child] },
  ] }
  expect(treatmentHistoryGroups(card).map(group => group.historyId)).toEqual([100])
})

it('groups legacy child histories with the same signature into one display visit', () => {
  const card = { id: 1, product_name: 'Combo', customer_name: 'Khách', children: [
    { id: 10, product_name: 'Laser', histories: [{ id: 101, execution_date: day, branch_id: 1, created_at: `${day}T09:00:00Z`, customer_signature_svg: '<svg>same</svg>', note: 'Theo dõi' }] },
    { id: 20, product_name: 'Điện di', histories: [{ id: 102, execution_date: day, branch_id: 1, created_at: `${day}T09:01:00Z`, customer_signature_svg: '<svg>same</svg>', note: 'Theo dõi' }] },
  ] }
  const groups = treatmentHistoryGroups(card)
  expect(groups).toHaveLength(1)
  expect(groups[0]).toMatchObject({ legacy: true, historyId: 101, day, branch_id: 1 })
  expect(groups[0].sessions.map(session => session.card.id)).toEqual([10, 20])
})

it('keeps legacy histories with different signatures in separate display visits', () => {
  const card = { id: 1, product_name: 'Combo', customer_name: 'Khách', children: [
    { id: 10, product_name: 'Laser', histories: [{ id: 101, execution_date: day, branch_id: 1, customer_signature_svg: '<svg>one</svg>' }] },
    { id: 20, product_name: 'Điện di', histories: [{ id: 102, execution_date: day, branch_id: 1, customer_signature_svg: '<svg>two</svg>' }] },
  ] }
  expect(treatmentHistoryGroups(card).map(group => group.sessions.map(session => session.history.id))).toEqual([[102], [101]])
})

it('splits repeated legacy child histories with the same signature into separate visits', () => {
  const signature = '<svg>same</svg>'
  const card = { id: 1, product_name: 'Combo', customer_name: 'Khách', children: [
    { id: 10, product_name: 'Laser', histories: [
      { id: 101, execution_date: day, branch_id: 1, created_at: `${day}T09:00:00Z`, customer_signature_svg: signature },
      { id: 103, execution_date: day, branch_id: 1, created_at: `${day}T10:00:00Z`, customer_signature_svg: signature },
    ] },
    { id: 20, product_name: 'Điện di', histories: [
      { id: 102, execution_date: day, branch_id: 1, created_at: `${day}T09:01:00Z`, customer_signature_svg: signature },
      { id: 104, execution_date: day, branch_id: 1, created_at: `${day}T10:01:00Z`, customer_signature_svg: signature },
    ] },
  ] }
  expect(treatmentHistoryGroups(card).map(group => group.sessions.map(session => session.history.id))).toEqual([[103, 104], [101, 102]])
})

it('groups unsigned legacy histories with contiguous IDs into one display visit', () => {
  const card = { id: 1, product_name: 'Combo', customer_name: 'Khách', children: [
    { id: 10, product_name: 'Laser', histories: [{ id: 101, execution_date: day, branch_id: 1, note: 'Giống nhau' }] },
    { id: 20, product_name: 'Điện di', histories: [{ id: 102, execution_date: day, branch_id: 1, note: 'Giống nhau' }] },
  ] }
  expect(treatmentHistoryGroups(card).map(group => group.sessions.map(session => session.history.id))).toEqual([[101, 102]])
})

it('keeps unsigned legacy histories with an ID gap in separate display visits', () => {
  const card = { id: 1, product_name: 'Combo', customer_name: 'Khách', children: [
    { id: 10, product_name: 'Laser', histories: [{ id: 101, execution_date: day, branch_id: 1 }] },
    { id: 20, product_name: 'Điện di', histories: [{ id: 103, execution_date: day, branch_id: 1 }] },
  ] }
  expect(treatmentHistoryGroups(card).map(group => group.sessions.map(session => session.history.id))).toEqual([[103], [101]])
})