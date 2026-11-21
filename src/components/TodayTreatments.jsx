import { Fragment, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import { canUndoTreatmentExecution } from '../auth/permissions'
import { assignTreatmentStaffs, executeTreatment, getResource, listResource, undoTreatmentExecution, updateGroupedTreatmentExecution } from '../api/resources'
import { dateOnly, formatSpaDate, today } from '../utils/format'
import InvoiceChildStaffPicker from './InvoiceChildStaffPicker'
import ConfirmDialog from './ConfirmDialog'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import RefreshButton from './RefreshButton'
import { canFollowUpTreatmentHistory } from '../auth/permissions'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import { canExecuteCard, todayTreatmentRows, treatmentCards } from '../utils/todayTreatments'
import TreatmentGroupSignature from './TreatmentGroupSignature'
import Pagination from './Pagination'
import './TodayTreatments.css'
import DateInput from './DateInput'

export default function TodayTreatments() {
  const { branchId } = useBranch(), { user } = useAuth(), qc = useQueryClient()
  const manager = user.system_role === 'MANAGER'
  const [viewDate, setViewDate] = useState(today)
  const [sessionEditor, setSessionEditor] = useState(null)
  const [page, setPage] = useState(1), [undo, setUndo] = useState(null)
  const [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
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
    setViewDate(date.toISOString().slice(0, 10)); setPage(1); setUndo(null); setMessage('')
  }
  function selectViewDate(value) {
    if (!value || value > todayDate) return
    setViewDate(value); setPage(1); setUndo(null); setMessage('')
  }
  const mutation = useMutation({
    mutationFn: async ({ card, historyId, assigned = [], branch, execution_date, parentHistory, history, groupChildren }) => {
      if (historyId && Array.isArray(parentHistory?.children)) return updateGroupedTreatmentExecution(parentHistory.id, { treatment_id: parentHistory.treatment_id, children: parentHistory.children.map(child => ({ treatment_id: child.treatment_id, staffs: Number(child.id) === Number(history.id) ? assigned : assigned.length ? [] : child.staffs || [] })) })
      if (historyId) return assignTreatmentStaffs(historyId, assigned)
      if (groupChildren && Array.isArray(parentHistory?.children)) {
        const existingChildren = parentHistory.children
        const childByTreatmentId = new Map(existingChildren.map(child => [Number(child.treatment_id), { treatment_id: child.treatment_id, staffs: child.staffs || [] }]))
        groupChildren.forEach(child => childByTreatmentId.set(Number(child.treatment_id), child))
        return updateGroupedTreatmentExecution(parentHistory.id, { treatment_id: parentHistory.treatment_id, children: [...childByTreatmentId.values()] })
      }
      if (groupChildren) return executeTreatment({ treatment_id: card.id, ...(manager ? { branch_id: Number(branch), execution_date } : {}), children: groupChildren })
      const created = await executeTreatment({ treatment_id: card.id, ...(manager ? { branch_id: Number(branch), execution_date } : {}), staffs: [] })
      if (assigned.length) {
        try { await assignTreatmentStaffs(created.treatmentHistoryId, assigned) }
        catch (error) { throw new Error(`Đã ghi nhận buổi #${created.treatmentHistoryId} nhưng chưa gán được nhân viên: ${error.message}. Mở lại thẻ để gán, không tick lần nữa.`) }
      }
      return created
    },
    onSuccess: async (_data, variables) => { await refreshTable(); setMessageType('success'); setMessage(variables.historyId ? 'Đã cập nhật nhân viên thực hiện.' : 'Đã ghi nhận buổi thực hiện.') },
    onError: async err => { setMessageType('error'); setMessage(err.message); await refreshTable() },
  })
  const undoMutation = useMutation({ mutationFn: target => {
    const id = typeof target === 'object' ? target.childHistory?.id || target.parentHistory?.id || target.id : target
    const history = typeof target === 'object' ? target.parentHistory || target : cardDetails.flatMap(detail => treatmentCards(detail.data || {})).flatMap(card => card.histories || []).find(history => history.id === id)
    if (!canUndoTreatmentExecution(user, history)) throw new Error('Bạn không có quyền hoàn tác buổi thực hiện này.')
    if (target?.childHistory && target.parentHistory?.children?.length > 1) return updateGroupedTreatmentExecution(target.parentHistory.id, { treatment_id: target.parentHistory.treatment_id, children: target.parentHistory.children.filter(item => Number(item.id) !== Number(target.childHistory.id)).map(item => ({ treatment_id: item.treatment_id, staffs: item.staffs || [] })) })
    return undoTreatmentExecution(id)
  }, onSuccess: async () => { await refreshTable(); setUndo(null); setMessageType('success'); setMessage('Đã hoàn tác buổi hôm nay.') }, onError: async err => { await refreshTable(); setUndo(null); setMessageType('error'); setMessage(err.message) } })
  function record(card, parentHistory, child) {
    if (cardDetails.some(detail => detail.isFetching) || detailError) return setMessage('Chưa tải đầy đủ lịch sử thực hiện. Vui lòng tải lại trước khi xác nhận.')
    if (!canExecuteCard(child || card)) return setMessage('Thẻ đã hết buổi hoặc đã đóng.')
    setMessage('')
    mutation.mutate({ card, parentHistory, branch: parentHistory?.branch_id || branchId || card.branch_id, execution_date: parentHistory ? dateOnly(parentHistory.execution_date) : viewDate, groupChildren: child ? [{ treatment_id: child.id, staffs: [] }] : null })
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
            const canUndo = canUndoTreatmentExecution(user, parentHistory || history)
            const signed = Boolean(history?.customer_signature_svg || history?.customer_signed_at)
            const allowed = canFollowUpTreatmentHistory(user, history)
            const suffix = multiple ? ` · Buổi #${history?.id}` : ''
            return <Fragment key={`row-${card.id}-${history?.id || 'new'}-${groupKey || 'standalone'}`}>
              <tr className={child ? 'today-treatment-child' : 'today-treatment-standalone'} data-history-id={history?.id}>
                <td data-label="Khách hàng">{child ? null : card.customer_name}</td>
                <td data-label="Dịch vụ"><span className={child ? 'today-child-service' : undefined}>{card.product_name}</span></td>
                <td data-label="Đã làm hôm nay"><input type="checkbox" aria-label={`Đã làm ${card.customer_name} - ${card.product_name}${suffix}`} checked={Boolean(history)} disabled={(Boolean(history) && !canUndo) || (!history && (!manager && !viewingToday)) || (!history && !canExecuteCard(card)) || mutation.isPending || undoMutation.isPending} onChange={event => history ? (!event.target.checked && canUndo && setUndo(child && parentHistory ? { parentHistory, childHistory: history } : (parentHistory || history).id)) : record(groupRoot || card, parentHistory, groupRoot ? card : null)} /></td>
                <td data-label="Nhân viên thực hiện">
                  {history ? <InvoiceChildStaffPicker name={card.product_name} selected={(history.staffs || []).map(staff => ({ staff_id: Number(staff.staff_id) }))} disabled={Boolean(child && parentHistory?.children?.some(entry => Number(entry.id) !== Number(history.id) && entry.staffs?.length))} onChange={assigned => mutation.mutate({ card, historyId: history.id, assigned, parentHistory, history })} branchId={history.branch_id || parentHistory?.branch_id || branchId || 'required'} className="today-staff-picker" /> : 'Chưa thực hiện'}
                </td>
                <td data-label="Ghi chú">{child ? null : <span className="today-session-note">{history?.note || '—'}</span>}</td>
                <td data-label="Chữ ký khách hàng">
                  {child ? null : history ? <div className="today-session-signatures"><div className="today-signature-preview">{history.customer_signature_svg && <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(history.customer_signature_svg)}`} alt={`Chữ ký buổi #${history.id}`} />}<small>{signed ? 'Đã ký' : 'Chưa ký'}</small></div><button type="button" className="session-followup-button" aria-label={`${allowed ? 'Ghi chú và chữ ký' : 'Xem buổi'} #${history.id} - ${card.customer_name}`} onClick={() => setSessionEditor({ card, history })}><Pencil size={12} aria-hidden="true" />{allowed ? signed ? 'Ghi chú / Xem' : 'Ghi chú / Ký' : 'Xem'}</button></div> : '—'}
                </td>
              </tr>
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