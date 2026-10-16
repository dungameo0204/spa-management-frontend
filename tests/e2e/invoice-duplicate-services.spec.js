import { test, expect } from '@playwright/test'

async function setup(page, { failExecution = false } = {}) {
  const writes = []
  const invoice = { id: 78, customer_id: 1, customer_name: 'Khách A', total_amount: 4200000, paid_amount: 4200000, wallet_used: 0, items: [{ id: 202, product_id: 3, snapshot_name: 'Dịch vụ sẹo', snapshot_price: 1500000, quantity: 1 }, { id: 101, product_id: 3, snapshot_name: 'Dịch vụ sẹo', snapshot_price: 900000, quantity: 3 }] }
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'MANAGER' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    const method = route.request().method()
    if (['POST', 'PUT'].includes(method)) {
      const body = route.request().postDataJSON()
      writes.push({ path, method, body })
      if (path === '/api/treatments/execute') return route.fulfill(failExecution ? { status: 500, json: { message: 'Không ghi nhận được buổi' } } : { status: 201, json: { treatmentHistoryId: body.treatment_id + 1000 } })
      return route.fulfill({ status: method === 'POST' ? 201 : 200, json: { invoiceId: 78, itemMappings: (body.items || []).map((_, request_index) => ({ request_index, invoice_item_id: 101 + request_index, treatment_id: 501 + request_index })).reverse() } })
    }
    if (/^\/api\/treatments\/50[12]$/.test(path)) return route.fulfill({ json: { data: { remaining_sessions: 1, histories: [] } } })
    if (path === '/api/invoices/78') return route.fulfill({ json: { data: invoice } })
    if (path === '/api/customers/1') return route.fulfill({ json: { data: { id: 1, fullname: 'Khách A', wallet_balance: 0 } } })
    const data = path === '/api/branches' ? [{ id: 1, name: 'Cơ sở 1' }] : path === '/api/invoices' ? [invoice] : path === '/api/customers' ? [{ id: 1, fullname: 'Khách A' }] : path === '/api/products' ? [{ id: 3, name: 'Dịch vụ sẹo', price: 900000, is_product: 0 }] : path === '/api/treatments' ? [{ id: 501, invoice_item_id: 101, product_id: 3 }, { id: 502, invoice_item_id: 202, product_id: 3 }] : []
    return route.fulfill({ json: { data, total: data.length, totalPages: 1 } })
  })
  await page.goto('/invoices')
  return writes
}

test('PUT giữ đúng ID hai dòng cùng dịch vụ, dòng thêm mới không có ID', async ({ page }) => {
  const writes = await setup(page)
  await page.getByRole('row', { name: /Khách A/ }).click()
  await page.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await page.getByRole('textbox', { name: 'Đơn giá', exact: true }).first().fill('1600000')
  await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click()
  await page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).last().click()
  await page.getByRole('option', { name: 'Dịch vụ sẹo' }).click()
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].method).toBe('PUT')
  expect(writes[0].body.items.map(item => item.invoice_item_id)).toEqual([202, 101, undefined])
  expect(writes[0].body.items.map(item => item.unit_price)).toEqual([1600000, 900000, 900000])
})

test('POST hai dòng trùng dùng mapping đảo thứ tự và vẫn ở form tạo', async ({ page }) => {
  const writes = await setup(page)
  await page.getByRole('button', { name: 'Tạo hóa đơn', exact: true }).click()
  await page.getByRole('combobox', { name: 'Cơ sở', exact: true }).selectOption('1')
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: 'Khách A' }).click()
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click()
    await page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).last().click()
    await page.getByRole('option', { name: 'Dịch vụ sẹo' }).click()
  }
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect(page.getByRole('status')).toContainText('Đã lưu hóa đơn #78 thành công')
  await expect(page.getByRole('status')).not.toContainText('Chưa ghi nhận')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'Tạo hóa đơn', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' })).toHaveCount(2)
  await expect(page.getByRole('textbox', { name: 'Đơn giá', exact: true }).first()).toHaveValue('900.000')
  expect(writes).toHaveLength(3)
  expect(writes.slice(1).map(write => write.body.treatment_id)).toEqual([501, 502])
  expect(writes.filter(write => write.path === '/api/invoices')).toHaveLength(1)
  expect(writes[0].body.items).toHaveLength(2)
  await expect(page.getByRole('button', { name: 'Lưu hóa đơn' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect.poll(() => writes.length).toBe(4)
  expect(writes[3].method).toBe('PUT')
  expect(writes[3].body.items.map(item => item.invoice_item_id)).toEqual([202, 101])
})

test('sau khi lưu ở lại form và có thể bắt đầu hóa đơn mới', async ({ page }) => {
  const writes = await setup(page)
  await page.getByRole('button', { name: 'Tạo hóa đơn', exact: true }).click()
  await page.getByRole('combobox', { name: 'Cơ sở', exact: true }).selectOption('1')
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: 'Khách A' }).click()
  await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click()
  await page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).click()
  await page.getByRole('option', { name: 'Dịch vụ sẹo' }).click()
  await page.getByRole('checkbox', { name: 'Chưa làm' }).check()
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect(page.getByRole('status')).toContainText('thành công')
  await expect(page.getByRole('dialog', { name: 'Tạo hóa đơn', exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Đơn giá', exact: true })).toBeDisabled()
  expect(writes).toHaveLength(1)
  await page.getByRole('button', { name: 'Tạo hóa đơn mới', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lưu hóa đơn' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' })).toHaveCount(0)
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('lỗi execute sau POST vẫn giữ form và không cho tạo lại hóa đơn', async ({ page }) => {
  const writes = await setup(page, { failExecution: true })
  await page.getByRole('button', { name: 'Tạo hóa đơn', exact: true }).click()
  await page.getByRole('combobox', { name: 'Cơ sở', exact: true }).selectOption('1')
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: 'Khách A' }).click()
  await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click()
  await page.getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).click()
  await page.getByRole('option', { name: 'Dịch vụ sẹo' }).click()
  await page.getByRole('button', { name: 'Lưu hóa đơn' }).click()
  await expect(page.getByRole('alert')).toContainText('Hóa đơn #78 đã lưu')
  await expect(page.getByRole('dialog', { name: 'Tạo hóa đơn', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lưu hóa đơn' })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'Đơn giá', exact: true })).toHaveValue('900.000')
  expect(writes).toHaveLength(2)
  expect(writes.filter(write => write.path === '/api/invoices')).toHaveLength(1)
})