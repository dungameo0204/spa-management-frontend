import { formatSpaDate } from '../utils/format'

export default function TreatmentHistoryList({ histories, branches, user, onAssign, onUndo }) {
  if (!histories?.length) return <p className="muted">Chưa thực hiện buổi nào.</p>

  return histories.map(history => {
    const branch = branches?.find(item => Number(item.id) === Number(history.branch_id))
    const branchName = history.branch_name || branch?.name || (history.branch_id != null && Number(history.branch_id) === Number(user.branch_id) ? user.branch_name : null) || (history.branch_id != null ? `Cơ sở #${history.branch_id}` : 'Chưa rõ cơ sở')
    const canEdit = user.system_role === 'MANAGER' || (history.branch_id != null && Number(history.branch_id) === Number(user.branch_id))
    return <div key={history.id} className="line-item">
      <strong>{formatSpaDate(history.execution_date)} · Cơ sở thực hiện: {branchName}</strong>
      <p>{history.staffs?.map(staff => staff.staff_name).join(', ') || 'Chưa gán nhân viên'}</p>
      {canEdit && <div className="drawer-actions"><button className="btn secondary" onClick={() => onAssign(history)}>Gán nhân viên</button><button className="btn danger" onClick={() => onUndo(history.id)}>Hoàn tác</button></div>}
    </div>
  })
}