import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import { updateTreatmentHistoryNote } from '../api/resources'

vi.mock('../api/resources', () => ({ updateTreatmentHistoryNote: vi.fn().mockResolvedValue({ data: {} }) }))

it('tracks successful saves so a standalone history can be restored or cleared in one dialog', async () => {
  render(<QueryClientProvider client={new QueryClient()}><TreatmentSessionDialog
    card={{ id: 100, product_name: 'Laser', note: 'Not a history note' }}
    history={{ id: 601, note: 'Original', branch_id: 1, execution_date: '2026-11-07' }}
    user={{ system_role: 'MANAGER' }} onClose={() => {}}
  /></QueryClientProvider>)
  const input = screen.getByRole('textbox', { name: 'Ghi chú buổi thực hiện' })
  for (const value of ['Updated', 'Original', '']) {
    fireEvent.change(input, { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
    await waitFor(() => expect(updateTreatmentHistoryNote).toHaveBeenLastCalledWith(601, value || null))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu ghi chú' })).toBeDisabled())
  }
  expect(updateTreatmentHistoryNote).toHaveBeenCalledTimes(3)
})