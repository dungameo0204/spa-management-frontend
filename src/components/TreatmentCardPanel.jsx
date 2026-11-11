import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getResource } from '../api/resources'
import { useAuth } from '../auth/AuthProvider'
import { canExecuteCard, canCloseTreatment, isTreatmentComplete, treatmentCards, treatmentHistoryGroups } from '../utils/todayTreatments'
import { dateOnly, formatSpaDate, today } from '../utils/format'
import TreatmentExecution from './TreatmentExecution'
import TreatmentCloseDialog from './TreatmentCloseDialog'
import TreatmentGroupedHistory from './TreatmentGroupedHistory'
import TreatmentHistoryList from './TreatmentHistoryList'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import './TreatmentCardPanel.css'
import { useBranchCatalog } from '../hooks/useProductCatalog'

export function sessionBaseLabel(card) {
  return card.closed_at ? 'Đã ký kết thúc' : card.remaining_sessions === null ? 'Trọn đời' : `${card.remaining_sessions ?? '—'}/${card.total_sessions ?? '—'} buổi`
}

export function sessionLabel(card) {
  return card.closed_at ? 'Đã ký kết thúc' : card.remaining_sessions === null ? 'Trọn đời' : `${card.remaining_sessions ?? '—'}/${card.total_sessions ?? '—'} buổi${card.remaining_sessions != null && Number(card.remaining_sessions) === 0 ? ' · Đã hoàn thành' : ''}`
}

export default function TreatmentCardPanel({ card, branchId, showHistory = false, branches, onAssign, onUndo, onUpdated, onOpen, embedded = false, executionFilters }) {
  const { user } = useAuth(), qc = useQueryClient()
  const [historyOpen, setHistoryOpen] = useState(showHistory), [executing, setExecuting] = useState(false), [closing, setClosing] = useState(false), [session, setSession] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const detail = useQuery({ queryKey: ['treatments', 'card-detail', card.id, executionFilters], queryFn: () => getResource('treatments', card.id, executionFilters), enabled: !embedded })
  const branchesQuery = useBranchCatalog({ enabled: !branches })
  const current = embedded ? card : { ...card, ...detail.data }, grouped = Boolean(current.children?.length)
  const cards = treatmentCards(current)
  const activeChildren = current.children?.filter(c => !c.closed_at && (c.remaining_sessions === null || Number(c.remaining_sessions) > 0)) || []
  const childCount = activeChildren.length > 0 ? activeChildren.length : (current.children?.length || 0)
  const isComplete = isTreatmentComplete(current)
  const canExecuteThisCard = !current.closed_at && cards.some(canExecuteCard)
  const histories = cards.flatMap(item => item.histories || []).filter(history => !history.deleted_at)
  const visitGroups = grouped ? treatmentHistoryGroups(current) : histories.map(history => ({ day: dateOnly(history.execution_date) }))
  const visitCount = visitGroups.length
  const todayExecutions = visitGroups.filter(group => group.day === today()).length
  const branchList = Array.isArray(branches) ? branches : (branches?.data || branchesQuery.data || [])

  async function refresh(updated) {
    if (updated) qc.setQueryData(['treatments', 'card-detail', card.id, executionFilters], updated)
    else if (!embedded) await detail.refetch()
    await onUpdated?.(updated)
  }

  return <article className={`treatment-card-item treatment-root-panel ${grouped ? 'is-grouped-treatment' : 'is-single-treatment'}`}>
    <div className="treatment-card-heading treatment-parent-heading">
      <div className="treatment-parent-heading-left">
        <button
          type="button"
          className={`text-action treatment-parent-title${canExecuteThisCard ? '' : ' is-disabled'}`}
          disabled={!canExecuteThisCard}
          onClick={() => canExecuteThisCard && setExecuting(!executing)}
        >
          <strong>{current.product_name}</strong> <span className="small-muted">{grouped ? `· ${childCount} liệu trình con` : `· ${sessionBaseLabel(current)}`}</span>
        </button>
      </div>
      <div className="treatment-completion-column">{isComplete && <span className="small-muted treatment-completed-badge">{current.closed_at ? 'Đã ký kết thúc' : 'Đã hoàn thành'}</span>}</div>
      <div className="treatment-today-column">
        {todayExecutions > 0 && <span className="today-execution-badge">Đã thực hiện {todayExecutions} buổi hôm nay</span>}
        {executionFilters && Number(current.matching_execution_count) > 0 && <span className="treatment-execution-range-badge">{current.matching_execution_count} buổi trong khoảng lọc{current.latest_matching_execution_date ? ` · gần nhất ${formatSpaDate(current.latest_matching_execution_date)}` : ''}</span>}
      </div>
      <div className={`treatment-parent-actions is-drawer-actions${user?.system_role === 'MANAGER' ? ' is-manager-actions' : ' is-staff-actions'}`}>
        <button type="button" className="text-action treatment-history-toggle" aria-label={historyOpen ? 'Ẩn lịch sử' : 'Xem lịch sử'} aria-expanded={historyOpen} onClick={() => onOpen ? onOpen(current) : setHistoryOpen(!historyOpen)}>
          <span className="treatment-history-label-full">{historyOpen ? 'Ẩn lịch sử' : 'Xem lịch sử'}</span>
          <span className="treatment-history-label-compact" aria-hidden="true">Lịch sử</span>
        </button>
        {canExecuteThisCard ? (
          <button className="btn secondary treatment-action-execute" disabled={!embedded && !detail.isSuccess} onClick={() => setExecuting(!executing)}>
            {'Thực hiện'}{!executing && selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </button>
        ) : null}
        {canCloseTreatment(current) && !current.parent_treatment_id && ['MANAGER', 'STAFF'].includes(user.system_role) ? (
          <button className="text-action treatment-close-action" aria-label="Kết thúc liệu trình" disabled={!embedded && !detail.isSuccess} onClick={() => setClosing(true)}>
            Kết thúc liệu trình
          </button>
        ) : null}
      </div>
    </div>
    {detail.isError && <p role="alert">{detail.error.message} <button className="text-action" onClick={() => detail.refetch()}>Thử lại</button></p>}
    {executing && canExecuteThisCard && <TreatmentExecution key={current.id} card={current} user={user} branchId={branchId} initialSelectedIds={selectedIds} onUpdated={() => { setSelectedIds([]); setExecuting(false); return refresh() }} onCancel={() => setExecuting(false)} />}
    {historyOpen && <div className="treatment-history">
      <div className="treatment-history-header">
        <h4>Lịch sử thực hiện <span className="treatment-history-visit-count">{visitCount > 0 ? `· Đã đến làm ${visitCount} lần` : '· Chưa đến làm lần nào'}</span></h4>
      </div>
      {grouped ? <TreatmentGroupedHistory card={current} user={user} branches={branchList} onAssign={onAssign} onUndo={onUndo} onUpdated={() => refresh()} /> : <TreatmentHistoryList histories={current.histories} branches={branchList} user={user} onAssign={onAssign} onUndo={onUndo} onFollowUp={history => setSession({ history, card: current })} />}
      {current.closed_at && <details className="treatment-closure"><summary>Đã kết thúc: {formatSpaDate(current.closed_at, { timeStyle: 'short' })}</summary>{current.closure_note && <p>Ghi chú kết thúc: {current.closure_note}</p>}</details>}
    </div>}
    {closing && <TreatmentCloseDialog card={current} onClose={() => setClosing(false)} onUpdated={refresh} />}
    {session && <TreatmentSessionDialog {...session} user={user} onClose={() => setSession(null)} onUpdated={() => refresh()} />}
  </article>
}
