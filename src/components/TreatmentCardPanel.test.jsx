import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import TreatmentCardPanel from './TreatmentCardPanel'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { system_role: 'MANAGER', branch_id: 1 } }) }))
vi.mock('../hooks/useProductCatalog', () => ({ useBranchCatalog: () => ({ data: [] }) }))

it('keeps history collapsed until requested, without a detail button', () => {
  render(<QueryClientProvider client={new QueryClient()}><TreatmentCardPanel
    card={{ id: 100, product_name: 'Gói chăm sóc da', children: [{ id: 101, product_name: 'Điện di', remaining_sessions: null, histories: [] }] }}
    branches={[]} embedded
  /></QueryClientProvider>)
  expect(screen.queryByText('Lịch sử thực hiện')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Chi tiết' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Xem lịch sử' }))
  expect(screen.getByText('Lịch sử thực hiện')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn lịch sử' }))
  expect(screen.queryByText('Lịch sử thực hiện')).not.toBeInTheDocument()
})

it('renders completed and today-execution badges in separate layout columns', () => {
  render(<QueryClientProvider client={new QueryClient()}><TreatmentCardPanel
    card={{ id: 100, product_name: 'Gói chăm sóc da', remaining_sessions: 0, total_sessions: 1, histories: [{ id: 501, execution_date: new Date().toISOString(), staffs: [] }] }}
    branches={[]} embedded
  /></QueryClientProvider>)
  expect(screen.getByText('Đã hoàn thành').closest('.treatment-completion-column')).toBeTruthy()
  expect(screen.getByText('Đã thực hiện 1 buổi hôm nay').closest('.treatment-today-column')).toBeTruthy()
})