import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TreatmentGroupSessionDialog from './TreatmentGroupSessionDialog'
import { getResource, signTreatmentHistory, updateTreatmentHistoryNote, updateTreatmentGroupNote } from '../api/resources'

vi.mock('../api/resources', () => ({ getResource: vi.fn(), signTreatmentHistory: vi.fn(), updateTreatmentHistoryNote: vi.fn(), updateTreatmentGroupNote: vi.fn() }))
vi.mock('./SignaturePad', () => ({ default: ({ onChange }) => <button onClick={() => onChange('<svg/>')}>Ký một lần</button> }))
const sessions = [
  { card: { id: 11, product_name: 'Laser' }, history: { id: 101, branch_id: 1 } },
  { card: { id: 12, product_name: 'Điện di' }, history: { id: 102, branch_id: 1 } },
  { card: { id: 13, product_name: 'Đã ký' }, history: { id: 103, branch_id: 1, customer_signature_svg: '<svg/>' } },
]
beforeEach(() => {
  vi.clearAllMocks()
  getResource.mockImplementation(async (_, id) => ({ histories: sessions.filter(entry => entry.card.id === id).map(entry => entry.history) }))
  signTreatmentHistory.mockResolvedValue({ data: { customer_signature_svg: '<svg/>' } })
  updateTreatmentHistoryNote.mockResolvedValue({})
  updateTreatmentGroupNote.mockResolvedValue({})
})
afterEach(cleanup)
it('saves one shared note on the parent, never on child histories', async () => {
  const actor = open()
  expect(screen.getAllByRole('textbox')).toHaveLength(1)
  await actor.type(screen.getByRole('textbox', { name: 'Ghi chú chung liệu trình' }), 'làm lần 1')
  await actor.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã lưu ghi chú chung'))
  expect(updateTreatmentGroupNote.mock.calls).toEqual([[1, 'làm lần 1']])
  expect(updateTreatmentHistoryNote).not.toHaveBeenCalled()
  expect(signTreatmentHistory).not.toHaveBeenCalled()
})
function open() {
  render(<QueryClientProvider client={new QueryClient()}><TreatmentGroupSessionDialog card={{ id: 1, customer_name: 'Khách A', product_name: 'Gói' }} sessions={sessions} user={{ system_role: 'MANAGER' }} onClose={vi.fn()} /></QueryClientProvider>)
  return userEvent.setup()
}
it('one signature applies to all unsigned performed child histories, never overwriting signed ones', async () => {
  const actor = open()
  await actor.click(screen.getByText('Ký một lần'))
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã ký xác nhận'))
  expect(signTreatmentHistory.mock.calls).toEqual([[101, '<svg/>'], [102, '<svg/>']])
  expect(updateTreatmentHistoryNote).not.toHaveBeenCalled()
})
it('partial failure preserves saved signatures and retry only signs the remainder', async () => {
  signTreatmentHistory.mockImplementation(async id => {
    if (id === 102 && signTreatmentHistory.mock.calls.length === 2) throw new Error('Mất kết nối')
    return { data: { customer_signature_svg: '<svg/>' } }
  })
  const actor = open()
  await actor.click(screen.getByText('Ký một lần'))
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã ký 1 buổi'))
  getResource.mockImplementation(async (_, id) => ({ histories: sessions.filter(entry => entry.card.id === id).map(entry => ({ ...entry.history, ...(id === 11 ? { customer_signature_svg: '<svg/>' } : {}) })) }))
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã ký xác nhận'))
  expect(signTreatmentHistory.mock.calls.map(call => call[0])).toEqual([101, 102, 102])
})