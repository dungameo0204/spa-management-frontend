import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import TreatmentCustomerList from './TreatmentCustomerList'

vi.mock('../hooks/useProductCatalog', () => ({ useBranchCatalog: () => ({ data: [] }) }))
vi.mock('./TreatmentCardPanel', () => ({ default: ({ card }) => <div>{card.product_name} · {card.total_debt}</div> }))

it('renders backend customer groups and delegates pagination without regrouping treatment cards', () => {
  const onPage = vi.fn()
  render(<QueryClientProvider client={new QueryClient()}><TreatmentCustomerList
    customers={[{ customer_id: 9, customer_name: 'Lan', phone_number: '0909', total_debt: 1500000, active_treatments: [{ id: 11, product_name: 'Laser' }], completed_treatments: [{ id: 12, product_name: 'Peel' }] }]}
    page={1}
    totalPages={2}
    totalItems={21}
    search=""
    onSearch={vi.fn()}
    onPage={onPage}
    onRetry={vi.fn()}
  /></QueryClientProvider>)

  expect(screen.getByText('Lan')).toBeInTheDocument()
  expect(screen.getByText('0909')).toBeInTheDocument()
  expect(document.querySelector('.debt-badge')).toHaveTextContent(/1[,.]?500[,.]?000/)
  fireEvent.click(screen.getByRole('button', { name: 'Lan: 1 dịch vụ' }))
  expect(screen.getByText('Laser · 1500000')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }))
  expect(onPage).toHaveBeenCalledWith(2)
})