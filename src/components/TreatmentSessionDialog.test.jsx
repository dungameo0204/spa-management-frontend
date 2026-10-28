import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import { getResource, signTreatmentHistory, updateTreatmentHistoryNote } from '../api/resources'

vi.mock('../api/resources', () => ({ getResource: vi.fn(), signTreatmentHistory: vi.fn(), updateTreatmentHistoryNote: vi.fn() }))
vi.mock('./SignaturePad', () => ({ default: ({ onChange, disabled }) => <button disabled={disabled} onClick={() => onChange('<svg><path d="M 1 1 L 2 2"/></svg>')}>Vẽ chữ ký thử</button> }))
const history = { id: 77, branch_id: 1, execution_date: '2020-01-01', note: 'Ghi chú cũ' }
const card = { id: 10, customer_name: 'Khách A', product_name: 'Chăm sóc da' }
beforeEach(() => { vi.clearAllMocks(); updateTreatmentHistoryNote.mockResolvedValue({ data: {} }); signTreatmentHistory.mockResolvedValue({ data: { customer_signed_at: '2026-10-28T09:00:00Z' } }) })
afterEach(cleanup)
function open(session = history, user = { system_role: 'STAFF', branch_id: 1 }) {
  const onClose = vi.fn(), onUpdated = vi.fn()
  render(<QueryClientProvider client={new QueryClient()}><TreatmentSessionDialog history={session} card={card} user={user} onClose={onClose} onUpdated={onUpdated} /></QueryClientProvider>)
  return { actor: userEvent.setup(), onClose, onUpdated }
}
it('buổi cũ đã ký vẫn sửa và xóa ghi chú, không cho ký đè', async () => {
  const { actor } = open({ ...history, customer_signed_at: '2026-10-28T09:00:00Z' })
  expect(screen.queryByRole('button', { name: 'Lưu và ký xác nhận' })).not.toBeInTheDocument()
  await actor.clear(screen.getByRole('textbox'))
  await actor.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  await waitFor(() => expect(updateTreatmentHistoryNote).toHaveBeenCalledWith(77, null))
  expect(signTreatmentHistory).not.toHaveBeenCalled()
})
it('lưu note trước khi ký, khóa chữ ký nhưng vẫn cho sửa note', async () => {
  const { actor, onUpdated } = open()
  await actor.clear(screen.getByRole('textbox')); await actor.type(screen.getByRole('textbox'), '  Ghi chú mới  ')
  await actor.click(screen.getByRole('button', { name: 'Vẽ chữ ký thử' }))
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  await waitFor(() => expect(onUpdated).toHaveBeenCalled())
  expect(updateTreatmentHistoryNote).toHaveBeenCalledWith(77, 'Ghi chú mới')
  expect(updateTreatmentHistoryNote.mock.invocationCallOrder[0]).toBeLessThan(signTreatmentHistory.mock.invocationCallOrder[0])
  expect(screen.queryByRole('button', { name: 'Vẽ chữ ký thử' })).not.toBeInTheDocument()
  expect(screen.getByRole('textbox')).toBeEnabled()
})
it('lỗi ký giữ nét ký và không lưu note lần nữa khi thử lại', async () => {
  signTreatmentHistory.mockRejectedValueOnce(new Error('Lỗi mạng'))
  const { actor } = open()
  await actor.type(screen.getByRole('textbox'), ' mới')
  await actor.click(screen.getByRole('button', { name: 'Vẽ chữ ký thử' }))
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  expect(await screen.findByText(/Ghi chú đã lưu.*Lỗi mạng/)).toBeInTheDocument()
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  await waitFor(() => expect(signTreatmentHistory).toHaveBeenCalledTimes(2))
  expect(updateTreatmentHistoryNote).toHaveBeenCalledTimes(1)
})
it('409 ký: tải trạng thái mới, chỉ khóa ký, giữ ghi chú có thể sửa', async () => {
  signTreatmentHistory.mockRejectedValue(Object.assign(new Error('Buổi đã ký'), { status: 409 }))
  getResource.mockResolvedValue({ histories: [{ ...history, customer_signed_at: '2026-10-28T09:00:00Z' }] })
  const { actor } = open()
  await actor.click(screen.getByRole('button', { name: 'Vẽ chữ ký thử' }))
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Lưu và ký xác nhận' })).not.toBeInTheDocument())
  expect(screen.getByRole('textbox')).toBeEnabled()
})
it('khác cơ sở chỉ xem; quản lý không bị giới hạn cơ sở/ngày', () => {
  open(history, { system_role: 'STAFF', branch_id: 2 })
  expect(screen.getByRole('textbox')).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Lưu ghi chú' })).not.toBeInTheDocument()
  cleanup()
  open(history, { system_role: 'MANAGER', branch_id: 2 })
  expect(screen.getByRole('textbox')).toBeEnabled()
})
it('hủy không gọi API; quá giới hạn UTF-8 không lưu', async () => {
  const { actor, onClose } = open()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'đ'.repeat(32768) } })
  await actor.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  expect(screen.getByText(/65535 byte/)).toBeInTheDocument()
  await actor.click(screen.getByRole('button', { name: 'Đóng' }))
  expect(onClose).toHaveBeenCalledOnce()
  expect(updateTreatmentHistoryNote).not.toHaveBeenCalled()
})
it('pending khóa đóng và lưu, lỗi note không gọi ký và giữ nhập liệu', async () => {
  let reject
  updateTreatmentHistoryNote.mockImplementation(() => new Promise((resolve, fail) => { reject = fail }))
  const { actor } = open()
  await actor.type(screen.getByRole('textbox'), ' mới')
  await actor.click(screen.getByRole('button', { name: 'Vẽ chữ ký thử' }))
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  expect(screen.getByRole('button', { name: 'Đóng' })).toBeDisabled()
  reject(new Error('Lỗi lưu note'))
  expect(await screen.findByText('Lỗi lưu note')).toBeInTheDocument()
  expect(screen.getByRole('textbox')).toHaveValue('Ghi chú cũ mới')
  expect(signTreatmentHistory).not.toHaveBeenCalled()
})