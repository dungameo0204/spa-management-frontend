import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TodayTreatments from './TodayTreatments'
import { getResource, listResource, undoTreatmentExecution } from '../api/resources'
import { today } from '../utils/format'

const auth = vi.hoisted(() => ({ role: 'MANAGER' }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: auth.role, branch_id: 1 } }) }))
vi.mock('./AppShell', () => ({ useBranch: () => ({ branchId: 1 }) }))
vi.mock('./RoleStaffPicker', () => ({ default: () => <div>Chọn nhân viên</div> }))
vi.mock('../api/resources', () => ({ getResource: vi.fn(), listResource: vi.fn(), undoTreatmentExecution: vi.fn(), executeTreatment: vi.fn(), assignTreatmentStaffs: vi.fn() }))
beforeEach(() => { auth.role = 'MANAGER' })
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('renders old parent as heading, child-specific staff/status and undoes the child history', async () => {
  const root = { id: 10, customer_name: 'Khách A', product_name: 'Gói nám', created_at: '2020-01-01', branch_id: 1 }
  const history = { id: 50, execution_date: today(), branch_id: 1, staffs: [{ staff_id: 2, staff_name: 'Lan', role_name: 'Kỹ thuật viên' }] }
  listResource.mockImplementation(async name => ({ data: name === 'treatments' ? [root] : [], totalPages: 1 }))
  getResource.mockResolvedValue({ ...root, children: [{ id: 11, product_name: 'Laser', remaining_sessions: null, histories: [history] }, { id: 12, product_name: 'Điện di', remaining_sessions: null, histories: [] }] })
  undoTreatmentExecution.mockResolvedValue({})
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  expect(await screen.findByText('Gói nám')).toBeInTheDocument()
  const parent = screen.getByText('Gói nám').closest('tr')
  expect(within(parent).queryByRole('checkbox')).not.toBeInTheDocument()
  expect(parent).not.toHaveTextContent('Chưa thực hiện')
  expect(within(parent).getByRole('button', { name: 'Ghi chú và chữ ký nhóm Gói nám' })).toBeInTheDocument()
  expect(within(parent).getByRole('button', { name: 'Ghi chú và chữ ký nhóm Gói nám' }).querySelector('svg')).not.toBeNull()
  expect(within(screen.getByText('Laser').closest('tr')).queryByRole('button', { name: /Ghi chú/ })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sửa nhân viên Khách A - Laser' })).toHaveTextContent('KTV Lan')
  const pending = screen.getByRole('checkbox', { name: 'Đã làm Khách A - Điện di' })
  expect(within(pending.closest('tr')).queryByText('Khách A')).not.toBeInTheDocument()
  expect(pending).toBeEnabled()
  expect(pending.closest('tr')).toHaveTextContent('Chưa thực hiện')
  const actor = userEvent.setup()
  await actor.click(screen.getByRole('checkbox', { name: 'Đã làm Khách A - Laser' }))
  await actor.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xác nhận' }))
  await waitFor(() => expect(undoTreatmentExecution).toHaveBeenCalledWith(50))
})

it('lets a manager manage a historical execution date', async () => {
  const root = { id: 10, customer_name: 'Khách A', product_name: 'Laser', created_at: '2020-01-01', branch_id: 1 }
  const history = { id: 50, execution_date: '2026-10-20', branch_id: 1, staffs: [{ staff_id: 2, staff_name: 'Lan' }] }
  listResource.mockImplementation(async name => ({ data: name === 'treatments' ? [root] : [], totalPages: 1 }))
  getResource.mockImplementation(async (_resource, _id, filters) => ({ ...root, histories: filters?.executionStartDate === '2026-10-20' ? [history] : [{ ...history, execution_date: today() }] }))
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  await screen.findByText('Laser')
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  await waitFor(() => expect(listResource).toHaveBeenCalledWith('treatments', { executionStartDate: '2026-10-20', executionEndDate: '2026-10-20' }, 1, 100))
  await waitFor(() => expect(getResource).toHaveBeenCalledWith('treatments', 10, { executionStartDate: '2026-10-20', executionEndDate: '2026-10-20' }))
  expect(await screen.findByRole('heading', { name: 'Khách hàng ngày 20/10/2026' })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Đã làm Khách A - Laser' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Sửa nhân viên Khách A - Laser' })).toBeInTheDocument()
})

it('lets staff reassign a historical execution but not undo it', async () => {
  auth.role = 'STAFF'
  const root = { id: 10, customer_name: 'Khách A', product_name: 'Laser', created_at: '2020-01-01', branch_id: 1 }
  const history = { id: 50, execution_date: '2026-10-20', created_at: '2026-10-20', branch_id: 1, staffs: [{ staff_id: 2, staff_name: 'Lan' }] }
  listResource.mockImplementation(async name => ({ data: name === 'treatments' ? [root] : [], totalPages: 1 }))
  getResource.mockImplementation(async (_resource, _id, filters) => ({ ...root, histories: filters?.executionStartDate === '2026-10-20' ? [history] : [{ ...history, execution_date: today(), created_at: today() }] }))
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  await screen.findByText('Laser')
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  expect(await screen.findByRole('button', { name: 'Sửa nhân viên Khách A - Laser' })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Đã làm Khách A - Laser' })).toBeDisabled()
})

it('does not allow future dates in the dashboard date picker', async () => {
  const root = { id: 10, customer_name: 'Khách A', product_name: 'Laser', created_at: today(), branch_id: 1 }
  listResource.mockImplementation(async name => ({ data: name === 'treatments' ? [root] : [], totalPages: 1 }))
  getResource.mockResolvedValue({ ...root, histories: [] })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  await screen.findByText('Laser')
  const dateInput = screen.getByLabelText('Ngày xem')
  const nextDay = new Date(`${today()}T00:00:00Z`)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  const futureDate = nextDay.toISOString().slice(0, 10)

  expect(dateInput).toHaveAttribute('max', today())
  expect(screen.getByRole('button', { name: 'Ngày tiếp theo' })).toBeDisabled()
  fireEvent.change(dateInput, { target: { value: futureDate } })
  expect(dateInput).toHaveValue(today())
  expect(listResource).not.toHaveBeenCalledWith('treatments', { executionStartDate: futureDate, executionEndDate: futureDate }, 1, 100)
})