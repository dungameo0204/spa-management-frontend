import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listResource } from '../api/resources'
export default function SearchPicker({ resource, label, value, onChange, initialLabel, filters = {}, required = false, onCreate, excludeIds = [], itemFilter, emptyOptionLabel }) {
  const [search, setSearch] = useState(''), [open, setOpen] = useState(false), [page, setPage] = useState(1)
  const [debounced, setDebounced] = useState('')
  const pickerRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const closeOutside = event => { if (!pickerRef.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])
  useEffect(() => { const timeout = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(timeout) }, [search])
  const query = useQuery({ queryKey: ['picker', resource, filters, debounced, page], queryFn: ({ signal }) => listResource(resource, { ...filters, search: debounced }, page, 20, signal), enabled: open })
  const display = item => item.fullname || item.name || item.customer_name || ''
  const options = query.data?.data?.filter(item => !excludeIds.some(id => String(id) === String(item.id)) && (!itemFilter || itemFilter(item))) || []
  return <div className="field picker" ref={pickerRef}><label>{label}{required && ' *'}</label><input role="combobox" aria-label={`Tìm ${label.toLowerCase()}`} aria-expanded={open} placeholder={`Tìm theo tên ${label.toLowerCase()}...`} value={open ? search : initialLabel || ''} onKeyDown={event => { if (event.key === 'Enter' && onCreate && search.trim() && !query.isLoading && !query.isError && query.data?.data?.length === 0) { event.preventDefault(); onCreate(search.trim()); setOpen(false) } }} onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onChange={event => { onChange(null); setSearch(event.target.value); setPage(1); setOpen(true) }} />{required && <input type="text" required value={value || ''} tabIndex={-1} aria-label={`Mã ${label.toLowerCase()} đã chọn`} className="picker-required" onChange={() => {}} />}{open && <div className="picker-options" role="listbox">{emptyOptionLabel && <button role="option" aria-selected={!value} type="button" onClick={() => { onChange(null); setSearch(''); setOpen(false) }}>{emptyOptionLabel}</button>}{query.isLoading ? <p>Đang tìm...</p> : query.isError ? <p>Không tải được dữ liệu: {query.error.message}</p> : options.length ? options.map(item => <button role="option" aria-selected={String(value) === String(item.id)} type="button" key={item.id} onClick={() => { onChange(item); setSearch(''); setOpen(false) }}>{display(item)}{item.phone_number ? ` · ${item.phone_number}` : ''}</button>) : <p>Không tìm thấy kết quả</p>}{onCreate && search.trim() && !query.isLoading && !query.isError && !query.data?.data?.length && <button type="button" onClick={() => { onCreate(search.trim()); setOpen(false) }}>+ Tạo khách “{search.trim()}” (Enter)</button>}{query.data?.totalPages > 1 && <div className="picker-pages"><button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button><span>{page}/{query.data.totalPages}</span><button type="button" disabled={page >= query.data.totalPages} onClick={() => setPage(p => p + 1)}>Sau</button></div>}<button type="button" className="picker-close" onClick={() => setOpen(false)}>Đóng</button></div>}</div>
}