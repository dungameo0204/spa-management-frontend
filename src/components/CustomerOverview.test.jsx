import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CustomerOverview from './CustomerOverview'
import { executeTreatment, getCustomerOverview, updateTreatmentHistoryNote } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'STAFF', branch_id: 1 } }) }))
vi.mock('./AppShell', () => ({ useBranch: () => ({ branchId: 1 }) }))
vi.mock('./RoleStaffPicker', () => ({ default: () => <div>Nhân viên</div> }))
vi.mock('./SkinImageAlbum', () => ({ default: () => null }))
vi.mock('../api/resources', () => ({ executeTreatment: vi.fn(), getCustomerOverview: vi.fn(), listResource: vi.fn(), updateTreatmentHistoryNote: vi.fn(), signTreatmentHistory: vi.fn(), getResource: vi.fn() }))
const overview = { customer: { id: 17, fullname: 'Khách thử' }, timeline: [{ type: 'treatment', date: '2026-10-28', treatment: { id: 36, product_name: 'Chăm sóc da', remaining_sessions: 2, total_sessions: 5, histories: [] } }] }

beforeEach(() => { vi.clearAllMocks(); executeTreatment.mockResolvedValue({}); getCustomerOverview.mockResolvedValue(overview) })
afterEach(cleanup)

async function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><CustomerOverview customerId={17} overview={overview} onOverview={vi.fn()} /></QueryClientProvider>)
  const actor = userEvent.setup()
  await actor.click(screen.getByRole('checkbox', { name: 'Làm hôm nay' }))
  return actor
}

it('chưa ký: phải xác nhận, quay lại giữ ghi chú và không gửi API', async () => {
  const actor = await open()
  await actor.type(screen.getByRole('textbox'), 'Da nhạy cảm')
  await actor.click(screen.getByRole('button', { name: 'Xác nhận hôm nay' }))
  expect(executeTreatment).not.toHaveBeenCalled()
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Bạn có chắc chắn muốn ghi nhận buổi mà không có chữ ký khách hàng?')
  await actor.click(screen.getByRole('button', { name: 'Quay lại ký' }))
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(screen.getByRole('textbox')).toHaveValue('Da nhạy cảm')
  await actor.click(screen.getByRole('button', { name: 'Xác nhận hôm nay' }))
  await actor.click(screen.getByRole('button', { name: 'Ghi nhận không có chữ ký' }))
  await waitFor(() => expect(executeTreatment).toHaveBeenCalledTimes(1))
  expect(executeTreatment.mock.calls[0][0]).toEqual({ treatment_id: 36, staffs: [], note: 'Da nhạy cảm' })
})

it('lỗi API giữ dữ liệu, lần thử lại vẫn hỏi xác nhận không ký', async () => {
  executeTreatment.mockRejectedValue(new Error('Lỗi mạng'))
  const actor = await open()
  await actor.type(screen.getByRole('textbox'), 'Ghi chú còn nguyên')
  await actor.click(screen.getByRole('button', { name: 'Xác nhận hôm nay' }))
  await actor.click(screen.getByRole('button', { name: 'Ghi nhận không có chữ ký' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Lỗi mạng')
  expect(screen.getByRole('textbox')).toHaveValue('Ghi chú còn nguyên')
  await actor.click(screen.getByRole('button', { name: 'Xác nhận hôm nay' }))
  expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  expect(executeTreatment).toHaveBeenCalledTimes(1)
})

it('ghi chú vượt giới hạn UTF-8 không gửi API', async () => {
  const actor = await open()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'đ'.repeat(32768) } })
  await actor.click(screen.getByRole('button', { name: 'Xác nhận hôm nay' }))
  expect(screen.getByRole('alert')).toHaveTextContent('65535 byte UTF-8')
  expect(executeTreatment).not.toHaveBeenCalled()
})

it('hiển thị ghi chú dạng text và chữ ký qua ảnh trong lịch sử', async () => {
  overview.timeline[0].treatment.histories = [{ id: 1, execution_date: '2026-10-28', note: '<script>không chạy</script>', customer_signature_svg: '<svg viewBox="0 0 300 100"><path d="M 10 10 L 20 20"/></svg>', customer_signed_at: '2026-10-28T09:00:00Z' }]
  try {
    const actor = await open()
    await actor.click(screen.getByRole('button', { name: 'Xem lịch sử' }))
    const history = document.querySelector('.customer-session-history')
    expect(within(history).getByText('Ghi chú: <script>không chạy</script>')).toBeInTheDocument()
    expect(history.querySelector('script')).toBeNull()
    expect(within(history).getByRole('img')).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml;'))
    expect(history).toHaveTextContent('Đã ký:')
  } finally { overview.timeline[0].treatment.histories = [] }
})

it('mở buổi cũ đã ký trong hồ sơ, sửa note và tải lại overview', async () => {
  overview.timeline[0].treatment.histories = [{ id: 77, branch_id: 1, execution_date: '2020-01-01', note: 'Ghi chú cũ', customer_signed_at: '2020-01-01T09:00:00Z' }]
  updateTreatmentHistoryNote.mockResolvedValue({ data: { note: 'Ghi chú mới' } })
  try {
    const actor = await open()
    await actor.click(screen.getByRole('button', { name: 'Xem lịch sử' }))
    await actor.click(screen.getByRole('button', { name: 'Ghi chú / Chữ ký buổi #77' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Ghi chú và chữ ký' }))
    await actor.clear(dialog.getByRole('textbox'))
    await actor.type(dialog.getByRole('textbox'), 'Ghi chú mới')
    await actor.click(dialog.getByRole('button', { name: 'Lưu ghi chú' }))
    await waitFor(() => expect(getCustomerOverview).toHaveBeenCalledWith(17))
    expect(updateTreatmentHistoryNote).toHaveBeenCalledWith(77, 'Ghi chú mới')
    expect(executeTreatment).not.toHaveBeenCalled()
  } finally { overview.timeline[0].treatment.histories = [] }
})