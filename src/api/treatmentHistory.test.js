import { afterEach, expect, it, vi } from 'vitest'
import { getResource, listAllResource, updateGroupedTreatmentExecution, updateTreatmentHistoryNote } from './resources'

afterEach(() => vi.unstubAllGlobals())

it('sends optional execution filters on detail and preserves the two-argument call', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { id: 100 } }) }))
  await getResource('treatments', 100, { executionStartDate: '2026-11-07', executionEndDate: '2026-11-07' })
  expect(fetch.mock.calls[0][0].searchParams.get('executionStartDate')).toBe('2026-11-07')
  expect(fetch.mock.calls[0][0].searchParams.get('executionEndDate')).toBe('2026-11-07')
  await getResource('treatments', 100)
  expect(fetch.mock.calls[1][0].search).toBe('')
})

it('loads all pages of both execution and creation lists', async () => {
  vi.stubGlobal('fetch', vi.fn(async url => ({ ok: true, json: async () => ({
    totalPages: 2, data: Array.from({ length: url.searchParams.get('page') === '1' ? 100 : 3 }, (_, i) => ({ id: (Number(url.searchParams.get('page')) - 1) * 100 + i + 1 })),
  }) })))
  for (const filters of [{ executionStartDate: '2026-11-07' }, { startDate: '2026-11-07' }]) {
    expect(await listAllResource('treatments', filters)).toHaveLength(103)
  }
  expect(fetch).toHaveBeenCalledTimes(4)
})

it('updates only the requested history endpoint, including null', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
  await updateTreatmentHistoryNote(601, null)
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch.mock.calls[0][0].pathname).toBe('/api/treatments/execute/601/note')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ note: null })
})

it('updates one grouped visit with its complete child selection', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
  const body = { treatment_id: 100, children: [{ treatment_id: 101, staffs: [{ staff_id: 9 }] }, { treatment_id: 102, staffs: [] }] }
  await updateGroupedTreatmentExecution(501, body)
  expect(fetch.mock.calls[0][0].pathname).toBe('/api/treatments/execute/501')
  expect(fetch.mock.calls[0][1].method).toBe('PUT')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(body)
})