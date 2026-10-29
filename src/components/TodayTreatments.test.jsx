import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import TodayTreatments from './TodayTreatments'
import { getResource, listResource, undoTreatmentExecution } from '../api/resources'
import { today } from '../utils/format'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'MANAGER' } }) }))
vi.mock('./AppShell', () => ({ useBranch: () => ({ branchId: 1 }) }))
vi.mock('./RoleStaffPicker', () => ({ default: () => <div>Chọn nhân viên</div> }))
vi.mock('../api/resources', () => ({ getResource: vi.fn(), listResource: vi.fn(), undoTreatmentExecution: vi.fn(), executeTreatment: vi.fn(), assignTreatmentStaffs: vi.fn() }))
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