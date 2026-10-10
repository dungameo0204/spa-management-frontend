import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, configureClient, normalizePagedResponse, request } from './client'
beforeEach(() => { configureClient(() => 'staff-token', () => {}); globalThis.fetch = vi.fn() })
afterEach(() => vi.restoreAllMocks())
describe('API client', () => {
  it('gửi Bearer và query page, chuẩn hóa tổng số theo server', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ total: 27, page: 2, pageSize: 10, totalPages: 3, data: [{ id: 1 }] }) })
    const result = normalizePagedResponse(await request('/api/products', { query: { search: 'da', page: 2, pageSize: 10 } }), 2, 10)
    const [url, init] = fetch.mock.calls[0]
    expect(url.searchParams.get('page')).toBe('2')
    expect(init.headers.Authorization).toBe('Bearer staff-token')
    expect(result.total).toBe(27)
    expect(result.data).toHaveLength(1)
  })
  it('giữ phiên khi server từ chối quyền 403 nhưng không phải token hết hạn', async () => {
    const expired = vi.fn(); configureClient(() => 'staff-token', expired)
    fetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({ message: 'Không đủ quyền' }) })
    await expect(request('/api/reports/revenue')).rejects.toBeInstanceOf(ApiError)
    expect(expired).not.toHaveBeenCalled()
  })
})