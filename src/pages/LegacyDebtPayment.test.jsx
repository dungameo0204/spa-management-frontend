import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TransactionPage from './TransactionPage'
import { createLegacyDebtPayment, createResource, getRemainingDebt, getResource, listResource } from '../api/resources'
import { loadReceipt } from '../utils/printReceipt'

const context = vi.hoisted(() => ({ role: 'STAFF', branch: 2 }))
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: context.role, branch_id: 2 } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: context.branch }) }))
vi.mock('../api/resources', () => ({ listResource: vi.fn(), getResource: vi.fn(), createResource: vi.fn(), createLegacyDebtPayment: vi.fn(), getRemainingDebt: vi.fn(), updateResource: vi.fn(), deleteResource: vi.fn() }))
vi.mock('../utils/printReceipt', () => ({ loadReceipt: vi.fn() }))

const customer = { id: 123, fullname: 'Khách hỗn hợp', total_debt: 1500000, invoice_debt: 1000000, legacy_debt: 500000 }
beforeEach(() => {
  vi.resetAllMocks()
  context.role = 'STAFF'; context.branch = 2
  listResource.mockImplementation(async resource => ({ data: resource === 'customers' ? [{ id: customer.id, fullname: customer.fullname }] : resource === 'branches' ? [{ id: 2, name: 'Cơ sở Hai' }] : resource === 'invoices' ? [{ id: 12, customer_id: 123, debt_amount: 1000000 }] : [], total: resource === 'debts' ? 0 : 1 }))
  getResource.mockResolvedValue(customer)
  getRemainingDebt.mockResolvedValue({ invoiceId: 12, remainingDebtAmount: 1000000 })
  createLegacyDebtPayment.mockResolvedValue({ debtPaymentId: 9 })
  loadReceipt.mockResolvedValue({ type: 'debts', records: [{ id: 9, customer_name: customer.fullname, invoice_id: null, amount: 200000, payment_method: 'TRANSFER', payment_date: '2026-10-30', collection_branch_name: 'Cơ sở Hai' }] })
  vi.spyOn(window, 'print').mockImplementation(() => {})
  createResource.mockResolvedValue({ debtPaymentId: 8 })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

async function openForm({ legacy = true } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const actor = userEvent.setup()
  render(<QueryClientProvider client={client}><MemoryRouter><TransactionPage resource="debts" /></MemoryRouter></QueryClientProvider>)
  await actor.click(screen.getByRole('button', { name: 'Thêm mới' }))
  await actor.click(screen.getByRole('combobox', { name: 'Tìm khách hàng' }))
  await actor.click(await screen.findByRole('option', { name: customer.fullname }))
  await screen.findByLabelText('Công nợ khách hàng')
  if (legacy) await actor.selectOptions(screen.getByLabelText('Loại thu nợ'), 'legacy')
  return { actor, invalidate, client }
}

for (const method of ['CASH', 'TRANSFER', 'CARD']) {
  it(`collects only legacy debt with ${method}, staff branch from token, refreshes dependent data`, async () => {
    const { actor, invalidate } = await openForm()
    expect(getResource).toHaveBeenCalledWith('customers', 123)
    expect(screen.getByText(/Nợ cũ có thể thu: 500\.000/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Cơ sở thu')).not.toBeInTheDocument()
    expect(screen.getByLabelText('In phiếu sau khi lưu')).not.toBeChecked()
    expect(screen.getByLabelText('Số tiền thu')).toHaveValue('500.000')
    fireEvent.change(screen.getByLabelText('Số tiền thu'), { target: { value: '200000' } })
    await actor.selectOptions(screen.getByLabelText('Phương thức thanh toán'), method)
    await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(createLegacyDebtPayment).toHaveBeenCalledExactlyOnceWith({ customer_id: 123, amount: 200000, payment_method: method }))
    expect(createResource).not.toHaveBeenCalled()
    for (const key of ['customers', 'picker', 'reports', 'overview']) expect(invalidate).toHaveBeenCalledWith({ queryKey: [key] }, { throwOnError: true })
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['debts'] }))
    await screen.findByText('Đã ghi nhận khoản thu nợ cũ.')
  })
}

