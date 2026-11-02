import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { addAppointmentContactNote, updateAppointmentContactNote, deleteAppointmentContactNote } from '../api/appointmentContactNotes'
import ConfirmDialog from './ConfirmDialog'
import './AppointmentContactNotes.css'

export function contactNoteSummary(appointment) {
  if (Array.isArray(appointment.contact_notes)) return appointment.contact_notes.map(entry => `${entry.contact_date ? `${entry.contact_date}: ` : ''}${entry.content}`).join('\n')
  return appointment.extra_note || ''
}

export function AppointmentNotePreview({ appointment }) {
  return <span className="appointment-note-preview"><span><b>Dịch vụ: </b>{appointment.note || '—'}</span><span><b>Ghi chú: </b>{contactNoteSummary(appointment) || 'Chưa có'}</span></span>
}

export default function AppointmentContactNotes({ appointment, user, onChange }) {
  const qc = useQueryClient()
  const [content, setContent] = useState(''), [edit, setEdit] = useState(null), [remove, setRemove] = useState(null)
  const [pending, setPending] = useState(false), [error, setError] = useState('')
  const busy = useRef(false)
  const writable = !appointment.deleted_at && (user?.system_role === 'MANAGER' || (user?.system_role === 'STAFF' && user.branch_id != null && appointment.branch_id != null && Number(user.branch_id) === Number(appointment.branch_id)))
  async function save(action, noteId, value) {
    if (busy.current || !writable) return
    const normalized = value?.replace(/\r\n?/g, '\n').trim()
    if (action !== 'delete' && (!normalized || normalized.includes('\0') || new TextEncoder().encode(normalized).length > 10000)) {
      setError('Nội dung phải khác trống, không chứa ký tự NUL và tối đa 10000 byte UTF-8.')
      return
    }
    busy.current = true
    setPending(true)
    setError('')
    try {
      const data = await (action === 'delete' ? deleteAppointmentContactNote(appointment.id, noteId) : action === 'edit' ? updateAppointmentContactNote(appointment.id, noteId, normalized) : addAppointmentContactNote(appointment.id, normalized))
      onChange({ extra_note: data.extra_note, contact_notes: data.contact_notes })
      if (action === 'add') setContent('')
      if (action === 'edit') setEdit(null)
      setRemove(null)
      for (const key of ['appointments', 'dashboard-appointments', 'dashboard-pending']) qc.invalidateQueries({ queryKey: [key] })
    } catch (err) {
      setError(err.message)
      setRemove(null)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return <section className="appointment-contact-notes" aria-label="Ghi chú">
    <h3>Ghi chú</h3>
    {error && <p role="alert" className="form-alert">{error}</p>}
    {appointment.contact_notes?.length ? appointment.contact_notes.map(entry => <article key={entry.id} className="contact-note-entry">
      <small>{entry.contact_date || 'Ghi chú cũ'}{entry.created_by ? ` · ${entry.created_by}` : ''}{entry.updated_by ? ` · Sửa bởi ${entry.updated_by}` : ''}</small>
      {edit?.id === entry.id ? <form onSubmit={e => { e.preventDefault(); save('edit', entry.id, edit.content) }} className="form-stack">
        <label className="field">Sửa nội dung ghi chú<textarea rows={4} value={edit.content} disabled={pending} onChange={e => setEdit({ ...edit, content: e.target.value })} /></label>
        <div className="drawer-actions"><button type="button" className="btn secondary" disabled={pending} onClick={() => setEdit(null)}>Hủy sửa</button><button className="btn primary" disabled={pending || !navigator.onLine}>Lưu ghi chú</button></div>
      </form> : <><p className="contact-note-text">{entry.content}</p>{writable && <div className="drawer-actions"><button type="button" className="btn secondary" disabled={pending} onClick={() => { setEdit({ id: entry.id, content: entry.content }); setError('') }}>Sửa ghi chú #{entry.id}</button><button type="button" className="btn danger" disabled={pending || !navigator.onLine} onClick={() => setRemove(entry.id)}>Xóa ghi chú #{entry.id}</button></div>}</>}
    </article>) : <p className="contact-note-text">{contactNoteSummary(appointment) || 'Chưa có ghi chú.'}</p>}
    {writable && <form className="contact-note-composer" onSubmit={e => { e.preventDefault(); save('add', null, content) }}>
      <label htmlFor={`appointment-contact-note-${appointment.id}`}>Nội dung ghi chú mới</label>
      <textarea id={`appointment-contact-note-${appointment.id}`} rows={4} value={content} disabled={pending} placeholder="Nhập ghi chú về khách..." onChange={e => setContent(e.target.value)} />
      <div className="contact-note-composer-footer"><p className="helper-text">Ngày tạo do hệ thống tự ghi nhận.</p><button className="btn primary" disabled={pending || !navigator.onLine || Boolean(edit)}>{pending ? 'Đang lưu...' : 'Thêm ghi chú'}</button></div>
    </form>}
    {remove != null && <ConfirmDialog title="Xóa ghi chú?" message="Ghi chú này sẽ bị xóa và không thể khôi phục." pending={pending} onCancel={() => setRemove(null)} onConfirm={() => save('delete', remove)} />}
  </section>
}