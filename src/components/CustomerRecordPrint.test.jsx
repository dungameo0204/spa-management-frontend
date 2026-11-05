import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import CustomerRecordPrint from './CustomerRecordPrint'

afterEach(cleanup)

it('prints purchases with treatment children, blank history lines and signature images', () => {
  vi.spyOn(window, 'print').mockImplementation(() => {})
  render(<CustomerRecordPrint onDone={vi.fn()} record={{
    customer: { id: 1, profile_code: 'HS-001', profile_date: '2026-10-10', fullname: 'Nguyễn An', phone_number: '0901000000', date_of_birth: '1995-08-01', gender: 'FEMALE', address: 'Hà Nội', skin_types: ['DRY'], referral_sources: ['FACEBOOK'], previous_skin_treatments: '', skin_assessment: 'Da khô', consultation_note: 'Dưỡng ẩm', total_debt: 500000 },
    timeline: [{ type: 'purchase', date: '2026-11-03', item: { invoice_item_id: 7, is_product: 0, product_name: 'Chữa nám trọn đời', quantity: 1, unit_price: 30000000, final_price: 30000000, treatment: { id: 10, product_name: 'Chữa nám trọn đời', total_sessions: null, children: [{ id: 11, product_name: 'PRP', total_sessions: null }, { id: 12, product_name: 'Laser', total_sessions: 10 }] } } }],
  treatments: [{ id: 10, product_name: 'Chữa nám trọn đời', total_sessions: null, children: [{ id: 11, product_name: 'PRP', total_sessions: null, histories: [{ id: 99, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV A' }] }] }, { id: 12, product_name: 'Laser', total_sessions: 10, histories: [{ id: 100, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV A' }], customer_signature_svg: '<svg><path d="M 0 0 L 1 1" /></svg>' }, { id: 102, execution_date: '2026-11-05', staffs: [{ staff_name: 'KTV A' }] }] }, { id: 13, product_name: 'Massage', total_sessions: null, histories: [{ id: 101, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV B' }], customer_signature_svg: '<svg><path d="M 2 2 L 3 3" /></svg>' }] }] }],
  }} />)
  expect(screen.getByText('HỒ SƠ KHÁCH HÀNG')).toBeTruthy()
  expect(screen.queryByText('LOẠI DA CỦA KHÁCH HÀNG')).toBeNull()
  expect(document.querySelector('.customer-record-cover .customer-record-history')).toHaveTextContent('KHAI THÁC TIỀN SỬ')
  expect(screen.getByText('HS-001')).toBeTruthy()
  expect(screen.getByText('PHIẾU THEO DÕI ĐIỀU TRỊ')).toBeTruthy()
  expect(screen.getByText('PRP, Laser (lần 1), Massage')).toBeTruthy()
  expect(screen.getByText('Số lần')).toBeTruthy()
  expect(screen.queryByText('KTV')).toBeNull()
  const historyRows = document.querySelectorAll('.customer-record-treatment-table tbody tr')
  expect(historyRows[0]).toHaveTextContent('04/11/2026PRP, Laser (lần 1), Massage1')
  expect(historyRows[1]).toHaveTextContent('05/11/2026Laser (lần 2)2')
  expect(screen.getByText('DỊCH VỤ ĐÃ MUA')).toBeTruthy()
  expect(screen.getByText(/Chữa nám trọn đời × 1/)).toBeTruthy()
  expect(screen.getByText('Ngày mua: 03/11/2026')).toBeTruthy()
  expect(screen.getByText(/PRP × Trọn đời, Laser × 10 buổi/)).toBeTruthy()
  expect(screen.getByText(/30\.000\.000\s*₫/)).toBeTruthy()
  expect(screen.getByAltText('Chữ ký khách hàng')).toBeTruthy()
  expect(screen.getByAltText('Chữ ký khách hàng').getAttribute('src')).toContain('xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22')
  expect(decodeURIComponent(screen.getByAltText('Chữ ký khách hàng').getAttribute('src'))).toContain('M 0 0 L 1 1')
  expect(decodeURIComponent(screen.getByAltText('Chữ ký khách hàng').getAttribute('src'))).not.toContain('M 2 2 L 3 3')
  expect(screen.queryByText('Diễn giải')).toBeNull()
  expect(document.querySelector('.customer-record-history li span').textContent).toBe('')
})