import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { useBranch } from '../components/AppShell'
import { canAccess } from '../auth/permissions'
import { listCustomerBookings, getCustomerBooking, createCustomerBooking, updateCustomerBooking, deleteCustomerBooking } from '../api/customerBookings'
import CustomerBookingFilters, { shiftBookingDay } from '../components/CustomerBookingFilters'
import CustomerBookingCard from '../components/CustomerBookingCard'
import CustomerBookingForm from '../components/CustomerBookingForm'
import FormDrawer from '../components/FormDrawer'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { dateOnly, formatSpaDate, formatCurrency, today } from '../utils/format'
import { defaultBookingFilters, validateBookingFilters } from '../utils/customerBookings'
import '../styles/customer-bookings.css'

const pageSize = 20

export default function CustomerBookingsPage() {
  const { user } = useAuth(), { branchId } = useBranch(), client = useQueryClient()
  const manager = user.system_role === 'MANAGER'
  const [filters, setFilters] = useState(defaultBookingFilters), [debouncedSearch, setDebouncedSearch] = useState(filters.search), [productLabel, setProductLabel] = useState('')
  const [paging, setPaging] = useState({ key: '', page: 1 })
  const [drawer, setDrawer] = useState(null), [removing, setRemoving] = useState(null), [message, setMessage] = useState('')
  useEffect(() => { const timeout = setTimeout(() => setDebouncedSearch(filters.search), 300); return () => clearTimeout(timeout) }, [filters.search])
  const queryFilters = { ...filters, search: debouncedSearch }
  const filterError = validateBookingFilters(filters)
  const key = JSON.stringify([queryFilters, branchId])
  const page = paging.key === key ? paging.page : 1
  const query = useQuery({ queryKey: ['customer-bookings', queryFilters, branchId], queryFn: ({ signal }) => listCustomerBookings({ ...queryFilters, branchId }, signal), enabled: !filterError })
  const detail = useQuery({ queryKey: ['customer-booking', drawer?.id], queryFn: ({ signal }) => getCustomerBooking(drawer.id, signal), enabled: Boolean(drawer?.id), staleTime: 0 })
  const writable = booking => canAccess(user, 'bookings.manage') && (manager || Number(booking.branch_id) === Number(user.branch_id))
  const mutation = useMutation({
    mutationFn: ({ action, id, body }) => action === 'delete' ? deleteCustomerBooking(id) : id ? updateCustomerBooking(id, body) : createCustomerBooking(body),
    onSuccess: async () => {
      setDrawer(null); setRemoving(null); setMessage('Đã lưu thay đổi lịch đặt.')
      await Promise.all([client.invalidateQueries({ queryKey: ['customer-bookings'] }), client.invalidateQueries({ queryKey: ['customer-booking'] })])
    },
  })
  function open(mode, id) { mutation.reset(); setMessage(''); setDrawer({ mode, id }) }
  function close() { if (!mutation.isPending) { setDrawer(null); mutation.reset() } }
  function changeFilters(next) { setFilters(next); setPaging({ key: '', page: 1 }) }
  function changeDay(offset) {
    const date = shiftBookingDay(filters.startDate || today(), offset)
    changeFilters({ ...filters, startDate: date, endDate: date })
  }
  const data = query.data || [], totalPages = Math.max(1, Math.ceil(data.length / pageSize)), safePage = Math.min(page, totalPages)
  const visible = data.slice((safePage - 1) * pageSize, safePage * pageSize)
  const groups = Map.groupBy ? Map.groupBy(visible, item => dateOnly(item.arrival_date)) : visible.reduce((map, item) => { const day = dateOnly(item.arrival_date); map.set(day, [...(map.get(day) || []), item]); return map }, new Map())
  const selected = detail.data
  return <div className="page customer-bookings">
    <div className="page-heading booking-page-heading"><h1>Khách đặt lịch</h1><button className="btn primary" onClick={() => open('create')}><Plus size={18} />Tạo lịch đặt</button></div>
    <CustomerBookingFilters value={filters} onChange={changeFilters} productLabel={productLabel} onProductLabel={setProductLabel} />
    {message && <p role="status" className="success-alert">{message}</p>}
    <section className="booking-agenda" aria-label="Danh sách lịch đặt" aria-busy={query.isFetching}>
      <header className="booking-agenda-header"><div><CalendarDays size={21} /><strong>{filters.startDate && filters.startDate === filters.endDate ? formatSpaDate(filters.startDate) : 'Lịch đặt theo bộ lọc'}</strong><span className="small-muted">{query.isPending ? 'Đang tải…' : `${data.length} lịch đặt`}</span></div><div className="booking-quick-actions"><button className="icon-btn" aria-label="Ngày trước" onClick={() => changeDay(-1)}><ChevronLeft size={20} /></button><button className="icon-btn" aria-label="Ngày tiếp theo" onClick={() => changeDay(1)}><ChevronRight size={20} /></button><button className="icon-btn" aria-label="Tải lại lịch đặt" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw size={17} /></button></div></header>
      {(filters.startTime || filters.endTime) && <span className="booking-filter-summary">Giờ {filters.startTime || '00:00'}–{filters.endTime || '23:59'} · gồm lịch chưa chọn giờ</span>}
      {filterError ? null : query.isPending ? <p className="booking-empty" role="status">Đang tải lịch đặt…</p> : query.isError ? <div className="booking-empty" role="alert"><p>{query.error.message}</p><button className="btn secondary" onClick={() => query.refetch()}>Thử lại</button></div> : !data.length ? <div className="booking-empty booking-empty-agenda"><div className="booking-empty-mark" aria-hidden="true"><CalendarDays size={28} /></div><div className="booking-empty-copy"><span>Ngày đang xem</span><h2>Chưa có lịch</h2><p>Không có khách đặt lịch trong ngày này.</p></div><div className="booking-empty-actions"><button className="btn primary" onClick={() => open('create')}><Plus size={18} /> Tạo lịch đặt</button><button type="button" className="booking-next-day" onClick={() => changeDay(1)}>Xem ngày tiếp theo <ChevronRight size={17} /></button></div></div> : [...groups].map(([day, bookings]) => <section key={day} className="booking-day"><h2>{formatSpaDate(day)} <small>{bookings.length} lịch trên trang này</small></h2><div className="booking-day-list"><div className="booking-table-heading" aria-label="Tiêu đề cột lịch đặt"><span>Giờ hẹn</span><span>Khách hàng</span><span>Dịch vụ</span><span>Chi nhánh / tư vấn</span><span>Nhu cầu / ghi chú</span><span>Đến</span><span>Thao tác</span></div>{bookings.map(booking => <CustomerBookingCard key={booking.id} booking={booking} writable={writable(booking)} onOpen={() => open('detail', booking.id)} onEdit={() => open('edit', booking.id)} onDelete={() => { mutation.reset(); setRemoving(booking) }} />)}</div></section>)}
      {!query.isError && <Pagination page={safePage} totalPages={totalPages} totalItems={data.length} pageSize={pageSize} onChange={next => setPaging({ key, page: next })} label="lịch đặt" />}
    </section>
    {drawer && <FormDrawer title={drawer.mode === 'create' ? 'Tạo lịch đặt' : drawer.mode === 'edit' ? 'Chỉnh sửa lịch đặt' : 'Chi tiết lịch đặt'} className="booking-drawer" onClose={close}>
      {mutation.isError && <p className="form-alert" role="alert">{mutation.error.message}</p>}
      {drawer.id && detail.isPending ? <p role="status">Đang tải chi tiết…</p> : drawer.id && detail.isError ? <div role="alert"><p>{detail.error.message}</p><button className="btn secondary" onClick={() => detail.refetch()}>Thử lại</button></div> : drawer.mode === 'create' || (drawer.mode === 'edit' && selected && writable(selected)) ? <CustomerBookingForm key={drawer.id || 'new'} booking={drawer.id ? selected : null} branchId={branchId} user={user} pending={mutation.isPending} onCancel={close} onSave={body => mutation.mutate({ id: drawer.id, body })} /> : selected && <>
        <div className="detail-list">{[['Khách hàng', selected.customer_name || selected.registered_customer_name], ['Số điện thoại', selected.customer_phone || selected.registered_customer_phone], ['Ngày đến', formatSpaDate(selected.arrival_date)], ['Giờ đến', selected.arrival_time || 'Chưa chọn giờ'], ['Dịch vụ', selected.product_name || 'Chưa chọn dịch vụ'], ['Chi nhánh', selected.branch_name], ['Trạng thái đến', selected.has_arrived ? 'Đã đến' : 'Chưa đến'], ['Giá trị tư vấn', formatCurrency(selected.consultation_total)], ['Nhu cầu / ưu đãi', selected.promotion_note], ['Ghi chú', selected.note]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || '—'}</strong></div>)}</div>
        {writable(selected) ? <div className="drawer-actions"><button className="btn danger" onClick={() => { mutation.reset(); setRemoving(selected) }}>Xóa lịch</button><button className="btn primary" onClick={() => setDrawer({ ...drawer, mode: 'edit' })}>Chỉnh sửa</button></div> : <p className="small-muted">Chỉ được chỉnh sửa lịch thuộc chi nhánh của bạn.</p>}
      </>}
    </FormDrawer>}
    {removing && <ConfirmDialog title="Xóa lịch đặt?" message={`Xóa lịch của ${removing.customer_name || 'khách hàng'} ngày ${formatSpaDate(removing.arrival_date)}?${mutation.isError ? ` ${mutation.error.message}` : ''}`} confirmLabel="Xóa lịch" pending={mutation.isPending} onCancel={() => { setRemoving(null); mutation.reset() }} onConfirm={() => mutation.mutate({ action: 'delete', id: removing.id })} />}
  </div>
}