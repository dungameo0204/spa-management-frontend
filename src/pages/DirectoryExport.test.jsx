import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import ResourcePage from './ResourcePage'
import InventoryPage from './InventoryPage'
import TreatmentsPage from './TreatmentsPage'
import { listResource } from '../api/resources'
import { exportTable } from '../utils/exportTable'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 1, system_role: 'MANAGER' } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: '2' }) }))
vi.mock('../utils/exportTable', () => ({ exportTable: vi.fn() }))
vi.mock('../api/resources', () => ({ listResource: vi.fn(), getResource: vi.fn(async () => ({ histories: [] })), createResource: vi.fn(), updateResource: vi.fn(), deleteResource: vi.fn(), restoreResource: vi.fn(), getCustomerOverview: vi.fn(), getReportDetails: vi.fn(), executeTreatment: vi.fn(), assignTreatmentStaffs: vi.fn(), undoTreatmentExecution: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
  listResource.mockImplementation(async (resource, filters, page = 1) => ({ total: 2, totalPages: ['customers', 'products', 'treatments'].includes(resource) ? 2 : 1, data: resource === 'customers' ? [{ id: page, fullname: `Lan ${page}`, phone_number: '0901234567' }] : resource === 'products' ? [{ id: page, name: `Kem ${page}`, is_product: 1, inventory: [{ branch_id: 1, branch_name: 'A', quantity: 8 }, { branch_id: 2, branch_name: 'B', quantity: 3 }] }] : resource === 'treatments' ? [{ id: page, customer_id: page, customer_name: `Lan ${page}`, product_name: 'Laser', remaining_sessions: 2, total_sessions: 5 }] : [] }))
})

function show(page) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{page}</MemoryRouter></QueryClientProvider>)
}

it.each(['customers', 'products'])('exports all pages from the %s directory with the search filter', async resource => {
  show(<ResourcePage resource={resource} />)
  const search = screen.getByRole('textbox', { name: 'Tìm kiếm' })
  await userEvent.type(search, 'Lan')
  await waitFor(() => expect(listResource).toHaveBeenCalledWith(resource, { search: 'Lan' }, 1, 20, expect.anything()))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Xuất Excel' })).toBeEnabled())
  await userEvent.click(screen.getByRole('button', { name: 'Xuất Excel' }))
  await waitFor(() => expect(exportTable).toHaveBeenCalledTimes(1))
  expect(exportTable.mock.calls[0][0].rows).toHaveLength(2)
  expect(listResource).toHaveBeenCalledWith(resource, { search: 'Lan' }, 2, 100)
})

it('exports all stock pages for only the selected branch', async () => {
  show(<InventoryPage />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Xuất Excel' })).toBeEnabled())
  await userEvent.click(screen.getByRole('button', { name: 'Xuất Excel' }))
  await waitFor(() => expect(exportTable).toHaveBeenCalledTimes(1))
  expect(exportTable.mock.calls[0][0].rows).toEqual([1, 2].map(page => ({ name: `Kem ${page}`, branch_name: 'B', quantity: 3, unit: undefined })))
  expect(listResource).toHaveBeenCalledWith('products', { is_product: 1, search: '' }, 2, 100)
})

it('exports all loaded treatment cards rather than the visible customer page', async () => {
  show(<TreatmentsPage />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Xuất Excel' })).toBeEnabled())
  await userEvent.click(screen.getByRole('button', { name: 'Xuất Excel' }))
  await waitFor(() => expect(exportTable).toHaveBeenCalledTimes(1))
  expect(exportTable.mock.calls[0][0].rows.map(row => row.id)).toEqual([1, 2])
  expect(listResource).toHaveBeenCalledWith('treatments', { customerSearch: '' }, 2, 100)
})