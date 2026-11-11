import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import TreatmentGroupedHistory from './TreatmentGroupedHistory'
import { updateTreatmentHistoryNote } from '../api/resources'

vi.mock('../api/resources', () => ({ updateTreatmentHistoryNote: vi.fn().mockResolvedValue({}) }))

it('renders two nearby histories with independent notes and keeps them independent after refetch', async () => {
  const first = { id: 501, branch_id: 1, execution_date: '2026-11-07 09:00:00', note: 'Da còn đỏ' }
  const second = { id: 601, branch_id: 1, execution_date: '2026-11-07 09:00:30', note: 'Da đã ổn hơn' }
  const card = { id: 100, product_name: 'Chữa nám', note: 'Không được dùng', histories: [], children: [{ id: 101, product_name: 'Laser', histories: [first, second] }] }
  const client = new QueryClient()
  const tree = value => <QueryClientProvider client={client}><TreatmentGroupedHistory card={value} user={{ system_role: 'MANAGER' }} branches={[]} /></QueryClientProvider>
  const view = render(tree(card))
  const rows = () => [...view.container.querySelectorAll('.treatment-history-day')]
  expect(rows()).toHaveLength(2)
  expect(rows().find(row => row.dataset.historyId === '501')).toHaveTextContent('Da còn đỏ')
  const secondRow = rows().find(row => row.dataset.historyId === '601')
  expect(secondRow).toHaveTextContent('Da đã ổn hơn')
  fireEvent.click(within(secondRow).getByRole('button', { name: 'Ghi chú' }))
  const input = screen.getByLabelText('Ghi chú lần thực hiện')
  expect(input).toHaveValue('Da đã ổn hơn')
  fireEvent.change(input, { target: { value: 'Đã cập nhật lần 2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  await waitFor(() => expect(updateTreatmentHistoryNote).toHaveBeenCalledWith(601, 'Đã cập nhật lần 2'))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Đóng' })).not.toBeDisabled())
  fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
  view.rerender(tree({ ...card, children: [{ ...card.children[0], histories: [first, { ...second, note: 'Đã cập nhật lần 2' }] }] }))
  expect(rows().find(row => row.dataset.historyId === '501')).toHaveTextContent('Da còn đỏ')
  const refreshed = rows().find(row => row.dataset.historyId === '601')
  expect(refreshed).toHaveTextContent('Đã cập nhật lần 2')
  fireEvent.click(within(refreshed).getByRole('button', { name: 'Ghi chú' }))
  expect(screen.getByLabelText('Ghi chú lần thực hiện')).toHaveValue('Đã cập nhật lần 2')
  expect(updateTreatmentHistoryNote).toHaveBeenCalledTimes(1)
  expect(view.container.querySelector('img')).toBeNull()
})

it('uses the explicit parent history for a grouped visit note rather than a child timestamp', async () => {
  const parent = { id: 700, treatment_id: 100, branch_id: 1, execution_date: '2026-11-08 10:00:00', note: 'Ghi chú của lần đến', children: [
    { id: 701, treatment_id: 101, branch_id: 1, execution_date: '2026-11-08 10:00:00', staffs: [] },
    { id: 702, treatment_id: 102, branch_id: 1, execution_date: '2026-11-08 10:00:00', staffs: [] },
  ] }
  const onUndo = vi.fn()
  render(<QueryClientProvider client={new QueryClient()}><TreatmentGroupedHistory card={{ id: 100, product_name: 'Chữa nám', histories: [parent], children: [{ id: 101, product_name: 'Laser' }, { id: 102, product_name: 'Điều trị' }] }} user={{ system_role: 'MANAGER' }} branches={[]} onUndo={onUndo} /></QueryClientProvider>)
  const visit = document.querySelector('[data-history-id="700"]')
  expect(visit).toHaveTextContent('Ghi chú của lần đến')
  expect(visit).toHaveTextContent('Laser')
  expect(visit).toHaveTextContent('Điều trị')
  const undoButtons = within(visit).getAllByRole('button', { name: 'Hoàn tác' })
  expect(undoButtons).toHaveLength(2)
  fireEvent.click(undoButtons[0])
  expect(onUndo).toHaveBeenCalledWith(701)
  fireEvent.click(within(visit).getByRole('button', { name: 'Ghi chú' }))
  fireEvent.change(screen.getByLabelText('Ghi chú lần thực hiện'), { target: { value: 'Ghi chú đã sửa' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  await waitFor(() => expect(updateTreatmentHistoryNote).toHaveBeenCalledWith(700, 'Ghi chú đã sửa'))
})