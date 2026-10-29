import { test, expect } from './fixtures'

async function setup(page, role = 'MANAGER') {
  const writes = []
  const children = [
    { id: 12, name: 'Chăm sóc da cơ bản', is_product: 0 },
    { id: 18, name: 'Điện di tinh chất', is_product: 0 },
    { id: 19, name: 'Đắp mặt nạ phục hồi', is_product: 0 },
    { id: 21, name: 'Massage thư giãn', is_product: 0 },
  ]
  let parent = { id: 20, name: 'Gói chăm sóc da tổng hợp', is_product: 0, price: 500000, sale_price: 500000, child_service_ids: [12, 18, 19, 21] }
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname, method = route.request().method()
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Nguyễn An', system_role: role } } } })
    if (path === '/api/products' && method === 'POST') {
      writes.push(route.request().postDataJSON())
      return route.fulfill({ status: 201, json: { productId: 50, message: 'Đã lưu' } })
    }
    if (path === '/api/products/20' && method === 'PUT') {
      const body = route.request().postDataJSON()
      writes.push(body)
      parent = { ...parent, ...body }
      return route.fulfill({ json: { message: 'Đã lưu' } })
    }
    if (path.startsWith('/api/products/')) return route.fulfill({ json: { data: [parent, ...children].find(item => item.id === Number(path.split('/').pop())) } })
    if (path === '/api/products') return route.fulfill({ json: { data: url.searchParams.get('is_product') === '0' ? [parent, ...children, { id: 30, name: 'Serum bán lẻ', is_product: 1 }] : [parent], total: 1, totalPages: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/products')
  return writes
}

for (const width of [1280, 390]) {
  test(`nested service display and STAFF editing fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const writes = await setup(page, 'STAFF')
    await expect(page.getByText('Có 4 dịch vụ con')).toBeVisible()
    await expect(page.getByText('+1 dịch vụ khác · Mở chi tiết để xem')).toBeVisible()
    await expect(page.getByText('Chăm sóc da cơ bản')).toBeVisible()
    await page.getByRole('button', { name: 'Xem Gói chăm sóc da tổng hợp' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('region', { name: 'Dịch vụ con' }).getByRole('listitem')).toHaveCount(4)
    await expect(dialog.getByText('Massage thư giãn', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Sửa', exact: true }).click()
    await dialog.getByRole('button', { name: 'Đưa Điện di tinh chất lên' }).click()
    await dialog.getByRole('button', { name: 'Bỏ Đắp mặt nạ phục hồi' }).click()
    await expect(dialog.getByRole('listitem').first()).toContainText('Điện di tinh chất')
    await dialog.getByRole('button', { name: 'Thêm dịch vụ con' }).click()
    await dialog.getByRole('combobox', { name: 'Tìm dịch vụ con' }).click()
    await expect(dialog.getByRole('option', { name: 'Đắp mặt nạ phục hồi' })).toBeVisible()
    await expect(dialog.getByRole('option', { name: 'Gói chăm sóc da tổng hợp' })).toHaveCount(0)
    await expect(dialog.getByRole('option', { name: 'Serum bán lẻ' })).toHaveCount(0)
    await dialog.getByRole('option', { name: 'Đắp mặt nạ phục hồi' }).click()
    const fits = await dialog.getByRole('region', { name: 'Dịch vụ con' }).evaluate(element => {
      const bounds = element.getBoundingClientRect()
      return bounds.left >= 0 && bounds.right <= innerWidth && element.scrollWidth <= element.clientWidth
    })
    expect(fits).toBe(true)
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect(dialog).toHaveCount(0)
    expect(writes[0].child_service_ids).toEqual([18, 12, 21, 19])
    expect(writes[0]).not.toHaveProperty('commission_tiers')
    expect(writes[0]).not.toHaveProperty('commissions')
    await page.getByRole('button', { name: 'Xem Gói chăm sóc da tổng hợp' }).click()
    await expect(page.getByRole('dialog').getByRole('listitem').first()).toContainText('Điện di tinh chất')
    await page.screenshot({ path: `test-results/product-service-children-${width}.png`, fullPage: true })
  })
}

test('creates child links and hides the editor for retail products', async ({ page }) => {
  const writes = await setup(page)
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('region', { name: 'Dịch vụ con' })).toHaveCount(0)
  await dialog.getByLabel('Tên sản phẩm / dịch vụ').fill('Gói mới')
  await dialog.getByLabel('Phân loại', { exact: true }).selectOption('0')
  await expect(dialog.getByText('Chưa có dịch vụ con.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Thêm dịch vụ con' }).click()
  await dialog.getByRole('combobox', { name: 'Tìm dịch vụ con' }).click()
  await dialog.getByRole('option', { name: 'Điện di tinh chất' }).click()
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(dialog).toHaveCount(0)
  expect(writes[0].child_service_ids).toEqual([18])
})