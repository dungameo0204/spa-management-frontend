import { describe, expect, it } from 'vitest'
import { findTreatmentHistory, todayTreatmentRows, treatmentHistoryGroups, mergeTreatmentCards } from './todayTreatments'

describe('todayTreatmentRows', () => {
  it('keeps every history independent even on different children less than two minutes apart', () => {
    const day = '2026-11-07'
    const root = {
      id: 10,
      customer_name: 'Khách A',
      product_name: 'Gói chăm sóc',
      children: [
        { id: 11, parent_treatment_id: 10, product_name: 'Laser', remaining_sessions: 3, histories: [
          { id: 101, execution_date: day, created_at: `${day}T09:00:00.000Z`, branch_id: 1 },
          { id: 104, execution_date: day, created_at: `${day}T10:00:00.000Z`, branch_id: 1 },
        ] },
        { id: 12, parent_treatment_id: 10, product_name: 'PRP', remaining_sessions: 3, histories: [
          { id: 102, execution_date: day, created_at: `${day}T09:00:20.000Z`, branch_id: 1 },
        ] },
        { id: 13, parent_treatment_id: 10, product_name: 'Tàn nhang', remaining_sessions: 3, histories: [
          { id: 103, execution_date: day, created_at: `${day}T09:00:40.000Z`, branch_id: 1 },
        ] },
      ],
    }

    const rows = todayTreatmentRows([root], [{ data: root }], day, 1)
    expect(rows.filter(row => row.group)).toHaveLength(4)
    expect(rows.filter(row => row.group).every(row => row.sessions.length === 1)).toBe(true)
    expect(new Set(treatmentHistoryGroups(root).map(group => group.historyId)).size).toBe(4)
  })

  it('recurses through an empty parent and filters the history date, branch and deleted flag', () => {
    const root = { id: 100, histories: [], children: [{ id: 101, histories: [], children: [{ id: 102, histories: [
      { id: 501, execution_date: '2026-11-07', branch_id: 1 },
      { id: 601, execution_date: '2026-11-07', branch_id: 2 },
      { id: 602, execution_date: '2026-11-06', branch_id: 1 },
      { id: 603, execution_date: '2026-11-07', branch_id: 1, deleted_at: '2026-11-07' },
    ] }] }] }
    const rows = todayTreatmentRows([root], [], '2026-11-07', 1)
    expect(rows.filter(row => row.group).map(row => row.history?.id)).toEqual([501])
    expect(rows.filter(row => row.child).map(row => row.history?.id)).toEqual([501])
  })

  it('shows every child in a real parent visit without adding a synthetic unperformed visit', () => {
    const day = '2026-11-07'
    const root = {
      id: 10,
      customer_name: 'Khách A',
      product_name: 'Gói chăm sóc',
      children: [
        { id: 11, product_name: 'Laser', histories: [] },
        { id: 12, product_name: 'PRP', histories: [] },
        { id: 13, product_name: 'Peel', histories: [] },
      ],
      histories: [{ id: 500, execution_date: day, branch_id: 1, note: 'Ghi chú cha', children: [
        { id: 501, treatment_id: 11, execution_date: day, branch_id: 1 },
      ] }],
    }

    const rows = todayTreatmentRows([root], [{ data: root }], day, 1)
    expect(rows.filter(row => row.group)).toHaveLength(1)
    expect(rows.filter(row => row.group)[0].history.id).toBe(500)
    expect(rows.filter(row => row.child).map(row => [row.card.id, row.history?.id || null])).toEqual([[11, 501], [12, null], [13, null]])
  })

  it('does not show a treatment merely because it was created on the selected day', () => {
    const root = { id: 10, created_at: '2026-11-07', product_name: 'Gói chăm sóc', children: [{ id: 11, product_name: 'Laser', histories: [] }] }
    expect(todayTreatmentRows([root], [{ data: root }], '2026-11-07', 1)).toEqual([])
  })

  it('keeps an explicit parent visit with no selected children as one real visit', () => {
    const root = {
      id: 10,
      customer_name: 'Khách A',
      product_name: 'Gói chăm sóc',
      children: [{ id: 11, product_name: 'Laser', histories: [] }],
      histories: [{ id: 500, execution_date: '2026-11-07', branch_id: 1, children: [] }],
    }
    const rows = todayTreatmentRows([root], [{ data: root }], '2026-11-07', 1)
    expect(rows.filter(row => row.group).map(row => row.history.id)).toEqual([500])
    expect(rows.filter(row => row.child).map(row => row.history)).toEqual([null])
  })

  it('merges partial responses without losing histories or independent notes', () => {
    const first = { id: 100, children: [{ id: 101, histories: [{ id: 501, note: 'first' }] }] }
    const second = { id: 100, children: [{ id: 101, histories: [{ id: 601, note: 'second' }] }] }
    const merged = mergeTreatmentCards([first], [second], [{ id: 100, children: [{ id: 101, histories: [] }] }])
    expect(merged[0].children[0].histories.map(history => history.note)).toEqual(['first', 'second'])
  })

  it('keeps missing histories missing so the component still requests detail', () => {
    expect(mergeTreatmentCards([{ id: 100 }], [{ id: 100 }])[0]).not.toHaveProperty('histories')
  })

  it('finds a child history nested under its parent visit with either string or numeric IDs', () => {
    const card = { id: 100, histories: [{ id: 500, children: [{ id: 501, treatment_id: 101 }] }] }
    expect(findTreatmentHistory(card, '501')).toMatchObject({ id: 501, treatment_id: 101 })
  })
})