import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import ResourcePage from './ResourcePage'
import { updateResource } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 1, system_role: 'MANAGER', fullname: 'Admin' } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: null }) }))
vi.mock('../api/resources', () => ({
  listResource: vi.fn(async resource => ({ total: 1, page: 1, pageSize: 20, totalPages: 1, data: resource === 'users' ? [{ id: 15, username: 'bs.ly', fullname: 'BS Lý', system_role: 'MANAGER', branch_id: null, branch_name: 'Tổng công ty' }] : [] })),
  getResource: vi.fn(async () => ({ id: 15, username: 'bs.ly', fullname: 'BS Lý', system_role: 'MANAGER', branch_id: null })),
  updateResource: vi.fn(async () => ({})),
  createResource: vi.fn(), deleteResource: vi.fn(), restoreResource: vi.fn(), getReportDetails: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

it('sửa MANAGER không có chi nhánh và gửi branchId null', async () => {
  const actor = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ResourcePage resource="users" /></QueryClientProvider>)
  await actor.click(await screen.findByRole('button', { name: /Xem BS Lý/ }))
  await actor.click(await screen.findByRole('button', { name: 'Sửa' }))
  const form = screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form')
  await actor.clear(within(form).getByLabelText('Họ tên'))
  await actor.type(within(form).getByLabelText('Họ tên'), 'Tên mới')
  await actor.click(within(form).getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(updateResource).toHaveBeenCalledWith('users', 15, expect.objectContaining({ fullname: 'Tên mới', systemRole: 'MANAGER', branchId: null })))
})

it('chuyển MANAGER sang STAFF vẫn yêu cầu chọn chi nhánh', async () => {
  const actor = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ResourcePage resource="users" /></QueryClientProvider>)
  await actor.click(await screen.findByRole('button', { name: /Xem BS Lý/ }))
  await actor.click(await screen.findByRole('button', { name: 'Sửa' }))
  const form = screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form')
  await actor.selectOptions(within(form).getByLabelText('Quyền'), 'STAFF')
  await actor.click(within(form).getByRole('button', { name: 'Lưu thay đổi' }))
  expect(screen.getByText('Nhân viên cần được gán chi nhánh.')).toBeInTheDocument()
  expect(updateResource).not.toHaveBeenCalled()
})