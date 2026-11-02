import DebtAmount from './DebtAmount'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCustomerOverview, listResource, undoTreatmentExecution } from '../api/resources'
import { formatCurrency, formatSpaDate } from '../utils/format'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import CustomerProfile from './CustomerProfile'
import SkinImageAlbum from './SkinImageAlbum'
import TreatmentCardPanel from './TreatmentCardPanel'
import { isTreatmentComplete } from '../utils/todayTreatments'
import './CustomerOverview.css'

export default function CustomerOverview({ customerId, overview, onOverview }) {
  const { user } = useAuth(), { branchId } = useBranch()
  const [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  const branches = useQuery({ queryKey: ['branches', 'customer-overview'], queryFn: () => listResource('branches', {}, 1, 100).then(r => r ?? { data: [] }) })
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
  </section>
}
