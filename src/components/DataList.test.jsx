import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import DataList from './DataList'

it('renders toolbar actions immediately beside the result count', () => {
  render(<DataList data={{ total: 1, totalPages: 1, data: [{ id: 1, name: 'Lan' }] }} columns={[{ key: 'name', label: 'Tên' }]} search="" onSearch={vi.fn()} page={1} onPage={vi.fn()} toolbarActions={<button aria-label="Tải lại danh sách">Refresh</button>} />)
  const actions = screen.getByRole('button', { name: 'Tải lại danh sách' }).parentElement
  expect(actions).toHaveClass('list-toolbar-actions')
  expect(actions).toHaveTextContent('1 kết quả')
})