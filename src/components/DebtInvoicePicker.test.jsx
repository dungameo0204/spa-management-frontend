import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import DebtInvoicePicker from './DebtInvoicePicker'
import { getRemainingDebt, listResource } from '../api/resources'

vi.mock('../api/resources', () => ({ getRemainingDebt: vi.fn(), listResource: vi.fn() }))

it('hiển thị số tiền thu theo nhóm nghìn nhưng trả về số không có dấu phân cách', async () => {
  listResource.mockResolvedValue({ data: [{ id: 89, customer_id: 1, branch_name: 'CS HN', invoice_date: '2026-10-24' }], totalPages: 1 })
  getRemainingDebt.mockResolvedValue({ remainingDebtAmount: 250000 })
  const onAmountChange = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Harness() {
    const [amounts, setAmounts] = useState({})
    return <DebtInvoicePicker customer={{ id: 1, fullname: 'Khách', total_debt: 250000 }} selected={[{ invoice: { id: 89 } }]} amounts={amounts} onChange={vi.fn()} onAmountChange={(id, value) => { onAmountChange(id, value); setAmounts(current => ({ ...current, [id]: value })) }} />
  }
  render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>)
  const input = await screen.findByRole('textbox', { name: 'Số tiền thu hóa đơn #89' })
  expect(input).toHaveValue('250.000')
  const user = userEvent.setup()
  await user.clear(input)
  await user.type(input, '125000')
  expect(input).toHaveValue('125.000')
  expect(onAmountChange).toHaveBeenLastCalledWith(89, '125000')
})