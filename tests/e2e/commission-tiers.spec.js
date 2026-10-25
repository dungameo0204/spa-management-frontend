import { test, expect } from './fixtures'

async function setup(page, role = 'MANAGER', tiers = [], inventory = []) {
  const writes = []
  const product = { id: 5, name: 'Điều trị sẹo', price: '500000.00', is_product: 0, is_treatment_combo: 0, default_sessions: 1, commissions: [], commission_tiers: tiers, inventory }
  await page.addInitScript(role => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: role, branch_id: 1 } })), role)
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (['POST', 'PUT'].includes(route.request().method())) { writes.push({ path, body: route.request().postDataJSON() }); return route.fulfill({ json: { message: 'OK' } }) }
    const data = path === '/api/products/5' ? product : path === '/api/products' ? [product] : path === '/api/roles' ? [{ id: 2, name: 'Kỹ thuật viên' }] : path === '/api/customers' ? [{ id: 3, fullname: 'Khách A' }] : []
    return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1, totalPages: 1, page: 1, pageSize: 20 } })
  })
  return writes
}

for (const role of ['MANAGER', 'STAFF']) {
  for (const inventory of [[], [{ branch_name: 'Kho dịch vụ cũ', quantity: 10 }]]) {
    test(`${role}: dịch vụ không hiện tồn kho dù API trả ${inventory.length} dòng tồn`, async ({ page }) => {
      await setup(page, role, [], inventory)
      await page.goto('/products')
      await page.getByText('Điều trị sẹo', { exact: true }).first().click()
      await expect(page.getByRole('button', { name: 'Sửa', exact: true })).toBeEnabled()
      await expect(page.getByRole('heading', { name: 'Tồn kho', exact: true })).toHaveCount(0)
      await expect(page.getByText('Chưa có dữ liệu tồn kho.', { exact: true })).toHaveCount(0)
      await expect(page.getByText(/Kho dịch vụ cũ/)).toHaveCount(0)
      await page.getByRole('button', { name: 'Sửa', exact: true }).click()
      await expect(page.getByText(/Điều chỉnh tồn kho qua phiếu nhập/)).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'Tồn kho ban đầu theo cơ sở', exact: true })).toHaveCount(0)
    })
  }
}

for (const editing of [false, true]) {
  test(`${editing ? 'sửa' : 'thêm'} dịch vụ: bỏ là liệu trình ẩn số buổi và gửi 1 thay vì số đã nhập`, async ({ page }) => {
    const writes = await setup(page)
    await page.goto('/products')
    if (editing) {
      await page.getByText('Điều trị sẹo', { exact: true }).first().click()
      await page.getByRole('button', { name: 'Sửa', exact: true }).click()
      await expect(page.getByLabel('Số buổi tạo tự động khi mua liệu trình')).toHaveCount(0)
    } else {
      await page.getByRole('button', { name: 'Thêm mới' }).click()
      await page.getByLabel('Tên sản phẩm / dịch vụ').fill('Dịch vụ một buổi')
      await page.getByLabel('Phân loại').selectOption('0')
    }
    await page.getByRole('checkbox', { name: 'Là liệu trình', exact: true }).check()
    await page.getByLabel('Số buổi tạo tự động khi mua liệu trình').fill('12')
    await page.getByRole('checkbox', { name: 'Là liệu trình', exact: true }).uncheck()
    await expect(page.getByLabel('Số buổi tạo tự động khi mua liệu trình')).toHaveCount(0)
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect.poll(() => writes.length).toBe(1)
    expect(writes[0].body).toMatchObject({ is_treatment_combo: false, default_sessions: 1 })
  })
}

test('tạo thẻ lấy giá catalog, cho sửa giá và gửi đúng ID, số đơn vị', async ({ page }) => {
  const writes = await setup(page)
  await page.goto('/treatments')
  await page.getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
  await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  await page.getByRole('option', { name: 'Khách A' }).click()
  await page.getByRole('combobox', { name: 'Tìm dịch vụ' }).click()
  await page.getByRole('option', { name: 'Điều trị sẹo' }).click()
  const price = page.getByLabel('Giá dịch vụ', { exact: true })
  await expect(price).toHaveValue('500.000')
  await price.fill('5000000')
  await page.getByLabel('Số đơn vị mỗi buổi').fill('2')
  await page.getByRole('dialog').getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0]).toEqual({ path: '/api/treatments', body: { customer_id: 3, product_id: 5, total_sessions: 1, remaining_sessions: 1, commission_base_price: 5000000, commission_quantity: 2, note: null } })
})

