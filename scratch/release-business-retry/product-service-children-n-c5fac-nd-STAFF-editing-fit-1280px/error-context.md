# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-service-children.spec.js >> nested service display and STAFF editing fit 1280px
- Location: tests\e2e\product-service-children.spec.js:39:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Chăm sóc da cơ bản')
Expected: visible
Error: strict mode violation: getByText('Chăm sóc da cơ bản') resolved to 2 elements:
    1) <strong>Chăm sóc da cơ bản</strong> aka getByRole('region', { name: 'Dịch vụ con' }).getByText('Chăm sóc da cơ bản')
    2) <strong>Chăm sóc da cơ bản</strong> aka getByText('Chăm sóc da cơ bản').nth(1)

Call log:
  - Expect "toBeVisible" getByText('Chăm sóc da cơ bản') with timeout 5000ms
  - waiting for getByText('Chăm sóc da cơ bản')

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - complementary [ref=f1e4]:
    - generic [ref=f1e6]:
      - strong [ref=f1e7]: ROSA
      - text: CLINIC & AESTHETIC
    - generic [ref=f1e8]: KHÔNG GIAN CỦA BẠN
    - navigation "Điều hướng chính" [ref=f1e9]:
      - generic [ref=f1e10]:
        - paragraph [ref=f1e11]: LÀM VIỆC
        - link "Tổng quan" [ref=f1e12] [cursor=pointer]:
          - /url: /
        - link "Khách hàng" [ref=f1e18] [cursor=pointer]:
          - /url: /customers
        - link "Khách đặt lịch" [ref=f1e23] [cursor=pointer]:
          - /url: /customer-bookings
        - link "Bán hàng" [ref=f1e26] [cursor=pointer]:
          - /url: /invoices
      - generic [ref=f1e30]:
        - paragraph [ref=f1e31]: VẬN HÀNH
        - link "Sản phẩm & dịch vụ" [ref=f1e32] [cursor=pointer]:
          - /url: /products
        - link "Lịch hẹn" [ref=f1e37] [cursor=pointer]:
          - /url: /appointments
        - link "Liệu trình" [ref=f1e40] [cursor=pointer]:
          - /url: /treatments
        - link "Nhập kho" [ref=f1e43] [cursor=pointer]:
          - /url: /imports
        - link "Tồn kho" [ref=f1e54] [cursor=pointer]:
          - /url: /inventory
        - link "Phiếu chi" [ref=f1e59] [cursor=pointer]:
          - /url: /expenses
        - link "Thu công nợ" [ref=f1e62] [cursor=pointer]:
          - /url: /debts
      - generic [ref=f1e65]:
        - paragraph [ref=f1e66]: NHÂN SỰ
        - link "Hồ sơ nhân sự" [ref=f1e67] [cursor=pointer]:
          - /url: /staffs
    - generic [ref=f1e72]:
      - button "Chuyển sang giao diện tối" [ref=f1e73] [cursor=pointer]: Giao diện tối
      - button "Đăng xuất" [ref=f1e77] [cursor=pointer]
      - generic [ref=f1e81]: ROSA · v0.1.2
  - generic [ref=f1e82]:
    - banner [ref=f1e83]:
      - generic [ref=f1e84]:
        - generic [ref=f1e85]: KHÔNG GIAN QUẢN LÝ
        - strong [ref=f1e86]: Sản phẩm & dịch vụ
      - generic [ref=f1e87]:
        - generic [ref=f1e88]: Cơ sở của bạn
        - generic "Nguyễn An" [ref=f1e89]: "N"
    - main [ref=f1e90]:
      - generic [ref=f1e91]:
        - generic [ref=f1e92]:
          - generic [ref=f1e93]:
            - text: KHÔNG GIAN VẬN HÀNH
            - heading "Sản phẩm & dịch vụ" [level=1] [ref=f1e94]
            - paragraph [ref=f1e95]: Thông tin được đồng bộ trực tiếp từ spa của bạn.
          - generic [ref=f1e96]:
            - button "Xuất Excel" [ref=f1e98] [cursor=pointer]
            - button "Thêm mới" [ref=f1e99] [cursor=pointer]
        - generic [ref=f1e101]:
          - generic [ref=f1e102]:
            - textbox "Tìm kiếm" [ref=f1e107]:
              - /placeholder: Tìm kiếm...
            - generic [ref=f1e108]:
              - generic [ref=f1e109]: 1 kết quả
              - button "Tải lại sản phẩm & dịch vụ" [ref=f1e110] [cursor=pointer]
          - table [ref=f1e117]:
            - rowgroup [ref=f1e118]:
              - row [ref=f1e119]:
                - columnheader "Tên" [ref=f1e120]
                - columnheader "Giá niêm yết" [ref=f1e121]
                - columnheader "Giá bán" [ref=f1e122]
                - columnheader "Đơn vị" [ref=f1e123]
                - columnheader "Loại" [ref=f1e124]
                - columnheader [ref=f1e125]
            - rowgroup [ref=f1e126]:
              - row [ref=f1e127] [cursor=pointer]:
                - cell [ref=f1e128]:
                  - strong [ref=f1e129]: Gói chăm sóc da tổng hợp
                  - region "Dịch vụ con" [ref=f1e130]:
                    - generic [ref=f1e131]: Có 4 dịch vụ con
                    - list [ref=f1e133]:
                      - listitem [ref=f1e134]:
                        - strong [ref=f1e136]: Chăm sóc da cơ bản
                      - listitem [ref=f1e137]:
                        - strong [ref=f1e139]: Điện di tinh chất
                      - listitem [ref=f1e140]:
                        - strong [ref=f1e142]: Đắp mặt nạ phục hồi
                    - generic [ref=f1e143]: +1 dịch vụ khác · Mở chi tiết để xem
                - cell [ref=f1e144]:
                  - strong [ref=f1e145]: 500.000 ₫
                - cell [ref=f1e146]:
                  - strong [ref=f1e147]: 500.000 ₫
                - cell "—" [ref=f1e148]
                - cell "Dịch vụ" [ref=f1e149]
                - cell [ref=f1e150]:
                  - button "Xem Gói chăm sóc da tổng hợp" [ref=f1e151]
              - row [ref=f1e155] [cursor=pointer]:
                - cell [ref=f1e156]:
                  - strong [ref=f1e157]: Chăm sóc da cơ bản
                - cell [ref=f1e158]:
                  - strong [ref=f1e159]: —
                - cell [ref=f1e160]:
                  - strong [ref=f1e161]: —
                - cell "—" [ref=f1e162]
                - cell "Dịch vụ" [ref=f1e163]
                - cell [ref=f1e164]:
                  - button "Xem Chăm sóc da cơ bản" [ref=f1e165]
              - row [ref=f1e169] [cursor=pointer]:
                - cell [ref=f1e170]:
                  - strong [ref=f1e171]: Điện di tinh chất
                - cell [ref=f1e172]:
                  - strong [ref=f1e173]: —
                - cell [ref=f1e174]:
                  - strong [ref=f1e175]: —
                - cell "—" [ref=f1e176]
                - cell "Dịch vụ" [ref=f1e177]
                - cell [ref=f1e178]:
                  - button "Xem Điện di tinh chất" [ref=f1e179]
              - row [ref=f1e183] [cursor=pointer]:
                - cell [ref=f1e184]:
                  - strong [ref=f1e185]: Đắp mặt nạ phục hồi
                - cell [ref=f1e186]:
                  - strong [ref=f1e187]: —
                - cell [ref=f1e188]:
                  - strong [ref=f1e189]: —
                - cell "—" [ref=f1e190]
                - cell "Dịch vụ" [ref=f1e191]
                - cell [ref=f1e192]:
                  - button "Xem Đắp mặt nạ phục hồi" [ref=f1e193]
              - row [ref=f1e197] [cursor=pointer]:
                - cell [ref=f1e198]:
                  - strong [ref=f1e199]: Massage thư giãn
                - cell [ref=f1e200]:
                  - strong [ref=f1e201]: —
                - cell [ref=f1e202]:
                  - strong [ref=f1e203]: —
                - cell "—" [ref=f1e204]
                - cell "Dịch vụ" [ref=f1e205]
                - cell [ref=f1e206]:
                  - button "Xem Massage thư giãn" [ref=f1e207]
              - row [ref=f1e211] [cursor=pointer]:
                - cell [ref=f1e212]:
                  - strong [ref=f1e213]: Serum bán lẻ
                - cell [ref=f1e214]:
                  - strong [ref=f1e215]: —
                - cell [ref=f1e216]:
                  - strong [ref=f1e217]: —
                - cell "—" [ref=f1e218]
                - cell "Sản phẩm" [ref=f1e219]
                - cell [ref=f1e220]:
                  - button "Xem Serum bán lẻ" [ref=f1e221]
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | async function setup(page, role = 'MANAGER') {
  4  |   const writes = []
  5  |   const children = [
  6  |     { id: 12, name: 'Chăm sóc da cơ bản', is_product: 0 },
  7  |     { id: 18, name: 'Điện di tinh chất', is_product: 0 },
  8  |     { id: 19, name: 'Đắp mặt nạ phục hồi', is_product: 0 },
  9  |     { id: 21, name: 'Massage thư giãn', is_product: 0 },
  10 |   ]
  11 |   let parent = { id: 20, name: 'Gói chăm sóc da tổng hợp', is_product: 0, price: 500000, sale_price: 500000, child_service_ids: [12, 18, 19, 21] }
  12 |   await page.route('**/api/**', async route => {
  13 |     const url = new URL(route.request().url()), path = url.pathname, method = route.request().method()
  14 |     if (!path.startsWith('/api/')) return route.continue()
  15 |     if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Nguyễn An', system_role: role } } } })
  16 |     if (path === '/api/products' && method === 'POST') {
  17 |       writes.push(route.request().postDataJSON())
  18 |       return route.fulfill({ status: 201, json: { productId: 50, message: 'Đã lưu' } })
  19 |     }
  20 |     if (path === '/api/products/20' && method === 'PUT') {
  21 |       const body = route.request().postDataJSON()
  22 |       writes.push(body)
  23 |       parent = { ...parent, ...body }
  24 |       return route.fulfill({ json: { message: 'Đã lưu' } })
  25 |     }
  26 |     if (path.startsWith('/api/products/')) return route.fulfill({ json: { data: [parent, ...children].find(item => item.id === Number(path.split('/').pop())) } })
  27 |     if (path === '/api/products') return route.fulfill({ json: { data: !url.searchParams.has('search') || url.searchParams.get('is_product') === '0' ? [parent, ...children, { id: 30, name: 'Serum bán lẻ', is_product: 1 }] : [parent], total: 1, totalPages: 1 } })
  28 |     return route.fulfill({ json: { data: [], total: 0 } })
  29 |   })
  30 |   await page.goto('/login')
  31 |   await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  32 |   await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  33 |   await page.getByRole('button', { name: 'Đăng nhập' }).click()
  34 |   await page.goto('/products')
  35 |   return writes
  36 | }
  37 | 
  38 | for (const width of [1280, 390]) {
  39 |   test(`nested service display and STAFF editing fit ${width}px`, async ({ page }) => {
  40 |     await page.setViewportSize({ width, height: 900 })
  41 |     const writes = await setup(page, 'STAFF')
  42 |     await expect(page.getByText('Có 4 dịch vụ con')).toBeVisible()
  43 |     await expect(page.getByText('+1 dịch vụ khác · Mở chi tiết để xem')).toBeVisible()
> 44 |     await expect(page.getByText('Chăm sóc da cơ bản')).toBeVisible()
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  45 |     await page.getByRole('button', { name: 'Xem Gói chăm sóc da tổng hợp' }).click()
  46 |     const dialog = page.getByRole('dialog')
  47 |     await expect(dialog.getByRole('region', { name: 'Dịch vụ con' }).getByRole('listitem')).toHaveCount(4)
  48 |     await expect(dialog.getByText('Massage thư giãn', { exact: true })).toBeVisible()
  49 |     await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  50 |     await dialog.getByRole('button', { name: 'Đưa Điện di tinh chất lên' }).click()
  51 |     await dialog.getByRole('button', { name: 'Bỏ Đắp mặt nạ phục hồi' }).click()
  52 |     await expect(dialog.getByRole('listitem').first()).toContainText('Điện di tinh chất')
  53 |     await dialog.getByRole('button', { name: 'Thêm dịch vụ con' }).click()
  54 |     await dialog.getByRole('combobox', { name: 'Tìm dịch vụ con' }).click()
  55 |     await expect(dialog.getByRole('option', { name: 'Đắp mặt nạ phục hồi' })).toBeVisible()
  56 |     await expect(dialog.getByRole('option', { name: 'Gói chăm sóc da tổng hợp' })).toHaveCount(0)
  57 |     await expect(dialog.getByRole('option', { name: 'Serum bán lẻ' })).toHaveCount(0)
  58 |     await dialog.getByRole('option', { name: 'Đắp mặt nạ phục hồi' }).click()
  59 |     const fits = await dialog.getByRole('region', { name: 'Dịch vụ con' }).evaluate(element => {
  60 |       const bounds = element.getBoundingClientRect()
  61 |       return bounds.left >= 0 && bounds.right <= innerWidth && element.scrollWidth <= element.clientWidth
  62 |     })
  63 |     expect(fits).toBe(true)
  64 |     await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
  65 |     await expect(dialog).toHaveCount(0)
  66 |     expect(writes[0].child_service_ids).toEqual([18, 12, 21, 19])
  67 |     expect(writes[0]).not.toHaveProperty('commission_tiers')
  68 |     expect(writes[0]).not.toHaveProperty('commissions')
  69 |     await page.getByRole('button', { name: 'Xem Gói chăm sóc da tổng hợp' }).click()
  70 |     await expect(page.getByRole('dialog').getByRole('listitem').first()).toContainText('Điện di tinh chất')
  71 |     await page.screenshot({ path: `test-results/product-service-children-${width}.png`, fullPage: true })
  72 |   })
  73 | }
  74 | 
  75 | test('creates child links and hides the editor for retail products', async ({ page }) => {
  76 |   const writes = await setup(page)
  77 |   await page.getByRole('button', { name: 'Thêm mới' }).click()
  78 |   const dialog = page.getByRole('dialog')
  79 |   await expect(dialog.getByRole('region', { name: 'Dịch vụ con' })).toHaveCount(0)
  80 |   await dialog.getByLabel('Tên sản phẩm / dịch vụ').fill('Gói mới')
  81 |   await dialog.getByLabel('Phân loại', { exact: true }).selectOption('0')
  82 |   await expect(dialog.getByText('Chưa có dịch vụ con.')).toBeVisible()
  83 |   await dialog.getByRole('button', { name: 'Thêm dịch vụ con' }).click()
  84 |   await dialog.getByRole('combobox', { name: 'Tìm dịch vụ con' }).click()
  85 |   await dialog.getByRole('option', { name: 'Điện di tinh chất' }).click()
  86 |   await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
  87 |   await expect(dialog).toHaveCount(0)
  88 |   expect(writes[0].child_service_ids).toEqual([18])
  89 | })
```