import { test, expect } from './fixtures'

for (const width of [390, 1440]) test(`contact history across appointments and both dashboard queues (${width}px)`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  let notes = [{ id: 15, content: 'Đã liên hệ\nKhách cần tư vấn', contact_date: '28/10/2026' }]
  let saved
  const appointment = () => ({ id: 9, customer_id: 7, customer_name: 'Khách Hoa', phone_number: '0900000000', branch_id: 1, branch_name: 'ROSA', appointment_date: '2026-11-03', note: 'Laser dịch vụ', status: 'Khách chưa đến', contact_notes: notes, extra_note: notes.map(n => `${n.contact_date}: ${n.content}`).join('\n') || null })
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), method = route.request().method()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    const paged = data => ({ total: data.length, page: 1, pageSize: 20, totalPages: 1, data })
    if (url.pathname === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
    if (url.pathname.endsWith('/contact-notes') && method === 'POST') {
      expect(Object.keys(route.request().postDataJSON())).toEqual(['content'])
      notes = [...notes, { id: 16, content: route.request().postDataJSON().content, contact_date: '02/11/2026' }]
      return route.fulfill({ status: 201, json: { data: appointment() } })
    }
    if (url.pathname === '/api/appointments/9' && method === 'PUT') { saved = route.request().postDataJSON(); return route.fulfill({ json: { message: 'OK' } }) }
    if (url.pathname === '/api/appointments/9') return route.fulfill({ json: { data: appointment() } })
    if (['/api/appointments', '/api/appointments/tomorrow', '/api/appointments/not-arrived'].includes(url.pathname)) return route.fulfill({ json: paged([appointment()]) })
    return route.fulfill({ json: paged([]) })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  const rows = page.locator('.dashboard-appointment-table tbody tr')
  await expect(rows).toHaveCount(2)
  for (const row of await rows.all()) {
    await expect(row).toContainText('Laser dịch vụ')
    await expect(row).toContainText('Khách cần tư vấn')
    await expect(row.getByRole('button', { name: /Thêm liên hệ/ })).toBeVisible()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await rows.first().getByRole('button', { name: /Thêm liên hệ/ }).click()
  await page.getByLabel('Nội dung liên hệ mới').fill('Khách xác nhận\nSẽ đến chiều mai')
  await page.getByRole('button', { name: 'Thêm lần liên hệ' }).click()
  await expect(page.getByLabel('Nội dung liên hệ mới')).toHaveValue('')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  for (const row of await rows.all()) await expect(row).toContainText('Sẽ đến chiều mai')
  await page.goto('/appointments')
  await expect(page.locator('table')).toContainText('Sẽ đến chiều mai')
  await page.getByRole('button', { name: 'Xem 9', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sửa lần liên hệ #16' })).toBeVisible()
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Tìm dịch vụ' })).toHaveValue('Laser dịch vụ')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => saved?.note).toBe('Laser dịch vụ')
  expect(saved).not.toHaveProperty('extra_note')
  expect(saved).not.toHaveProperty('contact_notes')
  expect(saved).not.toHaveProperty('status')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})