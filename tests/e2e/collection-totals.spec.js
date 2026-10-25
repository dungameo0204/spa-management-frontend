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
      return route.fulfill({ status: 200, json: { debtPaymentId: writes.length, walletLogId: 1 } })
    }
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }, { id: 2, name: 'Cơ sở Hai' }] } })
    if (path === '/api/customers') return route.fulfill({ json: { data: [{ id: 1, fullname: 'Khách A', phone_number: '0901', total_debt: 1050000 }], total: 1 } })
    if (path === '/api/invoices') return route.fulfill({ json: { data: [{ id: 12, customer_id: 1 }, { id: 13, customer_id: 1 }], total: 2 } })
    if (path.endsWith('/remaining-debt')) {
      const id = Number(path.split('/')[4])
      return route.fulfill({ json: { data: { invoiceId: id, remainingDebtAmount: id === 12 ? 950000 : 100000 } } })
    }
    if (path === '/api/customer-wallet-logs/7') return route.fulfill({ json: { data: { id: 7, customer_id: 1, customer_name: 'Khách A', branch_id: 2, paid_amount: 950000 } } })
    if (path === '/api/customer-wallet-logs') return route.fulfill({ json: { data: [{ id: 7, customer_name: 'Khách A', branch_id: 2, paid_amount: 950000 }], total: 1 } })
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
  await amount.fill('950000')
  await page.getByRole('checkbox', { name: /Hóa đơn #13/ }).check()
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(2)
  expect(writes.map(entry => entry.body)).toEqual([
    { invoice_id: 12, amount: 950000, payment_method: 'CASH', note: null, collection_branch_id: 1 },
    { invoice_id: 13, amount: 100000, payment_method: 'CASH', note: null, collection_branch_id: 1 },
  ])
})

for (const branch of ['', '1']) {
  test(`MANAGER chọn cơ sở nạp ví, bộ lọc mặc định: ${branch || 'tất cả'}`, async ({ page }) => {
    const writes = await setup(page, { branch })
    await page.goto('/wallet')
    await page.getByRole('button', { name: 'Thêm mới' }).click()
    const picker = page.getByRole('combobox', { name: 'Cơ sở nạp ví', exact: true })
    await expect(picker).toHaveValue(branch)
    await expect(picker).toHaveAttribute('required', '')
    await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
    await page.getByRole('option', { name: /Khách A/ }).click()
    await page.getByRole('textbox', { name: 'Tiền khách nạp' }).fill('950000')
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
    if (!branch) {
      expect(writes).toHaveLength(0)
    } else {
      await expect.poll(() => writes.length).toBe(1)
      expect(writes[0].body.branch_id).toBe(1)
      await page.getByRole('button', { name: 'Thêm mới' }).click()
      await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
      await page.getByRole('option', { name: /Khách A/ }).click()
      await page.getByRole('textbox', { name: 'Tiền khách nạp' }).fill('950000')
    }
    await picker.selectOption('2')
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect.poll(() => writes.length).toBe(branch ? 2 : 1)
    expect(writes.at(-1).body).toMatchObject({ branch_id: 2, paid_amount: 950000 })
  })
}

test('STAFF nạp ví không hiển thị và không gửi cơ sở', async ({ page }) => {
  const writes = await setup(page, { role: 'STAFF' })
  await page.goto('/wallet')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await expect(page.getByRole('combobox', { name: 'Cơ sở nạp ví' })).toHaveCount(0)
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: /Khách A/ }).click()
  await page.getByRole('textbox', { name: 'Tiền khách nạp' }).fill('100000')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].body).not.toHaveProperty('branch_id')
})

test('MANAGER sửa nạp ví không gửi lại cơ sở theo bộ lọc', async ({ page }) => {
  const writes = await setup(page, { branch: '1' })
  await page.goto('/wallet')
  await page.getByRole('row', { name: /Khách A/ }).click()
  await page.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await expect(page.getByRole('combobox', { name: 'Cơ sở nạp ví' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Tiền khách nạp' }).fill('900000')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].path).toBe('/api/customer-wallet-logs/7')
  expect(writes[0].body).not.toHaveProperty('branch_id')
})