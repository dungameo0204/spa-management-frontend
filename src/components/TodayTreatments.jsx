import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import { canUndoTreatmentExecution } from '../auth/permissions'
import { assignTreatmentStaffs, executeTreatment, listResource, undoTreatmentExecution } from '../api/resources'
import { dateOnly, formatSpaDate, today } from '../utils/format'
import RoleStaffPicker from './RoleStaffPicker'
import ConfirmDialog from './ConfirmDialog'
import MobileSelect from './MobileSelect'

const PAGE_SIZE = 20
const shiftDay = (day, amount) => { const value = new Date(`${day}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10) }

export default function TodayTreatments() {
  const { branchId } = useBranch(), { user } = useAuth(), qc = useQueryClient(), manager = user.system_role === 'MANAGER'
  const [viewDate, setViewDate] = useState(today), [executionDate, setExecutionDate] = useState(today)
  const [page, setPage] = useState(1), [selected, setSelected] = useState(null), [undo, setUndo] = useState(null)
  const [staffs, setStaffs] = useState([]), [executionBranch, setExecutionBranch] = useState(''), [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  const todayDate = today(), viewingToday = viewDate === todayDate, executionFilters = { executionStartDate: viewDate, executionEndDate: viewDate }
  const executions = useQuery({ queryKey: ['dashboard-treatments', 'execution', viewDate], queryFn: () => listResource('treatments', executionFilters, 1, 100) })
  const created = useQuery({ queryKey: ['dashboard-treatments', 'created', viewDate], queryFn: () => listResource('treatments', { startDate: viewDate, endDate: viewDate }, 1, 100), enabled: viewingToday })
  const staffBranch = manager ? (selected ? executionBranch : branchId) : branchId
  const employees = useQuery({ queryKey: ['staffs', 'today', staffBranch], queryFn: () => listResource('staffs', staffBranch ? { branchId: staffBranch } : {}, 1, 100), enabled: !manager || Boolean(staffBranch) })
  const branches = useQuery({ queryKey: ['branches', 'dashboard-treatment'], queryFn: () => listResource('branches', {}, 1, 100), enabled: manager })
  const cards = [...new Map([...(created.data?.data || []), ...(executions.data?.data || [])].map(card => [card.id, card])).values()]
  const matchesBranch = id => !branchId || Number(id) === Number(branchId)
  const rows = cards.flatMap(card => {
    const histories = (card.histories || []).filter(history => dateOnly(history.execution_date) === viewDate && matchesBranch(history.branch_id) && !history.deleted_at)
    if (histories.length) return histories.map(history => ({ card, history, multiple: histories.length > 1 }))
    return viewingToday && dateOnly(card.created_at) === viewDate && (!card.branch_id || matchesBranch(card.branch_id)) ? [{ card, history: null, multiple: false }] : []
  })
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)), currentPage = Math.min(page, pages)
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['commissions'] }) }
  const mutation = useMutation({ mutationFn: async ({ card, historyId, assigned, branch, execution_date }) => {
    if (historyId) return assignTreatmentStaffs(historyId, assigned)
    const createdHistory = await executeTreatment({ treatment_id: card.id, ...(manager ? { branch_id: Number(branch), execution_date } : {}), staffs: [] })
    if (assigned.length) await assignTreatmentStaffs(createdHistory.treatmentHistoryId, assigned)
    return createdHistory
  }, onSuccess: () => { invalidate(); setMessageType('success'); setMessage('Đã ghi nhận buổi và lưu nhân viên thực hiện.'); setSelected(null) }, onError: error => { setMessageType('error'); setMessage(error.message) } })
  const undoMutation = useMutation({ mutationFn: id => {
    const history = rows.find(row => row.history?.id === id)?.history
    if (!canUndoTreatmentExecution(user, history)) throw new Error('Bạn không có quyền hoàn tác buổi thực hiện này.')
    return undoTreatmentExecution(id)
  }, onSuccess: () => { invalidate(); setUndo(null); setSelected(null); setMessageType('success'); setMessage('Đã hoàn tác buổi thực hiện.'); setPage(1) }, onError: error => { setUndo(null); setMessageType('error'); setMessage(error.message) } })
  function changeViewDate(value) { if (!value || value > today()) return; setViewDate(value); setPage(1); setSelected(null); setMessage('') }
  function pick(card, history) { if (selected?.card.id === card.id && selected.historyId === history?.id) { setSelected(null); setMessage(''); return }; setSelected({ card, historyId: history?.id }); setExecutionDate(viewingToday ? today() : viewDate); setExecutionBranch(String(history?.branch_id || branchId || card.branch_id || '')); setStaffs((history?.staffs || []).map(staff => ({ staff_id: Number(staff.staff_id) }))); setMessage('') }
  function save() {
    if (!selected.historyId && Number(selected.card.remaining_sessions) < 1) return setMessage('Thẻ đã hết buổi.')
    if (!selected.historyId && !viewingToday) return setMessage('Chỉ ghi nhận buổi mới trong ngày hôm nay.')
    if (manager && !selected.historyId && !Number(executionBranch)) return setMessage('Chọn cơ sở thực hiện trước khi xác nhận.')
    if (employees.isLoading || (manager && !employees.data)) return setMessage('Đang tải danh sách nhân viên. Vui lòng chờ trước khi xác nhận.')
    if (employees.isError) return setMessage(`Không tải được danh sách nhân viên: ${employees.error.message}`)
    if (employees.data?.totalPages > 1) return setMessage('Danh sách nhân viên vượt 100 người. Vui lòng kiểm tra phạm vi danh sách trước khi gán.')
    setMessage(''); mutation.mutate({ ...selected, assigned: staffs, branch: executionBranch, execution_date: executionDate })
  }
  const loading = executions.isLoading || (viewingToday && created.isLoading), error = executions.error || (viewingToday && created.error)
  return <section className="section-card">
    <div className="surface-heading"><div><span className="eyebrow">KHÁCH LÀM DỊCH VỤ</span><h2>{viewingToday ? 'Khách hàng hôm nay' : `Khách hàng ngày ${formatSpaDate(viewDate)}`}</h2></div><div className="today-date-picker"><label className="field"><span>Ngày xem</span><input aria-label="Ngày xem" type="date" max={todayDate} value={viewDate} onChange={event => changeViewDate(event.target.value)} /></label><button type="button" className="icon-btn" aria-label="Ngày trước" onClick={() => changeViewDate(shiftDay(viewDate, -1))}><ChevronLeft size={18} /></button><button type="button" className="btn secondary" disabled={viewingToday} onClick={() => changeViewDate(todayDate)}>Hôm nay</button><button type="button" className="icon-btn" aria-label="Ngày tiếp theo" disabled={viewingToday} onClick={() => changeViewDate(shiftDay(viewDate, 1))}><ChevronRight size={18} /></button></div></div>
    <p className="small-muted">{viewingToday ? 'Thẻ tạo hôm nay hoặc có buổi thực hiện hôm nay.' : 'Các buổi thực hiện trong ngày đã chọn.'} Tick để ghi nhận, bấm tên nhân viên để sửa, bỏ tick để hoàn tác.</p>
    {message && !selected && <p role={messageType === 'error' ? 'alert' : 'status'} className={messageType === 'error' ? 'form-alert' : 'success-alert'}>{message}</p>}
    {error ? <p className="form-alert">Không tải được thẻ: {error.message}</p> : loading ? <p>Đang tải thẻ...</p> : rows.length ? <><div className="table-scroll"><table><thead><tr><th>Khách hàng</th><th>Dịch vụ</th><th>Đã làm hôm nay</th><th>Nhân viên thực hiện</th></tr></thead><tbody>{rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(({ card, history, multiple }) => {
      const active = selected?.card.id === card.id && selected.historyId === history?.id, canUndo = canUndoTreatmentExecution(user, history), suffix = multiple ? ` · Buổi #${history.id}` : ''
      return <Fragment key={`${card.id}-${history?.id || 'new'}`}><tr data-history-id={history?.id}><td data-label="Khách hàng">{card.customer_name}</td><td data-label="Dịch vụ">{card.product_name}{history && <small className="small-muted" style={{ display: 'block' }}>Buổi #{history.id}</small>}</td><td data-label="Đã làm hôm nay"><input type="checkbox" aria-label={`Đã làm ${card.customer_name} - ${card.product_name}${suffix}`} checked={Boolean(history) || (active && !selected.historyId)} disabled={(Boolean(history) && !canUndo) || (!history && (!viewingToday || Number(card.remaining_sessions) < 1)) || mutation.isPending || undoMutation.isPending} onChange={event => event.target.checked ? pick(card, history) : canUndo && setUndo(history.id)} /></td><td data-label="Nhân viên thực hiện">{active ? 'Đang chọn nhân viên bên dưới' : history ? <button type="button" className="text-action" onClick={() => pick(card, history)} aria-label={`Sửa nhân viên ${card.customer_name} - ${card.product_name}${suffix}`}>{(history.staffs || []).map(staff => staff.staff_name || staff.fullname).join(', ') || 'Chưa gán nhân viên · Bấm để sửa'}</button> : 'Chưa thực hiện'}</td></tr>{active && <tr className="today-staff-row"><td colSpan={4}><div className="treatment-actions today-staff-actions">{manager && !selected.historyId && <label className="field">Cơ sở thực hiện<MobileSelect aria-label="Cơ sở thực hiện" value={executionBranch} onChange={event => { setExecutionBranch(event.target.value); setStaffs([]); setMessage('') }}><option value="">Chọn cơ sở</option>{branches.data?.data?.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</MobileSelect></label>}{manager && !selected.historyId && <label className="field">Ngày thực hiện<input type="date" required max={todayDate} value={executionDate} onChange={event => setExecutionDate(event.target.value)} /></label>}<RoleStaffPicker selected={staffs} onChange={setStaffs} branchId={staffBranch || 'required'} /><button type="button" className="btn primary" disabled={mutation.isPending || !navigator.onLine} onClick={save}>{mutation.isPending ? 'Đang lưu...' : 'Xác nhận'}</button><button type="button" className="btn secondary" onClick={() => { setSelected(null); setMessage('') }}>Hủy</button></div>{branches.isError && manager && !selected.historyId && <p className="form-alert">Không tải được cơ sở: {branches.error.message}</p>}{message && <p role="alert" className="form-alert">{message}</p>}</td></tr>}</Fragment>
    })}</tbody></table></div>{pages > 1 && <div className="picker-pages"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Trước</button><span>{currentPage} / {pages}</span><button disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Sau</button></div>}</> : <p className="small-muted">{viewingToday ? 'Chưa có khách làm dịch vụ hôm nay.' : `Chưa có khách làm dịch vụ ngày ${formatSpaDate(viewDate)}.`}</p>}
    {undo && <ConfirmDialog title="Hoàn tác buổi thực hiện?" message="Buổi thực hiện và tiền công đã ghi nhận sẽ bị hoàn tác." pending={undoMutation.isPending} onCancel={() => setUndo(null)} onConfirm={() => undoMutation.mutate(undo)} />}
  </section>
}