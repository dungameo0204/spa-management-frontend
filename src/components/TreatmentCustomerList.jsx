import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import DebtAmount from './DebtAmount'
import TreatmentCardPanel from './TreatmentCardPanel'
import Pagination from './Pagination'
import RefreshButton from './RefreshButton'
import { useBranchCatalog } from '../hooks/useProductCatalog'

export default function TreatmentCustomerList({ customers = [], page = 1, total = 0, totalPages = 1, pageSize = 20, search, onSearch, loading, error, onRetry, onOpen, branchId, executionFilters, refreshing = false, onPageChange }) {
  const [expanded, setExpanded] = useState(null)
  const branchesQuery = useBranchCatalog()
  const branches = branchesQuery.data || []
  useEffect(() => setExpanded(null), [customers, page])

  return <div className="list-panel treatment-customers">
    <div className="list-toolbar"><div className="search-box"><Search size={18} /><input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." value={search} onChange={event => { onSearch(event.target.value); setExpanded(null) }} /></div><div className="list-toolbar-actions"><span className="list-count">{total} khách hàng</span><RefreshButton label="Tải lại thẻ liệu trình" disabled={refreshing} onClick={onRetry} /></div></div>
    {error ? <div className="empty-state"><h3>Không tải được dữ liệu</h3><p>{error.message}</p><button className="btn secondary" onClick={onRetry}>Thử lại</button></div> : loading ? <div className="skeleton-list" aria-label="Đang tải">Đang tải dữ liệu...</div> : !customers.length ? <div className="empty-state"><h3>Chưa có thẻ liệu trình</h3><p>Thử từ khóa hoặc khoảng ngày khác.</p></div> : <>
      <div className="table-scroll"><table><thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Tiền nợ</th><th>Dịch vụ</th><th>Đã hoàn thành</th></tr></thead><tbody>{customers.map(customer => {
        const activeCards = customer.active_treatments || customer.treatments || []
        const completedCards = customer.completed_treatments || []
        const name = customer.fullname || customer.customer_name || 'Khách hàng'
        const customerId = customer.customer_id ?? customer.id
        const toggle = kind => setExpanded(expanded?.id === customerId && expanded?.kind === kind ? null : { id: customerId, kind })
        return <Fragment key={customerId}><tr className="clickable" onClick={() => toggle(activeCards.length ? 'remaining' : 'completed')}><td data-label="Khách hàng">{name}</td><td data-label="Số điện thoại">{customer.phone_number || '—'}</td><td data-label="Tiền nợ">{customer.total_debt != null ? <DebtAmount value={customer.total_debt} /> : '—'}</td><td data-label="Dịch vụ">{activeCards.length > 0 ? <button type="button" className="text-action treatment-service-badge" aria-expanded={expanded?.id === customerId && expanded?.kind === 'remaining'} aria-label={`${name}: ${activeCards.length} dịch vụ`} onClick={event => { event.stopPropagation(); toggle('remaining') }}>{activeCards.length} dịch vụ {expanded?.id === customerId && expanded?.kind === 'remaining' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button> : <span className="small-muted">—</span>}</td><td data-label="Đã hoàn thành">{completedCards.length > 0 ? <button type="button" className="text-action treatment-finished-action" aria-expanded={expanded?.id === customerId && expanded?.kind === 'completed'} aria-label={`${name}: ${completedCards.length} đã hoàn thành`} onClick={event => { event.stopPropagation(); toggle('completed') }}>{completedCards.length} đã hoàn thành {expanded?.id === customerId && expanded?.kind === 'completed' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button> : <span className="small-muted">—</span>}</td></tr>
          {expanded?.id === customerId && <tr className="treatment-expanded-row"><td colSpan={5}><div className="treatment-card-list">{(expanded?.kind === 'completed' ? completedCards : activeCards).map(card => <TreatmentCardPanel key={card.id} card={{ ...card, customer_id: card.customer_id ?? customerId, customer_name: card.customer_name || name }} onOpen={onOpen} branchId={branchId} branches={branches} executionFilters={executionFilters} />)}</div></td></tr>}
        </Fragment>
      })}</tbody></table></div>
      <Pagination page={page} totalPages={totalPages} totalItems={total} pageSize={pageSize} onChange={onPageChange} label="khách hàng" />
    </>}
  </div>
}