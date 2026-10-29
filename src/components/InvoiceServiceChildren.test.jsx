import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import InvoiceServiceChildren, { InvoiceTreatmentDetail } from './InvoiceServiceChildren'
import { listResource } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'MANAGER' } }) }))
vi.mock('../api/resources', () => ({ listResource: vi.fn(async resource => ({ data: resource === 'roles' ? [{ id: 4, name: 'Kỹ thuật viên' }] : [{ id: 2, role_id: 4, branch_id: 1, fullname: 'Lan' }, { id: 3, role_id: 4, branch_id: 2, fullname: 'Khác cơ sở' }], totalPages: 1 })) }))
function Wrapper({ children }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
}

it('only edits child counts and explicitly toggles lifetime as null', async () => {
  const onChange = vi.fn(), actor = userEvent.setup()
  const props = { children: [{ product_id: 12, total_sessions: 5 }], queries: [{ data: { id: 12, name: 'Điện di' } }], onChange }
  const { rerender } = render(<InvoiceServiceChildren {...props} />, { wrapper: Wrapper })
  expect(screen.getAllByRole('spinbutton')).toHaveLength(1)
  await actor.click(screen.getByRole('checkbox', { name: 'Trọn đời Điện di' }))
  expect(onChange).toHaveBeenLastCalledWith([{ product_id: 12, total_sessions: null }])
  rerender(<InvoiceServiceChildren {...props} children={[{ product_id: 12, total_sessions: null }]} />)
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  await actor.click(screen.getByRole('checkbox', { name: 'Trọn đời Điện di' }))
  expect(onChange).toHaveBeenLastCalledWith([{ product_id: 12, total_sessions: 1 }])
})

it('selects child staff in grouped checkboxes and publishes only on confirmation', async () => {
  const actor = userEvent.setup(), onChange = vi.fn()
  render(<InvoiceServiceChildren children={[{ product_id: 12, total_sessions: 5, performNow: true }]} queries={[{ data: { id: 12, name: 'Điện di' } }]} branchId={1} onChange={onChange} />, { wrapper: Wrapper })
  expect(screen.getByRole('checkbox', { name: 'Chưa làm Điện di' })).not.toBeChecked()
  await actor.click(screen.getByRole('button', { name: 'Nhân viên làm Điện di' }))
  await actor.click(await screen.findByRole('checkbox', { name: 'Lan' }))
  expect(screen.queryByRole('checkbox', { name: 'Khác cơ sở' })).not.toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
  await actor.click(screen.getByRole('button', { name: 'Xong' }))
  expect(listResource).toHaveBeenCalledWith('staffs', { branchId: 1 }, 1, 100)
  expect(onChange).toHaveBeenLastCalledWith([{ product_id: 12, total_sessions: 5, performStaffs: [{ staff_id: 2 }], performNow: true, staffBranchId: 1 }])
})

it('displays actual child cards including exhausted and lifetime totals', () => {
  render(<InvoiceTreatmentDetail treatment={{ total_sessions: null, children: [{ id: 1, product_name: 'Điện di', total_sessions: null, remaining_sessions: 0 }, { id: 2, product_name: 'Laser', total_sessions: 5, remaining_sessions: 0 }] }} />)
  expect(screen.getByText('Trọn đời')).toBeInTheDocument()
  expect(screen.getByText('5 buổi')).toBeInTheDocument()
})