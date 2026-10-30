import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import ExportTableButton from './ExportTableButton'
import { exportTable } from '../utils/exportTable'

vi.mock('../utils/exportTable', () => ({ exportTable: vi.fn() }))
beforeEach(() => vi.resetAllMocks())

it('awaits async data, disables repeat clicks and then exports', async () => {
  let resolve
  const options = { rows: [{ name: 'Lan' }] }
  const load = vi.fn(() => new Promise(done => { resolve = done }))
  render(<ExportTableButton options={load} filename="customers.xlsx" />)
  await userEvent.click(screen.getByRole('button', { name: 'Xuất Excel' }))
  expect(screen.getByRole('button', { name: 'Đang xuất...' })).toBeDisabled()
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
  resolve(options)
  await waitFor(() => expect(exportTable).toHaveBeenCalledWith(options, 'customers.xlsx'))
  expect(await screen.findByRole('button', { name: 'Xuất Excel' })).toBeEnabled()
})

it('supports existing static options', async () => {
  const options = { rows: [{ id: 1 }] }
  render(<ExportTableButton options={options} filename="report.xlsx" />)
  await userEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(exportTable).toHaveBeenCalledWith(options, 'report.xlsx'))
})

it.each(['empty', 'error'])('shows a useful error and does not download %s data', async kind => {
  render(<ExportTableButton options={async () => { if (kind === 'error') throw new Error('Mất kết nối'); return { rows: [] } }} filename="report.xlsx" />)
  await userEvent.click(screen.getByRole('button'))
  expect(await screen.findByRole('alert')).toHaveTextContent(kind === 'error' ? 'Mất kết nối' : 'Không có dữ liệu phù hợp')
  expect(exportTable).not.toHaveBeenCalled()
  expect(screen.getByRole('button')).toBeEnabled()
})