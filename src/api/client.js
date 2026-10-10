const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
let tokenProvider = () => null
let expiredHandler = () => {}
export function configureClient(getToken, onExpired) { tokenProvider = getToken; expiredHandler = onExpired }
export class ApiError extends Error { constructor(status, message) { super(message); this.name = 'ApiError'; this.status = status } }
export async function request(path, { method = 'GET', body, query, signal } = {}) {
  const url = new URL(`${base}${path}`, window.location.origin)
  Object.entries(query || {}).forEach(([key, value]) => { if (value !== '' && value !== null && value !== undefined) url.searchParams.set(key, String(value)) })
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (tokenProvider()) headers.Authorization = `Bearer ${tokenProvider()}`
  let response
  try { response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal, cache: 'no-store' }) }
  catch (error) { if (error.name === 'AbortError') throw error; throw new ApiError(0, 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.') }
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    // Login 401 is invalid credentials, not an expired existing session.
    if ((response.status === 401 || response.status === 403) && path !== '/api/auth/login' && response.status === 403 && /token.*(không hợp lệ|hết hạn)/i.test(result.message || '')) expiredHandler()
    if (response.status === 401 && path !== '/api/auth/login') expiredHandler()
    throw new ApiError(response.status, result.message || `Yêu cầu không thành công (${response.status}).`)
  }
  return result
}
export function normalizePagedResponse(response, page = 1, pageSize = 20) {
  const data = Array.isArray(response?.data) ? response.data : []
  const total = Number(response?.total ?? data.length)
  return { ...response, data, total, page: Number(response?.page ?? page), pageSize: Number(response?.pageSize ?? pageSize), totalPages: Number(response?.totalPages ?? Math.ceil(total / pageSize)) }
}