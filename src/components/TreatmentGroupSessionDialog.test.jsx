import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TreatmentGroupSessionDialog from './TreatmentGroupSessionDialog'
import { signTreatmentHistory, updateTreatmentHistoryNote } from '../api/resources'

vi.mock('../api/resources', () => ({ signTreatmentHistory: vi.fn(), updateTreatmentHistoryNote: vi.fn() }))
vi.mock('./SignaturePad', () => ({ default: ({ onChange }) => <button onClick={() => onChange('<svg/>')}>Ký một lần</button> }))
const history = { id: 100, branch_id: 1 }
const sessions = [{ card: { id: 11, product_name: 'Laser' }, history: { id: 101, treatment_id: 11, branch_id: 1 } }, { card: { id: 12, product_name: 'Điện di' }, history: { id: 102, treatment_id: 12, branch_id: 1 } }]
beforeEach(() => { vi.clearAllMocks(); signTreatmentHistory.mockResolvedValue({ data: { customer_signature_svg: '<svg/>' } }); updateTreatmentHistoryNote.mockResolvedValue({}) })
afterEach(cleanup)
function open() {
  const onUpdated = vi.fn()
  render(<QueryClientProvider client={new QueryClient()}><TreatmentGroupSessionDialog card={{ id: 1, customer_name: 'Khách A', product_name: 'Gói' }} history={history} sessions={sessions} user={{ system_role: 'MANAGER' }} onClose={vi.fn()} onUpdated={onUpdated} /></QueryClientProvider>)
  return { actor: userEvent.setup(), onUpdated }
}
it('saves the group note on the parent history only', async () => {
  const { actor } = open()
  await actor.type(screen.getByRole('textbox', { name: 'Ghi chú buổi thực hiện' }), 'làm lần 1')
  await actor.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã lưu ghi chú buổi thực hiện'))
  expect(updateTreatmentHistoryNote).toHaveBeenCalledWith(100, 'làm lần 1')
})
it('signs the parent history once, never child histories', async () => {
  const { actor, onUpdated } = open()
  await actor.click(screen.getByText('Ký một lần'))
  await actor.click(screen.getByRole('button', { name: 'Lưu và ký xác nhận' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã ký xác nhận'))
  expect(signTreatmentHistory).toHaveBeenCalledTimes(1)
  expect(signTreatmentHistory).toHaveBeenCalledWith(100, '<svg/>')
  expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ id: 100, customer_signature_svg: '<svg/>' }))
})