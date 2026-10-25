import { test, expect } from './fixtures'
const product = { id: 1, name: 'Serum phục hồi', price: '450000.00', is_product: 1, inventory: [{ branch_name: 'Cơ sở 1', quantity: 12 }] }
async function setup(page, role) {
  const writes = []
  await page.route('**/api/**', async route => {
    const { pathname } = new URL(route.request().url())
    if (!pathname.startsWith('/api/')) return route.continue()
    const method = route.request().method()
    if (pathname === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: role === 'STAFF' ? 1 : null, fullname: 'Nguyễn An', system_role: role } } } })
    if (pathname.startsWith('/api/products') && !['GET', 'HEAD'].includes(method)) writes.push(method)
    if (pathname === '/api/products/1') return route.fulfill({ json: { data: product } })
    if (pathname === '/api/products') return route.fulfill({ json: { total: 1, page: 1, pageSize: 20, totalPages: 1, data: [product] } })
    return route.fulfill({ json: { total: 0, page: 1, pageSize: 20, totalPages: 0, data: [] } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/products')
  return writes
}
test('STAFF được quản lý sản phẩm nhưng không thấy cấu hình tiền công', async ({ page }) => {
  const writes = await setup(page, 'STAFF')
  await expect(page.getByRole('heading', { name: 'Sản phẩm & dịch vụ' })).toBeVisible()
  await page.getByText('Serum phục hồi').first().click()
  await expect(page.getByText('Cơ sở 1:')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Thêm mới' })).toBeVisible()
  await page.getByRole('button', { name: 'Sửa' }).click()
  await expect(page.getByText('Tiền công theo chức vụ')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible()
  expect(writes).toEqual([])
})
test('MANAGER có thể mở form tạo sản phẩm', async ({ page }) => {
  await setup(page, 'MANAGER')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await expect(page.getByRole('dialog', { name: 'Thêm sản phẩm & dịch vụ' })).toBeVisible()
  await expect(page.getByLabel('Mô tả', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Công dụng', { exact: true })).toHaveCount(0)
})
test('menu trên màn hình điện thoại vẫn cho STAFF xem sản phẩm', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setup(page, 'STAFF')
  await page.getByRole('button', { name: 'Thêm', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Sản phẩm & dịch vụ' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Báo cáo' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Booking từ khách' })).toHaveCount(0)
})

test('gỡ booking từ khách nhưng giữ trang lịch hẹn', async ({ page }) => {
  await setup(page, 'MANAGER')
  await expect(page.getByRole('link', { name: 'Booking từ khách' })).toHaveCount(0)
  await page.goto('/bookings')
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible()
  await page.goto('/appointments')
  await expect(page.getByRole('heading', { name: 'Lịch hẹn' })).toBeVisible()
})