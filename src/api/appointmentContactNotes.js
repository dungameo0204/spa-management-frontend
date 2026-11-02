import { request } from './client'

const path = (id, noteId) => `/api/appointments/${encodeURIComponent(id)}/contact-notes${noteId == null ? '' : `/${encodeURIComponent(noteId)}`}`
export const addAppointmentContactNote = (id, content) => request(path(id), { method: 'POST', body: { content } }).then(result => result.data)
export const updateAppointmentContactNote = (id, noteId, content) => request(path(id, noteId), { method: 'PUT', body: { content } }).then(result => result.data)
export const deleteAppointmentContactNote = (id, noteId) => request(path(id, noteId), { method: 'DELETE' }).then(result => result.data)