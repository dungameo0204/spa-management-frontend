import { test, expect } from './fixtures'

test('in hồ sơ khách tạo đủ bìa, khai thác tiền sử và phiếu điều trị A4', async ({ page }) => {
  page.on('pageerror', error => console.log(`PAGE_ERROR: ${error.message}`))
  page.on('console', message => { if (message.type() === 'error') console.log(`CONSOLE_ERROR: ${message.text()}`) })
  await page.addInitScript(() => {
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: 'MANAGER', fullname: 'Quản lý' } }))
    window.print = () => { window.__customerRecordPrinted = true }
  })
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    const customer = { id: 17, profile_code: 'HS-017', profile_date: '2026-11-05', fullname: 'Khách hồ sơ', phone_number: '0900000000', date_of_birth: '1995-08-21', gender: 'FEMALE', address: 'Hà Nội', skin_types: ['DRY'], referral_sources: ['FACEBOOK'], previous_skin_treatments: '', skin_assessment: 'Da khô', consultation_note: 'Dưỡng ẩm', wallet_balance: 0, total_debt: 500000 }
    const treatment = { id: 36, customer_id: 17, product_name: 'Chữa nám trọn đời', total_sessions: null, children: [{ id: 37, product_name: 'PRP', total_sessions: null, histories: [{ id: 98, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV A' }] }] }, { id: 38, product_name: 'Laser', total_sessions: 10, histories: [{ id: 99, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV A' }], customer_signature_svg: '<svg viewBox="0 0 10 10"><path d="M 0 0 L 10 10" /></svg>' }, { id: 101, execution_date: '2026-11-05', staffs: [{ staff_name: 'KTV A' }] }] }, { id: 39, product_name: 'Massage', total_sessions: null, histories: [{ id: 100, execution_date: '2026-11-04', staffs: [{ staff_name: 'KTV B' }], customer_signature_svg: '<svg viewBox="0 10 10 0"><path d="M 0 10 L 10 0" /></svg>' }] }] }
    const timeline = [{ type: 'purchase', date: '2026-11-03', item: { invoice_item_id: 42, invoice_id: 9, is_product: 0, product_name: 'Chữa nám trọn đời', quantity: 1, unit_price: 30000000, final_price: 30000000, treatment } }]
    const data = path === '/api/customers' ? [customer] : path === '/api/customers/17/overview' ? { customer, timeline } : path === '/api/treatments' || path === '/api/treatments/36' ? path === '/api/treatments' ? [treatment] : treatment : []
    return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1, totalPages: 1 } })
  })
  await page.setViewportSize({ width: 1440, height: 950 })
  await page.goto('/customers')
  await page.screenshot({ path: 'test-results/customer-record-list.png', fullPage: true })
  await page.getByRole('button', { name: 'Xem Khách hồ sơ', exact: true }).click()
  await page.getByRole('button', { name: 'In hồ sơ' }).click()
  await expect(page.locator('#customer-record-print')).toBeAttached()
  await expect(page.locator('#customer-record-print')).toContainText('HỒ SƠ KHÁCH HÀNG')
  await expect(page.locator('#customer-record-print')).not.toContainText('LOẠI DA CỦA KHÁCH HÀNG')
  await expect(page.locator('.customer-record-cover .customer-record-history')).toContainText('KHAI THÁC TIỀN SỬ')
  await expect(page.locator('#customer-record-print')).toContainText('PHIẾU THEO DÕI ĐIỀU TRỊ')
  await expect(page.locator('#customer-record-print')).toContainText('PRP, Laser (lần 1), Massage')
  await expect(page.locator('#customer-record-print')).toContainText('Chữa nám trọn đời × 1')
  await expect(page.locator('#customer-record-print')).toContainText('Ngày mua: 03/11/2026')
  await expect(page.locator('#customer-record-print')).toContainText('Laser × 10 buổi')
  await expect(page.locator('.customer-record-treatment-table')).toContainText('Số lần')
  await expect(page.locator('.customer-record-treatment-table')).not.toContainText('KTV')
  await expect(page.locator('.customer-record-treatment-table tbody tr').nth(0)).toContainText('1')
  await expect(page.locator('.customer-record-treatment-table tbody tr').nth(1)).toContainText('2')
  await expect(page.locator('.customer-record-signature-image')).toHaveCount(1)
  await expect.poll(() => page.evaluate(() => window.__customerRecordPrinted)).toBe(true)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.customer-record-page')).toHaveCount(3)
  await page.screenshot({ path: 'test-results/customer-record-print.png', fullPage: true })
})