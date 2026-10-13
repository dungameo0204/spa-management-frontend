import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from 'lucide-react'
import { executeTreatment, getResource, listResource } from '../api/resources'
import { dateOnly, formatCurrency, formatSpaDate, today } from '../utils/format'
import RoleStaffPicker from './RoleStaffPicker'

const PAGE_SIZE = 20

function CustomerContact({ id }) {
  const { data, isError } = useQuery({ queryKey: ['customers', 'treatment-summary', id], queryFn: () => getResource('customers', id), enabled: typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)) })
  return <><td data-label="Số điện thoại">{data?.phone_number || '—'}</td><td data-label="Tiền nợ">{data?.total_debt != null ? formatCurrency(data.total_debt) : isError ? 'Không tải được' : '—'}</td></>
}

function TreatmentCard({ card, onOpen, active, setActive, setMessage, branchId, branches, manager, execution }) {
  const detail = useQuery({ queryKey: ['treatments', 'card-detail', card.id], queryFn: () => getResource('treatments', card.id) })
  const todayExecutions = detail.data?.histories?.filter(history => dateOnly(history.execution_date) === today()).length || 0

  return <div className="treatment-card-item">
    <div className="treatment-card-heading"><button type="button" className="text-action" onClick={() => onOpen(card)}>{card.product_name} · còn {card.remaining_sessions}/{card.total_sessions} buổi · Xem lịch sử</button>{todayExecutions > 0 && <span className="today-execution-badge">Đã thực hiện {todayExecutions} buổi hôm nay</span>}<span className="small-muted">Ngày tạo: {formatSpaDate(card.created_at)}</span>{Number(card.remaining_sessions) > 0 ? <button type="button" className="btn secondary" onClick={() => { setActive(active?.id === card.id ? null : { id: card.id, branch: branchId || '', staffs: [] }); setMessage('') }}>Thực hiện hôm nay</button> : <span className="treatment-completed-label">Đã hoàn tất hôm nay</span>}</div>
    {active?.id === card.id && <div className="treatment-actions treatment-inline-actions">{manager && <label className="field">Cơ sở thực hiện<select value={active.branch} onChange={e => setActive({ ...active, branch: e.target.value, staffs: [] })}><option value="">Chọn cơ sở</option>{branches.data?.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}<RoleStaffPicker selected={active.staffs} onChange={staffs => setActive({ ...active, staffs })} branchId={manager && !active.branch ? 'required' : active.branch} /><button type="button" className="btn primary" disabled={execution.isPending || (manager && !active.branch) || !navigator.onLine} onClick={() => { setMessage(''); execution.mutate(active) }}>Xác nhận hôm nay</button></div>}
  </div>
}

export default function TreatmentCustomerList({ cards = [], search, onSearch, loading, error, onRetry, onOpen, manager, branchId }) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1), [expanded, setExpanded] = useState(null), [active, setActive] = useState(null), [message, setMessage] = useState(''), [messageType, setMessageType] = useState('success')
  const branches = useQuery({ queryKey: ['branches', 'treatment-picker'], queryFn: () => listResource('branches', {}, 1, 100), enabled: manager })
  const execution = useMutation({
    mutationFn: ({ id, branch, staffs }) => executeTreatment({ treatment_id: id, ...(manager ? { branch_id: Number(branch) } : {}), staffs }),
    onSuccess: () => { setActive(null); setMessageType('success'); setMessage('Đã ghi nhận buổi thực hiện.'); qc.invalidateQueries({ queryKey: ['treatments'] }); qc.invalidateQueries({ queryKey: ['dashboard-treatments'] }); qc.invalidateQueries({ queryKey: ['appointments'] }); qc.invalidateQueries({ queryKey: ['commissions'] }); qc.invalidateQueries({ queryKey: ['customers', 'treatment-summary'] }) },
    onError: err => { setMessageType('error'); setMessage(`Chưa xác nhận được trạng thái buổi: ${err.message}. Kiểm tra lịch sử trước khi thử lại.`) },
  })
  const customers = Array.from(cards.reduce((map, card) => {
    const key = card.customer_id ?? `card-${card.id}`
    if (!map.has(key)) map.set(key, { id: key, name: card.customer_name, cards: [] })
    map.get(key).cards.push(card)
    return map
  }, new Map()).values()).map(customer => ({ ...customer, cards: customer.cards.sort((a, b) => Number(b.remaining_sessions > 0) - Number(a.remaining_sessions > 0)) }))
    .sort((a, b) => Number(b.cards.some(card => Number(card.remaining_sessions) > 0)) - Number(a.cards.some(card => Number(card.remaining_sessions) > 0)))
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE))

  return <div className="list-panel treatment-customers">
    <div className="list-toolbar"><div className="search-box"><Search size={18} /><input aria-label="Tìm kiếm" placeholder="Tìm kiếm..." value={search} onChange={e => { onSearch(e.target.value); setPage(1); setExpanded(null); setActive(null) }} /></div><span className="list-count">{customers.length} khách hàng</span></div>
    {message && <p role={messageType === 'error' ? 'alert' : 'status'} className={messageType === 'error' ? 'form-alert' : 'success-alert'}>{message}</p>}
    {error ? <div className="empty-state"><h3>Không tải được dữ liệu</h3><p>{error.message}</p><button className="btn secondary" onClick={onRetry}>Thử lại</button></div> : loading ? <div className="skeleton-list" aria-label="Đang tải">Đang tải dữ liệu...</div> : !customers.length ? <div className="empty-state"><h3>Chưa có liệu trình còn buổi</h3><p>Thử từ khóa hoặc khoảng ngày khác.</p></div> : <>
      <div className="table-scroll"><table><thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Tiền nợ</th><th>Dịch vụ</th></tr></thead><tbody>{customers.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE).map(customer => <Fragment key={customer.id}><tr className="clickable" onClick={() => setExpanded(expanded === customer.id ? null : customer.id)}><td data-label="Khách hàng">{customer.name}</td><CustomerContact id={customer.id} /><td data-label="Dịch vụ"><button type="button" className="text-action" aria-expanded={expanded === customer.id} aria-label={`${customer.name}: ${customer.cards.length} dịch vụ`} onClick={event => { event.stopPropagation(); setExpanded(expanded === customer.id ? null : customer.id) }}>{customer.cards.length} dịch vụ {expanded === customer.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button></td></tr>
        {expanded === customer.id && <tr className="treatment-expanded-row"><td colSpan={4}><div className="treatment-card-list">{customer.cards.map(card => <TreatmentCard key={card.id} card={card} onOpen={onOpen} active={active} setActive={setActive} setMessage={setMessage} branchId={branchId} branches={branches} manager={manager} execution={execution} />)}</div></td></tr>}
      </Fragment>)}</tbody></table></div>
      <div className="pagination"><span>Trang {Math.min(page, totalPages)} / {totalPages}</span><div><button aria-label="Trang trước" disabled={page <= 1} onClick={() => { setPage(page - 1); setExpanded(null) }}><ChevronLeft size={19} /></button><button aria-label="Trang sau" disabled={page >= totalPages} onClick={() => { setPage(page + 1); setExpanded(null) }}><ChevronRight size={19} /></button></div></div>
    </>}
  </div>
}