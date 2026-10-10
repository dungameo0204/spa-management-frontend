import { test, expect } from '@playwright/test'

test('hóa đơn tìm khách/dịch vụ, đồng bộ chiết khấu và trả ví không tạo nợ', async ({ page }) => {
  const requests = []
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url()), path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên A', system_role: 'STAFF' } } } })
    if (path === '/api/invoices' && route.request().method() === 'POST') { requests.push(route.request().postDataJSON()); return route.fulfill({ json: { invoiceId: 12, totalAmount: 180000, debtAmount: 0, walletUsed: 100000 } }) }
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 1, fullname: 'Khách A', phone_number: '0901', wallet_balance: 100000, total_debt: 50000 }], total: 1 } })
    if (path === '/api/products') return route.fulfill({ json: { data: [{ id: 3, name: 'Liệu trình da', price: 200000, is_product: 0 }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/login')
  await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.goto('/invoices')
  await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: /Khách A/ }).click()
  await expect(page.getByText(/Khách còn nợ:/)).toBeVisible()
  await page.getByRole('button', { name: /Thêm sản phẩm\/dịch vụ/ }).click()
  await page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).click()
  await page.getByRole('option', { name: /Liệu trình da/ }).click()
  await page.getByRole('spinbutton', { name: 'Giảm dòng (%)' }).fill('10')
  await expect(page.getByRole('spinbutton', { name: 'Giảm dòng (đ)' })).toHaveValue('20000')
  await page.getByRole('checkbox', { name: /Dùng ví khách hàng/ }).check()
  await expect(page.getByText('80.000 ₫').first()).toBeVisible()
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect.poll(() => requests.length).toBe(1)
  expect(requests[0]).toMatchObject({ customer_id: 1, wallet_used: 100000, paid_amount: 80000, discount_percent: 0, discount_amount: 0, items: [{ product_id: 3, discount_percent: 10, discount_amount: 0 }] })
})

test('tiền tư vấn một người tự bằng giá sau giảm, hai người có ô chia riêng', async ({ page }) => {
  const requests = []
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 1, fullname: 'Khách A', wallet_balance: 0 }], total: 1 } })
    if (path === '/api/products') return route.fulfill({ json: { data: [{ id: 3, name: 'Dịch vụ A', price: 200000, is_product: 0 }], total: 1 } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [{ id: 2, fullname: 'Bạn A' }, { id: 3, fullname: 'Bạn B' }], total: 2 } })
    if (path === '/api/invoices' && route.request().method() === 'POST') { requests.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { invoiceId: requests.length } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/invoices')
  async function prepare() {
    await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
    await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
    await page.getByRole('option', { name: /Khách A/ }).click()
    await page.getByRole('button', { name: /Thêm sản phẩm\/dịch vụ/ }).click()
    await page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).click()
    await page.getByRole('option', { name: /Dịch vụ A/ }).click()
    await page.getByRole('spinbutton', { name: 'Giảm dòng (%)' }).fill('10')
    await page.getByText(/Nhân viên tư vấn \(tùy chọn\)/).click()
  }
  await prepare()
  await page.getByRole('checkbox', { name: 'Bạn A' }).check()
  await expect(page.getByText(/Doanh số tư vấn của người được chọn/)).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: /Số tiền tư vấn/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect.poll(() => requests.length).toBe(1)
  expect(requests[0].items[0].consultants).toEqual([{ staff_id: 2, revenue_amount: 180000, role_type: 'Tư vấn' }])
  await prepare()
  await page.getByRole('checkbox', { name: 'Bạn A' }).check()
  await page.getByRole('checkbox', { name: 'Bạn B' }).check()
  await page.getByRole('spinbutton', { name: /Số tiền tư vấn — Bạn A/ }).fill('100000')
  await page.getByRole('spinbutton', { name: /Số tiền tư vấn — Bạn B/ }).fill('80000')
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect.poll(() => requests.length).toBe(2)
  expect(requests[1].items[0].consultants.map(c => c.revenue_amount)).toEqual([100000, 80000])
})