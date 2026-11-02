import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CustomerBookingsPage from './CustomerBookingsPage'
import { createCustomerBooking, deleteCustomerBooking, getCustomerBooking, listCustomerBookings, updateCustomerBooking } from '../api/customerBookings'

const actor = vi.hoisted(() => ({ user: { system_role: 'STAFF', branch_id: 1 }, branchId: 1 }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: actor.user }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: actor.branchId }) }))
vi.mock('../api/customerBookings', () => ({ listCustomerBookings: vi.fn(), getCustomerBooking: vi.fn(), createCustomerBooking: vi.fn(), updateCustomerBooking: vi.fn(), deleteCustomerBooking: vi.fn() }))
vi.mock('../api/resources', () => ({ listResource: vi.fn(async resource => ({ data: resource === 'products' ? [{ id: 9, name: 'Chăm sóc da' }] : [{ id: 1, name: 'Cơ sở 1' }], totalPages: 1 })) }))
const row = { id: 7, branch_id: 1, customer_type: 'NEW', customer_name: 'Lan', customer_phone: '0901234567', arrival_date: '2026-11-01', arrival_time: null, status: 'PENDING' }
function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><CustomerBookingsPage /></QueryClientProvider>) }
beforeEach(() => {
  vi.clearAllMocks(); actor.user = { system_role: 'STAFF', branch_id: 1 }; actor.branchId = 1
  listCustomerBookings.mockResolvedValue([row]); getCustomerBooking.mockResolvedValue(row)
  createCustomerBooking.mockResolvedValue({}); updateCustomerBooking.mockResolvedValue({}); deleteCustomerBooking.mockResolvedValue({})
})
afterEach(cleanup)

it('hiển thị trạng thái trống ngắn gọn khi chưa có lịch', async () => {
  listCustomerBookings.mockResolvedValue([])
  const user = userEvent.setup()
  mount()
  const heading = await screen.findByRole('heading', { name: 'Chưa có lịch' })
  const empty = heading.closest('.booking-empty')
  expect(heading).toBeInTheDocument()
  expect(screen.queryByText('Chưa có lịch đặt phù hợp')).not.toBeInTheDocument()
  expect(within(empty).getByText('Không có khách đặt lịch trong ngày này.')).toBeInTheDocument()
  await user.click(within(empty).getByRole('button', { name: 'Tạo lịch đặt' }))
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
})

it('chuyển sang ngày tiếp theo từ trạng thái chưa có lịch', async () => {
  listCustomerBookings.mockResolvedValue([])
  const user = userEvent.setup()
  mount()
  const before = screen.getByLabelText('Từ ngày').value
  await user.click(await screen.findByRole('button', { name: 'Xem ngày tiếp theo' }))
  await waitFor(() => expect(screen.getByLabelText('Từ ngày').value).not.toBe(before))
  expect(screen.getByLabelText('Từ ngày')).toHaveValue('2026-11-03')
  expect(screen.getByLabelText('Đến ngày')).toHaveValue('2026-11-03')
})

