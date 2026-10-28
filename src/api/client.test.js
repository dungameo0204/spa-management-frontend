import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, configureClient, normalizePagedResponse, request } from './client'
beforeEach(() => { configureClient(() => 'staff-token', () => {}); globalThis.fetch = vi.fn() })
afterEach(() => vi.restoreAllMocks())
describe('API client', () => {
  it('gửi multipart không đặt Content-Type để trình duyệt sinh boundary', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) })
    const body = new FormData()
    body.append('images', new Blob(['png'], { type: 'image/png' }), 'skin.png')
    await request('/api/customers/1/skin-image-sessions', { method: 'POST', body })
    expect(fetch.mock.calls[0][1].body).toBe(body)
    expect(fetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined()
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer staff-token')
  })
  it('đọc bytes ảnh bằng Bearer, không đọc JSON và giữ xử lý lỗi 401', async () => {
    const blob = new Blob(['png'], { type: 'image/png' }), expired = vi.fn()
    configureClient(() => 'staff-token', expired)
    fetch.mockResolvedValueOnce({ ok: true, blob: async () => blob })
    expect(await request('/api/customers/1/skin-image-sessions/2/images/3/file', { responseType: 'blob' })).toBe(blob)
    expect(fetch.mock.calls[0][1].cache).toBe('no-store')
    fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'Hết phiên' }) })
    await expect(request('/api/customers/1/skin-image-sessions/2/images/3/file', { responseType: 'blob' })).rejects.toMatchObject({ status: 401 })
    expect(expired).toHaveBeenCalledOnce()
  })
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
  it.each([403, 429, 500, 503])('không logout với HTTP %s dù message đề cập token', async status => {
    const expired = vi.fn(); configureClient(() => 'staff-token', expired)
    fetch.mockResolvedValue({ ok: false, status, json: async () => ({ code: 'FORBIDDEN', message: 'Token không hợp lệ hoặc hết hạn' }) })
    await expect(request('/api/products')).rejects.toMatchObject({ status, code: 'FORBIDDEN' })
    expect(expired).not.toHaveBeenCalled()
  })
  it('401 login không đăng xuất và không gửi token hiện tại', async () => {
    const expired = vi.fn(); configureClient(() => 'staff-token', expired)
    fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'Sai mật khẩu' }) })
    await expect(request('/api/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 })
    expect(expired).not.toHaveBeenCalled()
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })
})