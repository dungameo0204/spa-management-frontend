import { test, expect } from '@playwright/test'

test('danh sách phiếu chi hiển thị ghi chú thay cho nội dung khoản chi', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF', fullname: 'Nhân viên' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/expenses') return route.fulfill({ json: { data: [
      { id: 1, note: 'Chi phí tháng này', expense_type: 'Nhiều mục chi', amount: 800000, expense_date: '2026-10-12', branch_name: 'CS1' },
      { id: 2, note: '', expense_type: 'Tiền điện', amount: 500000, expense_date: '2026-10-11', branch_name: 'CS1' },
    ], total: 2 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/expenses')
  const table = page.getByRole('table')
  await expect(page.getByRole('button', { name: 'Thêm mới' })).toBeVisible()
  await expect(table.getByRole('columnheader').first()).toHaveText('Ghi chú')
  await expect(table.getByRole('row').nth(1).getByRole('cell').first()).toHaveText('Chi phí tháng này')
  await expect(table.getByRole('row').nth(2).getByRole('cell').first()).toHaveText('—')
  await expect(table).not.toContainText('Nhiều mục chi')
})

test('phiếu chi lưu ghi chú tổng và nội dung từng khoản chi', async ({ page }) => {
  const writes = []
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF', fullname: 'Nhân viên' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/expenses' && route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { expenseId: 5 } }) }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/expenses')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByRole('textbox', { name: 'Ghi chú phiếu chi' }).fill('Chi phí tháng này')
  await page.getByRole('textbox', { name: 'Nội dung' }).fill('Mua đồ dùng spa')
  await page.getByRole('textbox', { name: 'Số tiền' }).fill('300000')
  await page.getByRole('button', { name: 'Thêm khoản' }).click()
  await page.getByRole('textbox', { name: 'Nội dung' }).nth(1).fill('Tiền điện')
  await page.getByRole('textbox', { name: 'Số tiền' }).nth(1).fill('500000')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].note).toBe('Chi phí tháng này')
  expect(writes[0].items).toEqual([{ expense_type: 'Mua đồ dùng spa', amount: 300000 }, { expense_type: 'Tiền điện', amount: 500000 }])
  expect(writes[0]).not.toHaveProperty('amount')
  expect(writes[0]).not.toHaveProperty('expense_type')
})

test('tạo khách mới bằng Enter khi ô tìm không có kết quả', async ({ page }) => {
  const writes = []
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF', fullname: 'Nhân viên' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/customers' && route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { customerId: 9 } }) }
    if (path === '/api/customers/9') return route.fulfill({ json: { data: { id: 9, fullname: 'Khách Mới', phone_number: '0901234567', wallet_balance: 0, total_debt: 0 } } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.goto('/invoices')
  await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).fill('Khách Mới')
  await expect(page.getByRole('button', { name: /Tạo khách.*Enter/ })).toBeVisible()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).press('Enter')
  await expect(page.getByRole('dialog', { name: 'Tạo khách hàng' })).toBeVisible()
  await page.getByRole('dialog', { name: 'Tạo khách hàng' }).getByRole('textbox', { name: 'Số điện thoại' }).fill('0901234567')
  await page.getByRole('textbox', { name: 'Địa chỉ (tùy chọn)' }).fill('Số 1 Đường Hoa')
  await page.getByRole('textbox', { name: 'Ghi chú (tùy chọn)' }).fill('Khách mới')
  await page.getByRole('button', { name: 'Lưu khách hàng' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0]).toEqual({ fullname: 'Khách Mới', phone_number: '0901234567', address: 'Số 1 Đường Hoa', note: 'Khách mới' })
  await expect(page.getByText('Đã tạo khách hàng.')).toHaveClass(/success-alert/)
  await expect(page.getByRole('combobox', { name: 'Tìm khách hàng' })).toHaveValue('Khách Mới')
})