it('đặt lọc nhanh phía trên ô lọc và hiện riêng hai loại ghi chú trong bảng', async () => {
  listCustomerBookings.mockResolvedValue([{ ...row, promotion_note: 'Ưu đãi khách mới', note: 'Nhắc khách đến sớm\nChuẩn bị hồ sơ' }])
  mount()
  const filters = screen.getByRole('form', { name: 'Lọc lịch đặt' })
  expect(filters.querySelector('.booking-filter-actions').compareDocumentPosition(filters.querySelector('.booking-filter-grid')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(within(filters).getByRole('button', { name: 'Hôm nay' })).toBeInTheDocument()
  expect(within(filters).getByRole('button', { name: 'Ngày mai' })).toBeInTheDocument()
  expect(within(filters).getByRole('button', { name: '7 ngày tiếp' })).toBeInTheDocument()
  expect(within(filters).getByRole('group', { name: 'Chọn ngày nhanh' })).not.toContainElement(within(filters).getByRole('button', { name: 'Xóa bộ lọc' }))
  expect(filters.querySelector('.booking-filter-grid').compareDocumentPosition(filters.querySelector('.booking-filter-reset')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  const card = (await screen.findByRole('button', { name: 'Xem lịch Lan' })).closest('.booking-card')
  const heading = screen.getByLabelText('Tiêu đề cột lịch đặt')
  expect(within(heading).getByText('Nhu cầu / ghi chú')).toBeInTheDocument()
  expect(within(heading).getByText('Giờ hẹn')).toBeInTheDocument()
  expect(card.querySelector('.booking-card-notes')).toBeInTheDocument()
  expect(card.querySelector('.booking-card-notes')).toContainElement(within(card).getByText('Nhu cầu / ưu đãi:'))
  expect(card.querySelector('.booking-card-notes')).toContainElement(within(card).getByText('Ghi chú cho nhân viên:'))
  expect(within(card).getByText('Nhu cầu / ưu đãi:').parentElement).toHaveTextContent('Ưu đãi khách mới')
  expect(within(card).getByText('Ghi chú cho nhân viên:').parentElement).toHaveTextContent('Nhắc khách đến sớm')
  expect(within(card).getByText('Ghi chú cho nhân viên:').parentElement).toHaveTextContent('Chuẩn bị hồ sơ')
})

it('chọn tất cả dịch vụ chỉ xóa lọc dịch vụ và nhãn hiển thị', async () => {
  const user = userEvent.setup(); mount()
  const filters = screen.getByRole('form', { name: 'Lọc lịch đặt' })
  await screen.findByRole('button', { name: 'Xem lịch Lan' })
  fireEvent.change(within(filters).getByLabelText('Từ giờ', { selector: 'select' }), { target: { value: '07:00' } })
  const picker = within(filters).getByRole('combobox', { name: 'Tìm dịch vụ quan tâm' })
  await user.click(picker)
  expect(within(within(filters).getByRole('listbox')).getAllByRole('option')[0]).toHaveTextContent('Tất cả dịch vụ')
  await user.type(picker, 'da')
  await user.click(await screen.findByRole('option', { name: 'Chăm sóc da' }))
  await waitFor(() => expect(listCustomerBookings).toHaveBeenLastCalledWith(expect.objectContaining({ productId: 9, startTime: '07:00' }), expect.any(AbortSignal)))
  expect(picker).toHaveValue('Chăm sóc da')
  expect(picker).toHaveAttribute('aria-expanded', 'false')
  await user.click(picker)
  const allServices = within(within(filters).getByRole('listbox')).getAllByRole('option')[0]
  expect(allServices).toHaveTextContent('Tất cả dịch vụ')
  expect(allServices).toHaveAttribute('aria-selected', 'false')
  await user.click(allServices)
  await waitFor(() => expect(listCustomerBookings).toHaveBeenLastCalledWith(expect.objectContaining({ productId: '', startTime: '07:00' }), expect.any(AbortSignal)))
  expect(picker).toHaveValue('')
  expect(picker).toHaveAttribute('aria-expanded', 'false')
  expect(within(filters).queryByRole('listbox')).not.toBeInTheDocument()
  expect(within(filters).queryByRole('button', { name: 'Tất cả dịch vụ' })).not.toBeInTheDocument()
  await user.click(picker)
  expect(within(within(filters).getByRole('listbox')).getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
})

it('tự lọc 07:00–08:00 vẫn hiện khách NULL và không gọi API nếu giờ đảo ngược', async () => {
  mount()
  await screen.findByRole('button', { name: 'Xem lịch Lan' })
  fireEvent.change(screen.getByLabelText('Từ giờ', { selector: 'select' }), { target: { value: '07:00' } })
  fireEvent.change(screen.getByLabelText('Đến giờ', { selector: 'select' }), { target: { value: '08:00' } })
  await waitFor(() => expect(listCustomerBookings).toHaveBeenLastCalledWith(expect.objectContaining({ startTime: '07:00', endTime: '08:00' }), expect.any(AbortSignal)))
  expect(await screen.findByText('Chưa chọn giờ')).toBeInTheDocument()
  const count = listCustomerBookings.mock.calls.length
  fireEvent.change(screen.getByLabelText('Từ giờ', { selector: 'select' }), { target: { value: '09:00' } })
  expect(screen.getByRole('alert')).toHaveTextContent('Giờ bắt đầu')
  expect(listCustomerBookings).toHaveBeenCalledTimes(count)
})

it('tạo khách mới không chọn giờ, khóa chi nhánh STAFF', async () => {
  const user = userEvent.setup(); mount()
  await user.click(screen.getByRole('button', { name: 'Tạo lịch đặt' }))
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).queryByLabelText('Chi nhánh tiếp nhận')).not.toBeInTheDocument()
  await user.type(within(dialog).getByLabelText('Họ và tên'), 'Khách mới')
  await user.type(within(dialog).getByLabelText('Số điện thoại'), '0900000000')
  await user.click(within(dialog).getByRole('button', { name: 'Lưu lịch đặt' }))
  await waitFor(() => expect(createCustomerBooking).toHaveBeenCalledWith(expect.objectContaining({ branch_id: 1, customer_name: 'Khách mới', customer_id: null, arrival_time: null })))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('STAFF không có nút sửa/xóa booking chi nhánh khác', async () => {
  listCustomerBookings.mockResolvedValue([{ ...row, branch_id: 2 }]); getCustomerBooking.mockResolvedValue({ ...row, branch_id: 2 })
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: 'Xem lịch Lan' }))
  await screen.findByText('Chỉ được chỉnh sửa lịch thuộc chi nhánh của bạn.')
  expect(screen.queryByRole('button', { name: 'Chỉnh sửa' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Xóa lịch Lan' })).not.toBeInTheDocument()
})

it('sửa lịch, giữ status backend và lưu giá trị tư vấn nguyên VND', async () => {
  getCustomerBooking.mockResolvedValue({ ...row, status: 'CUSTOM_STATUS', consultation_total: '123.45' })
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: 'Sửa lịch Lan' }))
  await screen.findByLabelText('Họ và tên')
  expect(screen.getByLabelText('Giá trị tư vấn dự kiến (VNĐ)')).toHaveValue('123')
  await user.click(screen.getByRole('button', { name: 'Lưu lịch đặt' }))
  await waitFor(() => expect(updateCustomerBooking).toHaveBeenCalledWith(7, expect.objectContaining({ status: 'CUSTOM_STATUS', consultation_total: '123' })))
})

it('giữ giờ hẹn đã lưu trước 07:00 khi sửa lịch cũ', async () => {
  getCustomerBooking.mockResolvedValue({ ...row, arrival_time: '06:30:00' })
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: 'Sửa lịch Lan' }))
  const time = screen.getByLabelText('Giờ đến (không bắt buộc)', { selector: 'select' })
  expect(time).toHaveValue('06:30')
  expect(time.options[1]).toHaveTextContent('06:30 (giờ đã lưu)')
  expect(time.options[2]).toHaveTextContent('07:00')
  await user.click(screen.getByRole('button', { name: 'Lưu lịch đặt' }))
  await waitFor(() => expect(updateCustomerBooking).toHaveBeenCalledWith(7, expect.objectContaining({ arrival_time: '06:30' })))
})

