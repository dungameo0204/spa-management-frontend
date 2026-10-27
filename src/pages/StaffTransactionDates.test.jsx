import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ResourcePage from './ResourcePage'
import TransactionPage from './TransactionPage'
import { createResource, updateResource, getResource, listResource } from '../api/resources'
import { today } from '../utils/format'

const auth = vi.hoisted(() => ({ role: 'STAFF' }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 1, system_role: auth.role, branch_id: 2 } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: 2 }) }))
vi.mock('../api/resources', () => ({
  listResource: vi.fn(), getResource: vi.fn(), createResource: vi.fn(), updateResource: vi.fn(),
  deleteResource: vi.fn(), restoreResource: vi.fn(), getReportDetails: vi.fn(), getRemainingDebt: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  createResource.mockResolvedValue({})
  updateResource.mockResolvedValue({})
})
afterEach(cleanup)

for (const resource of ['expenses', 'imports']) {
  for (const role of ['STAFF', 'MANAGER']) {
    for (const editing of [false, true]) {
      it(`${resource}: ${role} ${editing ? 'sửa' : 'tạo'} phiếu với đúng quyền ngày và payload`, async () => {
        auth.role = role
        const dateKey = resource === 'expenses' ? 'expense_date' : 'import_date'
        const dateLabel = resource === 'expenses' ? 'Ngày chi' : 'Ngày nhập'
        const record = { id: 15, import_code: 'NK-15', note: 'Phiếu kiểm thử', branch_id: 2, created_at: today(), [dateKey]: '2026-09-10', items: resource === 'expenses' ? [{ expense_type: 'Vật tư', amount: 1000 }] : [{ id: 1, product_id: 3, product_name: 'Kem', quantity: 1, unit_price: 1000 }] }
        listResource.mockImplementation(async name => ({ data: name === resource ? [record] : name === 'branches' ? [{ id: 2, name: 'Cơ sở 2' }] : name === 'products' ? [{ id: 3, name: 'Kem' }] : [], totalPages: 1, total: 1, page: 1, pageSize: 20 }))
        getResource.mockResolvedValue(record)
        const actor = userEvent.setup()
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
        render(<QueryClientProvider client={client}><MemoryRouter>{resource === 'expenses' ? <ResourcePage resource={resource} /> : <TransactionPage resource={resource} />}</MemoryRouter></QueryClientProvider>)
        if (editing) {
          if (resource === 'expenses') await actor.click(await screen.findByRole('button', { name: 'Xem 15' }))
          else await actor.click(await screen.findByText('NK-15'))
          await waitFor(() => expect(getResource).toHaveBeenCalledWith(resource, 15))
          await actor.click(await screen.findByRole('button', { name: resource === 'expenses' ? 'Sửa' : 'Chỉnh sửa', exact: true }))
        } else {
          await actor.click(screen.getByRole('button', { name: 'Thêm mới' }))
          if (resource === 'expenses') {
            await actor.type(screen.getByLabelText('Nội dung'), 'Vật tư')
            await actor.type(screen.getByLabelText('Số tiền'), '1000')
          } else {
            await actor.type(screen.getByLabelText('Mã phiếu nhập'), 'NK-MOI')
            await actor.click(screen.getByRole('button', { name: 'Thêm sản phẩm' }))
            await actor.click(screen.getByRole('combobox', { name: 'Tìm sản phẩm' }))
            await actor.click(await screen.findByRole('option', { name: 'Kem' }))
          }
          if (role === 'MANAGER') await actor.selectOptions(screen.getByLabelText('Chi nhánh'), '2')
        }
        if (role === 'STAFF') expect(screen.queryByLabelText(dateLabel)).not.toBeInTheDocument()
        else {
          const input = screen.getByLabelText(dateLabel)
          expect(input).toHaveValue(editing ? '2026-09-10' : today())
          fireEvent.change(input, { target: { value: '2026-09-12' } })
        }
        await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
        const save = editing ? updateResource : createResource
        await waitFor(() => expect(save).toHaveBeenCalled())
        const payload = save.mock.calls[0][editing ? 2 : 1]
        expect(payload.items).toHaveLength(1)
        if (role === 'STAFF') expect(payload).not.toHaveProperty(dateKey)
        else expect(payload[dateKey]).toBe('2026-09-12')
      })
    }
  }
}