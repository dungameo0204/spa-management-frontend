import { expect, it, vi } from 'vitest'
import { request } from './client'
import { addAppointmentContactNote, updateAppointmentContactNote, deleteAppointmentContactNote } from './appointmentContactNotes'

vi.mock('./client', () => ({ request: vi.fn(async () => ({ data: { contact_notes: [], extra_note: null } })) }))
it('uses contact-note endpoints and sends only content for writes', async () => {
  expect(await addAppointmentContactNote(9, 'Line 1\nLine 2')).toEqual({ contact_notes: [], extra_note: null })
  expect(request).toHaveBeenLastCalledWith('/api/appointments/9/contact-notes', { method: 'POST', body: { content: 'Line 1\nLine 2' } })
  await updateAppointmentContactNote(9, 15, 'Edited')
  expect(request).toHaveBeenLastCalledWith('/api/appointments/9/contact-notes/15', { method: 'PUT', body: { content: 'Edited' } })
  await deleteAppointmentContactNote(9, 15)
  expect(request).toHaveBeenLastCalledWith('/api/appointments/9/contact-notes/15', { method: 'DELETE' })
})