import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import SearchPicker from './SearchPicker'

vi.mock('../api/resources', () => ({ listResource: vi.fn(async resource => ({ data: resource === 'customers' ? [{ id: 7, fullname: 'Nguyễn An', phone_number: '0901000000', profile_code: 'HS-007' }] : [{ id: 9, name: 'Chăm sóc da' }], totalPages: 1 })) }))
afterEach(cleanup)

it('đóng khi bấm bên ngoài và chỉ hiện lựa chọn tất cả khi được yêu cầu', async () => {
  const user = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <SearchPicker resource="products" label="Dịch vụ quan tâm" value="" initialLabel="" onChange={vi.fn()} emptyOptionLabel="Tất cả dịch vụ" />
    <SearchPicker resource="products" label="Dịch vụ trong form" value="" initialLabel="" onChange={vi.fn()} />
    <button type="button">Ngoài picker</button>
  </QueryClientProvider>)
  const filterPicker = screen.getByRole('combobox', { name: 'Tìm dịch vụ quan tâm' })
  await user.click(filterPicker)
  expect(filterPicker).toHaveAttribute('aria-expanded', 'true')
  expect(within(screen.getByRole('listbox')).getAllByRole('option')[0]).toHaveTextContent('Tất cả dịch vụ')
  await user.click(screen.getByRole('button', { name: 'Ngoài picker' }))
  expect(filterPicker).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  const formPicker = screen.getByRole('combobox', { name: 'Tìm dịch vụ trong form' })
  await user.click(formPicker)
  expect(screen.getByRole('listbox')).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: 'Tất cả dịch vụ' })).not.toBeInTheDocument()
  await user.click(filterPicker)
  expect(formPicker).toHaveAttribute('aria-expanded', 'false')
  expect(filterPicker).toHaveAttribute('aria-expanded', 'true')
})

it('hiển thị mã hồ sơ và hướng dẫn tìm theo mã khi chọn khách hàng', async () => {
  const user = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <SearchPicker resource="customers" label="Khách hàng" value="" initialLabel="" onChange={vi.fn()} />
  </QueryClientProvider>)
  const picker = screen.getByRole('combobox', { name: 'Tìm khách hàng' })
  expect(picker).toHaveAttribute('placeholder', 'Tìm theo tên, SĐT hoặc mã hồ sơ...')
  await user.click(picker)
  expect(await screen.findByRole('option', { name: 'Nguyễn An · 0901000000 · Mã hồ sơ: HS-007' })).toBeInTheDocument()
})