import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import CustomerRecordPrint from './CustomerRecordPrint'

afterEach(cleanup)

const signature = '<svg><path d="M 0 0 L 1 1" /></svg>'

it('prints grouped child services once, notes, staff and payment history', () => {
  vi.spyOn(window, 'print').mockImplementation(() => {})
  render(<CustomerRecordPrint onDone={vi.fn()} record={{
    customer: { id: 1, profile_code: 'HS-001', profile_date: '2026-10-10', fullname: 'Nguyễn An', phone_number: '0901000000', date_of_birth: '1995-08-01', gender: 'FEMALE', address: 'Hà Nội', referral_sources: ['FACEBOOK'], skin_assessment: 'Da khô', consultation_note: 'Dưỡng ẩm', total_debt: 500000 },
    timeline: [{ type: 'purchase', date: '2026-11-03', item: { invoice_item_id: 7, is_product: 0, product_name: 'Gói chữa nám', quantity: 1, unit_price: 30000000, final_price: 30000000, treatment: { children: [{ id: 13, product_name: 'Chăm sóc da', total_sessions: null }] } } }],
    invoices: [{ id: 100, invoice_date: '2026-10-01 09:00:00', paid_amount: 2000000 }], debtPayments: [{ id: 11, payment_date: '2026-10-03 09:00:00', invoice_id: 100, amount: 1000000 }],
    treatments: [{ id: 10, product_name: 'Gói chữa nám', total_sessions: null, created_at: '2026-09-01 09:00:00', histories: [{ id: 200, treatment_id: 10, execution_date: '2026-11-04 09:00:00', note: 'Bôi phục hồi', customer_signature_svg: signature, children: [{ id: 201, parent_history_id: 200, treatment_id: 11, execution_date: '2026-11-04 09:00:00', note: 'Da hơi đỏ', staffs: [{ staff_name: 'KTV Lan' }] }, { id: 202, parent_history_id: 200, treatment_id: 12, execution_date: '2026-11-04 09:00:00', staffs: [{ staff_name: 'KTV Hương' }] }] }], children: [{ id: 11, product_id: 501, product_name: 'Laser', total_sessions: 10, created_at: '2026-09-01 09:00:00', histories: [] }, { id: 12, product_id: 502, product_name: 'PNP', total_sessions: null, created_at: '2026-09-01 09:00:00', histories: [] }] }],
  }} />)

  expect(screen.getByText('Dịch vụ điều trị:')).toBeInTheDocument()
  expect(screen.queryByText('Nội dung tư vấn')).not.toBeInTheDocument()
  expect(screen.getByText(/Chăm sóc da × Không giới hạn/)).toBeInTheDocument()
  const cover = document.querySelector('.customer-record-cover')
  expect(cover.textContent.indexOf('KHAI THÁC TIỀN SỬ')).toBeLessThan(cover.textContent.indexOf('THÔNG TIN TƯ VẤN'))
  const paymentRows = document.querySelectorAll('.customer-record-payments tbody tr')
  expect(paymentRows[0]).toHaveTextContent('01/10/2026Thanh toán hóa đơn #100')
  expect(paymentRows[1]).toHaveTextContent('03/10/2026Thanh toán bổ sung hóa đơn #100')
  const historyRow = document.querySelector('.customer-record-treatment-table tbody tr')
  expect(historyRow).toHaveTextContent('04/11/2026')
  expect(historyRow).toHaveTextContent('Laser (lần 1/10), PNP (lần 1/không giới hạn)')
  expect(historyRow).toHaveTextContent('1')
  expect(historyRow).toHaveTextContent('Laser: KTV Lan')
  expect(historyRow).toHaveTextContent('PNP: KTV Hương')
  expect(historyRow).toHaveTextContent('Ghi chú: Bôi phục hồi')
  expect(historyRow).toHaveTextContent('Ghi chú: Da hơi đỏ')
  expect(screen.getByText('Nhân viên thực hiện')).toBeInTheDocument()
  expect(screen.getByAltText('Chữ ký khách hàng').getAttribute('src')).toContain('xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22')
})