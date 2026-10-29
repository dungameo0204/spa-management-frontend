import { test, expect } from './fixtures'

test('login, browser title and installed-phone metadata use KAS', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle('KAS · Quản lý Spa')
  await expect(page.locator('.login-logo')).toContainText('KAS')
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'KAS')
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/icons/icon.svg?v=0.1.4')
  const logo = await page.request.get('/icons/icon.svg')
  expect(await logo.text()).toContain('KAS — Skin and Scar')
})

test('services hide list prices in list, detail and edit; products retain both prices', async ({ page }) => {
  const service = { id: 2, name: 'Laser KAS', is_product: '0', price: 950000, sale_price: 800000, unit: 'Buổi' }
  const product = { id: 1, name: 'Serum KAS', is_product: '1', price: 450000, sale_price: 400000 }
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
    if (path === '/api/products') return route.fulfill({ json: { data: [product, service], total: 2, totalPages: 1 } })
    if (path === '/api/products/2') return route.fulfill({ json: { data: service } })
    if (path === '/api/products/1') return route.fulfill({ json: { data: product } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.goto('/products')
  const row = page.getByRole('row').filter({ hasText: service.name })
  await expect(row.locator('[data-label="Giá niêm yết"]')).toHaveText('—')
  await expect(row.locator('[data-label="Loại"]')).toHaveText('Dịch vụ')
  await page.getByText(service.name, { exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Giá bán', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Giá niêm yết', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await expect(dialog.getByLabel('Giá bán', { exact: true })).toBeVisible()
  await expect(dialog.getByLabel('Giá niêm yết', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Hủy', exact: true }).click()
  await page.getByText(product.name, { exact: true }).click()
  await expect(page.getByRole('dialog').getByText('Giá niêm yết', { exact: true })).toBeVisible()
})