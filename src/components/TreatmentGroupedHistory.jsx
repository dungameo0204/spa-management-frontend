import { useState } from 'react'
import { formatSpaDate } from '../utils/format'
import { treatmentHistoryGroups } from '../utils/todayTreatments'
import { canUndoTreatmentExecution } from '../auth/permissions'
import TreatmentGroupSessionDialog from './TreatmentGroupSessionDialog'

export default function TreatmentGroupedHistory({ card, user, branches, onAssign, onUndo, onUpdated }) {
  const [sessionGroup, setSessionGroup] = useState(null), groups = treatmentHistoryGroups(card)
  if (!groups.length) return <p className="small-muted">Chưa thực hiện buổi nào.</p>
  return <div className="treatment-grouped-history">{groups.map(group => {
    const branch = group.branch_name || branches?.find(item => Number(item.id) === Number(group.branch_id))?.name || (Number(group.branch_id) === Number(user.branch_id) ? user.branch_name : null) || (group.branch_id != null ? `CS ${group.branch_id}` : 'Chưa rõ cơ sở')
    const groupNote = group.history?.note
    return <section className="treatment-history-day" key={group.key} data-history-id={group.historyId}><div className="treatment-history-day-heading"><strong>{formatSpaDate(group.day)} · {branch}</strong><button type="button" className="session-followup-button compact" onClick={() => setSessionGroup(group)}>Ghi chú</button></div>{groupNote && <p className="session-note">Ghi chú: {groupNote}</p>}<div className="treatment-history-services">{group.sessions.map(entry => {
      const canEdit = user.system_role === 'MANAGER' || (entry.history.branch_id != null && Number(entry.history.branch_id) === Number(user.branch_id)), names = entry.history.staffs?.map(staff => staff.staff_name).join(', ')
      return <div className="treatment-history-service-row" key={entry.history.id}><span className="treatment-history-service-name">{entry.card.product_name}</span><div className="treatment-history-service-meta">{onAssign && canEdit ? <button type="button" className="treatment-history-staff-btn" onClick={() => onAssign(entry.history)}><span className="treatment-history-staff-label">{names || 'Chưa gán nhân viên'}</span><span className="treatment-history-staff-edit">Gán lại</span></button> : <span className="treatment-history-staff-static">{names || 'Chưa gán nhân viên'}</span>}{onUndo && canUndoTreatmentExecution(user, entry.history) && <button type="button" className="btn danger compact treatment-history-undo-btn" onClick={() => onUndo(entry.history.id)}>Hoàn tác</button>}</div></div>
    })}</div></section>
  })}{sessionGroup && <TreatmentGroupSessionDialog card={card} history={sessionGroup.history} user={user} onClose={async () => { setSessionGroup(null); await onUpdated?.() }} />}</div>
}