it('xóa có xác nhận, lỗi API cho thử lại', async () => {
  deleteCustomerBooking.mockRejectedValueOnce(new Error('Không thể xóa'))
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: 'Xóa lịch Lan' }))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xóa lịch' }))
  await screen.findByText(/Không thể xóa/)
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xóa lịch' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
})

it('MANAGER lọc theo chi nhánh trên cùng nhưng vẫn chọn chi nhánh tiếp nhận khi tạo lịch', async () => {
  actor.user = { system_role: 'MANAGER' }
  const user = userEvent.setup(); const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><CustomerBookingsPage /></QueryClientProvider>)
  expect(screen.queryByLabelText('Chi nhánh lọc')).not.toBeInTheDocument()
  await waitFor(() => expect(listCustomerBookings).toHaveBeenCalledWith(expect.objectContaining({ branchId: 1 }), expect.anything()))
  actor.branchId = null; view.rerender(<QueryClientProvider client={client}><CustomerBookingsPage /></QueryClientProvider>)
  await waitFor(() => expect(listCustomerBookings).toHaveBeenCalledWith(expect.objectContaining({ branchId: null }), expect.anything()))
  await user.click(screen.getByRole('button', { name: 'Tạo lịch đặt' }))
  expect(await screen.findByLabelText('Chi nhánh tiếp nhận')).toHaveValue('')
  expect(screen.getByLabelText('Chi nhánh tiếp nhận').closest('.booking-form-branch-service')).toContainElement(within(screen.getByRole('dialog')).getByRole('combobox', { name: 'Tìm dịch vụ quan tâm' }))
})