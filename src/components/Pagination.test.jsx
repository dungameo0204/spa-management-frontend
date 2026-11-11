import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import Pagination, { getPageNumbers } from './Pagination'
import DataList from './DataList'

afterEach(cleanup)

it('rút gọn số trang ở đầu, giữa và cuối danh sách', () => {
  expect(getPageNumbers(1, 3)).toEqual([1, 2, 3])
  expect(getPageNumbers(1, 12)).toEqual([1, 2, 3, 4, 5, '...', 12])
  expect(getPageNumbers(6, 12)).toEqual([1, '...', 5, 6, 7, '...', 12])
  expect(getPageNumbers(12, 12)).toEqual([1, '...', 8, 9, 10, 11, 12])
})

it('ẩn phân trang khi danh sách chỉ có một trang', () => {
  render(<Pagination page={1} totalPages={1} totalItems={10} pageSize={20} onChange={vi.fn()} />)
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
})

it('hiển thị khoảng bản ghi, trạng thái trang và chuyển trang bằng số hoặc mũi tên', () => {
  const onChange = vi.fn()
  render(<Pagination page={2} totalPages={3} totalItems={45} pageSize={20} onChange={onChange} />)
  expect(screen.getByRole('navigation')).toHaveTextContent('21 - 40')
  expect(screen.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page')
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
  expect(onChange).toHaveBeenLastCalledWith(3)
  fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }))
  expect(onChange).toHaveBeenLastCalledWith(1)
  fireEvent.click(screen.getByRole('button', { name: 'Trang 3', exact: true }))
  expect(onChange).toHaveBeenLastCalledWith(3)
  onChange.mockClear()
  fireEvent.click(screen.getByRole('button', { name: 'Trang 2', exact: true }))
  expect(onChange).not.toHaveBeenCalled()
})

it('khóa mũi tên ở biên và không submit form khi chuyển trang bản gọn', () => {
  const onSubmit = vi.fn(event => event.preventDefault()), onChange = vi.fn()
  const { rerender } = render(<form onSubmit={onSubmit}><Pagination compact page={1} totalPages={2} onChange={onChange} /></form>)
  expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
  expect(onChange).toHaveBeenCalledWith(2)
  expect(onSubmit).not.toHaveBeenCalled()
  rerender(<Pagination page={2} totalPages={2} onChange={onChange} />)
  expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
})

it('bảng dùng metadata API và chuyển trang qua component dùng chung', () => {
  const onPage = vi.fn()
  render(<DataList data={{ data: [{ id: 1, name: 'Khách A' }], total: 25, pageSize: 10, totalPages: 3 }} columns={[{ key: 'name', label: 'Tên' }]} search="" onSearch={vi.fn()} page={1} onPage={onPage} />)
  expect(screen.getByRole('navigation')).toHaveTextContent('1 - 10')
  fireEvent.click(screen.getByRole('button', { name: 'Trang 2', exact: true }))
  expect(onPage).toHaveBeenCalledWith(2)
})