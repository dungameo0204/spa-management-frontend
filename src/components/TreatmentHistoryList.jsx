import { formatSpaDate } from '../utils/format'
import { canUndoTreatmentExecution } from '../auth/permissions'

export default function TreatmentHistoryList({ histories, branches, user, onAssign, onUndo, onFollowUp }) {
  if (!histories?.length) return <p className="muted">Chưa thực hiện buổi nào.</p>

  return <div className="treatment-history-compact-list">
    {histories.map(history => {
      const branch = branches?.find(item => Number(item.id) === Number(history.branch_id))
      const branchName = history.branch_name || branch?.name || (history.branch_id != null && Number(history.branch_id) === Number(user.branch_id) ? user.branch_name : null) || (history.branch_id != null ? `CS ${history.branch_id}` : 'Chưa rõ cơ sở')
      const canEdit = user.system_role === 'MANAGER' || (history.branch_id != null && Number(history.branch_id) === Number(user.branch_id))
      const isSigned = Boolean(history.customer_signature_svg || history.customer_signed_at)
      return <div key={history.id} className="treatment-history-compact-item">
        <div className="treatment-history-compact-top">
          <div className="treatment-history-meta">
            <strong>{formatSpaDate(history.execution_date)} · {branchName}</strong>
            <span className={`treatment-signature-badge ${isSigned ? 'is-signed' : 'is-unsigned'}`}>
              {isSigned ? '✓ Đã ký' : 'Chưa có chữ ký'}
            </span>
          </div>
          <div className="treatment-history-actions">
            {onFollowUp && <button type="button" className="session-followup-button compact" onClick={() => onFollowUp(history)}>Ghi chú / Ký</button>}
            {canEdit && onAssign && <button type="button" className="btn secondary compact" onClick={() => onAssign(history)}>Gán nhân viên</button>}
            {canEdit && onUndo && canUndoTreatmentExecution(user, history) && <button type="button" className="btn danger compact" onClick={() => onUndo(history.id)}>Hoàn tác</button>}
          </div>
        </div>
        <div className="treatment-history-compact-bottom">
          <span className="treatment-history-staff">{history.staffs?.length ? history.staffs.map(staff => staff.staff_name).join(', ') : 'Chưa gán nhân viên'}</span>
          {history.note && <span className="treatment-history-note-inline">· Ghi chú: {history.note}</span>}
        </div>
        {history.customer_signature_svg && <img className="treatment-history-signature compact" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(history.customer_signature_svg)}`} alt="Chữ ký khách hàng xác nhận buổi thực hiện" />}
      </div>
    })}
  </div>
}
