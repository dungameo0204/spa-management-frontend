import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CustomerOverview from './CustomerOverview'
import { executeTreatment, getCustomerOverview, updateTreatmentHistoryNote } from '../api/resources'
import { today } from '../utils/format'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'STAFF', branch_id: 1 } }) }))
vi.mock('./AppShell', () => ({ useBranch: () => ({ branchId: 1 }) }))
vi.mock('./RoleStaffPicker', () => ({ default: () => <div>Nhân viên</div> }))
vi.mock('./SkinImageAlbum', () => ({ default: () => null }))
vi.mock('../hooks/useProductCatalog', () => ({ useBranchCatalog: () => ({ data: [] }), useProductCatalog: () => ({ data: [{ id: 23, name: 'Tan nhang' }] }), useStaffCatalog: () => ({ data: [] }) }))
vi.mock('../api/resources', () => ({ executeTreatment: vi.fn(), getCustomerOverview: vi.fn(), listResource: vi.fn(), updateTreatmentHistoryNote: vi.fn(), signTreatmentHistory: vi.fn(), getResource: vi.fn(), undoTreatmentExecution: vi.fn() }))
const overview = { customer: { id: 17, fullname: 'Khách thử' }, timeline: [{ type: 'treatment', date: '2026-10-28', treatment: { id: 36, product_name: 'Chăm sóc da', remaining_sessions: 2, total_sessions: 5, histories: [] } }] }

beforeEach(() => { vi.clearAllMocks(); executeTreatment.mockResolvedValue({}); getCustomerOverview.mockResolvedValue(overview) })
afterEach(cleanup)

async function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><CustomerOverview customerId={17} overview={overview} onOverview={vi.fn()} /></QueryClientProvider>)
  const actor = userEvent.setup()
  await actor.click(screen.getByRole('button', { name: /Thực hiện/i }))
  await actor.click(screen.getByRole('button', { name: /Ghi chú/i }))
  return actor
}

it('chưa ký: phải xác nhận, quay lại giữ ghi chú và không gửi API', async () => {
  const actor = await open()
  await actor.type(screen.getByPlaceholderText('Lưu ý cho lần thực hiện này…'), 'Da nhạy cảm')
  await actor.click(screen.getByRole('button', { name: /Xác nhận/i }))
  expect(executeTreatment).not.toHaveBeenCalled()
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Ghi nhận buổi chưa có chữ ký?')
  await actor.click(screen.getByRole('button', { name: 'Quay lại ký' }))
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(screen.getByPlaceholderText('Lưu ý cho lần thực hiện này…')).toHaveValue('Da nhạy cảm')
  await actor.click(screen.getByRole('button', { name: /Xác nhận/i }))
  await actor.click(screen.getByRole('button', { name: 'Ghi nhận không có chữ ký' }))
  await waitFor(() => expect(executeTreatment).toHaveBeenCalledTimes(1))
  expect(executeTreatment.mock.calls[0][0]).toEqual({ treatment_id: 36, staffs: [], note: 'Da nhạy cảm', execution_date: today() })
})

