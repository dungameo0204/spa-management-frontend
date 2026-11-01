import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import ReceiptPrint from './ReceiptPrint'

afterEach(cleanup)

it.each(['A4', 'A5', 'K57', 'K80'])('prints child services, session totals and Vietnam invoice date on %s', size => {
  const record = {
    id: 1, invoice_date: '2026-10-31T17:00:00.000Z', created_at: '2026-10-30',
    customer_name: 'Khách A', total_amount: 100000, paid_amount: 100000,
    items: [
      { id: 1, snapshot_name: 'Combo chăm sóc', quantity: 1, snapshot_price: 100000,
        treatment: { children: [
          { id: 11, product_name: 'Phục hồi da', total_sessions: 5 },
          { id: 12, product_name: 'Chăm sóc định kỳ', total_sessions: null },
        ] } },
      { id: 2, snapshot_name: 'Dịch vụ đơn', quantity: 1, snapshot_price: 0, treatment: { total_sessions: 10 } },
      { id: 3, snapshot_name: 'Sản phẩm', quantity: 1, snapshot_price: 0 },
    ],
  }
  render(<ReceiptPrint receipt={{ type: 'invoices', size, records: [record] }} onDone={vi.fn()} />)
  expect(screen.getByText('Ngày: 01/11/2026')).toBeTruthy()
  expect(screen.getByText('↳ Phục hồi da · 5 buổi')).toBeTruthy()
  expect(screen.getByText('↳ Chăm sóc định kỳ · Trọn đời')).toBeTruthy()
  expect(screen.getByText('Liệu trình: 10 buổi')).toBeTruthy()
  expect(screen.queryByText(/undefined|NaN/)).toBeNull()
})