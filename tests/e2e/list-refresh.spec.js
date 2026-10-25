import { test, expect } from './fixtures'

test('phiếu nhập kho tải lại danh sách sau khi tạo', async ({ page }) => {
  let reads = 0
  let saved = false
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
    if (path === '/api/inventory-imports' && route.request().method() === 'GET') {
      reads++
      const data = saved ? [{ id: 7, import_code: 'PN-TEST', supplier_name: 'NCC', total_amount: 100000, import_date: '2026-10-11', branch_name: 'CS1' }] : []
      return route.fulfill({ json: { data, total: data.length } })
    }
    if (path === '/api/inventory-imports' && route.request().method() === 'POST') { saved = true; return route.fulfill({ status: 201, json: { importId: 7 } }) }
    if (path === '/api/products') return route.fulfill({ json: { data: [{ id: 3, name: 'Dầu dưỡng', is_product: 1, price: 100000 }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/imports')
  await expect.poll(() => reads).toBeGreaterThan(0)
  const before = reads
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByLabel('Mã phiếu').fill('PN-TEST')
  await page.getByRole('button', { name: /Thêm sản phẩm/ }).click()
  await page.getByRole('combobox', { name: 'Sản phẩm' }).click()
  await page.getByRole('option', { name: /Dầu dưỡng/ }).click()
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => reads).toBeGreaterThan(before)
  await expect(page.getByRole('row', { name: /PN-TEST/ })).toBeVisible()
})

test('hóa đơn lọc ngày và tên, tải lại sau khi xóa', async ({ page }) => {
  const requests = []
  let deleted = false
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
    if (path === '/api/invoices' && route.request().method() === 'GET') {
      requests.push(url)
      const matches = url.searchParams.get('startDate') === '2026-10-10' && url.searchParams.get('endDate') === '2026-10-10' && url.searchParams.get('search') === 'dũng'
      const data = matches && !deleted ? [{ id: 8, customer_name: 'Dũng', invoice_date: '2026-10-10 10:00:00', branch_name: 'CS1', total_amount: 100000, debt_amount: 0 }] : []
      return route.fulfill({ json: { data, total: data.length } })
    }
    if (path === '/api/invoices/8' && route.request().method() === 'GET') return route.fulfill({ json: { data: { id: 8, customer_name: 'Dũng', invoice_date: '2026-10-10 10:00:00', branch_name: 'CS1', total_amount: 100000, debt_amount: 0, items: [] } } })
    if (path === '/api/invoices/8' && route.request().method() === 'DELETE') { deleted = true; return route.fulfill({ json: { message: 'ok' } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/invoices')
  await page.getByLabel('Từ ngày').fill('2026-10-10')
  await page.getByLabel('Đến ngày').fill('2026-10-10')
  await page.getByRole('textbox', { name: 'Tìm kiếm' }).fill('dũng')
  await expect(page.getByRole('row', { name: /Dũng.*10\/10\/2026/ })).toBeVisible()
  expect(requests.at(-1).searchParams.get('search')).toBe('dũng')
  const before = requests.length
  await page.getByRole('row', { name: /Dũng/ }).click()
  await page.getByRole('button', { name: 'Xóa hóa đơn' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click()
  await expect.poll(() => requests.length).toBeGreaterThan(before)
  await expect(page.getByRole('row', { name: /Dũng/ })).toHaveCount(0)
})