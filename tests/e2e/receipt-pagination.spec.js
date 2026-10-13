import { test, expect } from '@playwright/test'

test('hóa đơn giấy thường nhiều sản phẩm có tiêu đề lặp và tổng kết liền khối', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'staff-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } }))
    localStorage.setItem('xuly.theme', 'dark')
  })
  const invoice = { id: 21, customer_name: 'Khách hàng thử nghiệm', branch_name: 'Cơ sở Một', invoice_date: '2026-10-10', total_amount: 12000000, paid_amount: 12000000, wallet_used: 0, debt_amount: 0, payment_method: 'CASH', discount_percent: 2, discount_amount: 0, items: Array.from({ length: 25 }, (_, index) => ({ id: index + 1, snapshot_name: `Liệu trình chăm sóc da số ${index + 1}`, quantity: 1, snapshot_price: 500000, discount_percent: index === 0 ? 10 : 0, discount_amount: 0, final_price: index === 0 ? 450000 : 500000 })) }
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/invoices/21') return route.fulfill({ json: { data: invoice } })
    return route.fulfill({ json: { data: path === '/api/invoices' ? [invoice] : [], total: path === '/api/invoices' ? 1 : 0 } })
  })
  await page.goto('/invoices')
  await page.getByRole('row', { name: /Khách hàng thử nghiệm/ }).click()
  await page.evaluate(() => { window.print = () => {} })
  for (const size of ['A4', 'A5']) {
    await page.getByRole('combobox', { name: 'Khổ giấy in' }).selectOption(size)
    await page.getByRole('button', { name: 'In hóa đơn' }).click()
    await expect(page.locator('#receipt-print .receipt-pages tbody tr')).toHaveCount(25)
    await expect(page.locator('#receipt-print > .receipt-summary')).toHaveCount(1)
    await expect(page.locator('#receipt-print .receipt-line').first()).toContainText(/Chiết khấu: -50\.000\s*₫/)
    await expect(page.locator('#receipt-print .receipt-line').nth(1)).not.toContainText('Chiết khấu')
    await expect(page.locator('#receipt-print .receipt-summary')).toContainText('Chiết khấu hóa đơn')
    await expect(page.locator('#receipt-print .receipt-summary')).toContainText(/-450\.000\s*₫/)
    await page.emulateMedia({ media: 'print' })
    const layout = await page.locator('#receipt-print').evaluate(el => ({ heading: getComputedStyle(el.querySelector('thead')).display, summary: getComputedStyle(el.querySelector('.receipt-summary')).breakInside, priceColor: getComputedStyle(el.querySelector('.receipt-line strong')).color, totalColor: getComputedStyle(el.querySelector('.receipt-row strong')).color }))
    expect(layout).toEqual({ heading: 'table-header-group', summary: 'avoid', priceColor: 'rgb(24, 44, 39)', totalColor: 'rgb(24, 44, 39)' })
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length
    expect(pages).toBeGreaterThan(1)
    expect(pages).toBeLessThan(5)
    await page.emulateMedia({ media: 'screen' })
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  }
})