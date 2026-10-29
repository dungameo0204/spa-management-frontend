import MobileSelect from './MobileSelect'
import DebtAmount from './DebtAmount'
import CustomerDebtSummary from './CustomerDebtSummary'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { executeTreatment, getCustomerOverview, listResource } from '../api/resources'
import { dateOnly, formatCurrency, formatSpaDate, today } from '../utils/format'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import RoleStaffPicker from './RoleStaffPicker'
import DetailNote from './DetailNote'

export default function CustomerOverview({ customerId, overview, onOverview }) {
  const { user } = useAuth(), { branchId } = useBranch(), manager = user.system_role === 'MANAGER', qc = useQueryClient()
  const [expanded, setExpanded] = useState(null), [active, setActive] = useState(null), [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  const branches = useQuery({ queryKey: ['branches', 'customer-overview'], queryFn: () => listResource('branches', {}, 1, 100), enabled: manager })
  const execution = useMutation({ mutationFn: executeTreatment, onSuccess: async () => { setActive(null); setMessageType('success'); setMessage('Đã ghi nhận một buổi thực hiện.'); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); try { onOverview(await getCustomerOverview(customerId)) } catch (error) { setMessageType('error'); setMessage(`Đã ghi nhận buổi; không tải lại được hồ sơ: ${error.message}. Không xác nhận lại.`) } }, onError: error => { setMessageType('error'); setMessage(`Chưa xác nhận được trạng thái buổi: ${error.message}. Kiểm tra lịch sử trước khi thử lại.`) } })
  if (!overview) return <p>Đang tải lịch sử khách hàng...</p>
  const { customer, timeline = [] } = overview
  return <section className="customer-overview">
    <div className="customer-identity"><strong>{customer.fullname}</strong><span>{customer.phone_number}</span><span>{customer.address || 'Chưa có địa chỉ'}</span><span>Ví: {formatCurrency(customer.wallet_balance)}</span><span>Nợ: <DebtAmount value={customer.total_debt} /></span></div>
    <CustomerDebtSummary customer={customer} />
    <DetailNote note={customer.note} />
    {message && <p role={messageType === 'error' ? 'alert' : 'status'} className={messageType === 'error' ? 'form-alert' : 'success-alert'}>{message}</p>}
    <h3>Lịch sử mua và chăm sóc</h3>
    {!timeline.length && <p className="small-muted">Khách chưa có giao dịch hoặc liệu trình.</p>}
    {timeline.map((entry, index) => {
      const purchase = entry.type === 'purchase' ? entry.item : null
      const treatment = purchase?.treatment || (entry.type === 'treatment' ? entry.treatment : null)
      const todayExecutions = treatment?.histories?.filter(history => dateOnly(history.execution_date) === today()).length || 0
      const selectedForToday = active?.id === treatment?.id
      if (!purchase && !treatment) return null
      return <div className="timeline-row" key={`${entry.type}-${purchase?.invoice_item_id || treatment.id}-${index}`}><time>{formatSpaDate(entry.date)}</time><div className="timeline-main">
        {purchase && <><strong>{purchase.product_name}</strong><small>Hóa đơn #{purchase.invoice_id} · {Number(purchase.is_product) ? 'Sản phẩm' : 'Dịch vụ'} · {purchase.quantity} × {formatCurrency(purchase.unit_price)} · Thành tiền {formatCurrency(purchase.final_price)}</small></>}
        {treatment && <>
          <div className="treatment-control-bar"><div className="treatment-control-info"><button type="button" className="text-action" onClick={() => setExpanded(expanded === treatment.id ? null : treatment.id)}>{!purchase && <><strong>{treatment.product_name}</strong> · </>}còn {treatment.remaining_sessions}/{treatment.total_sessions} buổi · Xem lịch sử</button>{todayExecutions > 0 && <span className="today-execution-badge">Đã thực hiện {todayExecutions} buổi hôm nay</span>}</div>{Number(treatment.remaining_sessions) > 0 && <label className={`choice-row ${selectedForToday ? 'is-selected' : ''}`}><input type="checkbox" checked={selectedForToday} onChange={event => { setActive(event.target.checked ? { id: treatment.id, staffs: [], branch: branchId || treatment.branch_id || '' } : null); setMessage('') }} />{selectedForToday ? 'Đang chọn ghi nhận hôm nay' : 'Làm hôm nay'}</label>}</div>
          {selectedForToday && <div className="today-selection-notice" role="status">Đang chuẩn bị ghi nhận thêm 1 buổi hôm nay. Kiểm tra lại lịch sử trước khi xác nhận.</div>}
          {selectedForToday && <div className="treatment-actions customer-inline-actions">{manager && <label className="field">Cơ sở thực hiện<MobileSelect value={active.branch} onChange={event => setActive({ ...active, branch: event.target.value, staffs: [] })}><option value="">Chọn cơ sở</option>{branches.data?.data?.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</MobileSelect></label>}<RoleStaffPicker selected={active.staffs} onChange={staffs => setActive({ ...active, staffs })} branchId={manager && !active.branch ? 'required' : active.branch} /><button className="btn primary" type="button" disabled={execution.isPending || (manager && !active.branch)} onClick={() => execution.mutate({ treatment_id: treatment.id, ...(manager ? { branch_id: Number(active.branch) } : {}), staffs: active.staffs })}>Xác nhận hôm nay</button></div>}
          {expanded === treatment.id && <div className="treatment-history">{treatment.histories?.length ? treatment.histories.map(history => <p key={history.id}>{formatSpaDate(history.execution_date)} · Cơ sở thực hiện: {history.branch_name || (history.branch_id != null ? `Cơ sở #${history.branch_id}` : 'Chưa rõ cơ sở')} · {history.staffs?.map(person => person.staff_name).join(', ') || 'Chưa gán nhân viên'}</p>) : <p>Chưa thực hiện buổi nào.</p>}</div>}
        </>}
      </div></div>
    })}
  </section>
}
