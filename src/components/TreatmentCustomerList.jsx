import { Fragment, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from 'lucide-react'
import { getResource } from '../api/resources'
import DebtAmount from './DebtAmount'
import TreatmentCardPanel from './TreatmentCardPanel'

const PAGE_SIZE = 20

function CustomerContact({ id }) {
  const { data, isError } = useQuery({ queryKey: ['customers', 'treatment-summary', id], queryFn: () => getResource('customers', id), enabled: typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)) })
  return <><td data-label="Số điện thoại">{data?.phone_number || '—'}</td><td data-label="Tiền nợ">{data?.total_debt != null ? <DebtAmount value={data.total_debt} /> : isError ? 'Không tải được' : '—'}</td></>
}

export default function TreatmentCustomerList({ cards = [], completedCards = [], search, onSearch, loading, error, onRetry, onOpen, branchId }) {
  const [page, setPage] = useState(1), [expanded, setExpanded] = useState(null)
  const completedIds = new Set(completedCards.map(card => card.id))
  const customers = Array.from([...cards, ...completedCards.filter(card => !cards.some(visible => visible.id === card.id))].reduce((map, card) => {
    const key = card.customer_id ?? `card-${card.id}`
    if (!map.has(key)) map.set(key, { id: key, name: card.customer_name, cards: [], completed: [] })
    const customer = map.get(key)
    if (card.closed_at && completedIds.has(card.id)) customer.completed.push(card)
    if (!completedIds.has(card.id) || cards.some(visible => visible.id === card.id)) customer.cards.push(card)
    return map
  }, new Map()).values()).map(customer => ({ ...customer, cards: customer.cards.sort((a, b) => Number(b.remaining_sessions > 0) - Number(a.remaining_sessions > 0)) }))
    .sort((a, b) => Number(b.cards.some(card => Number(card.remaining_sessions) > 0)) - Number(a.cards.some(card => Number(card.remaining_sessions) > 0)))
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE))

  return <div className="list-panel treatment-customers">
    <div className="list-toolbar"><div className="search-box"><Search size={18} /><input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." value={search} onChange={e => { onSearch(e.target.value); setPage(1); setExpanded(null) }} /></div><span className="list-count">{customers.length} khách hàng</span></div>
    {error ? <div className="empty-state"><h3>Không tải được dữ liệu</h3><p>{error.message}</p><button className="btn secondary" onClick={onRetry}>Thử lại</button></div> : loading ? <div className="skeleton-list" aria-label="Đang tải">Đang tải dữ liệu...</div> : !customers.length ? <div className="empty-state"><h3>Chưa có thẻ liệu trình</h3><p>Thử từ khóa hoặc khoảng ngày khác.</p></div> : <>
      <div className="table-scroll"><table><thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Tiền nợ</th><th>Dịch vụ</th><th>Đã hoàn thành</th></tr></thead><tbody>{customers.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE).map(customer => {
        const toggle = (kind) => { setExpanded(expanded?.id === customer.id && expanded.kind === kind ? null : { id: customer.id, kind }) }
        return <Fragment key={customer.id}><tr className="clickable" onClick={() => toggle(customer.cards.length ? 'remaining' : 'completed')}><td data-label="Khách hàng">{customer.name}</td><CustomerContact id={customer.id} /><td data-label="Dịch vụ">{customer.cards.length > 0 && <button type="button" className="text-action" aria-expanded={expanded?.id === customer.id && expanded.kind === 'remaining'} aria-label={`${customer.name}: ${customer.cards.length} dịch vụ`} onClick={event => { event.stopPropagation(); toggle('remaining') }}>{customer.cards.length} dịch vụ {expanded?.id === customer.id && expanded.kind === 'remaining' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>}</td><td data-label="Đã hoàn thành">{customer.completed.length > 0 && <button type="button" className="text-action treatment-finished-action" aria-expanded={expanded?.id === customer.id && expanded.kind === 'completed'} aria-label={`${customer.name}: ${customer.completed.length} đã hoàn thành`} onClick={event => { event.stopPropagation(); toggle('completed') }}>{customer.completed.length} đã hoàn thành {expanded?.id === customer.id && expanded.kind === 'completed' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>}</td></tr>
        {expanded?.id === customer.id && <tr className="treatment-expanded-row"><td colSpan={5}><div className="treatment-card-list">{(expanded.kind === 'completed' ? customer.completed : customer.cards).map(card => <TreatmentCardPanel key={card.id} card={card} onOpen={onOpen} branchId={branchId} />)}</div></td></tr>}
      </Fragment> })}</tbody></table></div>
      <div className="pagination"><span>Trang {Math.min(page, totalPages)} / {totalPages}</span><div><button aria-label="Trang trước" disabled={page <= 1} onClick={() => { setPage(page - 1); setExpanded(null) }}><ChevronLeft size={19} /></button><button aria-label="Trang sau" disabled={page >= totalPages} onClick={() => { setPage(page + 1); setExpanded(null) }}><ChevronRight size={19} /></button></div></div>
    </>}
  </div>
}