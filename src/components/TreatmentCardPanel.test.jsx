import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TreatmentCardPanel, { sessionLabel } from './TreatmentCardPanel'
import { closeTreatment, executeTreatment, getResource, listResource, updateTreatmentGroupNote } from '../api/resources'

vi.mock('../api/resources', () => ({ closeTreatment: vi.fn(), executeTreatment: vi.fn(), getResource: vi.fn(), listResource: vi.fn(), updateTreatmentGroupNote: vi.fn() }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'MANAGER' } }) }))
vi.mock('./SignaturePad', () => ({ default: ({ onChange }) => <button onClick={() => onChange('<svg/>')}>Ký mới</button> }))
vi.mock('./RoleStaffPicker', () => ({ default: ({ onChange, label }) => <button onClick={() => onChange([{ staff_id: label.includes('Laser') ? 7 : 8 }])}>{label}</button> }))
const root = () => ({ id: 1, customer_name: 'Khách A', product_name: 'Gói nám', total_sessions: 10, remaining_sessions: 10, children: [
  { id: 11, product_name: 'Laser', total_sessions: 3, remaining_sessions: 2, histories: [] },
  { id: 12, product_name: 'Massage', total_sessions: null, remaining_sessions: null, histories: [] },
  { id: 13, product_name: 'Đã hết', total_sessions: 1, remaining_sessions: 0, histories: [] },
] })
let card
beforeEach(() => {
  vi.clearAllMocks(); card = root()
  getResource.mockImplementation(async () => card)
  listResource.mockResolvedValue({ data: [{ id: 1, name: 'Cơ sở A' }] })
  executeTreatment.mockResolvedValue({}); updateTreatmentGroupNote.mockResolvedValue({})
  closeTreatment.mockImplementation(async () => { card = { ...card, closed_at: '2026-10-29', closure_signature_svg: '<svg/>' }; return {} })
})
afterEach(cleanup)
function open() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TreatmentCardPanel card={card} branchId={1} showHistory /></QueryClientProvider>)
  return userEvent.setup()
}
it('shows child count, finite/lifetime counts and requires a new signature plus explicit close confirmation', async () => {
  const actor = open()
  expect(screen.getByRole('button', { name: /Gói nám · 3 liệu trình con/ })).toBeTruthy()
  expect(screen.getByText('Trọn đời')).toBeTruthy()
  expect(screen.getByText(/Hết buổi, chờ ký kết thúc/)).toBeTruthy()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Ký kết thúc liệu trình' }).disabled).toBe(false))
  await actor.click(screen.getByRole('button', { name: 'Ký kết thúc liệu trình' }))
  expect(screen.getByRole('button', { name: 'Xác nhận kết thúc' }).disabled).toBe(true)
  await actor.click(screen.getByText('Ký mới'))
  await actor.click(screen.getByRole('button', { name: 'Xác nhận kết thúc' }))
  expect(closeTreatment).not.toHaveBeenCalled()
  await actor.click(screen.getByRole('button', { name: 'Quay lại' }))
  expect(closeTreatment).not.toHaveBeenCalled()
  await actor.click(screen.getByRole('button', { name: 'Xác nhận kết thúc' }))
  await actor.click(screen.getByRole('button', { name: 'Kết thúc toàn bộ liệu trình' }))
  await waitFor(() => expect(closeTreatment).toHaveBeenCalledTimes(1))
  expect(closeTreatment).toHaveBeenCalledWith(1, { closure_note: null, closure_signature_svg: '<svg/>' })
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Thực hiện' })).toBeNull())
})
it('executes selected children with their own staff and one parent note/signature', async () => {
  const actor = open()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Thực hiện' }).disabled).toBe(false))
  await actor.click(screen.getByRole('button', { name: 'Thực hiện' }))
  await actor.click(screen.getByRole('checkbox', { name: 'Laser' }))
  await actor.click(screen.getByRole('checkbox', { name: 'Massage' }))
  await actor.click(screen.getByRole('button', { name: 'Nhân viên Laser' }))
  await actor.click(screen.getByRole('button', { name: 'Nhân viên Massage' }))
  await actor.type(screen.getByRole('textbox'), 'Ghi chú chung')
  await actor.click(screen.getByText('Ký mới'))
  await actor.click(screen.getByRole('button', { name: 'Xác nhận thực hiện' }))
  await waitFor(() => expect(updateTreatmentGroupNote).toHaveBeenCalledWith(1, 'Ghi chú chung'))
  expect(executeTreatment.mock.calls.map(([body]) => [body.treatment_id, body.staffs, body.customer_signature_svg, body.note])).toEqual([[11, [{ staff_id: 7 }], '<svg/>', undefined], [12, [{ staff_id: 8 }], '<svg/>', undefined]])
})
it('stops on ambiguous partial failure and prevents accidental re-execution', async () => {
  executeTreatment.mockRejectedValue(new Error('Mất kết nối'))
  const actor = open()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Thực hiện' }).disabled).toBe(false))
  await actor.click(screen.getByRole('button', { name: 'Thực hiện' }))
  await actor.click(screen.getByRole('checkbox', { name: 'Laser' }))
  await actor.click(screen.getByRole('button', { name: 'Nhân viên Laser' }))
  await actor.click(screen.getByText('Ký mới'))
  await actor.click(screen.getByRole('button', { name: 'Xác nhận thực hiện' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Kiểm tra lịch sử'))
  expect(screen.getByRole('button', { name: 'Xác nhận thực hiện' }).disabled).toBe(true)
  expect(executeTreatment).toHaveBeenCalledTimes(1)
})
it('does not confuse exhausted, lifetime and signed closure states', () => {
  expect(sessionLabel({ remaining_sessions: null })).toBe('Trọn đời')
  expect(sessionLabel({ remaining_sessions: 0, total_sessions: 2 })).toContain('chờ ký kết thúc')
  expect(sessionLabel({ remaining_sessions: 0, closed_at: '2026-10-29' })).toBe('Đã ký kết thúc')
})