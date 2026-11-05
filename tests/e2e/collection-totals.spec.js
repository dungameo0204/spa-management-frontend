import { test, expect } from './fixtures'

async function setup(page, { role = 'MANAGER', branch = '' } = {}) {
  const writes = []
  await page.addInitScript(({ role, branch }) => {
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, fullname: 'Test', system_role: role, branch_id: role === 'STAFF' ? 1 : null } }))
    sessionStorage.setItem('xuly.branch', branch)
  }, { role, branch })
  await page.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (['POST', 'PUT'].includes(request.method())) {
      writes.push({ path, body: request.postDataJSON() })
      return route.fulfill({ status: 200, json: { debtPaymentId: writes.length } })
    }
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }, { id: 2, name: 'Cơ sở Hai' }] } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 1, fullname: 'Khách A', phone_number: '0901', total_debt: 1050000 }], total: 1 } })
    if (path === '/api/invoices') return route.fulfill({ json: { data: [{ id: 12, customer_id: 1 }, { id: 13, customer_id: 1 }], total: 2 } })
    if (path.endsWith('/remaining-debt')) {
      const id = Number(path.split('/')[4])
      return route.fulfill({ json: { data: { invoiceId: id, remainingDebtAmount: id === 12 ? 950000 : 100000 } } })
    }
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  return writes
}

test('thu nhiều hóa đơn: định dạng, tổng động, kiểm tra giới hạn và payload', async ({ page }) => {
  const writes = await setup(page, { branch: '1' })
  await page.goto('/debts')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: /Khách A/ }).click()
  const total = page.getByRole('status', { name: 'Tổng tiền thu của khách' })
  await expect(total).toContainText('0')
  await page.getByRole('checkbox', { name: /Hóa đơn #12/ }).check()
  await page.getByRole('checkbox', { name: /Hóa đơn #13/ }).check()
  const amount = page.getByRole('textbox', { name: 'Số tiền thu hóa đơn #12', exact: true })
  await expect(amount).toHaveValue('950.000')
  await expect(total).toContainText('1.050.000')
  await amount.fill('900000')
  await expect(amount).toHaveValue('900.000')
  await expect(total).toContainText('1.000.000')
  await page.getByRole('checkbox', { name: /Hóa đơn #13/ }).uncheck()
  await expect(total).toContainText('900.000')
  await amount.fill('0')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText(/Đã dừng xử lý:/)).toBeVisible()
  expect(writes).toHaveLength(0)
  await amount.fill('950001')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText(/Đã dừng xử lý:/)).toBeVisible()
  expect(writes).toHaveLength(0)
})