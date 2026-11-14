import { expect, it } from 'vitest'
import { paymentRecordRows, treatmentRecordRows } from './customerRecord'

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
  expect(rows[0]).toMatchObject({ visitNumber: 1, services: ['Laser (lần 1,2/10)', 'PRP (lần 1/5)'], staff: ['Laser: Lan, Hương', 'PRP: Minh'], notes: ['Làm sạch\nĐắp mặt nạ', 'Dưỡng ẩm'], signature: 'first-signature' })
  expect(rows[1]).toMatchObject({ visitNumber: 2, services: ['Laser (lần 3/10)'] })
})

it('sorts initial and supplementary payments chronologically', () => {
  expect(paymentRecordRows([{ id: 3, invoice_date: '2026-03-01', paid_amount: 200 }], [{ id: 4, invoice_id: 3, payment_date: '2026-03-02', amount: 50 }])).toMatchObject([{ content: 'Thanh toán hóa đơn #3', amount: 200 }, { content: 'Thanh toán bổ sung hóa đơn #3', amount: 50 }])
})