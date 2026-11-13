import { Fragment, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import { canUndoTreatmentExecution } from '../auth/permissions'
import { assignTreatmentStaffs, executeTreatment, getResource, listResource, undoTreatmentExecution, updateGroupedTreatmentExecution } from '../api/resources'
import { dateOnly, formatSpaDate, today } from '../utils/format'
import RoleStaffPicker from './RoleStaffPicker'
import ConfirmDialog from './ConfirmDialog'
import MobileSelect from './MobileSelect'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import RefreshButton from './RefreshButton'
import { canFollowUpTreatmentHistory } from '../auth/permissions'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import { canExecuteCard, todayTreatmentRows, treatmentCards } from '../utils/todayTreatments'
import TreatmentGroupSignature from './TreatmentGroupSignature'
import Pagination from './Pagination'
import './TodayTreatments.css'
import DateInput from './DateInput'
import { useBranchCatalog, useStaffCatalog } from '../hooks/useProductCatalog'

export default function TodayTreatments() {
  const { branchId } = useBranch(), { user } = useAuth(), qc = useQueryClient()
  const manager = user.system_role === 'MANAGER'
  const [viewDate, setViewDate] = useState(today), [executionDate, setExecutionDate] = useState(today)
  const [sessionEditor, setSessionEditor] = useState(null)
  const [page, setPage] = useState(1), [selected, setSelected] = useState(null), [undo, setUndo] = useState(null)
  const [staffs, setStaffs] = useState([]), [groupStaffs, setGroupStaffs] = useState({}), [executionBranch, setExecutionBranch] = useState(''), [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  const todayDate = today(), viewingToday = viewDate === todayDate
  const query = useQuery({ queryKey: ['dashboard-treatments', viewDate, branchId], queryFn: async () => {
    const executionFilters = { executionStartDate: viewDate, executionEndDate: viewDate }
    const [executedCards, createdCards] = await Promise.all([
      listResource('treatments', executionFilters, 1, 100),
      viewingToday ? listResource('treatments', { startDate: viewDate, endDate: viewDate }, 1, 100) : Promise.resolve({ data: [] }),
    ])
    return [...new Map([...createdCards.data, ...executedCards.data].map(card => [card.id, card])).values()]
  } })
  async function refreshTable() {
    await Promise.all([qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }), qc.invalidateQueries({ queryKey: ['treatments'] }), qc.invalidateQueries({ queryKey: ['commissions'] })])
    await Promise.all([query.refetch(), ...cardDetails.map(detail => detail.refetch())])
  }
  const staffBranch = manager ? (selected ? executionBranch : branchId) : branchId
  const staffCatalog = useStaffCatalog({ enabled: !manager || Boolean(staffBranch) })
  const employees = { ...staffCatalog, data: (staffCatalog.data || []).filter(staff => !staffBranch || Number(staff.branch_id) === Number(staffBranch)) }
  const branches = useBranchCatalog({ enabled: manager })
  const roles = useQuery({ queryKey: ['roles', 'staff-picker'], queryFn: () => listResource('roles', {}, 1, 100) })
  function staffSummary(history) {
    return (history.staffs || []).map(staff => {
      const role = staff.role_name || staff.role_type || roles.data?.data?.find(role => Number(role.id) === Number(staff.role_id))?.name || ''
      return `${role.replace(/^bác sĩ/i, 'BS').replace(/^kỹ thuật viên/i, 'KTV')} ${staff.staff_name || staff.fullname || `#${staff.staff_id}`}`.trim()
    }).join(' · ')
  }
  const allCards = query.data || []
  // The list endpoint includes child cards but not their execution histories.
  // Only skip detail requests when histories are explicitly present on every card.
  const cardDetails = useQueries({ queries: allCards.map(card => ({
    queryKey: ['dashboard-treatments', 'detail', card.id, viewDate],
    queryFn: () => getResource('treatments', card.id),
    enabled: treatmentCards(card).some(item => !Array.isArray(item.histories)),
    initialData: treatmentCards(card).every(item => Array.isArray(item.histories)) ? card : undefined,
  })) })
  const detailError = cardDetails.find(detail => detail.isError)?.error
  const rows = todayTreatmentRows(allCards, cardDetails, viewDate, branchId, viewingToday)

  // Gom các dòng theo khối lượt thực hiện (block) để không bao giờ bị cắt đôi giữa 2 trang
  const blocks = []
  let currentBlock = null
  for (const row of rows) {
    if (row.group) {
      currentBlock = { groupRow: row, childRows: [] }
      blocks.push(currentBlock)
    } else if (currentBlock && row.child) {
      currentBlock.childRows.push(row)
    } else {
      currentBlock = null
      blocks.push({ groupRow: null, childRows: [row] })
    }
  }

  const PAGE_SIZE = 10
  const pages = Math.max(1, Math.ceil(blocks.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, blocks.length)
  const visibleBlocks = blocks.slice(startIdx, endIdx)
  function changeViewDate(offset) {
    const date = new Date(`${viewDate}T12:00:00+07:00`)
    date.setUTCDate(date.getUTCDate() + offset)
    setViewDate(date.toISOString().slice(0, 10)); setPage(1); setSelected(null); setUndo(null); setMessage('')
  }
  function selectViewDate(value) {
    if (!value || value > todayDate) return
    setViewDate(value); setPage(1); setSelected(null); setUndo(null); setMessage('')
  }
  const mutation = useMutation({
    mutationFn: async ({ card, historyId, assigned, branch, execution_date, parentHistory, history, groupChildren }) => {
      if (historyId && Array.isArray(parentHistory?.children)) return updateGroupedTreatmentExecution(parentHistory.id, { treatment_id: parentHistory.treatment_id, children: parentHistory.children.map(child => ({ treatment_id: child.treatment_id, staffs: Number(child.id) === Number(history.id) ? assigned : child.staffs || [] })) })
      if (historyId) return assignTreatmentStaffs(historyId, assigned)
      if (groupChildren && Array.isArray(parentHistory?.children)) {
        const existingChildren = parentHistory.children
        const childByTreatmentId = new Map(existingChildren.map(child => [Number(child.treatment_id), { treatment_id: child.treatment_id, staffs: child.staffs || [] }]))
        groupChildren.forEach(child => childByTreatmentId.set(Number(child.treatment_id), child))
        return updateGroupedTreatmentExecution(parentHistory.id, { treatment_id: parentHistory.treatment_id, children: [...childByTreatmentId.values()] })
      }
      if (groupChildren) return executeTreatment({ treatment_id: card.id, ...(manager ? { branch_id: Number(branch) } : {}), execution_date, children: groupChildren })
      const created = await executeTreatment({ treatment_id: card.id, ...(manager ? { branch_id: Number(branch) } : {}), execution_date, staffs: [] })
      if (assigned.length) {
        try { await assignTreatmentStaffs(created.treatmentHistoryId, assigned) }
        catch (error) { throw new Error(`Đã ghi nhận buổi #${created.treatmentHistoryId} nhưng chưa gán được nhân viên: ${error.message}. Mở lại thẻ để gán, không tick lần nữa.`) }
      }
      return created
    },
    onSuccess: async () => { await refreshTable(); setMessageType('success'); setMessage('Đã ghi nhận buổi và lưu nhân viên thực hiện.'); setSelected(null); setGroupStaffs({}) },
    onError: async err => { setMessageType('error'); setMessage(err.message); await refreshTable() },
  })
  const undoMutation = useMutation({ mutationFn: target => {
    const id = typeof target === 'object' ? target.parentHistory?.id || target.id : target
    const history = typeof target === 'object' ? target.parentHistory || target : cardDetails.flatMap(detail => treatmentCards(detail.data || {})).flatMap(card => card.histories || []).find(history => history.id === id)
    if (!canUndoTreatmentExecution(user, history)) throw new Error('Bạn không có quyền hoàn tác buổi thực hiện này.')
    if (target?.childHistory && target.parentHistory?.children?.length > 1) return updateGroupedTreatmentExecution(target.parentHistory.id, { treatment_id: target.parentHistory.treatment_id, children: target.parentHistory.children.filter(item => Number(item.id) !== Number(target.childHistory.id)).map(item => ({ treatment_id: item.treatment_id, staffs: item.staffs || [] })) })
    return undoTreatmentExecution(id)
  }, onSuccess: async () => { await refreshTable(); setUndo(null); setSelected(null); setMessageType('success'); setMessage('Đã hoàn tác buổi hôm nay.') }, onError: async err => { await refreshTable(); setUndo(null); setMessageType('error'); setMessage(err.message) } })
  function pick(card, history, parentHistory) {
    if (selected?.card.id === card.id && selected.historyId === history?.id) { setSelected(null); setMessage(''); return }
    setSelected({ card, historyId: history?.id, history, parentHistory })
    setExecutionDate(manager ? viewDate : todayDate)
    setExecutionBranch(String(history?.branch_id || branchId || card.branch_id || ''))
    setStaffs((history?.staffs || []).map(s => ({ staff_id: Number(s.staff_id) })))
    setMessage('')
  }
  function toggleGroupDraft(root, groupKey, child, parentHistory) {
    setSelected(current => {
      const sameDraft = current?.groupKey === groupKey && Number(current.card.id) === Number(root.id) && !current.historyId
      const childIds = sameDraft ? current.childIds : []
      const exists = childIds.some(id => Number(id) === Number(child.id))
      const nextChildIds = exists ? childIds.filter(id => Number(id) !== Number(child.id)) : [...childIds, child.id]
      if (!nextChildIds.length) return null
      return { card: root, groupKey, parentHistory, childIds: nextChildIds, activeChildId: exists && Number(current.activeChildId) === Number(child.id) ? nextChildIds[0] : child.id }
    })
    setGroupStaffs(current => {
      const next = { ...current }
      if (Object.hasOwn(next, child.id)) delete next[child.id]
      else next[child.id] = []
      return next
    })
    setExecutionDate(parentHistory ? dateOnly(parentHistory.execution_date) : (manager ? viewDate : todayDate))
    setExecutionBranch(String(parentHistory?.branch_id || root.branch_id || branchId || ''))
    setMessage('')
  }
  function save() {
    if (cardDetails.some(detail => detail.isFetching) || detailError) return setMessage('Chưa tải đầy đủ lịch sử thực hiện. Vui lòng tải lại trước khi xác nhận.')
    if (!selected.historyId && !selected.groupKey && !canExecuteCard(selected.card)) return setMessage('Thẻ đã hết buổi hoặc đã đóng.')
    if (manager && !selected.historyId && !Number(executionBranch)) return setMessage('Chọn cơ sở thực hiện ngay tại dòng này trước khi xác nhận.')
    if (manager && !selected.historyId && !executionDate) return setMessage('Chọn ngày thực hiện.')
    if (employees.isLoading || (manager && !employees.data)) return setMessage('Đang tải danh sách nhân viên. Vui lòng chờ trước khi xác nhận.')
    if (employees.isError) return setMessage(`Không tải được danh sách nhân viên: ${employees.error.message}`)
    setMessage('')
    mutation.mutate({ ...selected, assigned: staffs, branch: executionBranch, execution_date: executionDate, groupChildren: selected.groupKey ? selected.childIds.map(id => ({ treatment_id: id, staffs: groupStaffs[id] || [] })) : null })
  }
  return <section className="section-card today-treatments">
    <div className="surface-heading today-treatments-heading"><div><span className="eyebrow">KHÁCH LÀM DỊCH VỤ</span><h2>{viewingToday ? 'Khách hàng hôm nay' : `Khách hàng ngày ${formatSpaDate(viewDate)}`}</h2></div><div className="today-date-picker" aria-label="Chọn ngày xem khách hàng"><button type="button" className="icon-btn" aria-label="Ngày trước" onClick={() => changeViewDate(-1)}><ChevronLeft size={20} /></button><label className="today-date-input"><span>Ngày xem</span><DateInput aria-label="Ngày xem" max={todayDate} value={viewDate} onChange={selectViewDate} /></label><button type="button" className="btn secondary today-button" disabled={viewingToday} onClick={() => selectViewDate(todayDate)}>Hôm nay</button><button type="button" className="icon-btn" aria-label="Ngày tiếp theo" disabled={viewingToday} onClick={() => changeViewDate(1)}><ChevronRight size={20} /></button></div></div>
    <p className="small-muted">{viewingToday ? <>Thẻ tạo hôm nay hoặc có buổi thực hiện hôm nay. Tick để ghi nhận, bấm tên nhân viên để sửa, bỏ tick để hoàn tác.{!manager && ' Nhân viên chỉ được hoàn tác buổi có ngày thực hiện và ngày tạo đều là hôm nay, tại cơ sở của mình.'}</> : manager ? <>Đang xem các buổi đã thực hiện ngày {formatSpaDate(viewDate)}. Quản lý vẫn có thể ghi nhận, gán lại nhân viên hoặc hoàn tác tại ngày này.</> : <>Đang xem các buổi đã thực hiện ngày {formatSpaDate(viewDate)}. Nhân viên có thể gán lại nhân viên thực hiện, nhưng không thể ghi nhận hoặc hoàn tác từ màn này.</>}</p>
    <div className="list-toolbar today-treatments-toolbar"><div /><div className="list-toolbar-actions"><span className="list-count">{blocks.length} lượt khách</span><RefreshButton label="Tải lại danh sách khách hàng" disabled={query.isFetching || cardDetails.some(detail => detail.isFetching)} onClick={refreshTable} /></div></div>
    {detailError && <p role="alert" className="form-alert">Không tải được lịch sử thực hiện: {detailError.message}</p>}
    {message && <p role="alert" aria-live="assertive" className={messageType === 'error' ? 'form-alert today-mutation-alert' : 'success-alert'}>{message}</p>}
    {query.isError ? <p className="form-alert">Không tải được thẻ: {query.error.message}</p> : query.isLoading ? <p>Đang tải thẻ...</p> : blocks.length ? <>
      <div className="table-scroll"><table><colgroup><col className="today-col-customer" /><col className="today-col-service" /><col className="today-col-completed" /><col className="today-col-staff" /><col className="today-col-note" /><col className="today-col-signature" /></colgroup><thead><tr><th>Khách hàng</th><th>Dịch vụ</th><th>{viewingToday ? 'Đã làm hôm nay' : 'Đã thực hiện'}</th><th>Nhân viên thực hiện</th><th>Ghi chú</th><th>Chữ ký khách hàng</th></tr></thead>
      {visibleBlocks.map(block => (
        <tbody className="today-visit" key={block.groupRow ? `block-group-${block.groupRow.card.id}-${block.groupRow.groupKey || '0'}` : `block-standalone-${block.childRows[0]?.card.id}-${block.childRows[0]?.history?.id || 'new'}`}>
          {block.groupRow && (() => {
            const { card, groupKey, groupTitle, sessions: rowSessions } = block.groupRow
            const sessions = rowSessions || []
            return <tr key={`group-${card.id}-${groupKey || '0'}`} className="today-treatment-group">
              <td data-label="Khách hàng"><strong>{card.customer_name}</strong></td>
              <td colSpan={3}>
                <div className="today-group-heading">
                  <strong>{groupTitle || card.product_name}</strong>
                  <small>{sessions.length ? `${sessions.length} dịch vụ` : `${card.children?.length || 0} dịch vụ`}</small>
                </div>
              </td>
              <td data-label="Ghi chú"><span className="today-session-note">{block.groupRow.history?.note || '—'}</span></td>
              <td data-label="Chữ ký khách hàng">
                {sessions.length ? <TreatmentGroupSignature card={card} history={block.groupRow.history} sessions={sessions} user={user} onUpdated={refreshTable} /> : '—'}
              </td>
            </tr>
          })()}
          {block.childRows.map(row => {
            const { card, history, multiple, child, groupKey, parentHistory } = row
            const groupRoot = block.groupRow?.card
            const draftingGroup = Boolean(groupRoot && selected?.groupKey === groupKey && Number(selected.card.id) === Number(groupRoot.id) && !selected.historyId)
            const selectedInDraft = draftingGroup && selected.childIds.some(id => Number(id) === Number(card.id))
            const active = history
              ? selected?.card.id === card.id && selected.historyId === history.id
              : groupRoot
                ? draftingGroup && Number(selected.activeChildId) === Number(card.id)
                : selected?.card.id === card.id && !selected.historyId && !selected.groupKey
            const canUndo = canUndoTreatmentExecution(user, parentHistory || history)
            const signed = Boolean(history?.customer_signature_svg || history?.customer_signed_at)
            const allowed = canFollowUpTreatmentHistory(user, history)
            const suffix = multiple ? ` · Buổi #${history?.id}` : ''
            return <Fragment key={`row-${card.id}-${history?.id || 'new'}-${groupKey || 'standalone'}`}>
              <tr className={child ? 'today-treatment-child' : 'today-treatment-standalone'} data-history-id={history?.id}>
                <td data-label="Khách hàng">{child ? null : card.customer_name}</td>
                <td data-label="Dịch vụ"><span className={child ? 'today-child-service' : undefined}>{card.product_name}</span></td>
                <td data-label="Đã làm hôm nay"><input type="checkbox" aria-label={`Đã làm ${card.customer_name} - ${card.product_name}${suffix}`} checked={Boolean(history) || selectedInDraft} disabled={(Boolean(history) && !canUndo) || (!history && (!manager && !viewingToday)) || (!history && !canExecuteCard(card)) || mutation.isPending || undoMutation.isPending} onChange={e => history ? (e.target.checked ? pick(card, history, parentHistory) : canUndo && setUndo(child && parentHistory ? { parentHistory, childHistory: history } : (parentHistory || history).id)) : groupRoot ? toggleGroupDraft(groupRoot, groupKey, card, parentHistory) : pick(card, history, parentHistory)} /></td>
                <td data-label="Nhân viên thực hiện">
                  {active ? 'Đang chọn nhân viên bên dưới' : history ? <button type="button" className="text-action" onClick={() => pick(card, history, parentHistory)} aria-label={`Sửa nhân viên ${card.customer_name} - ${card.product_name}${suffix}`}>{staffSummary(history) || 'Chưa gán NV'}</button> : 'Chưa thực hiện'}
                </td>
                <td data-label="Ghi chú">{child ? null : <span className="today-session-note">{history?.note || '—'}</span>}</td>
                <td data-label="Chữ ký khách hàng">
                  {child ? null : history ? <div className="today-session-signatures"><div className="today-signature-preview">{history.customer_signature_svg && <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(history.customer_signature_svg)}`} alt={`Chữ ký buổi #${history.id}`} />}<small>{signed ? 'Đã ký' : 'Chưa ký'}</small></div><button type="button" className="session-followup-button" aria-label={`${allowed ? 'Ghi chú và chữ ký' : 'Xem buổi'} #${history.id} - ${card.customer_name}`} onClick={() => setSessionEditor({ card, history })}><Pencil size={12} aria-hidden="true" />{allowed ? signed ? 'Ghi chú / Xem' : 'Ghi chú / Ký' : 'Xem'}</button></div> : '—'}
                </td>
              </tr>
              {active && <tr className="today-staff-row"><td colSpan={6}><div className="treatment-actions today-staff-actions">
                {manager && !selected.historyId && !selected.parentHistory && <label className="field">Cơ sở thực hiện<MobileSelect aria-label="Cơ sở thực hiện" value={executionBranch} onChange={e => { setExecutionBranch(e.target.value); setStaffs([]); setMessage('') }}><option value="">Chọn cơ sở</option>{branches.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</MobileSelect></label>}
                {!selected.historyId && !selected.parentHistory && <label className="field">Ngày thực hiện<DateInput aria-label="Ngày thực hiện" required value={executionDate} onChange={setExecutionDate} /></label>}
                <RoleStaffPicker selected={selected.groupKey ? groupStaffs[card.id] || [] : staffs} onChange={value => selected.groupKey ? setGroupStaffs(current => ({ ...current, [card.id]: value })) : setStaffs(value)} branchId={staffBranch || 'required'} /><button type="button" className="btn primary" disabled={mutation.isPending || !navigator.onLine} onClick={save}>{mutation.isPending ? 'Đang lưu...' : selected.groupKey ? `Xác nhận ${selected.childIds.length} dịch vụ` : 'Xác nhận'}</button><button type="button" className="btn secondary" onClick={() => { setSelected(null); setGroupStaffs({}); setMessage('') }}>Hủy</button>
              </div>{branches.isError && manager && !selected.historyId && <p className="form-alert">Không tải được cơ sở: {branches.error.message}</p>}</td></tr>}
            </Fragment>
          })}
        </tbody>
      ))}
      </table></div>
      <Pagination
        page={currentPage}
        totalPages={pages}
        totalItems={blocks.length}
        pageSize={PAGE_SIZE}
        onChange={setPage}
        label="lượt khách"
      />
    </> : <p className="small-muted">{viewingToday ? 'Chưa có khách làm dịch vụ hôm nay.' : `Chưa có khách làm dịch vụ ngày ${formatSpaDate(viewDate)}.`}</p>}
    {undo && <ConfirmDialog title="Hoàn tác buổi thực hiện?" message="Buổi thực hiện và tiền công đã ghi nhận sẽ bị hoàn tác." pending={undoMutation.isPending} onCancel={() => setUndo(null)} onConfirm={() => undoMutation.mutate(undo)} />}
    {sessionEditor && <TreatmentSessionDialog history={sessionEditor.history} card={sessionEditor.card} user={user} onClose={() => setSessionEditor(null)} onUpdated={refreshTable} />}
  </section>
}