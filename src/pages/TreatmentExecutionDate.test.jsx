import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TreatmentsPage from './TreatmentsPage'
import TodayTreatments from '../components/TodayTreatments'
import { executeTreatment, assignTreatmentStaffs, undoTreatmentExecution, getResource, listResource } from '../api/resources'
import { today } from '../utils/format'

const auth = vi.hoisted(() => ({ role: 'MANAGER' }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: auth.role, branch_id: 2 } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: 2 }) }))
vi.mock('../components/RoleStaffPicker', () => ({ default: () => <div>Chọn nhân viên</div> }))
vi.mock('../api/resources', () => ({
  executeTreatment: vi.fn(), assignTreatmentStaffs: vi.fn(), undoTreatmentExecution: vi.fn(),
  createResource: vi.fn(), getResource: vi.fn(), listResource: vi.fn(),
}))

const card = { id: 10, customer_id: 20, customer_name: 'Lan', product_name: 'Chăm sóc da', remaining_sessions: 5, total_sessions: 6, branch_id: 2 }

beforeEach(() => {
  vi.clearAllMocks()
  auth.role = 'MANAGER'
  listResource.mockImplementation(async resource => ({ data: resource === 'treatments' ? [{ ...card, created_at: today() }] : resource === 'branches' ? [{ id: 2, name: 'Cơ sở 2' }] : [], totalPages: 1 }))
  getResource.mockImplementation(async resource => resource === 'treatments' ? { ...card, histories: [] } : { id: 20, fullname: 'Lan', total_debt: 0 })
  executeTreatment.mockResolvedValue({ treatmentHistoryId: 30 })
  assignTreatmentStaffs.mockResolvedValue({})
  undoTreatmentExecution.mockReset().mockResolvedValue({})
})
afterEach(cleanup)

it('dashboard: mỗi buổi một dòng, sửa nhân viên và hoàn tác đúng buổi thứ hai', async () => {
  const histories = [
    { id: 30, branch_id: 2, execution_date: today(), created_at: today(), staffs: [{ staff_id: 1, staff_name: 'Nhân viên Một' }] },
    { id: 31, branch_id: 2, execution_date: today(), created_at: today(), staffs: [{ staff_id: 2, staff_name: 'Nhân viên Hai' }] },
  ]
  getResource.mockResolvedValue({ ...card, histories })
  const actor = userEvent.setup()
  show(<TodayTreatments />)
  await screen.findByText('Buổi #31')
  const first = document.querySelector('tr[data-history-id="30"]'), second = document.querySelector('tr[data-history-id="31"]')
  expect(within(first).getByText('Nhân viên Một')).toBeInTheDocument()
  expect(within(first).queryByText('Nhân viên Hai')).not.toBeInTheDocument()
  await actor.click(within(second).getByRole('button', { name: /Sửa nhân viên/ }))
  await actor.click(screen.getByRole('button', { name: 'Xác nhận', exact: true }))
  await waitFor(() => expect(assignTreatmentStaffs).toHaveBeenCalledWith(31, [{ staff_id: 2 }]))
  await actor.click(within(second).getByRole('checkbox'))
  await actor.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xác nhận', exact: true }))
  await waitFor(() => expect(undoTreatmentExecution).toHaveBeenCalledWith(31))
})

