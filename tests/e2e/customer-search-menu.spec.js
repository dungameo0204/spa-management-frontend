import { test, expect } from './fixtures'

test('menu tìm khách hàng trong hóa đơn đồng bộ menu cơ sở ở giao diện tối', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    localStorage.setItem('xuly.theme', 'dark')
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } }))
  })
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 7, fullname: 'Khách Hoa', phone_number: '0900000000' }, { id: 8, fullname: 'Khách Lan', phone_number: '0911111111' }], total: 2 } })
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'CS1' }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/invoices')
  await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
  await page.locator('.invoice-header-fields .field', { hasText: 'Cơ sở' }).locator('.mobile-select-trigger').click()
  const branch = page.getByRole('listbox', { name: 'Cơ sở' })
  const branchStyle = await branch.evaluate(menu => ({ background: getComputedStyle(menu).backgroundColor, color: getComputedStyle(menu).color }))
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  const picker = page.locator('.invoice-header-fields .picker-options')
  await expect(picker.getByRole('option', { name: 'Khách Hoa · 0900000000' })).toBeVisible()
  const appearance = await picker.evaluate(menu => {
    const box = menu.getBoundingClientRect()
    const option = menu.querySelector('[role="option"]')
    const optionStyle = getComputedStyle(option)
    return { background: getComputedStyle(menu).backgroundColor, color: getComputedStyle(menu).color,
      rounded: parseFloat(getComputedStyle(menu).borderRadius) >= 12,
      rowRounded: parseFloat(optionStyle.borderRadius) >= 8,
      rowHeight: option.getBoundingClientRect().height >= 42,
      fits: box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight }
  })
  expect(appearance).toEqual({ ...branchStyle, rounded: true, rowRounded: true, rowHeight: true, fits: true })
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).fill('Hoa')
  await picker.getByRole('option', { name: 'Khách Hoa · 0900000000' }).click()
  await expect(page.getByRole('combobox', { name: 'Tìm khách hàng' })).toHaveValue('Khách Hoa')
  await expect(picker).toBeHidden()
})