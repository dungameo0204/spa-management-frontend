import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import TreatmentCustomerList from './TreatmentCustomerList'

vi.mock('./TreatmentCardPanel', () => ({ default: ({ card }) => <div>{card.product_name}</div> }))
vi.mock('./RefreshButton', () => ({ default: () => null }))
vi.mock('../hooks/useProductCatalog', () => ({ useBranchCatalog: () => ({ data: [] }) }))

afterEach(cleanup)

it('renders and expands a backend grouped customer without an id field', async () => {
  const actor = userEvent.setup()
  render(<TreatmentCustomerList customers={[{
    customer_id: 148,
    customer_name: 'Khách overview',
    phone_number: '121155',
    total_debt: 0,
    active_treatments: [{ id: 657, product_name: 'Gói chăm sóc da', remaining_sessions: 1, total_sessions: 5 }],
    completed_treatments: [],
  }]} search="" onSearch={vi.fn()} onRetry={vi.fn()} onOpen={vi.fn()} />)

  expect(screen.getByText('Khách overview')).toBeInTheDocument()
  await actor.click(screen.getByRole('button', { name: 'Khách overview: 1 dịch vụ' }))
  expect(screen.getByText('Gói chăm sóc da')).toBeInTheDocument()
})