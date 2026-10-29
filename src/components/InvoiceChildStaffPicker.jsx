import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Check, Search, X } from 'lucide-react'
import { listResource } from '../api/resources'
import { useAuth } from '../auth/AuthProvider'
import useDialogFocus from './useDialogFocus'

async function listPickerResources(resource, filters = {}) {
  const first = await listResource(resource, filters, 1, 100)
  const remaining = await Promise.all(Array.from({ length: Math.max(0, (first.totalPages || 1) - 1) }, (_, index) => listResource(resource, filters, index + 2, 100)))
  return { ...first, data: [first, ...remaining].flatMap(page => page.data || []) }
}

function searchText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()
}

export default function InvoiceChildStaffPicker({ name, selected = [], branchId, onChange }) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const branch = user.system_role === 'STAFF' ? user.branch_id : branchId
  const roles = useQuery({ queryKey: ['roles', 'invoice-staff-picker'], queryFn: () => listPickerResources('roles') })
  const people = useQuery({ queryKey: ['staffs', 'invoice-staff-picker', branch], queryFn: () => listPickerResources('staffs', { branchId: branch }), enabled: Boolean(branch) })
  const available = (people.data?.data || []).filter(person => Number(person.branch_id) === Number(branch))
  const groups = (roles.data?.data || []).map(role => ({ ...role, people: available.filter(person => Number(person.role_id) === Number(role.id)) })).filter(role => role.people.length)
  const other = available.filter(person => !groups.some(role => Number(role.id) === Number(person.role_id)))
  if (other.length) groups.push({ id: 'other', name: 'Chức vụ khác', people: other })
  const summary = selected.map(entry => {
    const person = available.find(person => Number(person.id) === Number(entry.staff_id))
    const role = groups.find(role => role.people.includes(person))
    const roleName = (role?.name || '').replace(/^bác sĩ/i, 'BS').replace(/^kỹ thuật viên/i, 'KTV')
    return person ? `${roleName} ${person.fullname}`.trim() : `Nhân viên #${entry.staff_id}`
  }).join(' · ')
  const error = roles.error || people.error
  return <><button type="button" className={`invoice-child-staff${selected.length ? ' has-value' : ''}`} aria-label={`Nhân viên làm ${name}`} aria-haspopup="dialog" title={summary || 'Chọn nhân viên theo chức vụ'} onClick={() => setOpen(true)}><Users size={13} /><span>{summary || 'Chọn nhân viên'}</span>{selected.length > 0 && <span className="invoice-staff-count">{selected.length}</span>}</button>
    {open && createPortal(<StaffDialog name={name} groups={groups} selected={selected} branch={branch} loading={roles.isPending || people.isPending} error={error} onRetry={() => { roles.refetch(); people.refetch() }} onClose={() => setOpen(false)} onSave={value => { onChange(value); setOpen(false) }} />, document.body)}
  </>
}

function StaffDialog({ name, groups, selected, branch, loading, error, onRetry, onClose, onSave }) {
  const [draft, setDraft] = useState(selected)
  const [search, setSearch] = useState('')
  const [roleId, setRoleId] = useState('')
  const ref = useRef(null)
  useDialogFocus(ref, onClose)
  const terms = searchText(search).split(/\s+/).filter(Boolean)
  const visibleGroups = groups.filter(role => !roleId || String(role.id) === roleId).map(role => ({ ...role, people:role.people.filter(person => terms.every(term => searchText(person.fullname).includes(term))) })).filter(role => role.people.length)
  const total = groups.reduce((sum, role) => sum + role.people.length, 0)
  const shown = visibleGroups.reduce((sum, role) => sum + role.people.length, 0)
  const remove = id => setDraft(current => current.filter(entry => Number(entry.staff_id) !== Number(id)))
  return <div className="consultant-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section ref={ref} className="invoice-staff-dialog" role="dialog" aria-modal="true" aria-label={`Nhân viên làm ${name}`}>
    <header><div><strong>Nhân viên thực hiện</strong><p>{name}</p></div><button type="button" className="icon-btn" aria-label="Đóng chọn nhân viên" onClick={onClose}><X size={18} /></button></header>
    <div className="invoice-staff-tools">
      <div className="invoice-staff-filters"><label className="invoice-staff-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Tìm nhân viên" placeholder="Tìm tên nhân viên (có hoặc không dấu)…" value={search} onChange={event => setSearch(event.target.value)} /></label><label className="invoice-staff-role"><span>Chức vụ</span><select aria-label="Lọc chức vụ" value={roleId} onChange={event => setRoleId(event.target.value)}><option value="">Tất cả chức vụ</option>{groups.map(role => <option key={role.id} value={role.id}>{role.name} ({role.people.length})</option>)}</select></label></div>
      <div className="invoice-staff-selected" aria-label="Nhân viên đã chọn">{draft.length ? draft.map(entry => {
        const person = groups.flatMap(role => role.people).find(person => Number(person.id) === Number(entry.staff_id))
        const label = person?.fullname || `Nhân viên #${entry.staff_id}`
        return <button type="button" key={entry.staff_id} aria-label={`Bỏ chọn ${label}`} onClick={() => remove(entry.staff_id)}>{label}<X size={12} aria-hidden="true" /></button>
      }) : <span>Chưa chọn nhân viên</span>}</div>
      {branch && !loading && !error && <p className="invoice-staff-results" role="status">Hiển thị {shown}/{total} nhân viên{(search || roleId) && <button type="button" onClick={() => { setSearch(''); setRoleId('') }}>Xóa bộ lọc</button>}</p>}
    </div>
    <div className="invoice-staff-dialog-body">{!branch ? <p>Chọn cơ sở lập hóa đơn trước.</p> : error ? <p role="alert">Không tải được nhân viên: {error.message}<button type="button" className="btn secondary" onClick={onRetry}>Tải lại</button></p> : loading ? <p role="status">Đang tải nhân viên...</p> : !groups.length ? <p>Chưa có nhân viên tại cơ sở này.</p> : !visibleGroups.length ? <p>Không tìm thấy nhân viên phù hợp.</p> : visibleGroups.map(role => <fieldset key={role.id}><legend>{role.name}</legend><div className="invoice-staff-options">{role.people.map(person => {
      const checked = draft.some(entry => Number(entry.staff_id) === Number(person.id))
      return <label key={person.id} className={checked ? 'is-selected' : ''}><input type="checkbox" checked={checked} onChange={event => setDraft(current => event.target.checked ? [...current, { staff_id: Number(person.id) }] : current.filter(entry => Number(entry.staff_id) !== Number(person.id)))} /><span>{person.fullname}</span>{checked && <Check size={15} aria-hidden="true" />}</label>
    })}</div></fieldset>)}</div>
    <footer><span>Đã chọn <strong>{draft.length}</strong> người</span><button type="button" className="btn secondary" onClick={onClose}>Hủy</button><button type="button" className="btn primary" disabled={!branch || loading || Boolean(error)} onClick={() => onSave(draft)}>Xong</button></footer>
  </section></div>
}