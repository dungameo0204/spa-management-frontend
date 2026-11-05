import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import TodayTreatments from './TodayTreatments'
import { listResource } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'MANAGER', branch_id: 1 } }) }))
vi.mock('./AppShell', () => ({ useBranch: () => ({ branchId: 1 }) }))
vi.mock('./RoleStaffPicker', () => ({ default: () => <div>Chọn nhân viên</div> }))
vi.mock('../api/resources', () => ({ listResource: vi.fn(), executeTreatment: vi.fn(), assignTreatmentStaffs: vi.fn(), undoTreatmentExecution: vi.fn() }))

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