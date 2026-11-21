import { expect, it } from 'vitest'
import { cleanCustomerNote, paymentRecordRows, treatmentRecordRows } from './customerRecord'

it('combines successive cards with the same product into one accurate session progression', () => {
  const rows = treatmentRecordRows([
    { id: 1, product_id: 7, product_name: 'Laser', total_sessions: 10, created_at: '2026-01-01 09:00:00', histories: Array.from({ length: 10 }, (_, index) => ({ id: index + 1, execution_date: `2026-01-${String(index + 1).padStart(2, '0')} 09:00:00` })) },
    { id: 2, product_id: 7, product_name: 'Laser', total_sessions: 5, created_at: '2026-02-01 09:00:00', histories: [{ id: 11, execution_date: '2026-02-02 09:00:00' }] },
  ])
  expect(rows[9].services).toEqual(['Laser (lần 10/10)'])
  expect(rows[10].services).toEqual(['Laser (lần 11/15)'])
})

it('combines all treatment visits on the same date into one row while preserving session progression', () => {
  const rows = treatmentRecordRows([
    { id: 1, product_id: 7, product_name: 'Laser', total_sessions: 10, histories: [{ id: 1, execution_date: '2026-03-01 08:00:00', note: 'Làm sạch\nĐắp mặt nạ', customer_signature_svg: 'first-signature', staffs: [{ staff_name: 'Lan' }] }, { id: 2, execution_date: '2026-03-01 10:00:00', note: 'Dưỡng ẩm', customer_signature_svg: 'second-signature', staffs: [{ staff_name: 'Hương' }] }] },
    { id: 2, product_id: 8, product_name: 'PRP', total_sessions: 5, histories: [{ id: 3, execution_date: '2026-03-01 09:00:00', staffs: [{ staff_name: 'Minh' }] }] },
    { id: 3, product_id: 7, product_name: 'Laser', total_sessions: 10, histories: [{ id: 4, execution_date: '2026-03-02 08:00:00' }] },
  ])
  expect(rows).toHaveLength(2)
  expect(rows[0]).toMatchObject({ visitNumber: 1, services: ['Laser (lần 1,2/10)', 'PRP (lần 1/5)'], staff: ['Lan', 'Hương', 'Minh'], notes: ['Làm sạch\nĐắp mặt nạ', 'Dưỡng ẩm'], signature: 'first-signature' })
  expect(rows[1]).toMatchObject({ visitNumber: 2, services: ['Laser (lần 3/10)'] })
})

it('labels null session totals as package treatments in printed treatment rows', () => {
  const rows = treatmentRecordRows([
    { id: 1, product_id: 7, product_name: 'PRP', total_sessions: null, histories: [{ id: 1, execution_date: '2026-03-01 08:00:00' }] },
  ])
  expect(rows[0].services).toEqual(['PRP (lần 1/Trọn gói)'])
})

it('orders printed and shared treatment visits from oldest to newest execution time', () => {
  const rows = treatmentRecordRows([
    { id: 1, product_id: 7, product_name: 'Laser', total_sessions: 10, histories: [
      { id: 2, execution_date: '2026-03-03 09:00:00', created_at: '2026-03-03 09:01:00' },
      { id: 1, execution_date: '2026-03-01 09:00:00', created_at: '2026-03-04 09:00:00' },
    ] },
  ])
  expect(rows.map(row => [row.visitNumber, row.day, row.services])).toEqual([
    [1, '2026-03-01', ['Laser (lần 1/10)']],
    [2, '2026-03-03', ['Laser (lần 2/10)']],
  ])
})

it('sorts initial and supplementary payments chronologically', () => {
  expect(paymentRecordRows([{ id: 3, invoice_date: '2026-03-01', paid_amount: 200, note: 'Chuyển khoản đợt 1' }], [{ id: 4, invoice_id: 3, payment_date: '2026-03-02', amount: 50 }])).toMatchObject([{ content: 'Thanh toán hóa đơn #3', note: 'Chuyển khoản đợt 1', amount: 200 }, { content: 'Thanh toán bổ sung hóa đơn #3', amount: 50 }])
})

it('removes auto-appended invoice log lines from customer notes', () => {
  expect(cleanCustomerNote('khách VIP\n28/10/2026 [HĐ #134 - Tạo] khách đổi 1 buổi sang nám\n28/10/2026 [HĐ #134 - Đã xóa]')).toBe('khách VIP')
  expect(cleanCustomerNote('28/10/2026 [HĐ #134 - Tạo] chỉ có log hóa đơn')).toBe('')
})