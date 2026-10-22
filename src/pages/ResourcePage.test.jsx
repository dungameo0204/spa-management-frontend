import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import ResourcePage from './ResourcePage'
import { createResource, updateResource } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 1, system_role: 'MANAGER', fullname: 'Admin' } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: null }) }))
vi.mock('../api/resources', () => ({
  listResource: vi.fn(async resource => ({ total: 1, page: 1, pageSize: 20, totalPages: 1, data: resource === 'users' ? [{ id: 15, username: 'bs.ly', fullname: 'BS Lý', system_role: 'MANAGER', branch_id: null, branch_name: 'Tổng công ty' }] : resource === 'products' ? [{ id: 3, name: 'Laser', price: 1000000, sale_price: 800000, is_product: 1 }] : [] })),
  getResource: vi.fn(async resource => resource === 'products' ? { id: 3, name: 'Laser', price: 1000000, sale_price: 800000, is_product: 1 } : { id: 15, username: 'bs.ly', fullname: 'BS Lý', system_role: 'MANAGER', branch_id: null }),
  updateResource: vi.fn(async () => ({})),
  createResource: vi.fn(), deleteResource: vi.fn(), restoreResource: vi.fn(), getReportDetails: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

it('hiển thị giá niêm yết trước giá bán trong danh sách sản phẩm', async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ResourcePage resource="products" /></QueryClientProvider>)
  const table = (await screen.findByRole('button', { name: 'Xem Laser' })).closest('table')
  const headings = within(table).getAllByRole('columnheader').map(header => header.textContent)
  expect(headings.slice(0, 3)).toEqual(['Tên', 'Giá niêm yết', 'Giá bán'])
  const cells = within(table).getAllByRole('row')[1].querySelectorAll('td')
  expect(cells[1]).toHaveAttribute('data-label', 'Giá niêm yết')
  expect(cells[1]).toHaveTextContent('1.000.000')
  expect(cells[2]).toHaveAttribute('data-label', 'Giá bán')
  expect(cells[2]).toHaveTextContent('800.000')
})

it('sửa MANAGER không có chi nhánh và gửi branchId null', async () => {
  const actor = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ResourcePage resource="users" /></QueryClientProvider>)
  await actor.click(await screen.findByRole('button', { name: /Xem BS Lý/ }))
  await actor.click(await screen.findByRole('button', { name: 'Sửa' }))
  const form = screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form')
  await actor.clear(within(form).getByLabelText('Họ tên'))
  await actor.type(within(form).getByLabelText('Họ tên'), 'Tên mới')
  await actor.click(within(form).getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(updateResource).toHaveBeenCalledWith('users', 15, expect.objectContaining({ fullname: 'Tên mới', systemRole: 'MANAGER', branchId: null })))
})

it('chuyển MANAGER sang STAFF vẫn yêu cầu chọn chi nhánh', async () => {
  const actor = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ResourcePage resource="users" /></QueryClientProvider>)
  await actor.click(await screen.findByRole('button', { name: /Xem BS Lý/ }))
  await actor.click(await screen.findByRole('button', { name: 'Sửa' }))
  const form = screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form')
  await actor.selectOptions(within(form).getByLabelText('Quyền'), 'STAFF')
  await actor.click(within(form).getByRole('button', { name: 'Lưu thay đổi' }))
  expect(screen.getByText('Nhân viên cần được gán chi nhánh.')).toBeInTheDocument()
  expect(updateResource).not.toHaveBeenCalled()
})

it('thêm sản phẩm tự điền giá bán rồi cho sửa riêng và hiển thị cả hai giá', async () => {
  const actor = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ResourcePage resource="products" /></QueryClientProvider>)
  expect((await screen.findAllByText(/800\.000/)).length).toBeGreaterThan(0)
  await actor.click(screen.getByRole('button', { name: 'Thêm mới' }))
  const form = screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form')
  await actor.type(within(form).getByLabelText('Tên sản phẩm / dịch vụ'), 'Laser mới')
  const price = within(form).getByLabelText('Giá niêm yết')
  const sale = within(form).getByLabelText('Giá bán')
  await actor.clear(price)
  await actor.type(price, '1000000')
  expect(sale.value).toBe(price.value)
  await actor.clear(sale)
  await actor.type(sale, '800000')
  await actor.click(within(form).getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(createResource).toHaveBeenCalledWith('products', expect.objectContaining({ name: 'Laser mới', price: 1000000, sale_price: 800000 })))
})

it('sửa giá niêm yết của sản phẩm đang có chiết khấu không tự ghi đè giá bán', async () => {
  const actor = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ResourcePage resource="products" /></QueryClientProvider>)
  await actor.click(await screen.findByRole('button', { name: 'Xem Laser' }))
  await actor.click(await screen.findByRole('button', { name: 'Sửa' }))
  const form = screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form')
  await actor.clear(within(form).getByLabelText('Giá niêm yết'))
  await actor.type(within(form).getByLabelText('Giá niêm yết'), '1200000')
  await actor.click(within(form).getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(updateResource).toHaveBeenCalledWith('products', 3, expect.objectContaining({ price: 1200000, sale_price: 800000 })))
})