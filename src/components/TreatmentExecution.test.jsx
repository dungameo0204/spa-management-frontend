import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import TreatmentExecution from './TreatmentExecution'
import { executeTreatment, updateTreatmentGroupNote } from '../api/resources'

vi.mock('../api/resources', () => ({ executeTreatment: vi.fn().mockResolvedValue({}), updateTreatmentGroupNote: vi.fn().mockResolvedValue({}) }))
vi.mock('../hooks/useProductCatalog', () => ({ useBranchCatalog: () => ({ data: [{ id: 1, name: 'Cơ sở 1' }] }) }))
vi.mock('./InvoiceChildStaffPicker', () => ({ default: () => <button type="button">Chọn nhân viên</button> }))

beforeEach(() => vi.clearAllMocks())

function openExecution() {
  render(<QueryClientProvider client={new QueryClient()}><TreatmentExecution
    card={{ id: 100, note: 'Ghi chú chung đã có', children: [{ id: 101, product_name: 'Laser', remaining_sessions: null }] }}
    user={{ system_role: 'MANAGER', branch_id: 1 }} branchId={1} initialSelectedIds={[101]}
  /></QueryClientProvider>)
}

it('starts with a blank note even when the parent already has a shared note', () => {
  openExecution()
  expect(screen.queryByRole('button', { name: 'Ghi chú ✓' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ghi chú', exact: true }))
  expect(screen.getByRole('textbox', { name: 'Ghi chú buổi thực hiện' })).toHaveValue('')
})

it('does not copy or erase an existing shared note when confirming without a new note', async () => {
  openExecution()
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }))
  await waitFor(() => expect(executeTreatment).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeDisabled())
  expect(executeTreatment.mock.calls[0][0]).not.toHaveProperty('note')
  expect(updateTreatmentGroupNote).not.toHaveBeenCalled()
})

it('sends one grouped execution payload with the parent card and parent-history note', async () => {
  openExecution()
  fireEvent.click(screen.getByRole('button', { name: 'Ghi chú', exact: true }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú buổi thực hiện' }), { target: { value: ' Ghi chú mới ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }))
  await waitFor(() => expect(executeTreatment).toHaveBeenCalledWith(expect.objectContaining({ treatment_id: 100, note: 'Ghi chú mới', children: [{ treatment_id: 101, staffs: [] }] })))
  expect(updateTreatmentGroupNote).not.toHaveBeenCalled()
})