import { test, expect } from '@playwright/test'

test('tổng chứng từ toàn kỳ và công ca theo nhân viên không phụ thuộc trang dữ liệu', async ({ page }) => {
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'manager-test', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
    if (path === '/api/reports/details/invoices') return route.fulfill({ json: { data: [{ id: 12, branch_name: 'Cơ sở 1', customer_name: 'Khách A', total_amount: 100000 }], total: 12, totalAmount: 2200000, page: 1, totalPages: 2 } })
    if (path === '/api/reports/commissions') return route.fulfill({ json: { staffTotals: [{ branch_id: 1, branch_name: 'Cơ sở 1', staff_id: 3, staff_name: 'Nhân viên B', record_count: 2, total_amount: 200000 }], total: 1, totalAmount: 200000, page: 1, totalPages: 1 } })
    if (path === '/api/reports/details/commissions') return route.fulfill({ json: { data: [{ id: 1, execution_date: '2026-10-09', customer_name: 'Khách A', product_name: 'Chăm sóc da', commission_amount_snapshot: '100000.00' }], total: 2, totalAmount: 200000, page: 1, totalPages: 2 } })
    if (path === '/api/reports/revenue') return route.fulfill({ json: {} })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/reports')
  await expect(page.getByText(/Tổng hóa đơn toàn kỳ/)).toBeVisible()
  await expect(page.getByText(/2\.200\.000/)).toBeVisible()
  await page.getByRole('tab', { name: 'Công ca' }).click()
  await expect(page.getByRole('heading', { name: 'Nhân viên B' })).toBeVisible()
  await page.getByRole('button', { name: 'Xem ngày làm' }).click()
  await expect(page.getByText(/Tổng nhân viên trong kỳ/)).toBeVisible()
  await expect(page.getByText('Chăm sóc da')).toBeVisible()
})

test('tìm báo cáo trên toàn kỳ qua API trước khi phân trang', async ({ page }) => {
  const requests = []
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'manager-test', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
    if (path === '/api/reports/details/invoices' || path === '/api/reports/products') {
      requests.push({ path, search: url.searchParams.get('search'), page: url.searchParams.get('page'), startDate: url.searchParams.get('startDate'), endDate: url.searchParams.get('endDate') })
      const searched = Boolean(url.searchParams.get('search'))
      const product = path === '/api/reports/products'
      return route.fulfill({ json: { data: searched ? [product ? { product_id: 8, product_name: 'Liệu trình ở trang 3', revenue: 900000 } : { id: 42, customer_name: 'Khách ở trang 3', total_amount: 900000 }] : [], total: searched ? 1 : 60, totalAmount: searched ? 900000 : 5000000, totalRevenue: searched ? 900000 : 5000000, page: Number(url.searchParams.get('page')), totalPages: searched ? 1 : 3 } })
    }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/reports')
  const searches = page.getByRole('textbox', { name: 'Tìm kiếm' })
  await searches.first().fill('Liệu trình')
  await expect(page.getByText('Liệu trình ở trang 3')).toBeVisible()
  await searches.nth(1).fill('Khách ở trang 3')
  await expect(page.getByText('Khách ở trang 3')).toBeVisible()
  await expect.poll(() => requests.findLast(r => r.path === '/api/reports/details/invoices' && r.search)?.page).toBe('1')
  expect(requests.find(r => r.path === '/api/reports/products' && r.search)?.search).toBe('Liệu trình')
  expect(requests.find(r => r.path === '/api/reports/details/invoices' && r.search)?.startDate).toBeTruthy()
  expect(requests.find(r => r.path === '/api/reports/details/invoices' && r.search)?.endDate).toBeTruthy()
})