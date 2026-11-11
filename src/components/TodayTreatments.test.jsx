import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import TodayTreatments from './TodayTreatmentsGrouped'
import { listResource, undoTreatmentExecution, updateGroupedTreatmentExecution } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'MANAGER', branch_id: 1 } }) }))
vi.mock('./AppShell', () => ({ useBranch: () => ({ branchId: 1 }) }))
vi.mock('./RoleStaffPicker', () => ({ default: () => <div>Chọn nhân viên</div> }))
vi.mock('../api/resources', async importOriginal => ({ ...await importOriginal(), listResource: vi.fn(), listAllResource: vi.fn(async (...args) => (await listResource(...args, 1, 100)).data), assignTreatmentStaffs: vi.fn(), undoTreatmentExecution: vi.fn(), updateGroupedTreatmentExecution: vi.fn() }))

afterEach(() => vi.clearAllMocks())

it('loads a historical day with the execution-date API filter instead of treatment details', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Khách A', product_name: 'Laser', remaining_sessions: 1, histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, staffs: [{ staff_name: 'Lan' }] }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  await waitFor(() => expect(listResource).toHaveBeenCalledWith('treatments', { executionStartDate: '2026-10-20', executionEndDate: '2026-10-20' }, 1, 100))
  expect(await screen.findByText('Laser')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sửa nhân viên Khách A - Laser' })).toHaveTextContent('Lan')
})

it('renders an executed child service for a historical day instead of its parent package', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Customer A', product_name: 'Parent package', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, note: 'Theo dõi da trong 3 ngày', children: [{ id: 51, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [] }] }], children: [{ id: 11, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child laser', remaining_sessions: 1 }, { id: 12, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child PRP', remaining_sessions: 1 }, { id: 13, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child peel', remaining_sessions: 1 }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  expect(await screen.findByText('Child laser')).toBeInTheDocument()
  expect(screen.getByText('Parent package')).toBeInTheDocument()
  const parentRow = screen.getByText('Parent package').closest('tr')
  expect(parentRow.querySelector('[data-label="Ghi chú"] button')).toHaveAccessibleName('Sửa ghi chú #50')
  expect(parentRow.querySelector('[data-label="Ghi chú"]')).toHaveTextContent('Theo dõi da trong 3 ngày')
  const childRow = screen.getByText('Child laser').closest('tr')
  expect(screen.getByText('Child PRP')).toBeInTheDocument()
  expect(screen.getByText('Child peel')).toBeInTheDocument()
  expect(childRow.querySelector('input[type="checkbox"]')).toBeChecked()
  expect(screen.getByText('Child PRP').closest('tr').querySelector('input[type="checkbox"]')).not.toBeChecked()
  expect(screen.getByText('Child PRP').closest('tr').querySelector('input[type="checkbox"]')).not.toBeDisabled()
  expect(childRow.querySelector('[data-label="Ghi chú"] button')).toBeNull()
})

it('shows an empty grouped note as a dash before the pencil action', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Customer A', product_name: 'Parent package', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, children: [{ id: 51, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [] }] }], children: [{ id: 11, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child laser', remaining_sessions: 1 }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  const noteCell = (await screen.findByText('Parent package')).closest('tr').querySelector('[data-label="Ghi chú"]')
  expect(noteCell).toHaveTextContent('—')
  expect(noteCell.querySelector('button')).toHaveAccessibleName('Sửa ghi chú #50')
})

it('renders a standalone treatment note before its pencil action like a grouped parent visit', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Customer A', product_name: 'Ulatr', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, note: 'Theo dõi phản ứng da', staffs: [] }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  const row = (await screen.findByText('Ulatr')).closest('tr')
  const noteCell = row.querySelector('[data-label="Ghi chú"]')
  expect(noteCell).toHaveTextContent('Theo dõi phản ứng da')
  expect(noteCell.querySelector('button')).toHaveAccessibleName('Sửa ghi chú #50 - Customer A')
  expect(noteCell.querySelector('button')).not.toHaveTextContent('Ghi chú')
})

it('saves an edited grouped visit with exactly one parent-history PUT and the complete child list', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Customer A', product_name: 'Parent package', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, children: [{ id: 51, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [{ staff_id: 7 }] }] }], children: [{ id: 11, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child laser', remaining_sessions: 1 }, { id: 12, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child PRP', remaining_sessions: 1 }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  const prp = await screen.findByRole('checkbox', { name: 'Đã làm Customer A - Child PRP' })
  fireEvent.click(prp)
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(updateGroupedTreatmentExecution).toHaveBeenCalledWith(50, { treatment_id: 10, children: [{ treatment_id: 11, staffs: [{ staff_id: 7 }] }, { treatment_id: 12, staffs: [] }] }))
})