for (const role of ['STAFF', 'MANAGER']) {
  for (const entry of ['detail', 'dashboard']) {
    for (const scenario of ['today', 'old-created', 'missing-created', 'other-branch', 'cancel', 'error']) {
    it(`${entry}: ${role} hoàn tác ${scenario}`, async () => {
      auth.role = role
      const history = { id: 30, branch_id: scenario === 'other-branch' ? 3 : 2, execution_date: today(), created_at: scenario === 'old-created' ? '2020-01-01 09:00:00' : scenario === 'missing-created' ? null : `${today()} 09:00:00`, staffs: [] }
      getResource.mockImplementation(async resource => resource === 'treatments' ? { ...card, histories: [history] } : {})
      if (scenario === 'error') undoTreatmentExecution.mockRejectedValue(new Error('Không được hoàn tác buổi này.'))
      const allowed = role === 'MANAGER' || !['old-created', 'missing-created', 'other-branch'].includes(scenario)
      const visibleHistory = entry === 'detail' || scenario !== 'other-branch'
      const actor = userEvent.setup()
      show(entry === 'dashboard' ? <TodayTreatments /> : <TreatmentsPage />)
      if (entry === 'detail') {
        await actor.click(await screen.findByRole('button', { name: 'Lan: 1 dịch vụ' }))
        await actor.click(await screen.findByRole('button', { name: 'Chăm sóc da · Xem lịch sử' }))
        await screen.findByText(/Cơ sở thực hiện:/)
        if (!allowed) expect(screen.queryByRole('button', { name: 'Hoàn tác', exact: true })).not.toBeInTheDocument()
        else await actor.click(screen.getByRole('button', { name: 'Hoàn tác', exact: true }))
      } else {
        const checkbox = await screen.findByRole('checkbox', { name: 'Đã làm Lan - Chăm sóc da' })
        await waitFor(() => expect(checkbox.checked).toBe(visibleHistory))
        if (!allowed && visibleHistory) expect(checkbox).toBeDisabled()
        if (allowed && visibleHistory) await actor.click(checkbox)
      }
      if (allowed && visibleHistory) {
        expect(undoTreatmentExecution).not.toHaveBeenCalled()
        if (scenario === 'cancel') {
          await actor.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Giữ lại' }))
          expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
          expect(undoTreatmentExecution).not.toHaveBeenCalled()
          return
        }
        await actor.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xác nhận', exact: true }))
        await waitFor(() => expect(undoTreatmentExecution).toHaveBeenCalledWith(30))
        if (scenario === 'error') expect(await screen.findByText('Không được hoàn tác buổi này.')).toBeInTheDocument()
      } else {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(undoTreatmentExecution).not.toHaveBeenCalled()
      }
    })
    }
  }
}

function show(component) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter>{component}</MemoryRouter></QueryClientProvider>)
}

async function openExecution(entry, actor, manager) {
  show(entry === 'dashboard' ? <TodayTreatments /> : <TreatmentsPage />)
  if (entry === 'dashboard') {
    await actor.click(await screen.findByRole('checkbox', { name: 'Đã làm Lan - Chăm sóc da' }))
  } else {
    await actor.click(await screen.findByRole('button', { name: 'Lan: 1 dịch vụ' }))
    if (entry === 'detail') await actor.click(await screen.findByRole('button', { name: 'Chăm sóc da · Xem lịch sử' }))
    const scope = entry === 'detail' ? within(screen.getByRole('dialog')) : screen
    await actor.click(await scope.findByRole('button', { name: manager ? 'Thực hiện' : 'Thực hiện hôm nay', exact: true }))
  }
}

for (const entry of ['inline', 'detail', 'dashboard']) {
  it(`${entry}: MANAGER chọn ngày và gửi execution_date dạng YYYY-MM-DD`, async () => {
    const actor = userEvent.setup()
    await openExecution(entry, actor, true)
    const date = screen.getByLabelText('Ngày thực hiện')
    expect(date).toHaveValue(today())
    fireEvent.change(date, { target: { value: '2026-09-15' } })
    await actor.click(screen.getByRole('button', { name: 'Xác nhận', exact: true }))
    await waitFor(() => expect(executeTreatment).toHaveBeenCalledWith({ treatment_id: 10, branch_id: 2, execution_date: '2026-09-15', staffs: [] }))
  })

  it(`${entry}: STAFF giữ nguyên giao diện và không gửi execution_date`, async () => {
    auth.role = 'STAFF'
    const actor = userEvent.setup()
    await openExecution(entry, actor, false)
    expect(screen.queryByLabelText('Ngày thực hiện')).not.toBeInTheDocument()
    await actor.click(screen.getByRole('button', { name: entry === 'dashboard' ? 'Xác nhận' : 'Xác nhận hôm nay', exact: true }))
    await waitFor(() => expect(executeTreatment).toHaveBeenCalledWith({ treatment_id: 10, staffs: [] }))
  })
}

it('sửa nhân viên của buổi đã có không hiển thị hoặc gửi ngày thực hiện mới', async () => {
  getResource.mockImplementation(async resource => resource === 'treatments' ? { ...card, histories: [{ id: 30, branch_id: 2, execution_date: today(), staffs: [] }] } : {})
  const actor = userEvent.setup()
  show(<TodayTreatments />)
  await actor.click(await screen.findByRole('button', { name: 'Sửa nhân viên Lan - Chăm sóc da' }))
  expect(screen.queryByLabelText('Ngày thực hiện')).not.toBeInTheDocument()
  await actor.click(screen.getByRole('button', { name: 'Xác nhận', exact: true }))
  await waitFor(() => expect(assignTreatmentStaffs).toHaveBeenCalledWith(30, []))
  expect(executeTreatment).not.toHaveBeenCalled()
})