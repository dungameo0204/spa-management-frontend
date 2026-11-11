import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import TreatmentGroupSessionDialog from './TreatmentGroupSessionDialog'
import { updateTreatmentGroupNote, updateTreatmentHistoryNote } from '../api/resources'

vi.mock('../api/resources', () => ({ updateTreatmentGroupNote: vi.fn().mockResolvedValue({}), updateTreatmentHistoryNote: vi.fn() }))

it('saves only the explicitly selected history, supports repeated saves and null deletion', async () => {
  render(<QueryClientProvider client={new QueryClient()}><TreatmentGroupSessionDialog
    card={{ id: 100, product_name: 'Gói chăm sóc da', note: 'Ghi chú cũ của thẻ không được dùng' }}
    history={{ id: 601, note: 'Note 601', branch_id: 1 }} sessions={[
      { card: { id: 101, product_name: 'Điện di' }, history: { id: 501, note: 'Ghi chú lần 1', branch_id: 1 } },
      { card: { id: 102, product_name: 'Đắp mặt nạ' }, history: { id: 502, note: 'Ghi chú lần 1', branch_id: 1 } }
    ]}
    user={{ system_role: 'MANAGER', branch_id: 1 }} onClose={() => {}}
  /></QueryClientProvider>)
  const input = screen.getByLabelText('Ghi chú lần thực hiện')
  expect(input).toHaveValue('Note 601')
  fireEvent.change(input, { target: { value: 'Ghi chú lần 2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  await waitFor(() => expect(updateTreatmentHistoryNote).toHaveBeenCalledTimes(1))
  expect(updateTreatmentHistoryNote).toHaveBeenCalledWith(601, 'Ghi chú lần 2')
  expect(updateTreatmentHistoryNote).not.toHaveBeenCalledWith(501, expect.anything())
  fireEvent.change(input, { target: { value: 'Second edit' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  await waitFor(() => expect(updateTreatmentHistoryNote).toHaveBeenLastCalledWith(601, 'Second edit'))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu ghi chú' })).not.toBeDisabled())
  fireEvent.change(input, { target: { value: '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  await waitFor(() => expect(updateTreatmentHistoryNote).toHaveBeenLastCalledWith(601, null))
  expect(updateTreatmentGroupNote).not.toHaveBeenCalled()
})