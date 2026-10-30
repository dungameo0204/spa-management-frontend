import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ResourcePage from './ResourcePage'
import InvoicesPage from './InvoicesPage'
import DetailNote from '../components/DetailNote'
import { getCustomerOverview, getResource, listResource } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 1, system_role: 'MANAGER' } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: 2 }) }))
vi.mock('../api/resources', () => ({
  listResource: vi.fn(), getResource: vi.fn(), getCustomerOverview: vi.fn(),
  createResource: vi.fn(), updateResource: vi.fn(), deleteResource: vi.fn(), restoreResource: vi.fn(),
  getReportDetails: vi.fn(), executeTreatment: vi.fn(), assignTreatmentStaffs: vi.fn(),
}))

const note = 'Khách VIP\n27/10/2026 Khách đổi 1 buổi nặn mụn thành 1 buổi peel\n28/10/2026 Khách muốn đổi lịch'
const customer = { id: 20, fullname: 'Lan', phone_number: '0900000000', wallet_balance: 0, total_debt: 0, note }

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

function show(component) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter>{component}</MemoryRouter></QueryClientProvider>)
}

function expectMultilineNote() {
  const section = screen.getByRole('region', { name: 'Ghi chú' })
  const text = section.querySelector('p')
  expect(text.textContent).toBe(note)
  expect(text).toHaveStyle({ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' })
}

it('mở chi tiết khách hàng hiển thị ghi chú nhiều dòng từ hồ sơ API', async () => {
  listResource.mockImplementation(async resource => ({ data: resource === 'customers' ? [{ ...customer, note: undefined }] : [], totalPages: 1 }))
  getCustomerOverview.mockResolvedValue({ customer, timeline: [] })
  show(<ResourcePage resource="customers" />)
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Xem Lan' }))
  await screen.findByRole('region', { name: 'Ghi chú' })
  expectMultilineNote()
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getAllByText('Nợ:')).toHaveLength(1)
  expect(dialog.querySelector('.customer-identity')).toHaveTextContent('Nợ: 0 ₫')
  expect(within(dialog).queryByLabelText('Công nợ khách hàng')).not.toBeInTheDocument()
  expect(within(dialog).queryByText('Nợ hóa đơn còn lại:')).not.toBeInTheDocument()
  expect(within(dialog).queryByText('Nợ cũ không có hóa đơn còn lại:')).not.toBeInTheDocument()
})

it('mở chi tiết hóa đơn hiển thị ghi chú từ API chi tiết, giữ xuống dòng', async () => {
  const invoice = { id: 15, customer_id: 20, customer_name: 'Lan', branch_name: 'Cơ sở 2', total_amount: 1000, paid_amount: 1000, items: [] }
  listResource.mockImplementation(async resource => ({ data: resource === 'invoices' ? [invoice] : [], totalPages: 1 }))
  getResource.mockImplementation(async resource => resource === 'invoices' ? { ...invoice, note } : customer)
  show(<InvoicesPage />)
  await userEvent.setup().click(await screen.findByText('Lan'))
  await screen.findByRole('region', { name: 'Ghi chú' })
  expect(within(screen.getByRole('dialog')).getByRole('region', { name: 'Ghi chú' })).toBeInTheDocument()
  expectMultilineNote()
})

it.each([undefined, null, '', '  \n  '])('không hiển thị mục ghi chú rỗng: %s', note => {
  render(<DetailNote note={note} />)
  expect(screen.queryByRole('region', { name: 'Ghi chú' })).not.toBeInTheDocument()
})

it('ghi chú chứa thẻ HTML chỉ hiển thị như văn bản', () => {
  const { container } = render(<DetailNote note={'<script>alert(1)</script>\n<strong>VIP</strong>'} />)
  expect(container.querySelector('script')).toBeNull()
  expect(container.querySelector('strong')).toBeNull()
  expect(container.querySelector('p').textContent).toBe('<script>alert(1)</script>\n<strong>VIP</strong>')
})