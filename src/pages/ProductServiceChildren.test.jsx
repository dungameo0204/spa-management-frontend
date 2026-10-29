import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import ResourcePage from './ResourcePage'
import { createResource, getResource, listResource, updateResource } from '../api/resources'

const auth = vi.hoisted(() => ({ role: 'MANAGER' }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 1, system_role: auth.role } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: null }) }))
vi.mock('../api/resources', () => ({ listResource: vi.fn(), getResource: vi.fn(), updateResource: vi.fn(), createResource: vi.fn(), deleteResource: vi.fn(), restoreResource: vi.fn(), getReportDetails: vi.fn() }))
const parent = { id: 20, name: 'Gói chăm sóc da', is_product: 0, price: 500000, sale_price: 500000, child_service_ids: [12, 18] }
const children = [{ id: 12, name: 'Chăm sóc da cơ bản', is_product: 0 }, { id: 18, name: 'Điện di tinh chất', is_product: 0 }]
beforeEach(() => {
  vi.resetAllMocks()
  auth.role = 'MANAGER'
  listResource.mockImplementation(async (resource, filters) => ({ data: resource !== 'products' ? [] : filters.is_product === 0 ? [parent, ...children, { id: 30, name: 'Serum', is_product: 1 }] : [parent], total: 1, totalPages: 1 }))
  getResource.mockImplementation(async (_, id) => [parent, ...children].find(item => item.id === Number(id)))
  createResource.mockResolvedValue({})
  updateResource.mockResolvedValue({})
})
function setup() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><ResourcePage resource="products" /></QueryClientProvider>)
  return userEvent.setup()
}
async function edit(actor) {
  await actor.click(await screen.findByRole('button', { name: 'Xem Gói chăm sóc da' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Sửa' })).toBeEnabled())
  await actor.click(screen.getByRole('button', { name: 'Sửa' }))
  return within(screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form'))
}
it('shows child names outside the current page, nests details and saves reordered numeric IDs', async () => {
  const actor = setup()
  expect(await screen.findByText('Có 2 dịch vụ con')).toBeInTheDocument()
  expect(await screen.findByText('Điện di tinh chất')).toBeInTheDocument()
  expect(getResource).toHaveBeenCalledWith('products', 18)
  const form = await edit(actor)
  await actor.click(form.getByRole('button', { name: 'Đưa Điện di tinh chất lên' }))
  expect(form.getAllByRole('listitem')[0]).toHaveTextContent('Điện di tinh chất')
  await actor.click(form.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(updateResource).toHaveBeenCalledWith('products', 20, expect.objectContaining({ child_service_ids: [18, 12] })))
})
it('allows STAFF to clear all links without commissions or deleting services', async () => {
  auth.role = 'STAFF'
  const actor = setup()
  const form = await edit(actor)
  await actor.click(form.getByRole('button', { name: 'Bỏ Chăm sóc da cơ bản' }))
  await actor.click(form.getByRole('button', { name: 'Bỏ Điện di tinh chất' }))
  expect(form.getByText('Chưa có dịch vụ con.')).toBeInTheDocument()
  await actor.click(form.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(updateResource).toHaveBeenCalled())
  const body = updateResource.mock.calls[0][2]
  expect(body.child_service_ids).toEqual([])
  expect(body).not.toHaveProperty('commission_tiers')
  expect(body).not.toHaveProperty('commissions')
})
it('creates a service with children, excludes duplicates, self and retail products', async () => {
  const actor = setup()
  await actor.click(screen.getByRole('button', { name: 'Thêm mới' }))
  const form = within(screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form'))
  expect(form.queryByRole('region', { name: 'Dịch vụ con' })).not.toBeInTheDocument()
  await actor.type(form.getByLabelText('Tên sản phẩm / dịch vụ'), 'Gói mới')
  await actor.selectOptions(form.getByLabelText('Phân loại'), '0')
  await actor.click(form.getByRole('button', { name: 'Thêm dịch vụ con' }))
  await actor.click(form.getByRole('combobox', { name: 'Tìm dịch vụ con' }))
  await actor.click(await screen.findByRole('option', { name: 'Chăm sóc da cơ bản' }))
  await actor.click(form.getByRole('button', { name: 'Thêm dịch vụ con' }))
  await actor.click(form.getByRole('combobox', { name: 'Tìm dịch vụ con' }))
  expect(screen.queryByRole('option', { name: 'Chăm sóc da cơ bản' })).not.toBeInTheDocument()
  expect(screen.queryByRole('option', { name: 'Serum' })).not.toBeInTheDocument()
  await actor.click(form.getByRole('button', { name: 'Hủy thêm' }))
  await actor.click(form.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(createResource).toHaveBeenCalledWith('products', expect.objectContaining({ child_service_ids: [12] })))
})
it('excludes the edited parent and retains links when API rejects a cycle', async () => {
  updateResource.mockRejectedValue(new Error('Không được tạo chu trình dịch vụ.'))
  const actor = setup()
  const form = await edit(actor)
  await actor.click(form.getByRole('button', { name: 'Thêm dịch vụ con' }))
  await actor.click(form.getByRole('combobox', { name: 'Tìm dịch vụ con' }))
  await screen.findByText('Không tìm thấy kết quả')
  expect(screen.queryByRole('option', { name: parent.name })).not.toBeInTheDocument()
  await actor.click(form.getByRole('button', { name: 'Hủy thêm' }))
  await actor.click(form.getByRole('button', { name: 'Lưu thay đổi' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Không được tạo chu trình dịch vụ.')
  expect(form.getAllByRole('listitem')).toHaveLength(2)
})