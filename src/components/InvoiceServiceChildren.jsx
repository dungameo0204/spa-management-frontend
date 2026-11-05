import InvoiceChildStaffPicker from './InvoiceChildStaffPicker'
import './InvoiceServiceChildren.css'

export default function InvoiceServiceChildren({ children, queries, onChange, branchId, editing = false }) {
  if (!children?.length) return null
  return <section className="invoice-service-children" aria-label="Số buổi dịch vụ con">
    <h4 className="invoice-children-heading">Dịch vụ đi kèm</h4>
    <ol>{children.map((child, index) => {
      const query = queries.find(entry => Number(entry.data?.id) === child.product_id)
      const name = child.product_name || query?.data?.name || `Dịch vụ #${child.product_id}`
      function change(patch) { onChange(children.map((entry, n) => n === index ? { ...entry, ...patch } : entry)) }
      return <li key={child.product_id}>
        <span className="invoice-child-name" title={name}>↳ {name}</span>
        <label className="invoice-child-lifetime"><input type="checkbox" aria-label={`Không giới hạn ${name}`} checked={child.total_sessions === null} onChange={event => change({ total_sessions: event.target.checked ? null : 1 })} />Không giới hạn</label>
        {child.total_sessions !== null ? <input className="invoice-child-count" aria-label={`Số buổi ${name}`} title="Số buổi" required type="number" min="0" max="2147483647" step="1" value={child.total_sessions} onChange={event => { const val = event.target.value; change({ total_sessions: val, ...(val === '0' || Number(val) === 0 ? { performNow: false } : {}) }) }} /> : <span className="invoice-child-count-placeholder">—</span>}
        {!editing && <><label className={`invoice-child-pending${child.total_sessions !== null && Number(child.total_sessions) === 0 ? ' is-disabled' : ''}`}><input type="checkbox" aria-label={`Chưa làm ${name}`} disabled={child.total_sessions !== null && Number(child.total_sessions) === 0} checked={child.total_sessions !== null && Number(child.total_sessions) === 0 ? true : !child.performNow} onChange={event => change({ performNow: !event.target.checked })} />Chưa làm</label>
        {!(child.total_sessions !== null && Number(child.total_sessions) === 0) && child.performNow && <InvoiceChildStaffPicker name={name} selected={child.performStaffs || []} branchId={branchId} onChange={people => change({ performStaffs: people, staffBranchId: branchId })} />}</>}
      </li>
    })}</ol>
  </section>
}

export function InvoiceTreatmentDetail({ treatment }) {
  if (!treatment) return null
  const children = treatment.children || []
  const sessions = card => card.total_sessions === null ? 'Trọn đời' : `${card.total_sessions} buổi`
  return <div className="invoice-service-children">{children.length ? <><strong>Dịch vụ con</strong><ul>{children.map(child => <li key={child.id}><span>{child.product_name || child.name || `Dịch vụ #${child.product_id}`}</span><strong>{sessions(child)}</strong></li>)}</ul></> : <p>{sessions(treatment)}</p>}</div>
}