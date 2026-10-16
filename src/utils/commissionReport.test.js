import { describe, expect, it, vi } from 'vitest'
import { groupCommissionRows, loadCommissionReport } from './commissionReport'

describe('commission report', () => {
  it('groups numeric and decimal string rates, sorted by amount', () => {
    expect(groupCommissionRows([{ commission_amount: '50000.00' }, { commission_amount: 20000 }, { commission_amount: '20000.00' }, { commission_amount: 0 }])).toEqual([
      { amount: 0, quantity: 1, total: 0 },
      { amount: 20000, quantity: 2, total: 40000 },
      { amount: 50000, quantity: 1, total: 50000 },
    ])
  })
  it('loads all pages before grouping', async () => {
    const load = vi.fn(async page => ({ total: 3, totalPages: 2, data: page === 1 ? [{ commission_amount: 20000 }, { commission_amount: 50000 }] : [{ commission_amount: '20000.00' }] }))
    expect(await loadCommissionReport(load)).toEqual([{ amount: 20000, quantity: 2, total: 40000 }, { amount: 50000, quantity: 1, total: 50000 }])
    expect(load.mock.calls).toEqual([[1], [2]])
  })
  it('handles empty reports', async () => {
    expect(await loadCommissionReport(async () => ({ data: [], total: 0, totalPages: 0 }))).toEqual([])
  })
  it('does not show a partial report when later pages fail or are incomplete', async () => {
    await expect(loadCommissionReport(async page => { if (page === 2) throw new Error('Network error'); return { data: [{ commission_amount: 20000 }], total: 2, totalPages: 2 } })).rejects.toThrow('Network error')
    await expect(loadCommissionReport(async () => ({ data: [], total: 2, totalPages: 1 }))).rejects.toThrow('Chưa tải đủ')
  })
  it('rejects missing or invalid amounts rather than treating them as zero', () => {
    for (const commission_amount of [undefined, null, '', 'invalid', Infinity]) expect(() => groupCommissionRows([{ commission_amount }])).toThrow('không hợp lệ')
  })
})