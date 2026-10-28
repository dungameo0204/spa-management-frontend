import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appendSkinImages, deleteSkinImage, deleteSkinSession, getSkinImage, listSkinSessions, saveSkinSession } from '../api/resources'
import { dateOnly, formatSpaDate, today } from '../utils/format'
import { validateCustomerBirthDate } from '../utils/validation'
import ConfirmDialog from './ConfirmDialog'
import { ImagePlus, UploadCloud, X } from 'lucide-react'
import SkinImageViewer from './SkinImageViewer'
import useDraftGuard from './useDraftGuard'

function UploadZone({ onFiles, disabled }) {
  const [dragging, setDragging] = useState(false)
  return <label className={`skin-dropzone ${dragging ? 'is-dragging' : ''}`} onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }} onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) onFiles(Array.from(event.dataTransfer.files)) }}>
    <input aria-label="Chọn ảnh" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={event => { onFiles(Array.from(event.target.files || [])); event.target.value = '' }} />
    <UploadCloud size={23} /><span><strong>Chọn ảnh hoặc kéo thả vào đây</strong><small>JPEG, PNG, WebP · tối đa 10 MiB/ảnh · 10 ảnh/lượt lưu</small></span><span className="skin-pick-label">Chọn ảnh</span>
  </label>
}

function ImagePreview({ file, customerId, sessionId, image, onOpen }) {
  const [source, setSource] = useState(''), [error, setError] = useState(''), [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true, url
    const controller = new AbortController()
    setSource(''); setError('')
    const load = async () => {
      try {
        const blob = file || await getSkinImage(customerId, sessionId, image.id, controller.signal)
        if (!alive) return
        url = URL.createObjectURL(blob); setSource(url)
      } catch (err) { if (alive && err.name !== 'AbortError') setError(err.message) }
    }
    load()
    return () => { alive = false; controller.abort(); if (url) URL.revokeObjectURL(url) }
  }, [file, customerId, sessionId, image?.id, attempt])
  const name = file?.name || image?.original_filename || 'Ảnh da'
  if (error) return <button type="button" className="skin-image-error" onClick={() => setAttempt(value => value + 1)} title={error}>Không tải được ảnh · Thử lại</button>
  return <button type="button" className="skin-thumbnail" disabled={!source} onClick={() => onOpen({ source, name })} aria-label={`Xem ảnh ${name}`}>{source ? <img src={source} alt={name} loading="lazy" onError={() => setError('Ảnh hỏng hoặc không đọc được')} /> : <span>Đang tải ảnh…</span>}</button>
}