it('requires a collecting branch for managers and sends that branch', async () => {
  context.role = 'MANAGER'; context.branch = ''
  const { actor } = await openForm()
  fireEvent.change(screen.getByLabelText('Số tiền thu'), { target: { value: '500000' } })
  await actor.selectOptions(screen.getByLabelText('Cơ sở thu'), '2')
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(createLegacyDebtPayment).toHaveBeenCalledWith(expect.objectContaining({ collection_branch_id: 2 })))
})

it('rejects amounts above legacy debt even when total debt is larger', async () => {
  await openForm()
  fireEvent.change(screen.getByLabelText('Số tiền thu'), { target: { value: '600000' } })
  expect(screen.getByText(/Số tiền thu vượt nợ không hóa đơn còn lại/)).toHaveClass('form-alert')
  expect(screen.getByLabelText('Số tiền thu')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
  expect(createLegacyDebtPayment).not.toHaveBeenCalled()
})

for (const balance of [undefined, 0]) {
  it(`blocks saving with ${balance === undefined ? 'missing' : 'zero'} legacy balance`, async () => {
    getResource.mockResolvedValue({ ...customer, legacy_debt: balance })
    await openForm()
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
    expect(screen.getByText(balance === undefined ? 'Chưa xác định được số dư nợ cũ. Vui lòng tải lại thông tin khách hàng.' : 'Khách không còn nợ không hóa đơn để thu. Vui lòng chọn Thu nợ hóa đơn nếu cần.')).toHaveClass('form-alert')
    expect(screen.getByLabelText('Số tiền thu')).toHaveValue(balance === undefined ? '' : '0')
  })
}

it('does not rebalance inconsistent customer data', async () => {
  getResource.mockResolvedValue({ ...customer, total_debt: 500000, invoice_debt: 1000000, legacy_debt: 0 })
  await openForm()
  expect(screen.getByText(/cần đối soát dữ liệu/)).toHaveAttribute('role', 'alert')
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
})

it('retains the form on backend rejection and refreshes the customer balance', async () => {
  createLegacyDebtPayment.mockRejectedValue(new Error('Số tiền vượt nợ cũ còn lại'))
  const { actor } = await openForm()
  fireEvent.change(screen.getByLabelText('Số tiền thu'), { target: { value: '200000' } })
  getResource.mockResolvedValue({ ...customer, legacy_debt: 100000, total_debt: 1100000 })
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await screen.findByText('Số tiền vượt nợ cũ còn lại')
  await waitFor(() => expect(getResource.mock.calls.length).toBeGreaterThan(1))
  await screen.findByText(/Nợ cũ có thể thu: 100\.000/)
  expect(screen.getByLabelText('Số tiền thu')).toHaveValue('200.000')
})

it('prevents duplicate submission while the request is pending', async () => {
  let resolve
  createLegacyDebtPayment.mockImplementation(() => new Promise(done => { resolve = done }))
  const { actor } = await openForm()
  fireEvent.change(screen.getByLabelText('Số tiền thu'), { target: { value: '200000' } })
  const button = screen.getByRole('button', { name: 'Lưu thay đổi' })
  await actor.dblClick(button)
  expect(createLegacyDebtPayment).toHaveBeenCalledTimes(1)
  expect(button).toBeDisabled()
  resolve({})
  await screen.findByText('Đã ghi nhận khoản thu nợ cũ.')
})

it('preserves the existing invoice-based API flow', async () => {
  const { actor } = await openForm({ legacy: false })
  await actor.click(await screen.findByRole('checkbox', { name: /Hóa đơn #12/ }))
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(createResource).toHaveBeenCalledWith('debts', expect.objectContaining({ invoice_id: 12, amount: 1000000 })))
  expect(createLegacyDebtPayment).not.toHaveBeenCalled()
})

for (const amount of ['', '0']) {
  it(`immediately blocks an ${amount === '' ? 'empty' : 'zero'} amount without restoring the default`, async () => {
    await openForm()
    fireEvent.change(screen.getByLabelText('Số tiền thu'), { target: { value: amount } })
    expect(screen.getByText('Số tiền thu phải lớn hơn 0.')).toHaveClass('form-alert')
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
    expect(screen.getByLabelText('Số tiền thu')).toHaveValue(amount)
  })
}

it('saves the default legacy balance rather than total debt', async () => {
  const { actor } = await openForm()
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(createLegacyDebtPayment).toHaveBeenCalledExactlyOnceWith({ customer_id: 123, amount: 500000, payment_method: 'CASH' }))
})

it('defaults for a new customer and on re-entering legacy mode, but preserves edits on refetch', async () => {
  const nextCustomer = { ...customer, id: 456, fullname: 'Khách tiếp theo', legacy_debt: 300000, total_debt: 1300000 }
  const { actor, client } = await openForm()
  fireEvent.change(screen.getByLabelText('Số tiền thu'), { target: { value: '200000' } })
  getResource.mockResolvedValue({ ...customer, legacy_debt: 400000 })
  await client.invalidateQueries({ queryKey: ['customers', 'debt-detail'] })
  await screen.findByText(/Nợ cũ có thể thu: 400\.000/)
  expect(screen.getByLabelText('Số tiền thu')).toHaveValue('200.000')
  listResource.mockResolvedValue({ data: [nextCustomer], total: 1 })
  getResource.mockResolvedValue(nextCustomer)
  await client.invalidateQueries({ queryKey: ['picker'] })
  await actor.click(screen.getByRole('combobox', { name: 'Tìm khách hàng' }))
  await actor.click(await screen.findByRole('option', { name: nextCustomer.fullname }))
  await waitFor(() => expect(screen.getByLabelText('Số tiền thu')).toHaveValue('300.000'))
  fireEvent.change(screen.getByLabelText('Số tiền thu'), { target: { value: '100000' } })
  fireEvent.change(screen.getByLabelText('Loại thu nợ', { selector: 'select' }), { target: { value: 'invoice' } })
  fireEvent.change(screen.getByLabelText('Loại thu nợ', { selector: 'select' }), { target: { value: 'legacy' } })
  await waitFor(() => expect(screen.getByLabelText('Số tiền thu')).toHaveValue('300.000'))
})

it('prints only the persisted legacy payment after a successful save', async () => {
  const { actor } = await openForm()
  await actor.click(screen.getByLabelText('In phiếu sau khi lưu'))
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(loadReceipt).toHaveBeenCalledExactlyOnceWith('debts', [9]))
  expect(document.getElementById('receipt-print')).toHaveTextContent('Thu nợ')
  expect(document.getElementById('receipt-print')).not.toHaveTextContent(/Nợ cũ|không có hóa đơn/)
  expect(document.getElementById('receipt-print')).toHaveTextContent('200.000')
  await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1))
})