for (const remaining of [0, 4]) {
  test(`tạo thẻ cũ tổng 10, còn ${remaining} buổi và không ghi đè số nhập riêng`, async ({ page }) => {
    const writes = await setup(page)
    await page.goto('/treatments')
    await page.getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
    await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
    await page.getByRole('option', { name: 'Khách A' }).click()
    await page.getByRole('combobox', { name: 'Tìm dịch vụ' }).click()
    await page.getByRole('option', { name: 'Điều trị sẹo' }).click()
    await page.getByLabel('Số buổi', { exact: true }).fill('8')
    const balance = page.getByLabel('Số buổi còn lại', { exact: false })
    await expect(balance).toHaveValue('8')
    await balance.fill(String(remaining))
    await page.getByLabel('Số buổi', { exact: true }).fill('10')
    await expect(balance).toHaveValue(String(remaining))
    await balance.fill('11')
    await page.getByRole('dialog').getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
    expect(writes).toHaveLength(0)
    await balance.fill(String(remaining))
    await page.getByRole('dialog').getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
    await expect.poll(() => writes.length).toBe(1)
    expect(writes[0].body).toMatchObject({ total_sessions: 10, remaining_sessions: remaining })
  })
}

test('tạo dịch vụ một mức mặc định, thêm hai bậc và chặn khoảng hở/chồng', async ({ page }) => {
  const writes = await setup(page)
  await page.goto('/products')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByLabel('Tên sản phẩm / dịch vụ').fill('Dịch vụ mới')
  await page.getByLabel('Phân loại').selectOption('0')
  await expect(page.getByText('Mức công dự phòng (cấu hình cũ)', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Tính công theo chức vụ', exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: 'Kỹ thuật viên', exact: true }).first().check()
  await expect(page.getByLabel('Giá từ (đ)')).toHaveCount(0)
  await page.getByLabel('Tiền công (%)', { exact: true }).first().fill('10')
  await page.getByRole('button', { name: 'Thêm mức công cho Kỹ thuật viên' }).click()
  await page.getByLabel('Giá đến, không bao gồm (đ)').first().fill('1000000')
  await page.getByLabel('Giá từ (đ)').nth(1).fill('900000')
  await page.getByLabel('Cách tính công').nth(1).selectOption('FIXED')
  await page.getByLabel('Tiền công cố định (đ)').first().fill('100000')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText(/chồng lấn/).first()).toBeVisible()
  expect(writes).toHaveLength(0)
  await page.getByLabel('Giá từ (đ)').nth(1).fill('1100000')
  await expect(page.getByRole('alert')).toContainText('trống')
  await page.getByLabel('Giá từ (đ)').nth(1).fill('1000000')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].body.commission_tiers).toEqual([{ role_id: 2, min_price: 0, max_price: 1000000, calculation_type: 'PERCENT', percent: 10 }, { role_id: 2, min_price: 1000000, max_price: null, calculation_type: 'FIXED', fixed_amount: 100000 }])
})

test('sửa tải lại bậc giá và cho xóa toàn bộ bằng PUT', async ({ page }) => {
  const writes = await setup(page, 'MANAGER', [{ role_id: 2, min_price: '0', max_price: null, calculation_type: 'FIXED', fixed_amount: '100000' }])
  await page.goto('/products')
  await page.getByText('Điều trị sẹo', { exact: true }).first().click()
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await expect(page.getByLabel('Tiền công cố định (đ)').first()).toHaveValue('100.000')
  await page.getByRole('checkbox', { name: 'Kỹ thuật viên', exact: true }).first().uncheck()
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].path).toBe('/api/products/5')
  expect(writes[0].body.commission_tiers).toEqual([])
})

test('STAFF sửa dịch vụ không gửi hai field công ca bị cấm', async ({ page }) => {
  const writes = await setup(page, 'STAFF')
  await page.goto('/products')
  await page.getByText('Điều trị sẹo', { exact: true }).first().click()
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0].body).not.toHaveProperty('commission_tiers')
  expect(writes[0].body).not.toHaveProperty('commissions')
})