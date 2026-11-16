import { Fragment, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import DebtAmount from './DebtAmount'
import TreatmentCardPanel from './TreatmentCardPanel'
import Pagination from './Pagination'
import RefreshButton from './RefreshButton'
import { useBranchCatalog } from '../hooks/useProductCatalog'

export default function TreatmentCustomerList({ customers = [], page = 1, totalPages = 1, totalItems = 0, search, onSearch, onPage, loading, error, onRetry, onOpen, branchId, executionFilters, refreshing = false }) {
  const [expanded, setExpanded] = useState(null)
  const branchesQuery = useBranchCatalog()
  const branches = branchesQuery.data || []

  return <div className="list-panel treatment-customers">
    <div className="list-toolbar"><div className="search-box"><Search size={18} /><input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." value={search} onChange={e => { onSearch(e.target.value); setExpanded(null) }} /></div><div className="list-toolbar-actions"><span className="list-count">{totalItems} khách hàng</span><RefreshButton label="Tải lại thẻ liệu trình" disabled={refreshing} onClick={onRetry} /></div></div>
    {error ? <div className="empty-state"><h3>Không tải được dữ liệu</h3><p>{error.message}</p><button className="btn secondary" onClick={onRetry}>Thử lại</button></div> : loading ? <div className="skeleton-list" aria-label="Đang tải">Đang tải dữ liệu...</div> : !customers.length ? <div className="empty-state"><h3>Chưa có thẻ liệu trình</h3><p>Thử từ khóa hoặc khoảng ngày khác.</p></div> : <>
      <div className="table-scroll"><table><thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Tiền nợ</th><th>Dịch vụ</th><th>Đã hoàn thành</th></tr></thead><tbody>{customers.map(customer => {
        const activeTreatments = customer.active_treatments || [], completedTreatments = customer.completed_treatments || []
        const toggle = kind => { setExpanded(expanded?.id === customer.customer_id && expanded.kind === kind ? null : { id: customer.customer_id, kind }) }
        return <Fragment key={customer.customer_id}><tr className="clickable" onClick={() => toggle(activeTreatments.length ? 'remaining' : 'completed')}><td data-label="Khách hàng">{customer.customer_name}</td><td data-label="Số điện thoại">{customer.phone_number || '—'}</td><td data-label="Tiền nợ">{customer.total_debt != null ? <DebtAmount value={customer.total_debt} /> : '—'}</td><td data-label="Dịch vụ">{activeTreatments.length > 0 ? <button type="button" className="text-action treatment-service-badge" aria-expanded={expanded?.id === customer.customer_id && expanded.kind === 'remaining'} aria-label={`${customer.customer_name}: ${activeTreatments.length} dịch vụ`} onClick={event => { event.stopPropagation(); toggle('remaining') }}>{activeTreatments.length} dịch vụ {expanded?.id === customer.customer_id && expanded.kind === 'remaining' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button> : <span className="small-muted">—</span>}</td><td data-label="Đã hoàn thành">{completedTreatments.length > 0 ? <button type="button" className="text-action treatment-finished-action" aria-expanded={expanded?.id === customer.customer_id && expanded.kind === 'completed'} aria-label={`${customer.customer_name}: ${completedTreatments.length} đã hoàn thành`} onClick={event => { event.stopPropagation(); toggle('completed') }}>{completedTreatments.length} đã hoàn thành {expanded?.id === customer.customer_id && expanded.kind === 'completed' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button> : <span className="small-muted">—</span>}</td></tr>
        {expanded?.id === customer.customer_id && <tr className="treatment-expanded-row"><td colSpan={5}><div className="treatment-card-list">{(expanded.kind === 'completed' ? completedTreatments : activeTreatments).map(card => <TreatmentCardPanel key={card.id} card={{ ...card, customer_id: card.customer_id ?? customer.customer_id, customer_name: card.customer_name || customer.customer_name, total_debt: customer.total_debt }} onOpen={onOpen} branchId={branchId} branches={branches} executionFilters={executionFilters} />)}</div></td></tr>}
      </Fragment> })}</tbody></table></div>
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={20} onChange={nextPage => { onPage(nextPage); setExpanded(null) }} label="khách hàng" />
    </>}
  </div>
}