import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listResource } from '../api/resources'
import { useAuth } from '../auth/AuthProvider'
import MobileSelect from './MobileSelect'

export default function RoleStaffPicker({ selected = [], onChange, branchId, label = 'Nhân viên thực hiện' }) {
  const { user } = useAuth()
  const effectiveBranch = user.system_role === 'STAFF' ? user.branch_id : branchId
  const roles = useQuery({ queryKey: ['roles', 'staff-picker'], queryFn: () => listResource('roles', {}, 1, 100) })
  const people = useQuery({ queryKey: ['staffs', 'role-picker', effectiveBranch], queryFn: () => listResource('staffs', { branchId: effectiveBranch }, 1, 100), enabled: Boolean(effectiveBranch) && effectiveBranch !== 'required' })
  const available = useMemo(() => (people.data?.data || []).filter(staff => Number(staff.branch_id) === Number(effectiveBranch)), [people.data, effectiveBranch])
  useEffect(() => {
    if (!people.isSuccess) return
    const valid = selected.filter(person => available.some(staff => Number(staff.id) === Number(person.staff_id)))
    if (valid.length !== selected.length) onChange(valid)
  }, [people.isSuccess, available, selected, onChange])
  const activeRoles = (roles.data?.data || []).filter(role => available.some(staff => Number(staff.role_id) === Number(role.id)))
  const ungrouped = available.filter(staff => !activeRoles.some(role => Number(role.id) === Number(staff.role_id)))
  return <div className="role-staff-picker" aria-label={label}>
    {roles.isError || people.isError ? <p className="form-alert">Không tải được chức vụ/nhân viên: {roles.error?.message || people.error?.message}</p> : null}
    {roles.data?.totalPages > 1 || people.data?.totalPages > 1 ? <p className="form-alert">Danh sách vượt 100 mục; cần phân trang trước khi gán.</p> : null}
    {activeRoles.map(role => {
      const staff = available.filter(person => Number(person.role_id) === Number(role.id))
      const current = selected.find(person => staff.some(s => Number(s.id) === Number(person.staff_id)))
       return <label className="field" key={role.id}>{role.name}<MobileSelect aria-label={`${label} - ${role.name}`} value={current?.staff_id || ''} onChange={event => onChange([...selected.filter(person => !staff.some(s => Number(s.id) === Number(person.staff_id))), ...(event.target.value ? [{ staff_id: Number(event.target.value) }] : [])])}><option value="">Chưa chọn</option>{staff.map(person => <option key={person.id} value={person.id}>{person.fullname}</option>)}</MobileSelect></label>
    })}
     {ungrouped.length > 0 && <label className="field">Chức vụ khác<MobileSelect aria-label={`${label} - Chức vụ khác`} value={selected.find(person => ungrouped.some(staff => Number(staff.id) === Number(person.staff_id)))?.staff_id || ''} onChange={event => onChange([...selected.filter(person => !ungrouped.some(staff => Number(staff.id) === Number(person.staff_id))), ...(event.target.value ? [{ staff_id: Number(event.target.value) }] : [])])}><option value="">Chưa chọn</option>{ungrouped.map(person => <option key={person.id} value={person.id}>{person.fullname}</option>)}</MobileSelect></label>}
    {effectiveBranch && effectiveBranch !== 'required' && !people.isLoading && !activeRoles.length && !ungrouped.length && <p className="small-muted">Chưa có nhân viên tại cơ sở này.</p>}
  </div>
}