it('lỗi API giữ dữ liệu, khoá gửi lại để tránh trừ trùng', async () => {
  executeTreatment.mockRejectedValue(new Error('Lỗi mạng'))
  const actor = await open()
  await actor.type(screen.getByPlaceholderText('Lưu ý cho lần thực hiện này…'), 'Ghi chú còn nguyên')
  await actor.click(screen.getByRole('button', { name: /Xác nhận/i }))
  await actor.click(screen.getByRole('button', { name: 'Ghi nhận không có chữ ký' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Lỗi mạng')
  expect(screen.getByPlaceholderText('Lưu ý cho lần thực hiện này…')).toHaveValue('Ghi chú còn nguyên')
  expect(screen.getByRole('button', { name: /Xác nhận/i })).toBeDisabled()
  expect(executeTreatment).toHaveBeenCalledTimes(1)
})

it('ghi chú vượt giới hạn UTF-8 không gửi API', async () => {
  const actor = await open()
  fireEvent.change(screen.getByPlaceholderText('Lưu ý cho lần thực hiện này…'), { target: { value: 'đ'.repeat(32768) } })
  await actor.click(screen.getByRole('button', { name: /Xác nhận/i }))
  expect(screen.getByRole('status')).toHaveTextContent('65535 byte UTF-8')
  expect(executeTreatment).not.toHaveBeenCalled()
})

it('hiển thị tên dịch vụ từ treatment khi snapshot tên trên hóa đơn bị thiếu', () => {
  const purchaseOverview = {
    customer: { id: 17, fullname: 'Khách thử' },
    timeline: [{
      type: 'purchase',
      date: '2026-10-28',
      item: {
        invoice_item_id: 83,
        invoice_id: 64,
        product_name: '   ',
        is_product: 0,
        quantity: 1,
        unit_price: '500000.00',
        final_price: '500000.00',
        treatment: { id: 54, product_name: 'Tan nhang', remaining_sessions: 0, total_sessions: 1, histories: [] },
      },
    }],
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

  render(<QueryClientProvider client={client}><CustomerOverview customerId={17} overview={purchaseOverview} onOverview={vi.fn()} /></QueryClientProvider>)

  expect(document.querySelector('.timeline-purchase-card > strong')).toHaveTextContent('Tan nhang')
})

it('hiển thị tên dịch vụ standalone từ catalog khi overview chỉ trả product_id', () => {
  const legacyTreatmentOverview = {
    customer: { id: 17, fullname: 'Khách thử' },
    timeline: [{
      type: 'treatment',
      date: '2026-10-26',
      treatment: { id: 54, product_id: 23, remaining_sessions: 0, total_sessions: 1, histories: [] },
    }],
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

  render(<QueryClientProvider client={client}><CustomerOverview customerId={17} overview={legacyTreatmentOverview} onOverview={vi.fn()} /></QueryClientProvider>)

  expect(document.querySelector('.timeline-service-name')).toHaveTextContent('Tan nhang')
})

it('hiển thị ghi chú dạng text và chữ ký qua ảnh trong lịch sử', async () => {
  overview.timeline[0].treatment.histories = [{ id: 1, execution_date: '2026-10-28', note: '<script>không chạy</script>', customer_signature_svg: '<svg viewBox="0 0 300 100"><path d="M 10 10 L 20 20"/></svg>', customer_signed_at: '2026-10-28T09:00:00Z' }]
  try {
    const actor = userEvent.setup()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    render(<QueryClientProvider client={client}><CustomerOverview customerId={17} overview={overview} onOverview={vi.fn()} /></QueryClientProvider>)
    await actor.click(screen.getByRole('button', { name: 'Xem lịch sử' }))
    const history = document.querySelector('.treatment-history-compact-item')
    expect(within(history).getByText('· Ghi chú: <script>không chạy</script>')).toBeInTheDocument()
    expect(history.querySelector('script')).toBeNull()
    expect(within(history).getByRole('img')).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml;'))
    expect(history).toHaveTextContent('✓ Đã ký')
  } finally { overview.timeline[0].treatment.histories = [] }
})

it('mở buổi cũ đã ký trong hồ sơ, sửa note và tải lại overview', async () => {
  overview.timeline[0].treatment.histories = [{ id: 77, branch_id: 1, execution_date: '2020-01-01', note: 'Ghi chú cũ', customer_signed_at: '2020-01-01T09:00:00Z' }]
  updateTreatmentHistoryNote.mockResolvedValue({ data: { note: 'Ghi chú mới' } })
  try {
    const actor = userEvent.setup()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    render(<QueryClientProvider client={client}><CustomerOverview customerId={17} overview={overview} onOverview={vi.fn()} /></QueryClientProvider>)
    await actor.click(screen.getByRole('button', { name: 'Xem lịch sử' }))
    await actor.click(screen.getByRole('button', { name: 'Ghi chú / Ký' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Ghi chú và chữ ký' }))
    await actor.clear(dialog.getByRole('textbox'))
    await actor.type(dialog.getByRole('textbox'), 'Ghi chú mới')
    await actor.click(dialog.getByRole('button', { name: 'Lưu ghi chú' }))
    await waitFor(() => expect(getCustomerOverview).toHaveBeenCalledWith(17))
    expect(updateTreatmentHistoryNote).toHaveBeenCalledWith(77, 'Ghi chú mới')
    expect(executeTreatment).not.toHaveBeenCalled()
  } finally { overview.timeline[0].treatment.histories = [] }
})
