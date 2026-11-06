# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: list-refresh.spec.js >> hóa đơn lọc ngày và tên, tải lại sau khi xóa
- Location: tests\e2e\list-refresh.spec.js:36:1

# Error details

```
Error: locator.fill: Error: strict mode violation: getByLabel('Từ ngày') resolved to 2 elements:
    1) <input id="_r_0_" type="text" autocomplete="off" value="dd/mm/yyyy" inputmode="numeric" aria-label="Từ ngày" aria-expanded="false" aria-haspopup="dialog"/> aka getByRole('textbox', { name: 'Từ ngày' })
    2) <button type="button" class="date-input-toggle" aria-label="Mở lịch Từ ngày">…</button> aka getByRole('button', { name: 'Mở lịch Từ ngày' })

Call log:
  - waiting for getByLabel('Từ ngày')

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
        - link "Công ca" [ref=f1e72] [cursor=pointer]:
          - /url: /commissions
        - link "Hoa hồng · tư vấn" [ref=f1e79] [cursor=pointer]:
          - /url: /consultants
      - generic [ref=f1e83]:
        - paragraph [ref=f1e84]: QUẢN LÝ
        - link "Báo cáo" [ref=f1e85] [cursor=pointer]:
          - /url: /reports
        - link "Chi nhánh" [ref=f1e88] [cursor=pointer]:
          - /url: /branches
        - link "Chức vụ" [ref=f1e93] [cursor=pointer]:
          - /url: /roles
        - link "Tài khoản" [ref=f1e97] [cursor=pointer]:
          - /url: /users
    - generic [ref=f1e110]:
      - button "Chuyển sang giao diện tối" [ref=f1e111] [cursor=pointer]: Giao diện tối
      - button "Đăng xuất" [ref=f1e115] [cursor=pointer]
      - generic [ref=f1e119]: ROSA · v0.1.2
  - generic [ref=f1e120]:
    - banner [ref=f1e121]:
      - generic [ref=f1e122]:
        - generic [ref=f1e123]: KHÔNG GIAN QUẢN LÝ
        - strong [ref=f1e124]: Bán hàng
      - generic [ref=f1e125]:
        - button "Chọn chi nhánh" [ref=f1e127] [cursor=pointer]:
          - generic [ref=f1e128]: Cơ sở
          - strong [ref=f1e129]: Tất cả chi nhánh
        - generic "Quản lý" [ref=f1e132]: Q
    - main [ref=f1e133]:
      - generic [ref=f1e134]:
        - generic [ref=f1e135]:
          - generic [ref=f1e136]:
            - text: CHĂM SÓC TỪNG GIAO DỊCH
            - heading "Bán hàng & hóa đơn" [level=1] [ref=f1e137]
            - paragraph [ref=f1e138]: Mọi đơn hàng, mọi nụ cười — luôn được ghi nhận.
          - button "Tạo hóa đơn" [ref=f1e139] [cursor=pointer]
        - group "Khoảng ngày" [ref=f1e141]:
          - generic [ref=f1e142]:
            - generic [ref=f1e143]: Từ ngày
            - generic [ref=f1e144]:
              - textbox "Từ ngày" [ref=f1e145]: dd/mm/yyyy
              - button "Mở lịch Từ ngày" [ref=f1e146] [cursor=pointer]
          - generic [ref=f1e149]:
            - generic [ref=f1e150]: Đến ngày
            - generic [ref=f1e151]:
              - textbox "Đến ngày" [ref=f1e152]: dd/mm/yyyy
              - button "Mở lịch Đến ngày" [ref=f1e153] [cursor=pointer]
        - button "Xuất Excel" [disabled] [ref=f1e158]
        - generic [ref=f1e159]:
          - generic [ref=f1e160]:
            - textbox "Tìm kiếm" [ref=f1e165]:
              - /placeholder: Tìm kiếm...
            - generic [ref=f1e166]:
              - generic [ref=f1e167]: 0 kết quả
              - button "Tải lại hóa đơn" [ref=f1e168] [cursor=pointer]
          - generic [ref=f1e174]:
            - heading "Chưa có dữ liệu" [level=3] [ref=f1e178]
            - paragraph [ref=f1e179]: Thử từ khóa khác hoặc thêm bản ghi mới.
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | test('phiếu nhập kho tải lại danh sách sau khi tạo', async ({ page }) => {
  4  |   let reads = 0
  5  |   let saved = false
  6  |   await page.route('**/api/**', route => {
  7  |     const path = new URL(route.request().url()).pathname
  8  |     if (!path.startsWith('/api/')) return route.continue()
  9  |     if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
  10 |     if (path === '/api/inventory-imports' && route.request().method() === 'GET') {
  11 |       reads++
  12 |       const data = saved ? [{ id: 7, import_code: 'PN-TEST', supplier_name: 'NCC', total_amount: 100000, import_date: '2026-10-11', branch_name: 'CS1' }] : []
  13 |       return route.fulfill({ json: { data, total: data.length } })
  14 |     }
  15 |     if (path === '/api/inventory-imports' && route.request().method() === 'POST') { saved = true; return route.fulfill({ status: 201, json: { importId: 7 } }) }
  16 |     if (path === '/api/products') return route.fulfill({ json: { data: [{ id: 3, name: 'Dầu dưỡng', is_product: 1, price: 100000 }], total: 1 } })
  17 |     return route.fulfill({ json: { data: [], total: 0 } })
  18 |   })
  19 |   await page.goto('/login')
  20 |   await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  21 |   await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  22 |   await page.getByRole('button', { name: 'Đăng nhập' }).click()
  23 |   await page.goto('/imports')
  24 |   await expect.poll(() => reads).toBeGreaterThan(0)
  25 |   const before = reads
  26 |   await page.getByRole('button', { name: 'Thêm mới' }).click()
  27 |   await page.getByLabel('Mã phiếu').fill('PN-TEST')
  28 |   await page.getByRole('button', { name: /Thêm sản phẩm/ }).click()
  29 |   await page.getByRole('combobox', { name: 'Sản phẩm' }).click()
  30 |   await page.getByRole('option', { name: /Dầu dưỡng/ }).click()
  31 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  32 |   await expect.poll(() => reads).toBeGreaterThan(before)
  33 |   await expect(page.getByRole('row', { name: /PN-TEST/ })).toBeVisible()
  34 | })
  35 | 
  36 | test('hóa đơn lọc ngày và tên, tải lại sau khi xóa', async ({ page }) => {
  37 |   const requests = []
  38 |   let deleted = false
  39 |   await page.route('**/api/**', route => {
  40 |     const url = new URL(route.request().url()), path = url.pathname
  41 |     if (!path.startsWith('/api/')) return route.continue()
  42 |     if (path === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
  43 |     if (path === '/api/invoices' && route.request().method() === 'GET') {
  44 |       requests.push(url)
  45 |       const matches = url.searchParams.get('startDate') === '2026-10-10' && url.searchParams.get('endDate') === '2026-10-10' && url.searchParams.get('search') === 'dũng'
  46 |       const data = matches && !deleted ? [{ id: 8, customer_name: 'Dũng', invoice_date: '2026-10-10 10:00:00', branch_name: 'CS1', total_amount: 100000, debt_amount: 0 }] : []
  47 |       return route.fulfill({ json: { data, total: data.length } })
  48 |     }
  49 |     if (path === '/api/invoices/8' && route.request().method() === 'GET') return route.fulfill({ json: { data: { id: 8, customer_name: 'Dũng', invoice_date: '2026-10-10 10:00:00', branch_name: 'CS1', total_amount: 100000, debt_amount: 0, items: [] } } })
  50 |     if (path === '/api/invoices/8' && route.request().method() === 'DELETE') { deleted = true; return route.fulfill({ json: { message: 'ok' } }) }
  51 |     return route.fulfill({ json: { data: [], total: 0 } })
  52 |   })
  53 |   await page.goto('/login')
  54 |   await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  55 |   await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  56 |   await page.getByRole('button', { name: 'Đăng nhập' }).click()
  57 |   await page.goto('/invoices')
> 58 |   await page.getByLabel('Từ ngày').fill('2026-10-10')
     |                                    ^ Error: locator.fill: Error: strict mode violation: getByLabel('Từ ngày') resolved to 2 elements:
  59 |   await page.getByLabel('Đến ngày').fill('2026-10-10')
  60 |   await page.getByRole('textbox', { name: 'Tìm kiếm' }).fill('dũng')
  61 |   await expect(page.getByRole('row', { name: /Dũng.*10\/10\/2026/ })).toBeVisible()
  62 |   expect(requests.at(-1).searchParams.get('search')).toBe('dũng')
  63 |   const before = requests.length
  64 |   await page.getByRole('row', { name: /Dũng/ }).click()
  65 |   await page.getByRole('button', { name: 'Xóa hóa đơn' }).click()
  66 |   await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận' }).click()
  67 |   await expect.poll(() => requests.length).toBeGreaterThan(before)
  68 |   await expect(page.getByRole('row', { name: /Dũng/ })).toHaveCount(0)
  69 | })
```