it('does not print a rejected payment', async () => {
  createLegacyDebtPayment.mockRejectedValue(new Error('Không thể thu'))
  const { actor } = await openForm()
  await actor.click(screen.getByLabelText('In phiếu sau khi lưu'))
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await screen.findByText('Không thể thu')
  expect(loadReceipt).not.toHaveBeenCalled()
})

it('reports printing failure without retrying the saved payment', async () => {
  loadReceipt.mockRejectedValue(new Error('Mất kết nối'))
  const { actor } = await openForm()
  await actor.click(screen.getByLabelText('In phiếu sau khi lưu'))
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await screen.findByText(/Đã lưu giao dịch nhưng không tải được bản in: Mất kết nối.*không thu lại/)
  expect(createLegacyDebtPayment).toHaveBeenCalledTimes(1)
  expect(window.print).not.toHaveBeenCalled()
})

it('does not invent a receipt identifier when the saved response omits it', async () => {
  createLegacyDebtPayment.mockResolvedValue({})
  const { actor } = await openForm()
  await actor.click(screen.getByLabelText('In phiếu sau khi lưu'))
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await screen.findByText(/phản hồi thiếu mã phiếu để in/)
  expect(createLegacyDebtPayment).toHaveBeenCalledTimes(1)
  expect(loadReceipt).not.toHaveBeenCalled()
})