export default function SkinImageAlbum({ customerId }) {
  const qc = useQueryClient(), [page, setPage] = useState(1), [editor, setEditor] = useState(null), [files, setFiles] = useState([]), [warning, setWarning] = useState(''), [notice, setNotice] = useState(''), [removal, setRemoval] = useState(null), [viewer, setViewer] = useState(null)
  const lock = useRef(false)
  const albumRef = useRef(null)
  const query = useQuery({ queryKey: ['skin-images', customerId, page], queryFn: () => listSkinSessions(customerId, page), retry: false })
  const mutation = useMutation({
    mutationFn: async action => {
      if (action.type === 'delete') return action.imageId == null ? deleteSkinSession(customerId, action.sessionId) : deleteSkinImage(customerId, action.sessionId, action.imageId)
      if (editor.mode === 'edit') return saveSkinSession(customerId, editor.id, { captured_date: editor.date, note: editor.note.trim() || null })
      const body = new FormData()
      files.forEach(file => body.append('images', file))
      if (editor.mode === 'append') return appendSkinImages(customerId, editor.id, body)
      body.append('captured_date', editor.date); body.append('note', editor.note.trim())
      return saveSkinSession(customerId, null, body)
    },
    onSuccess: async () => { setEditor(null); setFiles([]); setRemoval(null); setViewer(null); setWarning(''); setNotice('Đã lưu thay đổi album ảnh.'); await qc.invalidateQueries({ queryKey: ['skin-images', customerId] }) },
    onError: error => { setWarning(`${error.message} Nếu kết nối bị ngắt, hãy tải lại album để kiểm tra trước khi gửi lại.`) },
    onSettled: () => { lock.current = false },
  })
  const run = action => { if (lock.current) return; lock.current = true; setWarning(''); setNotice(''); mutation.mutate(action) }
  const dirty = Boolean(editor && (files.length || editor.date !== editor.initialDate || editor.note !== editor.initialNote))
  const guard = useDraftGuard(albumRef, dirty, mutation.isPending)
  useEffect(() => {
    if (query.isSuccess && page > 1 && !query.data.data.length) setPage(current => Math.max(1, Math.min(current - 1, query.data.totalPages || 1)))
  }, [query.isSuccess, query.data, page])
  const openEditor = (mode, session) => { const date = dateOnly(session?.captured_date) || today(), note = session?.note || ''; setEditor({ mode, id: session?.id, date, note, initialDate: date, initialNote: note }); setFiles([]); setWarning(''); setNotice('') }
  const selectFiles = selected => {
    if (!selected.length) return
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10485760 || file.size === 0)) return setWarning('Chọn 1–10 ảnh JPEG, PNG hoặc WebP; mỗi ảnh không quá 10 MiB và không rỗng.')
    const combined = [...files]
    selected.forEach(file => { if (!combined.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) combined.push(file) })
    if (combined.length > 10) return setWarning('Mỗi lượt lưu tối đa 10 ảnh mới. Các ảnh đã chọn vẫn được giữ lại; hãy lưu trước rồi thêm tiếp.')
    setFiles(combined); setWarning('')
  }
  const submit = event => {
    event.preventDefault()
    if (editor.mode !== 'append' && (!editor.date || validateCustomerBirthDate(editor.date, today()))) return setWarning('Ngày chụp phải hợp lệ và không ở tương lai.')
    if (new TextEncoder().encode(editor.note.trim()).length > 65535) return setWarning('Ghi chú tối đa 65535 byte UTF-8.')
    if (editor.mode !== 'edit' && !files.length) return setWarning('Vui lòng chọn ít nhất một ảnh.')
    run({ type: 'save' })
  }
  const cancelEditor = () => guard.request(() => { setEditor(null); setFiles([]); setWarning(''); setViewer(null) })
  const openPending = index => {
    const session = editor?.mode === 'append' ? query.data?.data.find(item => item.id === editor.id) : null
    const existing = session?.images || []
    setViewer({ sessionId: session?.id, images: [...existing, ...files.map(file => ({ file }))], index: existing.length + index })
  }
  const pendingImages = files.map((file, index) => <div className="skin-image-card is-pending" key={`${file.name}-${file.size}-${file.lastModified}`}><ImagePreview file={file} onOpen={() => openPending(index)} /><span className="skin-pending-badge">Chưa lưu</span><button type="button" className="skin-remove-pending" disabled={mutation.isPending} aria-label={`Bỏ ảnh ${index + 1}`} onClick={() => { setViewer(null); setFiles(current => current.filter((_, position) => position !== index)) }}><X size={15} /></button><small className="skin-image-name" title={file.name}>{file.name}</small></div>)
  const editorForm = (inline = false) => <form className={`skin-editor ${inline ? 'is-inline' : ''}`} onSubmit={submit}><fieldset disabled={mutation.isPending}>
    {warning && <p role="alert" className="form-alert">{warning}</p>}
    {editor.mode !== 'append' && <div className="skin-metadata"><label className="field">Ngày chụp<input type="date" required min="1000-01-01" max={today()} value={editor.date} onChange={event => setEditor({ ...editor, date: event.target.value })} /></label><label className="field">Ghi chú lần chụp<textarea rows={2} placeholder="Trước / sau điều trị, tình trạng da…" value={editor.note} onChange={event => setEditor({ ...editor, note: event.target.value })} /></label></div>}
    {editor.mode !== 'edit' && <><UploadZone onFiles={selectFiles} disabled={mutation.isPending} />{!inline && files.length > 0 && <div className="skin-image-grid">{pendingImages}</div>}<p className="skin-upload-count" role="status">{files.length ? `${files.length}/10 ảnh mới đang chờ lưu · Chọn tiếp để thêm ảnh` : 'Chọn nhiều lần vẫn giữ các ảnh đã chọn.'}</p></>}
    <div className="skin-actions"><button type="button" className="btn secondary" onClick={cancelEditor}>Hủy nhập ảnh</button><button type="submit" className="btn primary" disabled={!navigator.onLine || (editor.mode !== 'edit' && !files.length)}>{mutation.isPending ? 'Đang lưu…' : 'Lưu album'}</button></div>
  </fieldset></form>
  return <section ref={albumRef} className="skin-album customer-panel" aria-label="Album ảnh da">
    <div className="customer-panel-heading"><div><h3>Album ảnh da</h3><p className="skin-album-caption">Theo dõi thay đổi qua từng lần chụp</p></div><button type="button" className="btn secondary" disabled={mutation.isPending || Boolean(editor)} onClick={() => openEditor('create')}><ImagePlus size={16} />Thêm lần chụp</button></div>
    {notice && <p role="status" className="success-alert">{notice}</p>}{warning && !editor && !removal && <p role="alert" className="form-alert">{warning}</p>}
    {editor?.mode === 'create' && editorForm()}
    {query.isPending && <p role="status">Đang tải album…</p>}{query.isError && <div className="form-alert" role="alert">Không tải được album: {query.error.message}<button type="button" className="text-action" onClick={() => query.refetch()}>Tải lại album</button></div>}
    {query.isSuccess && !query.data.data.length && <p className="small-muted">Chưa có lần chụp nào.</p>}
    {query.data?.data.map(session => <article className="skin-session" key={session.id}><div className="skin-session-heading"><h4>{formatSpaDate(session.captured_date)} <small>· {session.images?.length || 0} ảnh</small></h4></div>{session.note && <p className="skin-note">{session.note}</p>}<div className="skin-image-grid">{session.images?.map(image => <div className="skin-image-card" key={image.id}><ImagePreview customerId={customerId} sessionId={session.id} image={image} onOpen={() => setViewer({ sessionId: session.id, images: [...session.images, ...(editor?.mode === 'append' && editor.id === session.id ? files.map(file => ({ file })) : [])], index: session.images.indexOf(image) })} /><button type="button" className="skin-delete-image" disabled={mutation.isPending || Boolean(editor)} onClick={() => { setWarning(''); setRemoval({ type: 'delete', sessionId: session.id, imageId: image.id }) }} aria-label={`Xóa ảnh ${image.original_filename}`}>Xóa ảnh</button></div>)}{editor?.mode === 'append' && editor.id === session.id && pendingImages}</div>
      {editor?.id === session.id && editorForm(true)}
      <div className="skin-actions skin-session-actions"><button type="button" className="text-action" disabled={mutation.isPending || Boolean(editor)} onClick={() => openEditor('append', session)}><ImagePlus size={15} /> Thêm ảnh</button><button type="button" className="text-action" disabled={mutation.isPending || Boolean(editor)} onClick={() => openEditor('edit', session)}>Sửa lần chụp</button><button type="button" className="text-action skin-delete-session" disabled={mutation.isPending || Boolean(editor)} onClick={() => { setWarning(''); setRemoval({ type: 'delete', sessionId: session.id }) }}>Xóa lần chụp</button></div></article>)}
    {(page > 1 || query.data?.totalPages > 1) && <nav className="skin-actions" aria-label="Phân trang album"><button type="button" className="btn secondary" disabled={page === 1 || query.isFetching || mutation.isPending || Boolean(editor)} onClick={() => setPage(page - 1)}>Trước</button><span>Trang {page} / {query.data?.totalPages || page}</span><button type="button" className="btn secondary" disabled={!query.data || page >= query.data.totalPages || query.isFetching || mutation.isPending || Boolean(editor)} onClick={() => setPage(page + 1)}>Sau</button></nav>}
    {removal && <ConfirmDialog title={removal.imageId == null ? 'Xóa lần chụp và toàn bộ ảnh?' : 'Xóa ảnh này?'} message={warning || 'Ảnh sẽ không còn hiển thị trong hồ sơ. Thao tác này chưa hỗ trợ khôi phục.'} pending={mutation.isPending} onCancel={() => { if (!mutation.isPending) setRemoval(null) }} onConfirm={() => run(removal)} />}
    {guard.discard && <ConfirmDialog title="Bỏ thay đổi chưa lưu?" message="Ảnh đã chọn và nội dung đang nhập sẽ bị bỏ. Chọn Giữ lại để tiếp tục chỉnh sửa." onCancel={guard.keep} onConfirm={guard.confirm} />}
    {viewer && <SkinImageViewer customerId={customerId} selection={viewer} onClose={() => setViewer(null)} />}
  </section>
}