import { test, expect } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } })))
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/invoices') return route.fulfill({ json: { data: [{ id: 8, customer_name: 'Khách A', invoice_date: '2026-10-10', branch_name: 'CS1', total_amount: 100000, debt_amount: 0 }], total: 1 } })
    if (path === '/api/invoices/8') return route.fulfill({ json: { data: { id: 8, customer_name: 'Khách A', invoice_date: '2026-10-10', branch_name: 'CS1', total_amount: 100000, debt_amount: 0, items: [] } } })
    if (path === '/api/inventory-imports') return route.fulfill({ json: { data: [{ id: 9, import_code: 'PN-09', supplier_name: 'NCC', import_date: '2026-10-10', total_amount: 100000, branch_name: 'CS1' }], total: 1 } })
    if (path === '/api/inventory-imports/9') return route.fulfill({ json: { data: { id: 9, import_code: 'PN-09', supplier_name: 'NCC', import_date: '2026-10-10', created_at: new Date().toISOString(), total_amount: 100000, branch_name: 'CS1', items: [{ id: 1, product_name: 'Dầu dưỡng', quantity: 1, unit_price: 100000, total_price: 100000 }] } } })
    if (path === '/api/products') return route.fulfill({ json: { data: [{ id: 3, name: 'Dầu dưỡng', is_product: 1, price: 100000 }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
})

test('chi tiết hóa đơn nửa màn hình, form tạo vẫn đủ rộng', async ({ page }) => {
  await page.setViewportSize({ width: 1910, height: 900 })
  await page.goto('/invoices')
  await page.getByRole('row', { name: /Khách A/ }).click()
  const drawer = page.getByRole('dialog', { name: 'Hóa đơn #8' })
  await expect(drawer.getByText('Khách A')).toBeVisible()
  const detailWidth = await drawer.evaluate(element => element.getBoundingClientRect().width)
  expect(detailWidth).toBeGreaterThanOrEqual(750)
  expect(detailWidth).toBeLessThanOrEqual(1910 * .52)
  await drawer.getByRole('button', { name: 'Đóng' }).click()
  await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
  const editWidth = await page.getByRole('dialog', { name: 'Tạo hóa đơn' }).evaluate(element => element.getBoundingClientRect().width)
  expect(editWidth).toBeGreaterThan(detailWidth)
})

test('chi tiết nhập kho nửa màn hình, form thêm và sửa vẫn đủ rộng', async ({ page }) => {
  await page.setViewportSize({ width: 1910, height: 900 })
  await page.goto('/imports')
  await page.getByRole('row', { name: /PN-09/ }).click()
  const drawer = page.getByRole('dialog', { name: 'Chi tiết nhập kho' })
  await expect(drawer.getByText('Dầu dưỡng')).toBeVisible()
  const detailWidth = await drawer.evaluate(element => element.getBoundingClientRect().width)
  expect(detailWidth).toBeGreaterThanOrEqual(750)
  expect(detailWidth).toBeLessThanOrEqual(1910 * .52)
  await drawer.getByRole('button', { name: 'Chỉnh sửa' }).click()
  const editWidth = await page.getByRole('dialog', { name: 'Sửa nhập kho' }).evaluate(element => element.getBoundingClientRect().width)
  expect(editWidth).toBeGreaterThan(detailWidth)
  await page.getByRole('dialog', { name: 'Sửa nhập kho' }).getByRole('button', { name: 'Đóng' }).click()
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  const createWidth = await page.getByRole('dialog', { name: 'Thêm nhập kho' }).evaluate(element => element.getBoundingClientRect().width)
  expect(createWidth).toBeGreaterThan(detailWidth)
})

test('form nhập kho cân đối sản phẩm, số lượng và thu gọn theo màn hình', async ({ page }) => {
  await page.goto('/imports')
  for (const width of [1910, 1000, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('button', { name: 'Thêm mới' }).click()
    await page.getByRole('button', { name: /Thêm sản phẩm/ }).click()
    const drawer = page.getByRole('dialog', { name: 'Thêm nhập kho' })
    const layout = await drawer.evaluate(element => {
      const row = element.querySelector('.product-entry-row')
      const rect = selector => element.querySelector(selector).getBoundingClientRect()
      return { drawer: element.getBoundingClientRect(), product: rect('.product-picker-stack'), quantity: rect('.quantity-field'), price: rect('.money-field'), total: rect('.line-total'), deleteButton: rect('.line-delete'), row: row.getBoundingClientRect() }
    })
    expect(layout.drawer.width).toBeLessThanOrEqual(width < 700 ? width : width * .96)
    if (width > 700) {
      expect(layout.product.width).toBeGreaterThan(layout.quantity.width * 2)
      expect(layout.total.width).toBeGreaterThan(layout.product.width * .6)
      expect(layout.total.width).toBeGreaterThan(layout.price.width)
      expect(layout.quantity.width).toBeLessThan(85)
      expect(layout.product.right).toBeLessThanOrEqual(layout.quantity.left + 1)
      expect(layout.quantity.right).toBeLessThanOrEqual(layout.price.left + 1)
    } else {
      expect(layout.product.bottom).toBeLessThanOrEqual(layout.quantity.top)
      expect(layout.quantity.top).toBe(layout.price.top)
      expect(layout.total.top).toBeGreaterThan(layout.price.bottom)
      expect(layout.row.right).toBeLessThanOrEqual(layout.drawer.right)
    }
    expect(layout.deleteButton.right).toBeLessThanOrEqual(layout.drawer.right)
    await drawer.getByRole('combobox', { name: 'Tìm sản phẩm' }).click()
    if (width === 390) {
      const menu = await drawer.locator('.product-picker-stack .picker-options').boundingBox()
      expect(menu.width).toBeGreaterThan(180)
      expect(menu.x + menu.width).toBeLessThanOrEqual(width)
      await expect(drawer.getByRole('option', { name: 'Dầu dưỡng' })).toBeInViewport()
    }
    await page.getByRole('option', { name: 'Dầu dưỡng' }).click()
    await expect(drawer.getByRole('combobox', { name: 'Tìm sản phẩm' })).toHaveValue('Dầu dưỡng')
    await drawer.getByRole('button', { name: 'Đóng' }).click()
  }
})

test('tám dòng nhập kho gọn, nút thêm nằm trước tổng tiền', async ({ page }) => {
  await page.setViewportSize({ width: 1910, height: 900 })
  await page.goto('/imports')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  const drawer = page.getByRole('dialog', { name: 'Thêm nhập kho' })
  const add = drawer.getByRole('button', { name: /Thêm sản phẩm/ })
  for (let index = 0; index < 8; index++) await add.click()
  const cards = drawer.locator('.compact-invoice-line')
  await expect(cards).toHaveCount(8)
  const layout = await drawer.evaluate(element => {
    const cards = [...element.querySelectorAll('.compact-invoice-line')].map(card => card.getBoundingClientRect())
    const add = element.querySelector('.add-line-btn').getBoundingClientRect()
    const total = element.querySelector('.report-total').getBoundingClientRect()
    const body = element.querySelector('.drawer-body').getBoundingClientRect()
    return { first: cards[0], last: cards.at(-1), heights: cards.map(card => card.height), add, total, body }
  })
  expect(Math.max(...layout.heights)).toBeLessThanOrEqual(85)
  expect(layout.last.top - layout.first.top).toBeLessThanOrEqual(7 * 95)
  expect(layout.last.bottom).toBeLessThanOrEqual(layout.body.bottom)
  expect(layout.add.top).toBeGreaterThanOrEqual(layout.last.bottom)
  expect(layout.add.bottom).toBeLessThanOrEqual(layout.total.top)
})

test('quản lý chọn chi nhánh khi tạo phiếu nhập kho', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 2, fullname: 'Quản lý', system_role: 'MANAGER' } }))
    sessionStorage.removeItem('xuly.branch')
  })
  let savedBody
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'CS1' }, { id: 2, name: 'CS2' }], total: 2 } })
    if (path === '/api/inventory-imports' && route.request().method() === 'POST') {
      savedBody = route.request().postDataJSON()
      return route.fulfill({ status: 201, json: { inventoryImportId: 7 } })
    }
    if (path === '/api/products') return route.fulfill({ json: { data: [{ id: 3, name: 'Dầu dưỡng', is_product: 1, price: 100000 }], total: 1 } })
    return route.fulfill({ json: { data: [], total: 0 } })
  })
  await page.setViewportSize({ width: 1910, height: 900 })
  await page.goto('/imports')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  const drawer = page.getByRole('dialog', { name: 'Thêm nhập kho' })
  const branch = drawer.getByRole('combobox', { name: 'Chi nhánh' })
  await expect(branch).toBeVisible()
  await expect(branch).toHaveValue('')
  await expect(branch.getByRole('option', { name: 'CS2' })).toBeAttached()
  await drawer.getByLabel('Mã phiếu nhập').fill('PN-CS2')
  await drawer.getByRole('button', { name: /Thêm sản phẩm/ }).click()
  await drawer.getByRole('combobox', { name: 'Tìm sản phẩm' }).click()
  await page.getByRole('option', { name: 'Dầu dưỡng' }).click()
  await drawer.getByRole('button', { name: 'Lưu thay đổi' }).click()
  expect(await branch.evaluate(element => element.validity.valueMissing)).toBe(true)
  expect(savedBody).toBeUndefined()
  await branch.selectOption('2')
  await drawer.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect.poll(() => savedBody?.branch_id).toBe(2)
})