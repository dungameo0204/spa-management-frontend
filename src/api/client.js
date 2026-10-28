const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
let tokenProvider = () => null
let expiredHandler = () => {}
let sessionProvider = () => tokenProvider()
export function configureClient(getToken, onExpired, getSession = getToken) { tokenProvider = getToken; expiredHandler = onExpired; sessionProvider = getSession }
export class ApiError extends Error { constructor(status, message, code) { super(message); this.name = 'ApiError'; this.status = status; this.code = code } }
export async function request(path, { method = 'GET', body, query, signal, responseType } = {}) {
  const url = new URL(`${base}${path}`, window.location.origin)
  Object.entries(query || {}).forEach(([key, value]) => { if (value !== '' && value !== null && value !== undefined) url.searchParams.set(key, String(value)) })
  const headers = { Accept: 'application/json' }
  const multipart = body instanceof FormData
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json'
  const token = tokenProvider(), session = sessionProvider(), onExpired = expiredHandler
  if (token && path !== '/api/auth/login') headers.Authorization = `Bearer ${token}`
  let response
  try { response = await fetch(url, { method, headers, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body), signal, cache: 'no-store' }) }
  catch (error) { if (error.name === 'AbortError') throw error; throw new ApiError(0, 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.') }
  if (response.ok && responseType === 'blob') return response.blob()
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    // Login 401 is invalid credentials, not an expired existing session.
    if (response.status === 401 && path !== '/api/auth/login' && token && token === tokenProvider() && session === sessionProvider()) onExpired()
    throw new ApiError(response.status, result.message || `Yêu cầu không thành công (${response.status}).`, result.code)
  }
  return result
}
export function normalizePagedResponse(response, page = 1, pageSize = 20) {
  const data = Array.isArray(response?.data) ? response.data : []
  const total = Number(response?.total ?? data.length)
  return { ...response, data, total, page: Number(response?.page ?? page), pageSize: Number(response?.pageSize ?? pageSize), totalPages: Number(response?.totalPages ?? Math.ceil(total / pageSize)) }
}