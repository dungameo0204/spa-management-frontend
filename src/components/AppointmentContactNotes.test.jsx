import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import AppointmentContactNotes, { contactNoteSummary } from './AppointmentContactNotes'
import { addAppointmentContactNote, updateAppointmentContactNote, deleteAppointmentContactNote } from '../api/appointmentContactNotes'

vi.mock('../api/appointmentContactNotes', () => ({ addAppointmentContactNote: vi.fn(), updateAppointmentContactNote: vi.fn(), deleteAppointmentContactNote: vi.fn() }))
const entry = { id: 15, content: 'Đã gọi\nKhách xác nhận', contact_date: '28/10/2026', created_by: 'Lan' }
function setup(user = { system_role: 'MANAGER' }, notes = [entry]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  function Host() {
    const [appointment, setAppointment] = useState({ id: 9, branch_id: 1, note: 'Laser', contact_notes: notes })
    return <AppointmentContactNotes appointment={appointment} user={user} onChange={data => setAppointment(current => ({ ...current, ...data }))} />
  }
  render(<QueryClientProvider client={client}><Host /></QueryClientProvider>)
  return invalidate
}
beforeEach(() => vi.resetAllMocks())

it('adds only new content, uses server date, clears input and refreshes all appointment lists', async () => {
  const actor = userEvent.setup(), invalidate = setup()
  addAppointmentContactNote.mockResolvedValue({ extra_note: 'server summary', contact_notes: [entry, { id: 16, content: 'Nội dung mới\nDòng hai', contact_date: '02/11/2026' }] })
  await actor.type(screen.getByLabelText('Nội dung ghi chú mới'), 'Nội dung mới{Enter}Dòng hai')
  await actor.click(screen.getByRole('button', { name: 'Thêm ghi chú' }))
  expect(addAppointmentContactNote).toHaveBeenCalledWith(9, 'Nội dung mới\nDòng hai')
  expect(await screen.findByText('02/11/2026')).toBeInTheDocument()
  expect(screen.getByLabelText('Nội dung ghi chú mới')).toHaveValue('')
  for (const key of ['appointments', 'dashboard-appointments', 'dashboard-pending']) expect(invalidate).toHaveBeenCalledWith({ queryKey: [key] })
})

it('edits and deletes by entry ID including legacy entries without a date', async () => {
  const actor = userEvent.setup()
  setup(undefined, [{ ...entry, contact_date: null }])
  expect(screen.getByText(/Ghi chú cũ/)).toBeInTheDocument()
  updateAppointmentContactNote.mockResolvedValue({ contact_notes: [{ ...entry, content: 'Đã sửa', contact_date: null }], extra_note: 'Đã sửa' })
  await actor.click(screen.getByRole('button', { name: 'Sửa ghi chú #15' }))
  await actor.clear(screen.getByLabelText('Sửa nội dung ghi chú'))
  await actor.type(screen.getByLabelText('Sửa nội dung ghi chú'), 'Đã sửa')
  await actor.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
  expect(updateAppointmentContactNote).toHaveBeenCalledWith(9, 15, 'Đã sửa')
  expect(await screen.findByText('Đã sửa')).toBeInTheDocument()
  deleteAppointmentContactNote.mockResolvedValue({ contact_notes: [], extra_note: null })
  await actor.click(screen.getByRole('button', { name: 'Xóa ghi chú #15' }))
  expect(deleteAppointmentContactNote).not.toHaveBeenCalled()
  await actor.click(screen.getByRole('button', { name: 'Xác nhận' }))
  expect(await screen.findByText('Chưa có ghi chú.')).toBeInTheDocument()
  expect(deleteAppointmentContactNote).toHaveBeenCalledWith(9, 15)
})

it('rejects empty content and retains draft after server error', async () => {
  const actor = userEvent.setup()
  setup()
  await actor.click(screen.getByRole('button', { name: 'Thêm ghi chú' }))
  expect(addAppointmentContactNote).not.toHaveBeenCalled()
  addAppointmentContactNote.mockRejectedValue(new Error('Vượt giới hạn tổng ghi chú'))
  await actor.type(screen.getByLabelText('Nội dung ghi chú mới'), 'Giữ lại bản nháp')
  await actor.click(screen.getByRole('button', { name: 'Thêm ghi chú' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Vượt giới hạn tổng ghi chú')
  expect(screen.getByLabelText('Nội dung ghi chú mới')).toHaveValue('Giữ lại bản nháp')
})

it('blocks duplicate submission while request is pending', async () => {
  const actor = userEvent.setup()
  setup()
  let resolve
  addAppointmentContactNote.mockImplementation(() => new Promise(done => { resolve = done }))
  await actor.type(screen.getByLabelText('Nội dung ghi chú mới'), 'Liên hệ')
  await actor.dblClick(screen.getByRole('button', { name: 'Thêm ghi chú' }))
  expect(addAppointmentContactNote).toHaveBeenCalledTimes(1)
  resolve({ contact_notes: [], extra_note: null })
  await waitFor(() => expect(screen.getByLabelText('Nội dung ghi chú mới')).toHaveValue(''))
})

it('shows read-only history for staff from another branch', () => {
  setup({ system_role: 'STAFF', branch_id: 2 })
  expect(screen.getByText(/Khách xác nhận/)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('preserves legacy blocks and never guesses dates from content', () => {
  expect(contactNoteSummary({ contact_notes: [{ content: '28/10/2026: cũ\nDòng hai', contact_date: null }] })).toBe('28/10/2026: cũ\nDòng hai')
  expect(contactNoteSummary({ extra_note: 'Legacy' })).toBe('Legacy')
  expect(contactNoteSummary({ contact_notes: [], extra_note: 'stale' })).toBe('')
})