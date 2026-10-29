import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import InvoiceChildStaffPicker from './InvoiceChildStaffPicker'
import { listResource } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role:'MANAGER' } }) }))
vi.mock('../api/resources', () => ({ listResource:vi.fn() }))
const people = Array.from({ length:50 }, (_, i) => ({ id:i + 1, fullname:i === 49 ? 'Đặng Thị Hồng' : `Nhân viên ${i + 1}`, branch_id:1, role_id:i % 2 ? 5 : 4 }))
beforeEach(() => {
  vi.resetAllMocks()
  listResource.mockImplementation(async resource => ({ data:resource === 'roles' ? [{ id:4, name:'Kỹ thuật viên' }, { id:5, name:'Bác sĩ' }] : people, totalPages:1 }))
})
function show(onChange = vi.fn(), selected = []) {
  const client = new QueryClient({ defaultOptions:{ queries:{ retry:false } } })
  render(<QueryClientProvider client={client}><InvoiceChildStaffPicker name="pnp" branchId={1} selected={selected} onChange={onChange} /></QueryClientProvider>)
  return onChange
}

it('searches 50 staff without accents, filters roles and retains selections hidden by filters', async () => {
  const actor = userEvent.setup(), onChange = show()
  await actor.click(screen.getByRole('button', { name:'Nhân viên làm pnp' }))
  await screen.findByText('Hiển thị 50/50 nhân viên')
  const dialog = screen.getByRole('dialog', { name:'Nhân viên làm pnp' })
  expect(dialog.querySelector('.invoice-staff-avatar')).toBeNull()
  expect([...dialog.querySelectorAll('legend')].map(element => element.textContent)).toEqual(['Kỹ thuật viên', 'Bác sĩ'])
  const search = screen.getByRole('searchbox', { name:'Tìm nhân viên' })
  await actor.type(search, 'dang hong')
  expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  await actor.click(screen.getByRole('checkbox', { name:'Đặng Thị Hồng' }))
  await actor.selectOptions(screen.getByRole('combobox', { name:'Lọc chức vụ' }), '4')
  expect(screen.getByText('Không tìm thấy nhân viên phù hợp.')).toBeInTheDocument()
  expect(within(screen.getByLabelText('Nhân viên đã chọn')).getByRole('button', { name:'Bỏ chọn Đặng Thị Hồng' })).toBeInTheDocument()
  await actor.click(screen.getByRole('button', { name:'Xóa bộ lọc' }))
  expect(screen.getByRole('checkbox', { name:'Đặng Thị Hồng' })).toBeChecked()
  await actor.click(screen.getByRole('button', { name:'Xong' }))
  expect(onChange).toHaveBeenCalledWith([{ staff_id:50 }])
})

it('loads all pages and cancellation does not publish draft changes', async () => {
  listResource.mockImplementation(async (resource, filters, page) => resource === 'roles' ? { data:[{ id:5, name:'Bác sĩ' }], totalPages:1 } : { data:page === 1 ? people.slice(0, 49) : people.slice(49), totalPages:2 })
  const actor = userEvent.setup(), onChange = show(vi.fn(), [{ staff_id:50 }])
  await actor.click(screen.getByRole('button', { name:'Nhân viên làm pnp' }))
  await screen.findByRole('checkbox', { name:'Đặng Thị Hồng' })
  expect(listResource).toHaveBeenCalledWith('staffs', { branchId:1 }, 2, 100)
  await actor.click(screen.getByRole('button', { name:'Bỏ chọn Đặng Thị Hồng' }))
  await actor.click(screen.getByRole('button', { name:'Hủy', exact:true }))
  expect(onChange).not.toHaveBeenCalled()
  await actor.click(screen.getByRole('button', { name:'Nhân viên làm pnp' }))
  expect(await screen.findByRole('checkbox', { name:'Đặng Thị Hồng' })).toBeChecked()
})