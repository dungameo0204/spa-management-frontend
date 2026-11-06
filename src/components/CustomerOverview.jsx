import DebtAmount from './DebtAmount'
import { useState } from 'react'
import { getCustomerOverview, getResource, listResource, undoTreatmentExecution } from '../api/resources'
import { formatCurrency, formatSpaDate } from '../utils/format'
import { useBranch } from './AppShell'
import { useAuth } from '../auth/AuthProvider'
import CustomerProfile from './CustomerProfile'
import SkinImageAlbum from './SkinImageAlbum'
import TreatmentCardPanel from './TreatmentCardPanel'
import CustomerRecordPrint from './CustomerRecordPrint'
import CustomerRecordShare from './CustomerRecordShare'
import { isTreatmentComplete } from '../utils/todayTreatments'
import './CustomerOverview.css'
import { useBranchCatalog, useProductCatalog } from '../hooks/useProductCatalog'

export default function CustomerOverview({ customerId, overview, onOverview }) {
  const { user } = useAuth(), { branchId } = useBranch()
  const [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success'), [printRecord, setPrintRecord] = useState(null), [shareRecord, setShareRecord] = useState(null), [printing, setPrinting] = useState(false), [sharing, setSharing] = useState(false)
  const branches = useBranchCatalog()
  const products = useProductCatalog()
  if (!overview) return <p>Đang tải lịch sử khách hàng...</p>
  const { customer, timeline = [] } = overview
  async function loadCustomerRecord(action) {
    if (printing || sharing) return
    const setBusy = action === 'print' ? setPrinting : setSharing
    setBusy(true)
    try {
      const first = await listResource('treatments', { customerId }, 1, 100)
      const pages = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) => listResource('treatments', { customerId }, index + 2, 100)))
      const cards = [first, ...pages].flatMap(page => page.data || [])
      const details = await Promise.all(cards.map(card => getResource('treatments', card.id)))
      const record = { customer, timeline, treatments: details }
      if (action === 'print') setPrintRecord(record)
      else setShareRecord(record)
    } catch (error) {
      setMessageType('error'); setMessage(`Không thể chuẩn bị hồ sơ ${action === 'print' ? 'in' : 'chia sẻ'}: ${error.message}`)
      setBusy(false)
    } finally {
      if (action === 'print') setBusy(false)
    }
  }
  const printCustomerRecord = () => loadCustomerRecord('print')
  const shareCustomerRecord = () => loadCustomerRecord('share')
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
      const catalogProduct = products.data?.find(product => Number(product.id) === Number(treatment?.product_id || purchase?.product_id))
      const treatmentName = treatment?.product_name?.trim() || catalogProduct?.name?.trim() || 'Dịch vụ không rõ tên'
      const purchaseName = purchase?.product_name?.trim() || treatmentName
       return <div className="timeline-row" key={`${entry.type}-${purchase?.invoice_item_id || treatment.id}-${index}`}><time>{formatSpaDate(entry.date)}</time><div className={`timeline-main timeline-purchase-card ${purchase && Number(purchase.is_product) ? 'is-product' : 'is-service'} ${treatment && isTreatmentComplete(treatment) ? 'is-completed' : ''}`}>
        <span className="timeline-kind">{purchase && Number(purchase.is_product) ? 'Sản phẩm đã mua' : 'Dịch vụ đã mua'}</span>
        {purchase && <><strong>{purchaseName}</strong><small>Hóa đơn #{purchase.invoice_id} · {purchase.quantity} × {formatCurrency(purchase.unit_price)}</small><div className="timeline-purchase-total"><span>Thành tiền</span><strong>{formatCurrency(purchase.final_price)}</strong></div></>}
        {!purchase && treatment && <strong className="timeline-service-name">{treatmentName}</strong>}
        {treatment && <TreatmentCardPanel
          card={{ ...treatment, product_name: treatmentName, customer_name: customer.fullname }}
          branchId={branchId || user.branch_id}
          branches={branches.data}
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
    </div><aside className="customer-profile-column"><CustomerProfile customer={customer} onPrint={printCustomerRecord} onShare={shareCustomerRecord} printing={printing} sharing={sharing} /><SkinImageAlbum key={customerId} customerId={customerId} /></aside></div><CustomerRecordPrint record={printRecord} onDone={() => setPrintRecord(null)} /><CustomerRecordShare record={shareRecord} onDone={() => { setShareRecord(null); setSharing(false) }} onMessage={(text, type) => { setMessage(text); setMessageType(type) }} />
  </section>
}
