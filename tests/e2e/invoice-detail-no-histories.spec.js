import { test, expect } from './fixtures'

test('chi tiết hóa đơn chỉ hiển thị hóa đơn, không tải hay hiển thị buổi thực hiện', async ({ page }) => {
  const paths = []
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    paths.push(path)
    if (path === '/api/invoices') return route.fulfill({ json: { data: [{ id: 12, customer_name: 'Khách A', branch_id: 1, branch_name: 'Cơ sở Một', invoice_date: '2026-10-12' }], total: 1 } })
    if (path === '/api/invoices/12') return route.fulfill({ json: { data: { id: 12, customer_id: 1, customer_name: 'Khách A', branch_id: 1, branch_name: 'Cơ sở Một', items: [{ product_id: 3, product_name: 'Dịch vụ', quantity: 1, unit_price: 100000, final_price: 100000 }] } } })
    if (path === '/api/customers/1') return route.fulfill({ json: { data: { id: 1, fullname: 'Khách A' } } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/invoices')
  await page.getByText('Khách A').first().click()
  const detail = page.getByRole('dialog', { name: 'Hóa đơn #12' })
  await expect(detail).toContainText('Cơ sở Một')
  await expect(detail).toContainText('Dịch vụ')
  await expect(detail).not.toContainText('Buổi thực hiện')
  await expect(detail.getByRole('button', { name: 'Gán lại nhân viên' })).toHaveCount(0)
  expect(paths).not.toContain('/api/treatments')
})