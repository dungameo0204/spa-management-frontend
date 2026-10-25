import { test, expect } from './fixtures'

test('tạo nhanh khách trong hóa đơn cũng gửi ngày sinh', async ({ page }) => {
  const writes = []
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: 'STAFF', branch_id: 1 } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/customers' && route.request().method() === 'POST') {
      writes.push(route.request().postDataJSON())
      return route.fulfill({ json: { customerId: 3 } })
    }
    if (path === '/api/customers/3') return route.fulfill({ json: { data: { id: 3, fullname: 'Khách mới', phone_number: '0901234567', date_of_birth: '1995-08-21' } } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/invoices')
  await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).fill('Khách mới')
  await page.getByRole('button', { name: /Tạo khách “Khách mới”/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Tạo khách hàng', exact: true })
  await dialog.getByLabel('Số điện thoại', { exact: true }).fill('0901234567')
  await dialog.getByLabel('Ngày sinh', { exact: true }).fill('1995-08-21')
  await dialog.getByRole('button', { name: 'Lưu khách hàng' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].date_of_birth).toBe('1995-08-21')
  await expect(page.getByRole('combobox', { name: 'Tìm khách hàng' })).toHaveValue('Khách mới')
})

test('ngày sinh trong thêm/sửa khách, không hiện ở danh sách và tổng quan; vẫn tìm và xóa được', async ({ page }) => {
  let customer = { id: 3, fullname: 'Khách ngày sinh', phone_number: '0901234567', date_of_birth: '1995-08-21' }
  const writes = []
  const searches = []
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (!url.pathname.startsWith('/api/')) return route.continue()
    const method = route.request().method()
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      const body = method === 'DELETE' ? null : route.request().postDataJSON()
      writes.push({ method, path: url.pathname, body })
      if (body) customer = { ...customer, ...body }
      return route.fulfill({ json: { message: 'OK' } })
    }
    if (url.pathname === '/api/customers/3/overview') return route.fulfill({ json: { data: { customer, timeline: [] } } })
    if (url.pathname === '/api/customers') {
      searches.push(url.searchParams.get('search'))
      return route.fulfill({ json: { data: [customer], total: 1, totalPages: 1 } })
    }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/customers')
  await expect(page.getByRole('button', { name: 'Xem Khách ngày sinh' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Ngày sinh' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByLabel('Họ tên', { exact: true }).fill('Khách ngày sinh')
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0901234567')
  await page.getByLabel('Ngày sinh', { exact: true }).fill('2000-02-29')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].body.date_of_birth).toBe('2000-02-29')
  await page.getByRole('button', { name: 'Xem Khách ngày sinh' }).click()
  await expect(page.locator('.customer-identity')).toContainText('0901234567')
  await expect(page.locator('.customer-identity')).not.toContainText('2000')
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await expect(page.getByLabel('Ngày sinh', { exact: true })).toHaveValue('2000-02-29')
  await page.getByLabel('Ngày sinh', { exact: true }).fill('1995-08-21')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(2)
  expect(writes[1].body.date_of_birth).toBe('1995-08-21')
  await page.getByRole('button', { name: 'Xem Khách ngày sinh' }).click()
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await page.getByLabel('Ngày sinh', { exact: true }).fill('')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(3)
  expect(writes[2].body.date_of_birth).toBeNull()
  await page.getByPlaceholder(/Tìm/).fill('0901234567')
  await expect.poll(() => searches.includes('0901234567')).toBe(true)
  await page.getByRole('button', { name: 'Xem Khách ngày sinh' }).click()
  await page.getByRole('button', { name: 'Xóa', exact: true }).click()
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect.poll(() => writes.length).toBe(4)
  expect(writes[3]).toEqual({ method: 'DELETE', path: '/api/customers/3', body: null })
})