import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import DebtInvoicePicker from './DebtInvoicePicker'
import { getRemainingDebt, listResource } from '../api/resources'

vi.mock('../api/resources', () => ({ getRemainingDebt: vi.fn(), listResource: vi.fn() }))

const invoice = { id: 89, customer_id: 1, branch_name: 'CS HN', invoice_date: '2026-10-24' }
const debt = { remainingDebtAmount: 250000 }
beforeEach(() => {
  vi.resetAllMocks()
  listResource.mockResolvedValue({ data: [invoice], totalPages: 1 })
  getRemainingDebt.mockResolvedValue(debt)
})
afterEach(cleanup)

function show({ preselected = false } = {}) {
  const onAmountChange = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Harness() {
    const [selected, setSelected] = useState(preselected ? [{ invoice, debt }] : [])
    const [amounts, setAmounts] = useState({})
    return <DebtInvoicePicker customer={{ id: 1, fullname: 'Khách', total_debt: 250000 }} selected={selected} onChange={setSelected} amounts={amounts} onAmountChange={(id, value) => { onAmountChange(id, value); setAmounts(current => ({ ...current, [id]: value })) }} />
  }
  render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>)
  return onAmountChange
}

it('hiển thị nhóm nghìn nhưng callback trả chuỗi tiền không có dấu phân cách', async () => {
  const onAmountChange = show({ preselected: true })
  const input = await screen.findByRole('textbox', { name: 'Số tiền thu hóa đơn #89' })
  expect(input).toHaveValue('250.000')
  const actor = userEvent.setup()
  await actor.clear(input)
  await actor.type(input, '125000')
  expect(input).toHaveValue('125.000')
  expect(onAmountChange).toHaveBeenLastCalledWith(89, '125000')
  expect(within(screen.getByRole('status', { name: 'Tổng tiền thu của khách' })).getByText(/125\.000/)).toBeInTheDocument()
})

it('chọn và bỏ chọn hóa đơn thực tế cập nhật tổng thu theo công nợ API', async () => {
  show()
  const total = screen.getByRole('status', { name: 'Tổng tiền thu của khách' })
  const checkbox = await screen.findByRole('checkbox', { name: /Hóa đơn #89/ })
  const actor = userEvent.setup()
  await actor.click(checkbox)
  expect(screen.getByRole('textbox', { name: 'Số tiền thu hóa đơn #89' })).toHaveValue('250.000')
  expect(total).toHaveTextContent('250.000')
  await actor.click(checkbox)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(total).not.toHaveTextContent('250.000')
  expect(total).toHaveTextContent('0')
})