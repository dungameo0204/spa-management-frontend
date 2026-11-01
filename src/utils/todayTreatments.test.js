import { expect, it } from 'vitest'
import { canCloseTreatment, canExecuteCard, isTreatmentComplete, todayTreatmentRows, treatmentHistoryGroups } from './todayTreatments'

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

it('summarizes child histories by Vietnam day and branch without losing repeated executions', () => {
  const groups = treatmentHistoryGroups({ product_name: 'Gói', children: [
    { id: 1, product_name: 'pnp', histories: [{ id: 1, execution_date: '2026-10-30', branch_id: 1 }, { id: 2, execution_date: '2026-10-30', branch_id: 1 }] },
    { id: 2, product_name: 'laser', histories: [{ id: 3, execution_date: '2026-10-30', branch_id: 1 }, { id: 4, execution_date: '2026-10-30', branch_id: 2 }, { id: 5, execution_date: '2026-10-29', branch_id: 1 }, { id: 6, execution_date: '2026-10-30', branch_id: 1, deleted_at: day }] },
  ] })
  expect(groups.map(group => [group.day, group.branch_id, group.sessions.length])).toEqual([['2026-10-30', 1, 2], ['2026-10-30', 1, 1], ['2026-10-30', 2, 1], ['2026-10-29', 1, 1]])
  expect(groups[0].sessions.map(entry => entry.card.product_name)).toEqual(['pnp', 'laser'])
  expect(groups[1].sessions.map(entry => entry.card.product_name)).toEqual(['pnp'])
})


it('separates repeated executions on the same day into distinct visit groups in todayTreatmentRows', () => {
  const comboRoot = { id: 100, product_name: 'Combo nám', customer_name: 'Chị Mai', created_at: '2026-10-31', branch_id: 1 }
  const h1 = { id: 101, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T09:00:00Z', customer_signature_svg: '<svg1/>' }
  const h2 = { id: 102, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T09:00:10Z', customer_signature_svg: '<svg1/>' }
  const h3 = { id: 103, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T14:00:00Z', customer_signature_svg: '<svg2/>' }
  const h4 = { id: 104, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T14:00:10Z', customer_signature_svg: '<svg2/>' }

  const comboDetail = {
    data: {
      ...comboRoot,
      children: [
        { id: 110, product_name: 'pnp', histories: [h1, h3] },
        { id: 120, product_name: 'tan nhang', histories: [h2, h4] },
        { id: 130, product_name: 'laser', histories: [] }
      ]
    }
  }

  const rows = todayTreatmentRows([comboRoot], [comboDetail], '2026-10-31', 1)
  const groupRows = rows.filter(r => r.group)
  expect(groupRows).toHaveLength(3)
  expect(groupRows[0].groupTitle).toBe('Combo nám')
  expect(groupRows[1].groupTitle).toBe('Combo nám')
  expect(groupRows[2].groupTitle).toContain('Chưa thực hiện')
})

it('maintains group position and service order when a service is undone in treatmentHistoryGroups', () => {
  const cardBefore = {
    id: 1,
    product_name: 'Combo',
    customer_name: 'Khách',
    children: [
      {
        id: 10,
        product_name: 'pnp',
        histories: [
          { id: 201, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T15:00:00Z' },
          { id: 101, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T10:00:00Z' }
        ]
      },
      {
        id: 20,
        product_name: 'tan nhang',
        histories: [
          { id: 202, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T15:00:00Z' },
          { id: 102, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T10:00:00Z' }
        ]
      }
    ]
  }

  const before = treatmentHistoryGroups(cardBefore)
  expect(before).toHaveLength(2)
  expect(before[0].sessions.map(s => s.card.product_name)).toEqual(['pnp', 'tan nhang'])
  expect(before[1].sessions.map(s => s.card.product_name)).toEqual(['pnp', 'tan nhang'])

  // Undo pnp from the latest group (id: 201)
  const cardAfter = {
    ...cardBefore,
    children: [
      {
        ...cardBefore.children[0],
        histories: [{ id: 101, execution_date: '2026-10-31', branch_id: 1, created_at: '2026-10-31T10:00:00Z' }]
      },
      cardBefore.children[1]
    ]
  }

  const after = treatmentHistoryGroups(cardAfter)
  expect(after).toHaveLength(2)
  // The latest group (at 15:00) MUST REMAIN at index 0 and not jump to the bottom!
  expect(after[0].sessions.map(s => s.card.product_name)).toEqual(['tan nhang'])
  expect(after[0].sessions[0].history.id).toBe(202)
  // The older group (at 10:00) remains at index 1
  expect(after[1].sessions.map(s => s.card.product_name)).toEqual(['pnp', 'tan nhang'])
})
