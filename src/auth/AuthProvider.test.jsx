import { StrictMode, useEffect } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthProvider'
import { request } from '../api/client'

const user = { id: 1, fullname: 'Người dùng mới', system_role: 'STAFF' }
const response = (status, data) => ({ ok: status === 200, status, json: async () => data })
const valid = () => response(200, { data: { user, expires_at: '2026-10-26T05:00:00.000Z' } })
let businessMounts
function Page() {
  const { user, login, logout } = useAuth()
  useEffect(() => { if (user) businessMounts() }, [user])
  return <><p>{user?.fullname || 'Chưa đăng nhập'}</p><button onClick={logout}>Thoát</button><button onClick={() => login({ username: 'demo', password: 'demo' })}>Đổi tài khoản</button></>
}
function setup() {
  return render(<StrictMode><QueryClientProvider client={new QueryClient()}><AuthProvider><Page /></AuthProvider></QueryClientProvider></StrictMode>)
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); businessMounts = vi.fn()
  localStorage.setItem('xuly.session', JSON.stringify({ token: 'saved-token', user: { ...user, fullname: 'Tên cũ' } }))
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('chờ xác minh, gửi token ngay và chỉ gọi me một lần trong StrictMode', async () => {
  let resolve
  fetch.mockImplementation(() => new Promise(done => { resolve = done }))
  setup()
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(businessMounts).not.toHaveBeenCalled()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch.mock.calls[0][0].pathname).toBe('/api/auth/me')
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer saved-token')
  await act(async () => resolve(valid()))
  expect(screen.getByText(user.fullname)).toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('xuly.session'))).toMatchObject({ token: 'saved-token', user })
})

it.each(['AUTH_TOKEN_MISSING', 'AUTH_TOKEN_INVALID', 'AUTH_TOKEN_EXPIRED', 'AUTH_SESSION_INVALID', 'AUTH_SESSION_CHANGED'])('xóa phiên với 401 %s', async code => {
  fetch.mockResolvedValue(response(401, { code, message: 'Đăng nhập lại' }))
  setup()
  expect(await screen.findByText('Chưa đăng nhập')).toBeInTheDocument()
  expect(localStorage.getItem('xuly.session')).toBeNull()
})

it.each([0, 429, 500, 503])('giữ phiên khi lỗi %s và cho thử lại', async status => {
  if (status) fetch.mockResolvedValueOnce(response(status, { code: 'AUTH_SERVICE_ERROR', message: 'Tạm thời không kết nối' }))
  else fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
  fetch.mockResolvedValueOnce(valid())
  setup()
  await screen.findByRole('alert')
  expect(localStorage.getItem('xuly.session')).not.toBeNull()
  expect(businessMounts).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Thử lại'))
  expect(await screen.findByText(user.fullname)).toBeInTheDocument()
})

it.each(['TENANT_DISABLED', 'TENANT_EXPIRED'])('giữ token và chặn trang với %s', async code => {
  fetch.mockResolvedValue(response(403, { code, message: 'Spa bị chặn' }))
  setup()
  expect(await screen.findByText('Không thể truy cập Spa')).toBeInTheDocument()
  expect(localStorage.getItem('xuly.session')).not.toBeNull()
  expect(businessMounts).not.toHaveBeenCalled()
})

it('response me đến sau logout không khôi phục lại phiên', async () => {
  let resolve
  fetch.mockImplementation(() => new Promise(done => { resolve = done }))
  setup()
  fireEvent.click(screen.getByText('Đăng xuất'))
  await act(async () => resolve(valid()))
  expect(screen.getByText('Chưa đăng nhập')).toBeInTheDocument()
  expect(localStorage.getItem('xuly.session')).toBeNull()
})

it('401 cũ không xóa phiên mới, kể cả khi token mới giống token cũ', async () => {
  fetch.mockResolvedValueOnce(valid())
  setup()
  await screen.findByText(user.fullname)
  let rejectOld
  fetch.mockImplementationOnce(() => new Promise(done => { rejectOld = done }))
  const oldRequest = request('/api/products').catch(error => error)
  fetch.mockResolvedValueOnce(response(200, { data: { token: 'saved-token', user: { ...user, fullname: 'Tài khoản mới' } } }))
  fireEvent.click(screen.getByText('Đổi tài khoản'))
  await screen.findByText('Tài khoản mới')
  await act(async () => { rejectOld(response(401, { code: 'AUTH_SESSION_INVALID' })); await oldRequest })
  expect(screen.getByText('Tài khoản mới')).toBeInTheDocument()
  expect(localStorage.getItem('xuly.session')).not.toBeNull()
})

it('khôi phục storage cũ khi chỉ có token và di chuyển sang localStorage', async () => {
  localStorage.removeItem('xuly.session'); sessionStorage.setItem('xuly.session', JSON.stringify({ token: 'legacy' }))
  fetch.mockResolvedValue(valid()); setup()
  await screen.findByText(user.fullname)
  await waitFor(() => expect(sessionStorage.getItem('xuly.session')).toBeNull())
  expect(JSON.parse(localStorage.getItem('xuly.session')).token).toBe('legacy')
})