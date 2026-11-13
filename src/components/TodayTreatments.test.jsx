import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import TodayTreatments from './TodayTreatments'
import { executeTreatment, getResource, listResource, updateGroupedTreatmentExecution } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'MANAGER', branch_id: 1 } }) }))
vi.mock('./AppShell', () => ({ useBranch: () => ({ branchId: 1 }) }))
vi.mock('./RoleStaffPicker', () => ({ default: ({ branchId }) => <div data-testid="staff-picker" data-branch-id={branchId}>Chọn nhân viên</div> }))
vi.mock('../hooks/useProductCatalog', () => ({ useStaffCatalog: () => ({ data: [], isLoading: false, isError: false }), useBranchCatalog: () => ({ data: [] }) }))
vi.mock('../api/resources', () => ({ listResource: vi.fn(), getResource: vi.fn(), executeTreatment: vi.fn(), assignTreatmentStaffs: vi.fn(), undoTreatmentExecution: vi.fn(), updateGroupedTreatmentExecution: vi.fn() }))

afterEach(() => vi.clearAllMocks())

it('loads historical treatment groups from the execution-date list API without card detail requests', async () => {
  const history = { id: 50, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [{ staff_id: 2, staff_name: 'Lan', role_name: 'Kỹ thuật viên' }] }
  const parentHistory = { id: 40, execution_date: '2026-10-20', branch_id: 1, note: 'Theo dõi vùng da điều trị', children: [history] }
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Khách A', product_name: 'Gói nám', created_at: '2020-01-01', branch_id: 1, histories: [parentHistory], children: [{ id: 11, product_name: 'Laser', remaining_sessions: 1 }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '20/10/2026' } })
  await waitFor(() => expect(listResource).toHaveBeenCalledWith('treatments', { executionStartDate: '2026-10-20', executionEndDate: '2026-10-20' }, 1, 100))
  expect(await screen.findByText('Gói nám')).toBeInTheDocument()
  expect(screen.getByText('Laser')).toBeInTheDocument()
  expect(screen.getByText('Theo dõi vùng da điều trị')).toBeInTheDocument()
  expect(screen.getAllByRole('columnheader').map(header => header.textContent)).toEqual(['Khách hàng', 'Dịch vụ', 'Đã thực hiện', 'Nhân viên thực hiện', 'Ghi chú', 'Chữ ký khách hàng'])
  expect(document.querySelector('.today-col-signature')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sửa nhân viên Khách A - Laser' })).toHaveTextContent('KTV Lan')
})

it('creates one parent visit with every selected child in one request', async () => {
  const root = { id: 10, customer_name: 'Khách A', product_name: 'Gói nám', created_at: new Date().toISOString(), branch_id: 1, histories: [], children: [
    { id: 11, product_name: 'Laser', remaining_sessions: 2, histories: [] },
    { id: 12, product_name: 'Điện di', remaining_sessions: 2, histories: [] },
  ] }
  listResource.mockImplementation(async resource => resource === 'treatments' ? { data: [root], totalPages: 1 } : { data: [], totalPages: 1 })
  executeTreatment.mockResolvedValue({ treatmentHistoryId: 100, childTreatmentHistoryIds: [101, 102] })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  await screen.findByText('Gói nám')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Đã làm Khách A - Laser' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Đã làm Khách A - Điện di' }))
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận 2 dịch vụ' }))
  await waitFor(() => expect(executeTreatment).toHaveBeenCalledTimes(1))
  expect(executeTreatment).toHaveBeenCalledWith(expect.objectContaining({ treatment_id: 10, branch_id: 1, children: [{ treatment_id: 11, staffs: [] }, { treatment_id: 12, staffs: [] }] }))
})

it('adds a child to the existing parent visit with PUT instead of creating a second visit', async () => {
  const executionDate = new Date().toISOString()
  const root = { id: 10, customer_name: 'Khách A', product_name: 'Gói nám', created_at: executionDate, branch_id: 1, histories: [{
    id: 100,
    treatment_id: 10,
    execution_date: executionDate,
    branch_id: 1,
    children: [{ id: 101, treatment_id: 11, staffs: [{ staff_id: 2 }] }],
  }], children: [
    { id: 11, product_name: 'Laser', remaining_sessions: 2, histories: [] },
    { id: 12, product_name: 'Massage', remaining_sessions: 2, histories: [] },
  ] }
  listResource.mockImplementation(async resource => resource === 'treatments' ? { data: [root], totalPages: 1 } : { data: [], totalPages: 1 })
  getResource.mockResolvedValue(root)
  updateGroupedTreatmentExecution.mockResolvedValue({})
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  await screen.findByText('Gói nám')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Đã làm Khách A - Massage' }))
  expect(screen.queryByLabelText('Cơ sở thực hiện')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Ngày thực hiện')).not.toBeInTheDocument()
  expect(screen.getByTestId('staff-picker')).toHaveAttribute('data-branch-id', '1')
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận 1 dịch vụ' }))
  await waitFor(() => expect(updateGroupedTreatmentExecution).toHaveBeenCalledTimes(1))
  expect(updateGroupedTreatmentExecution).toHaveBeenCalledWith(100, { treatment_id: 10, children: [
    { treatment_id: 11, staffs: [{ staff_id: 2 }] },
    { treatment_id: 12, staffs: [] },
  ] })
  expect(executeTreatment).not.toHaveBeenCalled()
})

it('refetches the active list and its visible card details from the refresh button', async () => {
  const root = { id: 10, customer_name: 'Khách A', product_name: 'Laser', created_at: new Date().toISOString(), branch_id: 1, remaining_sessions: 2, histories: [] }
  listResource.mockImplementation(async resource => resource === 'treatments' ? { data: [root], totalPages: 1 } : { data: [], totalPages: 1 })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  await screen.findByText('Laser')
  const before = listResource.mock.calls.filter(([resource]) => resource === 'treatments').length
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tải lại danh sách khách hàng' }))
  await waitFor(() => expect(listResource.mock.calls.filter(([resource]) => resource === 'treatments').length).toBeGreaterThan(before))
})