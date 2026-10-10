import { test, expect } from '@playwright/test'

test('tải lại trang vẫn giữ phiên và tải dữ liệu mới', async ({ page }) => {
  let loads = 0
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên A', system_role: 'STAFF' } } } })
    if (path === '/api/products') { loads++; return route.fulfill({ json: { data: [{ id: 1, name: 'Serum', is_product: 1, price: 100000 }], total: 1 } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/products')
  await expect(page.getByText('Serum')).toBeVisible()
  const before = loads
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sản phẩm & dịch vụ' })).toBeVisible()
  await expect.poll(() => loads).toBeGreaterThan(before)
})