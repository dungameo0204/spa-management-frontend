import { test, expect } from './fixtures'

test('desktop: chọn nhân viên hóa đơn bằng menu nổi, bàn phím và không bị cắt trong ngăn kéo', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/products') return route.fulfill({ json: { data: [{ id: 3, name: 'Dịch vụ A', price: 500000, is_product: 0 }], total: 1 } })
    if (path === '/api/roles') return route.fulfill({ json: { data: [{ id: 1, name: 'BS tóc' }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'BS Tóc', role_id: 1, branch_id: 1 }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/invoices')
  await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
  await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click()
  await page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).click()
  await page.getByRole('option', { name: 'Dịch vụ A' }).click()
  const name = 'Nhân viên thực hiện - BS tóc'
  const trigger = page.locator('.invoice-item-actions').getByRole('button', { name })
  await expect(trigger).toBeVisible()
  await trigger.click()
  const menu = page.getByRole('listbox', { name })
  await expect(menu).toBeVisible()
  const layout = await menu.evaluate(element => {
    const box = element.getBoundingClientRect()
    return { portal: element.parentElement === document.body, fits: box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight, styled: getComputedStyle(element).borderRadius !== '0px' }
  })
  expect(layout).toEqual({ portal: true, fits: true, styled: true })
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('combobox', { name })).toHaveValue('2')
  await expect(trigger).toContainText('BS Tóc')
  await trigger.click()
  await menu.getByRole('option', { name: 'Chưa chọn' }).click()
  await expect(page.getByRole('combobox', { name })).toHaveValue('')
  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await trigger.click()
  await page.getByRole('heading', { name: 'Tạo hóa đơn' }).click()
  await expect(menu).toBeHidden()
})

test('desktop: ô phân loại dùng menu ứng dụng và giữ giá trị select gốc', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'manager', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    if (new URL(route.request().url()).pathname.startsWith('/api/')) return route.fulfill({ json: { data: [], total: 0 } })
    return route.continue()
  })
  await page.goto('/products')
  await page.getByRole('button', { name: /Thêm mới/ }).click()
  const trigger = page.locator('.field', { hasText: 'Phân loại' }).locator('.mobile-select-trigger')
  await trigger.click()
  await page.getByRole('listbox', { name: 'Phân loại' }).getByRole('option', { name: 'Dịch vụ' }).click()
  await expect(page.getByRole('combobox', { name: 'Phân loại' })).toHaveValue('0')
  await expect(trigger).toContainText('Dịch vụ')
})