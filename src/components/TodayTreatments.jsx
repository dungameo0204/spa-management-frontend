import { Fragment, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import { canUndoTreatmentExecution } from '../auth/permissions'
import { assignTreatmentStaffs, getResource, listResource, listAllResource, undoTreatmentExecution } from '../api/resources'
import { formatSpaDate, today } from '../utils/format'
import RoleStaffPicker from './RoleStaffPicker'
import ConfirmDialog from './ConfirmDialog'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import RefreshButton from './RefreshButton'
import { canFollowUpTreatmentHistory } from '../auth/permissions'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import TreatmentGroupSessionDialog from './TreatmentGroupSessionDialog'
import { todayTreatmentRows, treatmentCards, mergeTreatmentCards } from '../utils/todayTreatments'
import Pagination from './Pagination'
import './TodayTreatments.css'
import { useStaffCatalog } from '../hooks/useProductCatalog'
import DateInput from './DateInput'

export default function TodayTreatments() {
  const { branchId } = useBranch(), { user } = useAuth(), qc = useQueryClient()
  const manager = user.system_role === 'MANAGER'
  const [viewDate, setViewDate] = useState(today)
  const [sessionEditor, setSessionEditor] = useState(null)
  const [page, setPage] = useState(1), [selected, setSelected] = useState(null), [undo, setUndo] = useState(null)
  const [staffs, setStaffs] = useState([]), [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  const todayDate = today(), viewingToday = viewDate === todayDate
  const query = useQuery({ queryKey: ['dashboard-treatments', viewDate, branchId], queryFn: async () => {
    const executionFilters = { executionStartDate: viewDate, executionEndDate: viewDate }
    const executedCards = await listAllResource('treatments', executionFilters)
    return mergeTreatmentCards(executedCards)
  } })
  const staffBranch = selected?.historyId ? selected.branchId : branchId
  const staffCatalog = useStaffCatalog({ enabled: !manager || Boolean(staffBranch) })
  const employees = { ...staffCatalog, data: (staffCatalog.data || []).filter(staff => !staffBranch || Number(staff.branch_id) === Number(staffBranch)) }
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
    queryFn: () => getResource('treatments', card.id, { executionStartDate: viewDate, executionEndDate: viewDate }),
    enabled: treatmentCards(card).some(item => !Array.isArray(item.histories)),
    initialData: treatmentCards(card).every(item => Array.isArray(item.histories)) ? card : undefined,
  })) })
  const detailError = cardDetails.find(detail => detail.isError)?.error
  const rows = todayTreatmentRows(allCards, cardDetails, viewDate, branchId)

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
    mutationFn: async ({ historyId, assigned }) => {
      if (!historyId) throw new Error('Chỉ có thể sửa dịch vụ đã thuộc lần thực hiện này.')
      return assignTreatmentStaffs(historyId, assigned)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['commissions'] }); setMessageType('success'); setMessage('Đã lưu nhân viên thực hiện.'); setSelected(null) },
    onError: err => { qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); setMessageType('error'); setMessage(err.message) },
  })
  const undoMutation = useMutation({ mutationFn: id => {
    const history = cardDetails.flatMap(detail => treatmentCards(detail.data || {})).flatMap(card => card.histories || []).find(history => history.id === id)
    if (!canUndoTreatmentExecution(user, history)) throw new Error('Bạn không có quyền hoàn tác buổi thực hiện này.')
    return undoTreatmentExecution(id)
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['commissions'] }); setUndo(null); setSelected(null); setMessageType('success'); setMessage('Đã hoàn tác buổi hôm nay.') }, onError: err => { setUndo(null); setMessageType('error'); setMessage(err.message) } })
  function pick(card, history) {
    if (selected?.card.id === card.id && selected.historyId === history?.id) { setSelected(null); setMessage(''); return }
    setSelected({ card, historyId: history?.id })
    setSelected({ card, historyId: history?.id, branchId: history?.branch_id || branchId || card.branch_id || '' })
    setStaffs((history?.staffs || []).map(s => ({ staff_id: Number(s.staff_id) })))
    setMessage('')
  }
  function save() {
    if (cardDetails.some(detail => detail.isFetching) || detailError) return setMessage('Chưa tải đầy đủ lịch sử thực hiện. Vui lòng tải lại trước khi xác nhận.')
    if (!selected?.historyId) return setMessage('API sửa lần thực hiện nhóm chưa sẵn sàng. Mở Thẻ liệu trình để thực hiện lần đầu.')
    if (employees.isLoading || (manager && !employees.data)) return setMessage('Đang tải danh sách nhân viên. Vui lòng chờ trước khi xác nhận.')
    if (employees.isError) return setMessage(`Không tải được danh sách nhân viên: ${employees.error.message}`)
    setMessage('')
    mutation.mutate({ ...selected, assigned: staffs })
  }
  return <section className="section-card today-treatments">
    <div className="surface-heading today-treatments-heading"><div><span className="eyebrow">KHÁCH LÀM DỊCH VỤ</span><h2>{viewingToday ? 'Khách hàng hôm nay' : `Khách hàng ngày ${formatSpaDate(viewDate)}`}</h2></div><div className="today-date-picker" aria-label="Chọn ngày xem khách hàng"><button type="button" className="icon-btn" aria-label="Ngày trước" onClick={() => changeViewDate(-1)}><ChevronLeft size={20} /></button><label className="today-date-input"><span>Ngày xem</span><DateInput aria-label="Ngày xem" max={todayDate} value={viewDate} onChange={selectViewDate} /></label><button type="button" className="btn secondary today-button" disabled={viewingToday} onClick={() => selectViewDate(todayDate)}>Hôm nay</button><button type="button" className="icon-btn" aria-label="Ngày tiếp theo" disabled={viewingToday} onClick={() => changeViewDate(1)}><ChevronRight size={20} /></button></div></div>
    <p className="small-muted">{viewingToday ? <>Thẻ tạo hôm nay hoặc có buổi thực hiện hôm nay. Tick để ghi nhận, bấm tên nhân viên để sửa, bỏ tick để hoàn tác.{!manager && ' Nhân viên chỉ được hoàn tác buổi có ngày thực hiện và ngày tạo đều là hôm nay, tại cơ sở của mình.'}</> : manager ? <>Đang xem các buổi đã thực hiện ngày {formatSpaDate(viewDate)}. Quản lý vẫn có thể ghi nhận, gán lại nhân viên hoặc hoàn tác tại ngày này.</> : <>Đang xem các buổi đã thực hiện ngày {formatSpaDate(viewDate)}. Nhân viên có thể gán lại nhân viên thực hiện, nhưng không thể ghi nhận hoặc hoàn tác từ màn này.</>}</p>
    {message && !selected && <p role={messageType === 'error' ? 'alert' : 'status'} className={messageType === 'error' ? 'form-alert' : 'success-alert'}>{message}</p>}
    <div className="list-toolbar today-treatments-toolbar"><div /><div className="list-toolbar-actions"><span className="list-count">{blocks.length} lượt khách</span><RefreshButton label="Tải lại danh sách khách hàng" disabled={query.isFetching || cardDetails.some(detail => detail.isFetching)} onClick={() => qc.invalidateQueries({ queryKey: ['dashboard-treatments'] })} /></div></div>
    {detailError && <p role="alert" className="form-alert">Không tải được lịch sử thực hiện: {detailError.message}</p>}
    {query.isError ? <p className="form-alert">Không tải được thẻ: {query.error.message}</p> : query.isLoading ? <p>Đang tải thẻ...</p> : blocks.length ? <>
      <div className="table-scroll"><table><thead><tr><th>Khách hàng</th><th>Dịch vụ</th><th>{viewingToday ? 'Đã làm hôm nay' : 'Đã thực hiện'}</th><th>Nhân viên thực hiện</th><th>Ghi chú</th></tr></thead>
      {visibleBlocks.map(block => (
        <tbody className="today-visit" key={block.groupRow ? `block-group-${block.groupRow.card.id}-${block.groupRow.groupKey || '0'}` : `block-standalone-${block.childRows[0]?.card.id}-${block.childRows[0]?.history?.id || 'new'}`}>
          {block.groupRow && (() => {
            const { card, groupKey, groupTitle, history: groupHistory, sessions: rowSessions } = block.groupRow
            const sessions = rowSessions || []
            const groupNote = groupHistory?.note
            return <tr key={`group-${card.id}-${groupKey || '0'}`} className="today-treatment-group" data-history-id={groupHistory?.id}>
              <td data-label="Khách hàng"><strong>{card.customer_name}</strong></td>
              <td colSpan={3}>
                <div className="today-group-heading">
                  <strong>{groupTitle || card.product_name}</strong>
                  <small>{sessions.length ? `${sessions.length} dịch vụ` : `${card.children?.length || 0} dịch vụ`}</small>
                </div>
              </td>
              <td data-label="Ghi chú">{groupHistory ? <div className="today-treatment-note"><span title={groupNote || ''}>{groupNote || '—'}</span><button type="button" className="session-followup-button" aria-label={`Sửa ghi chú #${groupHistory.id}`} title="Sửa ghi chú" onClick={() => setSessionEditor({ card, history: groupHistory, group: true })}><Pencil size={14} aria-hidden="true" /></button></div> : '—'}</td>
            </tr>
          })()}
          {block.childRows.map(row => {
            const { card, history, multiple, child, groupKey } = row
              const active = selected?.card.id === card.id && selected.historyId === history?.id
            const canUndo = canUndoTreatmentExecution(user, history)
            const allowed = canFollowUpTreatmentHistory(user, history)
            const suffix = multiple ? ` · Buổi #${history?.id}` : ''
            return <Fragment key={`row-${card.id}-${history?.id || 'new'}-${groupKey || 'standalone'}`}>
              <tr className={child ? 'today-treatment-child' : 'today-treatment-standalone'} data-history-id={history?.id}>
                <td data-label="Khách hàng">{child ? null : card.customer_name}</td>
                <td data-label="Dịch vụ"><span className={child ? 'today-child-service' : undefined}>{card.product_name}</span></td>
                <td data-label="Đã làm hôm nay"><input type="checkbox" aria-label={`Đã làm ${card.customer_name} - ${card.product_name}${suffix}`} title={history ? undefined : 'API sửa lần thực hiện nhóm chưa sẵn sàng'} checked={Boolean(history)} disabled={!history || !canUndo || mutation.isPending || undoMutation.isPending} onChange={e => e.target.checked ? pick(card, history) : canUndo && setUndo(history.id)} /></td>
                <td data-label="Nhân viên thực hiện">
                  {active ? 'Đang chọn nhân viên bên dưới' : history ? <button type="button" className="text-action" onClick={() => pick(card, history)} aria-label={`Sửa nhân viên ${card.customer_name} - ${card.product_name}${suffix}`}>{staffSummary(history) || 'Chưa gán NV'}</button> : 'Chưa thực hiện'}
                </td>
                <td data-label="Ghi chú">{!child && history ? <div className="today-treatment-note"><span title={history.note || ''}>{history.note || '—'}</span><button type="button" className="session-followup-button" aria-label={`${allowed ? 'Sửa ghi chú' : 'Xem ghi chú'} #${history.id} - ${card.customer_name}`} title={allowed ? 'Sửa ghi chú' : 'Xem ghi chú'} onClick={() => setSessionEditor({ card, history })}><Pencil size={12} aria-hidden="true" /></button></div> : '—'}</td>
              </tr>
              {active && <tr className="today-staff-row"><td colSpan={5}><div className="treatment-actions today-staff-actions">
                <RoleStaffPicker selected={staffs} onChange={setStaffs} branchId={staffBranch || 'required'} /><button type="button" className="btn primary" disabled={mutation.isPending || !navigator.onLine} onClick={save}>{mutation.isPending ? 'Đang lưu...' : 'Xác nhận'}</button><button type="button" className="btn secondary" onClick={() => { setSelected(null); setMessage('') }}>Hủy</button>
              </div>{message && <p role="alert" className="form-alert">{message}</p>}</td></tr>}
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
    {sessionEditor && (sessionEditor.group ? <TreatmentGroupSessionDialog card={sessionEditor.card} history={sessionEditor.history} user={user} onClose={() => setSessionEditor(null)} /> : <TreatmentSessionDialog history={sessionEditor.history} card={sessionEditor.card} user={user} onClose={() => setSessionEditor(null)} />)}
  </section>
}