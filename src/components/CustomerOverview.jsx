import MobileSelect from './MobileSelect'
import DebtAmount from './DebtAmount'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { executeTreatment, getCustomerOverview, listResource, undoTreatmentExecution } from '../api/resources'
import { dateOnly, formatCurrency, formatSpaDate, today } from '../utils/format'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import RoleStaffPicker from './RoleStaffPicker'
import CustomerProfile from './CustomerProfile'
import SkinImageAlbum from './SkinImageAlbum'
import SignaturePad from './SignaturePad'
import ConfirmDialog from './ConfirmDialog'
import TreatmentSessionDialog from './TreatmentSessionDialog'
import TreatmentCardPanel from './TreatmentCardPanel'
import { canExecuteCard, isTreatmentComplete } from '../utils/todayTreatments'
import './CustomerOverview.css'

export default function CustomerOverview({ customerId, overview, onOverview }) {
  const { user } = useAuth(), { branchId } = useBranch(), manager = user.system_role === 'MANAGER', qc = useQueryClient()
  const [expanded, setExpanded] = useState(null), [active, setActive] = useState(null), [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  const [confirmUnsigned, setConfirmUnsigned] = useState(false)
  const [sessionEditor, setSessionEditor] = useState(null)
  const branches = useQuery({ queryKey: ['branches', 'customer-overview'], queryFn: () => listResource('branches', {}, 1, 100).then(r => r ?? { data: [] }) })
  const execution = useMutation({ mutationFn: executeTreatment, onSuccess: async () => { setActive(null); setMessageType('success'); setMessage('Đã ghi nhận một buổi thực hiện.'); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); try { onOverview(await getCustomerOverview(customerId)) } catch (error) { setMessageType('error'); setMessage(`Đã ghi nhận buổi; không tải lại được hồ sơ: ${error.message}. Không xác nhận lại.`) } }, onError: error => { setMessageType('error'); setMessage(`Chưa xác nhận được trạng thái buổi: ${error.message}. Kiểm tra lịch sử trước khi thử lại.`) } })
  const submitExecution = (allowUnsigned = false) => {
    if (!active || execution.isPending || (manager && !active.branch)) return
    if (new TextEncoder().encode(active.note || '').length > 65535) {
      setMessageType('error'); setMessage('Ghi chú buổi thực hiện tối đa 65535 byte UTF-8.'); return
    }
    if (!active.signature && !allowUnsigned) { setConfirmUnsigned(true); return }
    setConfirmUnsigned(false)
    setMessage('')
    execution.mutate({
      treatment_id: active.id,
      ...(manager ? { branch_id: Number(active.branch) } : {}),
      ...(manager && active.execution_date ? { execution_date: active.execution_date } : {}),
      staffs: active.staffs,
      ...(active.note?.trim() ? { note: active.note.trim() } : {}),
      ...(active.signature ? { customer_signature_svg: active.signature } : {})
    })
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
       return <div className="timeline-row" key={`${entry.type}-${purchase?.invoice_item_id || treatment.id}-${index}`}><time>{formatSpaDate(entry.date)}</time><div className={`timeline-main timeline-purchase-card ${purchase && Number(purchase.is_product) ? 'is-product' : 'is-service'} ${treatment && isTreatmentComplete(treatment) ? 'is-completed' : ''}`}>
        <span className="timeline-kind">{purchase && Number(purchase.is_product) ? 'Sản phẩm đã mua' : 'Dịch vụ đã mua'}</span>
        {purchase && <><strong>{purchase.product_name}</strong><small>Hóa đơn #{purchase.invoice_id} · {purchase.quantity} × {formatCurrency(purchase.unit_price)}</small><div className="timeline-purchase-total"><span>Thành tiền</span><strong>{formatCurrency(purchase.final_price)}</strong></div></>}
        {treatment && <TreatmentCardPanel
          card={{ ...treatment, customer_name: customer.fullname }}
          branchId={branchId || user.branch_id}
          branches={branches.data?.data}
          embedded
          onUpdated={async () => {
            onOverview(await getCustomerOverview(customerId));
            setMessage('Đã ghi nhận buổi thực hiện thành công.');
            setMessageType('success');
          }}
          onUndo={async id => {
            try {
              await undoTreatmentExecution(id);
              onOverview(await getCustomerOverview(customerId));
            } catch (error) {
              setMessageType('error');
              setMessage(error.message);
            }
          }}
        />}
      </div></div>
    })}
    </div><aside className="customer-profile-column"><CustomerProfile customer={customer} /><SkinImageAlbum key={customerId} customerId={customerId} /></aside></div>
    {confirmUnsigned && <ConfirmDialog title="Ghi nhận buổi chưa có chữ ký?" message="Bạn có chắc chắn muốn ghi nhận buổi mà không có chữ ký khách hàng? Có thể ký bổ sung vào buổi này sau khi ghi nhận." cancelLabel="Quay lại ký" confirmLabel="Ghi nhận không có chữ ký" pending={execution.isPending} onCancel={() => setConfirmUnsigned(false)} onConfirm={() => submitExecution(true)} />}
    {sessionEditor && <TreatmentSessionDialog history={sessionEditor.history} card={sessionEditor.card} user={user} onClose={() => setSessionEditor(null)} onUpdated={async () => onOverview(await getCustomerOverview(customerId))} />}
  </section>
}
