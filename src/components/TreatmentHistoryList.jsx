import { formatSpaDate } from '../utils/format'
import { canUndoTreatmentExecution } from '../auth/permissions'

export default function TreatmentHistoryList({ histories, branches, user, onAssign, onUndo, onFollowUp }) {
  if (!histories?.length) return <p className="muted">Chưa thực hiện buổi nào.</p>

  return histories.map(history => {
    const branch = branches?.find(item => Number(item.id) === Number(history.branch_id))
    const branchName = history.branch_name || branch?.name || (history.branch_id != null && Number(history.branch_id) === Number(user.branch_id) ? user.branch_name : null) || (history.branch_id != null ? `Cơ sở #${history.branch_id}` : 'Chưa rõ cơ sở')
    const canEdit = user.system_role === 'MANAGER' || (history.branch_id != null && Number(history.branch_id) === Number(user.branch_id))
    return <div key={history.id} className="line-item">
      <strong>{formatSpaDate(history.execution_date)} · Cơ sở thực hiện: {branchName}</strong>
      <p>{history.staffs?.map(staff => staff.staff_name).join(', ') || 'Chưa gán nhân viên'}</p>
      {history.note && <p className="session-note">Ghi chú: {history.note}</p>}
      {history.customer_signature_svg && <img className="treatment-history-signature" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(history.customer_signature_svg)}`} alt="Chữ ký khách hàng xác nhận buổi thực hiện" />}
      <p className="small-muted">{history.customer_signed_at ? `Đã ký: ${formatSpaDate(history.customer_signed_at, { timeStyle: 'short' })}` : history.customer_signature_svg ? 'Đã ký' : 'Chưa có chữ ký khách hàng'}</p>
      {onFollowUp && <button className="session-followup-button" onClick={() => onFollowUp(history)}>Ghi chú / Chữ ký buổi #{history.id}</button>}
      {canEdit && <div className="drawer-actions">{onAssign && <button className="btn secondary" onClick={() => onAssign(history)}>Gán nhân viên</button>}{onUndo && canUndoTreatmentExecution(user, history) && <button className="btn danger" onClick={() => onUndo(history.id)}>Hoàn tác</button>}</div>}
    </div>
  })
}