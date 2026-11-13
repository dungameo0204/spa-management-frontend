import { useState } from 'react'
import { formatSpaDate } from '../utils/format'
import { treatmentHistoryGroups } from '../utils/todayTreatments'
import { canUndoTreatmentExecution } from '../auth/permissions'
import TreatmentGroupSessionDialog from './TreatmentGroupSessionDialog'

const isSigned = history => Boolean(history.customer_signature_svg || history.customer_signed_at)

export default function TreatmentGroupedHistory({ card, user, branches, onAssign, onUndo, onUpdated }) {
  const [sessionGroup, setSessionGroup] = useState(null)
  const groups = treatmentHistoryGroups(card)
  if (!groups.length) return <p className="small-muted">Chưa thực hiện buổi nào.</p>
  return <div className="treatment-grouped-history">{groups.map(group => {
    const branch = group.branch_name || branches?.find(item => Number(item.id) === Number(group.branch_id))?.name || (Number(group.branch_id) === Number(user.branch_id) ? user.branch_name : null) || (group.branch_id != null ? `CS ${group.branch_id}` : 'Chưa rõ cơ sở')
    const signed = isSigned(group.history)
    const signatureSvg = group.history.customer_signature_svg
    return <section className="treatment-history-day" key={group.key}>
      <div className="treatment-history-day-heading">
        <strong>{formatSpaDate(group.day)} · {branch}</strong>
        <div className="treatment-history-heading-right">
          {signatureSvg ? (
            <img className="treatment-history-signature-thumb" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(signatureSvg)}`} alt="Chữ ký" title="Chữ ký khách hàng" />
          ) : (
            <span className={`treatment-signature-badge ${signed ? 'is-signed' : 'is-unsigned'}`}>
              {signed ? '✓ Đã ký' : 'Chưa ký'}
            </span>
          )}
          <button type="button" className="session-followup-button compact" onClick={() => setSessionGroup(group)}>Ghi chú / Xem chữ ký</button>
        </div>
      </div>
      {group.history.note && <p className="session-note">Ghi chú: {group.history.note}</p>}
      <div className="treatment-history-services">
        {group.sessions.map(entry => {
          const canEdit = user.system_role === 'MANAGER' || (entry.history.branch_id != null && Number(entry.history.branch_id) === Number(user.branch_id))
          const staffNames = entry.history.staffs?.map(staff => staff.staff_name).join(', ')
          return <div className="treatment-history-service-row" key={entry.history.id}>
            <span className="treatment-history-service-name">{entry.card.product_name}</span>
            <div className="treatment-history-service-meta">
              {onAssign && canEdit ? (
                <button
                  type="button"
                  className="treatment-history-staff-btn"
                  title="Bấm để cấu hình lại nhân viên"
                  onClick={() => onAssign(group.legacy ? entry.history : { ...entry.history, parentHistory: group.history })}
                >
                  <span className="treatment-history-staff-label">{staffNames || 'Chưa gán nhân viên'}</span>
                  <span className="treatment-history-staff-edit">Gán lại</span>
                </button>
              ) : (
                <span className="treatment-history-staff-static">{staffNames || 'Chưa gán nhân viên'}</span>
              )}
              {onUndo && canUndoTreatmentExecution(user, group.history) && (
                <button
                  type="button"
                  className="btn danger compact treatment-history-undo-btn"
                  onClick={() => onUndo(group.legacy ? entry.history.id : { parentHistory: group.history, childHistory: entry.history })}
                >
                  Hoàn tác
                </button>
              )}
            </div>
          </div>
        })}
      </div>
    </section>
  })}{sessionGroup && <TreatmentGroupSessionDialog card={card} history={sessionGroup.history} sessions={sessionGroup.sessions} user={user} onClose={async () => { setSessionGroup(null); await onUpdated?.() }} onUpdated={onUpdated} />}</div>
}