it('lets a manager remove one existing child from a grouped visit through PUT instead of denying undo', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Customer A', product_name: 'Parent package', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, children: [{ id: 51, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [] }, { id: 52, treatment_id: 12, execution_date: '2026-10-20', branch_id: 1, staffs: [] }] }], children: [{ id: 11, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child laser', remaining_sessions: 1 }, { id: 12, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child PRP', remaining_sessions: 1 }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Đã làm Customer A - Child PRP' }))
  expect(screen.queryByText('Chọn nhân viên')).not.toBeInTheDocument()
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Bỏ dịch vụ khỏi lần thực hiện?')
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ dịch vụ' }))
  await waitFor(() => expect(updateGroupedTreatmentExecution).toHaveBeenCalledWith(50, { treatment_id: 10, children: [{ treatment_id: 11, staffs: [] }] }))
  expect(screen.queryByText('Bạn không có quyền hoàn tác buổi thực hiện này.')).not.toBeInTheDocument()
})

it('saves removing the final grouped child as one empty-children PUT instead of DELETE', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Customer A', product_name: 'Parent package', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, children: [{ id: 51, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [] }] }], children: [{ id: 11, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child laser', remaining_sessions: 1 }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Đã làm Customer A - Child laser' }))
  expect(screen.queryByText('Chọn nhân viên')).not.toBeInTheDocument()
  expect(screen.queryByText('Đang chọn nhân viên bên dưới')).not.toBeInTheDocument()
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Bỏ dịch vụ khỏi lần thực hiện?')
  expect(updateGroupedTreatmentExecution).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ dịch vụ' }))
  await waitFor(() => expect(updateGroupedTreatmentExecution).toHaveBeenCalledWith(50, { treatment_id: 10, children: [] }))
  expect(undoTreatmentExecution).not.toHaveBeenCalled()
})

it('keeps a grouped child checked when its removal confirmation is cancelled', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Customer A', product_name: 'Parent package', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, children: [{ id: 51, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [] }] }], children: [{ id: 11, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child laser', remaining_sessions: 1 }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  const checkbox = await screen.findByRole('checkbox', { name: 'Đã làm Customer A - Child laser' })
  fireEvent.click(checkbox)
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Giữ lại' }))
  expect(checkbox).toBeChecked()
  expect(updateGroupedTreatmentExecution).not.toHaveBeenCalled()
})

it('does not crash when editing a grouped visit while a standalone history is also rendered', async () => {
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [
      { id: 9, customer_name: 'Customer A', product_name: 'Standalone service', histories: [{ id: 40, execution_date: '2026-10-20', branch_id: 1, staffs: [] }] },
      { id: 10, customer_name: 'Customer A', product_name: 'Parent package', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, children: [{ id: 51, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [] }, { id: 52, treatment_id: 12, execution_date: '2026-10-20', branch_id: 1, staffs: [] }] }], children: [{ id: 11, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child laser', remaining_sessions: 1 }, { id: 12, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child PRP', remaining_sessions: 1 }] },
    ], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Đã làm Customer A - Child PRP' }))
  expect(screen.getByText('Standalone service')).toBeInTheDocument()
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Bỏ dịch vụ khỏi lần thực hiện?')
})

it('reloads the table with current execution data when the refresh button is clicked', async () => {
  let selectedChildren = [{ id: 51, treatment_id: 11, execution_date: '2026-10-20', branch_id: 1, staffs: [] }]
  listResource.mockImplementation(async (resource, filters = {}) => {
    if (resource !== 'treatments') return { data: [], totalPages: 1 }
    if (filters.executionStartDate === '2026-10-20') return { data: [{ id: 10, customer_name: 'Customer A', product_name: 'Parent package', histories: [{ id: 50, execution_date: '2026-10-20', branch_id: 1, children: selectedChildren }], children: [{ id: 11, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child laser', remaining_sessions: 1 }, { id: 12, parent_treatment_id: 10, customer_name: 'Customer A', product_name: 'Child PRP', remaining_sessions: 1 }] }], totalPages: 1 }
    return { data: [], totalPages: 1 }
  })
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TodayTreatments /></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Ngày xem'), { target: { value: '2026-10-20' } })
  expect((await screen.findByRole('checkbox', { name: 'Đã làm Customer A - Child laser' })).checked).toBe(true)
  selectedChildren = []
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại danh sách khách hàng' }))
  await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Đã làm Customer A - Child laser' })).not.toBeChecked())
})
