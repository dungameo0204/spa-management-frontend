import { Fragment, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import { assignTreatmentStaffs, executeTreatment, getResource, listResource, undoTreatmentExecution } from '../api/resources'
import { today } from '../utils/format'
import RoleStaffPicker from './RoleStaffPicker'
import ConfirmDialog from './ConfirmDialog'
import MobileSelect from './MobileSelect'

export default function TodayTreatments() {
  const { branchId } = useBranch(), { user } = useAuth(), qc = useQueryClient()
  const manager = user.system_role === 'MANAGER'
  const [page, setPage] = useState(1), [selected, setSelected] = useState(null), [undo, setUndo] = useState(null)
  const [staffs, setStaffs] = useState([]), [executionBranch, setExecutionBranch] = useState(''), [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  // Treatment list dates filter creation, not execution. Scan all cards to find today's histories.
  const query = useQuery({ queryKey: ['dashboard-treatments', 'all', branchId], queryFn: async () => {
    // branchId on treatments means ORIGINAL invoice branch, not execution branch.
    const filters = {}
    const first = await listResource('treatments', filters, 1, 100)
    const rest = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => listResource('treatments', filters, i + 2, 100)))
    return [first, ...rest].flatMap(result => result.data)
  } })
  const staffBranch = manager ? (selected ? executionBranch : branchId) : branchId
  const employees = useQuery({ queryKey: ['staffs', 'today', staffBranch], queryFn: () => listResource('staffs', staffBranch ? { branchId: staffBranch } : {}, 1, 100), enabled: !manager || Boolean(staffBranch) })
  const branches = useQuery({ queryKey: ['branches', 'dashboard-treatment'], queryFn: () => listResource('branches', {}, 1, 100), enabled: manager })
  const allCards = query.data || []
  const cardDetails = useQueries({ queries: allCards.map(card => ({ queryKey: ['dashboard-treatments', 'detail', card.id], queryFn: () => getResource('treatments', card.id), staleTime: 15_000 })) })
  const cards = allCards.map((card, index) => ({ card, detail: cardDetails[index] })).filter(({ card, detail }) => (card.created_at?.slice(0, 10) === today() && (!branchId || card.branch_id == null || Number(card.branch_id) === Number(branchId))) || detail.data?.histories?.some(h => h.execution_date?.slice(0, 10) === today() && (!branchId || Number(h.branch_id) === Number(branchId))))
  const pages = Math.max(1, Math.ceil(cards.length / 20))
  const mutation = useMutation({
    mutationFn: async ({ card, historyId, assigned, branch }) => {
      if (historyId) return assignTreatmentStaffs(historyId, assigned)
      const created = await executeTreatment({ treatment_id: card.id, ...(manager ? { branch_id: Number(branch) } : {}), staffs: [] })
      if (assigned.length) {
        try { await assignTreatmentStaffs(created.treatmentHistoryId, assigned) }
        catch (error) { throw new Error(`Đã ghi nhận buổi #${created.treatmentHistoryId} nhưng chưa gán được nhân viên: ${error.message}. Mở lại thẻ để gán, không tick lần nữa.`) }
      }
      return created
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['commissions'] }); setMessageType('success'); setMessage('Đã ghi nhận buổi và lưu nhân viên thực hiện.'); setSelected(null) },
    onError: err => { qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); setMessageType('error'); setMessage(err.message) },
  })
  const undoMutation = useMutation({ mutationFn: undoTreatmentExecution, onSuccess: () => { qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['commissions'] }); setUndo(null); setSelected(null); setMessageType('success'); setMessage('Đã hoàn tác buổi hôm nay.') }, onError: err => { setUndo(null); setMessageType('error'); setMessage(err.message) } })
  function pick(card, detail) {
    if (selected?.card.id === card.id) { setSelected(null); setMessage(''); return }
    const history = (detail?.histories || []).find(h => h.execution_date?.slice(0, 10) === today() && (!branchId || Number(h.branch_id) === Number(branchId)))
    setSelected({ card, historyId: history?.id })
    setExecutionBranch(String(history?.branch_id || branchId || card.branch_id || ''))
    setStaffs((history?.staffs || []).map(s => ({ staff_id: Number(s.staff_id) })))
    setMessage('')
  }
  function save() {
    if (!selected.historyId && Number(selected.card.remaining_sessions) < 1) return setMessage('Thẻ đã hết buổi.')
    if (manager && !selected.historyId && !Number(executionBranch)) return setMessage('Chọn cơ sở thực hiện ngay tại dòng này trước khi xác nhận.')
    if (employees.isLoading || (manager && !employees.data)) return setMessage('Đang tải danh sách nhân viên. Vui lòng chờ trước khi xác nhận.')
    if (employees.isError) return setMessage(`Không tải được danh sách nhân viên: ${employees.error.message}`)
    if (employees.data?.totalPages > 1) return setMessage('Danh sách nhân viên vượt 100 người. Vui lòng kiểm tra phạm vi danh sách trước khi gán.')
    setMessage('')
    mutation.mutate({ ...selected, assigned: staffs, branch: executionBranch })
  }
  return <section className="section-card">
    <div className="surface-heading"><div><span className="eyebrow">KHÁCH LÀM DỊCH VỤ</span><h2>Khách hàng hôm nay</h2></div></div>
    <p className="small-muted">Gồm thẻ tạo hôm nay và thẻ đã thực hiện hôm nay. Tick để ghi nhận, bấm tên nhân viên để sửa, bỏ tick để hoàn tác.</p>
    {message && !selected && <p role={messageType === 'error' ? 'alert' : 'status'} className={messageType === 'error' ? 'form-alert' : 'success-alert'}>{message}</p>}
    {query.isError ? <p className="form-alert">Không tải được thẻ: {query.error.message}</p> : query.isLoading || cardDetails.some(d => d.isLoading) ? <p>Đang tải thẻ...</p> : cards.length ? <div className="table-scroll"><table><thead><tr><th>Khách hàng</th><th>Dịch vụ</th><th>Đã làm hôm nay</th><th>Nhân viên thực hiện</th></tr></thead><tbody>
      {cards.slice((page - 1) * 20, page * 20).map(({ card, detail: cardQuery }) => {
        const detail = cardQuery?.data
        const history = (detail?.histories || []).find(h => h.execution_date?.slice(0, 10) === today() && (!branchId || Number(h.branch_id) === Number(branchId)))
        const active = selected?.card.id === card.id
        return <Fragment key={card.id}><tr><td data-label="Khách hàng">{card.customer_name}</td><td data-label="Dịch vụ">{card.product_name}</td><td data-label="Đã làm hôm nay"><input type="checkbox" aria-label={`Đã làm ${card.customer_name} - ${card.product_name}`} checked={Boolean(history) || (active && !selected.historyId)} disabled={cardQuery?.isLoading || cardQuery?.isError || (!history && Number(card.remaining_sessions) < 1) || mutation.isPending || undoMutation.isPending} onChange={e => e.target.checked ? pick(card, detail) : history && setUndo(history.id)} /></td><td data-label="Nhân viên thực hiện">
          {cardQuery?.isError ? 'Không tải được lịch sử' : active ? 'Đang chọn nhân viên bên dưới' : history ? <button type="button" className="text-action" onClick={() => pick(card, detail)} aria-label={`Sửa nhân viên ${card.customer_name} - ${card.product_name}`}>{(history.staffs || []).map(s => s.staff_name || s.fullname).join(', ') || 'Chưa gán nhân viên · Bấm để sửa'}</button> : 'Chưa thực hiện'}
        </td></tr>{active && <tr className="today-staff-row"><td colSpan={4}><div className="treatment-actions today-staff-actions">
          {manager && !selected.historyId && <label className="field">Cơ sở thực hiện<MobileSelect aria-label="Cơ sở thực hiện" value={executionBranch} onChange={e => { setExecutionBranch(e.target.value); setStaffs([]); setMessage('') }}><option value="">Chọn cơ sở</option>{branches.data?.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</MobileSelect></label>}
          <RoleStaffPicker selected={staffs} onChange={setStaffs} branchId={staffBranch || 'required'} /><button type="button" className="btn primary" disabled={mutation.isPending || !navigator.onLine} onClick={save}>{mutation.isPending ? 'Đang lưu...' : 'Xác nhận'}</button><button type="button" className="btn secondary" onClick={() => { setSelected(null); setMessage('') }}>Hủy</button>
        </div>{branches.isError && manager && !selected.historyId && <p className="form-alert">Không tải được cơ sở: {branches.error.message}</p>}{message && <p role="alert" className="form-alert">{message}</p>}</td></tr>}</Fragment>
      })}
    </tbody></table></div> : <p className="small-muted">Chưa có khách làm dịch vụ hôm nay.</p>}
    {pages > 1 && <div className="picker-pages"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau</button></div>}
    {undo && <ConfirmDialog title="Hoàn tác buổi hôm nay?" message="Buổi thực hiện và tiền công đã ghi nhận sẽ bị hoàn tác." pending={undoMutation.isPending} onCancel={() => setUndo(null)} onConfirm={() => undoMutation.mutate(undo)} />}
  </section>
}