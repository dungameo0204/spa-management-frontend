import MobileSelect from './MobileSelect'
import DebtAmount from './DebtAmount'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { executeTreatment, getCustomerOverview, listResource } from '../api/resources'
import { dateOnly, formatCurrency, formatSpaDate, today } from '../utils/format'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import RoleStaffPicker from './RoleStaffPicker'
import CustomerProfile from './CustomerProfile'
import SkinImageAlbum from './SkinImageAlbum'
import SignaturePad from './SignaturePad'
import ConfirmDialog from './ConfirmDialog'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import './CustomerOverview.css'

export default function CustomerOverview({ customerId, overview, onOverview }) {
  const { user } = useAuth(), { branchId } = useBranch(), manager = user.system_role === 'MANAGER', qc = useQueryClient()
  const [expanded, setExpanded] = useState(null), [active, setActive] = useState(null), [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  const [confirmUnsigned, setConfirmUnsigned] = useState(false)
  const [sessionEditor, setSessionEditor] = useState(null)
  const branches = useQuery({ queryKey: ['branches', 'customer-overview'], queryFn: () => listResource('branches', {}, 1, 100), enabled: manager })
  const execution = useMutation({ mutationFn: executeTreatment, onSuccess: async () => { setActive(null); setMessageType('success'); setMessage('Đã ghi nhận một buổi thực hiện.'); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); try { onOverview(await getCustomerOverview(customerId)) } catch (error) { setMessageType('error'); setMessage(`Đã ghi nhận buổi; không tải lại được hồ sơ: ${error.message}. Không xác nhận lại.`) } }, onError: error => { setMessageType('error'); setMessage(`Chưa xác nhận được trạng thái buổi: ${error.message}. Kiểm tra lịch sử trước khi thử lại.`) } })
  const submitExecution = (allowUnsigned = false) => {
    if (!active || execution.isPending || (manager && !active.branch)) return
    if (new TextEncoder().encode(active.note || '').length > 65535) {
      setMessageType('error'); setMessage('Ghi chú buổi thực hiện tối đa 65535 byte UTF-8.'); return
    }
    if (!active.signature && !allowUnsigned) { setConfirmUnsigned(true); return }
    setConfirmUnsigned(false)
    setMessage('')
    execution.mutate({ treatment_id: active.id, ...(manager ? { branch_id: Number(active.branch) } : {}), staffs: active.staffs, ...(active.note?.trim() ? { note: active.note.trim() } : {}), ...(active.signature ? { customer_signature_svg: active.signature } : {}) })
  }
  if (!overview) return <p>Đang tải lịch sử khách hàng...</p>
  const { customer, timeline = [] } = overview
  return <section className="customer-overview">
    <div className="customer-identity"><strong>{customer.fullname}</strong><span>{customer.phone_number}</span><span>{customer.address || 'Chưa có địa chỉ'}</span><span>Ví: {formatCurrency(customer.wallet_balance)}</span><span>Nợ: <DebtAmount value={customer.total_debt} /></span></div>
    <div className="customer-overview-columns"><div className="customer-timeline customer-panel">
    {message && <p role={messageType === 'error' ? 'alert' : 'status'} className={messageType === 'error' ? 'form-alert' : 'success-alert'}>{message}</p>}
    <h3>Lịch sử mua và chăm sóc</h3>
    {!timeline.length && <p className="small-muted">Khách chưa có giao dịch hoặc liệu trình.</p>}
    {timeline.map((entry, index) => {
      const purchase = entry.type === 'purchase' ? entry.item : null
      const treatment = purchase?.treatment || (entry.type === 'treatment' ? entry.treatment : null)
      const todayExecutions = treatment?.histories?.filter(history => dateOnly(history.execution_date) === today()).length || 0
      const selectedForToday = active?.id === treatment?.id
      if (!purchase && !treatment) return null
       return <div className="timeline-row" key={`${entry.type}-${purchase?.invoice_item_id || treatment.id}-${index}`}><time>{formatSpaDate(entry.date)}</time><div className={`timeline-main timeline-purchase-card ${purchase && Number(purchase.is_product) ? 'is-product' : 'is-service'} ${treatment && Number(treatment.remaining_sessions) <= 0 ? 'is-completed' : ''}`}>
        <span className="timeline-kind">{purchase && Number(purchase.is_product) ? 'Sản phẩm đã mua' : 'Dịch vụ đã mua'}</span>
        {purchase && <><strong>{purchase.product_name}</strong><small>Hóa đơn #{purchase.invoice_id} · {purchase.quantity} × {formatCurrency(purchase.unit_price)}</small><div className="timeline-purchase-total"><span>Thành tiền</span><strong>{formatCurrency(purchase.final_price)}</strong></div></>}
         {treatment && <>
          <div className="treatment-control-bar"><div className="treatment-control-info">{!purchase && <strong className="timeline-service-name">{treatment.product_name}</strong>}<div className="timeline-treatment-meta"><span>còn {treatment.remaining_sessions}/{treatment.total_sessions} buổi</span><span aria-hidden="true">·</span><button type="button" className="timeline-history-link" aria-expanded={expanded === treatment.id} onClick={() => setExpanded(expanded === treatment.id ? null : treatment.id)}>{expanded === treatment.id ? 'Ẩn lịch sử' : 'Xem lịch sử'}</button></div>{todayExecutions > 0 && <span className="today-execution-badge">Đã thực hiện {todayExecutions} buổi hôm nay</span>}</div>{Number(treatment.remaining_sessions) > 0 && <label className={`choice-row ${selectedForToday ? 'is-selected' : ''}`}><input type="checkbox" disabled={execution.isPending} checked={selectedForToday} onChange={event => { setActive(event.target.checked ? { id: treatment.id, staffs: [], branch: branchId || treatment.branch_id || '' } : null); setMessage('') }} />{selectedForToday ? 'Đang chọn ghi nhận hôm nay' : 'Làm hôm nay'}</label>}</div>
          {selectedForToday && <div className="today-selection-notice" role="status">Đang chuẩn bị ghi nhận thêm 1 buổi hôm nay. Kiểm tra lại lịch sử trước khi xác nhận.</div>}
           {selectedForToday && <div className="treatment-actions customer-inline-actions">
             <fieldset className="customer-session-fields" disabled={execution.isPending}>
               <div className="customer-session-staff">{manager && <label className="field">Cơ sở thực hiện<MobileSelect value={active.branch} onChange={event => setActive({ ...active, branch: event.target.value, staffs: [] })}><option value="">Chọn cơ sở</option>{branches.data?.data?.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</MobileSelect></label>}<RoleStaffPicker selected={active.staffs} onChange={staffs => setActive({ ...active, staffs })} branchId={manager && !active.branch ? 'required' : active.branch} /></div>
               <div className="customer-session-metadata"><label className="field session-note-field"><span className="session-note-heading"><span>Ghi chú buổi thực hiện</span><span className="session-note-optional">Không bắt buộc</span></span><textarea rows={3} placeholder="Tình trạng da, cảm nhận hoặc lưu ý cho buổi sau…" value={active.note || ''} onChange={event => setActive({ ...active, note: event.target.value })} /></label><SignaturePad key={active.id} disabled={execution.isPending} onChange={signature => setActive(current => current ? { ...current, signature } : current)} /></div>
             </fieldset>
             <button className="btn primary" type="button" disabled={execution.isPending || (manager && !active.branch)} onClick={() => submitExecution()}>{execution.isPending ? 'Đang ghi nhận...' : 'Xác nhận hôm nay'}</button>
           </div>}
           {expanded === treatment.id && <div className="treatment-history">{treatment.histories?.length ? treatment.histories.map(history => <div key={history.id} className="customer-session-history"><p>{formatSpaDate(history.execution_date)} · Cơ sở thực hiện: {history.branch_name || (history.branch_id != null ? `Cơ sở #${history.branch_id}` : 'Chưa rõ cơ sở')} · {history.staffs?.map(person => person.staff_name).join(', ') || 'Chưa gán nhân viên'}</p>{history.note && <p className="session-note">Ghi chú: {history.note}</p>}{history.customer_signature_svg ? <figure><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(history.customer_signature_svg)}`} alt="Chữ ký khách hàng xác nhận buổi thực hiện" />{history.customer_signed_at && <figcaption>Đã ký: {formatSpaDate(history.customer_signed_at, { timeStyle: 'short' })}</figcaption>}</figure> : <p className="small-muted">{history.customer_signed_at ? 'Đã ký xác nhận' : 'Chưa có chữ ký khách hàng.'}</p>}<button type="button" className="session-followup-button" onClick={() => setSessionEditor({ history, card: { ...treatment, customer_name: customer.fullname } })}>Ghi chú / Chữ ký buổi #{history.id}</button></div>) : <p>Chưa thực hiện buổi nào.</p>}</div>}
        </>}
      </div></div>
    })}
    </div><aside className="customer-profile-column"><CustomerProfile customer={customer} /><SkinImageAlbum key={customerId} customerId={customerId} /></aside></div>
    {confirmUnsigned && <ConfirmDialog title="Ghi nhận buổi chưa có chữ ký?" message="Bạn có chắc chắn muốn ghi nhận buổi mà không có chữ ký khách hàng? Có thể ký bổ sung vào buổi này sau khi ghi nhận." cancelLabel="Quay lại ký" confirmLabel="Ghi nhận không có chữ ký" pending={execution.isPending} onCancel={() => setConfirmUnsigned(false)} onConfirm={() => submitExecution(true)} />}
    {sessionEditor && <TreatmentSessionDialog history={sessionEditor.history} card={sessionEditor.card} user={user} onClose={() => setSessionEditor(null)} onUpdated={async () => onOverview(await getCustomerOverview(customerId))} />}
  </section>
}
