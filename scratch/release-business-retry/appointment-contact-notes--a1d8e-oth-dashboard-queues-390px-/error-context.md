# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: appointment-contact-notes.spec.js >> contact history across appointments and both dashboard queues (390px)
- Location: tests\e2e\appointment-contact-notes.spec.js:3:34

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Sửa lần liên hệ #16' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Sửa lần liên hệ #16' }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Sửa lần liên hệ #16' })

```

```yaml
- complementary:
  - strong: ROSA
  - text: CLINIC & AESTHETIC
  - button "Đóng menu":
    - img
  - text: KHÔNG GIAN CỦA BẠN
  - navigation "Điều hướng chính":
    - paragraph: LÀM VIỆC
    - link "Tổng quan":
      - /url: /
      - img
      - text: Tổng quan
    - link "Khách hàng":
      - /url: /customers
      - img
      - text: Khách hàng
    - link "Khách đặt lịch":
      - /url: /customer-bookings
      - img
      - text: Khách đặt lịch
    - link "Bán hàng":
      - /url: /invoices
      - img
      - text: Bán hàng
    - paragraph: VẬN HÀNH
    - link "Sản phẩm & dịch vụ":
      - /url: /products
      - img
      - text: Sản phẩm & dịch vụ
    - link "Lịch hẹn":
      - /url: /appointments
      - img
      - text: Lịch hẹn
    - link "Liệu trình":
      - /url: /treatments
      - img
      - text: Liệu trình
    - link "Nhập kho":
      - /url: /imports
      - img
      - text: Nhập kho
    - link "Tồn kho":
      - /url: /inventory
      - img
      - text: Tồn kho
    - link "Phiếu chi":
      - /url: /expenses
      - img
      - text: Phiếu chi
    - link "Thu công nợ":
      - /url: /debts
      - img
      - text: Thu công nợ
    - paragraph: NHÂN SỰ
    - link "Hồ sơ nhân sự":
      - /url: /staffs
      - img
      - text: Hồ sơ nhân sự
  - button "Chuyển sang giao diện tối":
    - img
    - text: Giao diện tối
  - button "Đăng xuất":
    - img
    - text: Đăng xuất
  - text: ROSA · v0.1.2
- banner:
  - button "Mở menu":
    - img
  - text: KHÔNG GIAN QUẢN LÝ
  - strong: Lịch hẹn
  - text: "N"
- main:
  - text: KHÔNG GIAN VẬN HÀNH
  - heading "Lịch hẹn" [level=1]
  - paragraph: Thông tin được đồng bộ trực tiếp từ spa của bạn.
  - button "Thêm mới":
    - img
    - text: Thêm mới
  - group "Lọc trạng thái lịch hẹn":
    - button "Tất cả"
    - button "Khách cần quan tâm"
    - button "Khách đã đến"
  - group "Khoảng ngày":
    - text: Từ ngày
    - textbox "Từ ngày": dd/mm/yyyy
    - button "Mở lịch Từ ngày":
      - img
    - text: Đến ngày
    - textbox "Đến ngày": dd/mm/yyyy
    - button "Mở lịch Đến ngày":
      - img
  - img
  - textbox "Tìm kiếm":
    - /placeholder: Tìm kiếm...
  - text: 1 kết quả
  - button "Tải lại lịch hẹn":
    - img
  - table:
    - rowgroup:
      - 'row "Khách hàng Khách Hoa 0900000000 Ngày hẹn 03/11/2026 Trạng thái Khách chưa đến Dịch vụ Laser dịch vụ Ghi chú 28/10/2026: Đã liên hệ Khách cần tư vấn 02/11/2026: Khách xác nhận Sẽ đến chiều mai Xem 9"':
        - cell "Khách hàng Khách Hoa 0900000000":
          - text: Khách hàng
          - strong: Khách Hoa
          - text: "0900000000"
        - cell "Ngày hẹn 03/11/2026"
        - cell "Trạng thái Khách chưa đến"
        - cell "Dịch vụ Laser dịch vụ"
        - 'cell "Ghi chú 28/10/2026: Đã liên hệ Khách cần tư vấn 02/11/2026: Khách xác nhận Sẽ đến chiều mai"'
        - cell "Xem 9":
          - button "Xem 9":
            - img
  - button "Đóng"
  - dialog "Chi tiết lịch hẹn":
    - heading "Chi tiết lịch hẹn" [level=2]
    - button "Đóng":
      - img
    - text: Khách hàng
    - strong: Khách Hoa
    - text: Số điện thoại
    - strong: "0900000000"
    - text: Chi nhánh
    - strong: ROSA
    - text: Ngày hẹn
    - strong: 03/11/2026
    - text: Trạng thái
    - strong: Khách chưa đến
    - text: Dịch vụ
    - strong: Laser dịch vụ
    - region "Ghi chú":
      - heading "Ghi chú" [level=3]
      - article:
        - text: 28/10/2026
        - paragraph: Đã liên hệ Khách cần tư vấn
        - 'button "Sửa ghi chú #15"'
        - 'button "Xóa ghi chú #15"'
      - article:
        - text: 02/11/2026
        - paragraph: Khách xác nhận Sẽ đến chiều mai
        - 'button "Sửa ghi chú #16"'
        - 'button "Xóa ghi chú #16"'
      - text: Nội dung ghi chú mới
      - textbox "Nội dung ghi chú mới":
        - /placeholder: Nhập ghi chú về khách...
      - paragraph: Ngày tạo do hệ thống tự ghi nhận.
      - button "Thêm ghi chú"
    - button "Sửa":
      - img
      - text: Sửa
    - button "Xóa":
      - img
      - text: Xóa
- navigation "Điều hướng nhanh":
  - link "Tổng quan":
    - /url: /
    - img
    - text: Tổng quan
  - link "Khách hàng":
    - /url: /customers
    - img
    - text: Khách hàng
  - link "Khách đặt lịch":
    - /url: /customer-bookings
    - img
    - text: Khách đặt lịch
  - link "Bán hàng":
    - /url: /invoices
    - img
    - text: Bán hàng
  - button "Thêm":
    - img
    - text: Thêm
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | for (const width of [390, 1440]) test(`contact history across appointments and both dashboard queues (${width}px)`, async ({ page }) => {
  4  |   await page.setViewportSize({ width, height: 900 })
  5  |   let notes = [{ id: 15, content: 'Đã liên hệ\nKhách cần tư vấn', contact_date: '28/10/2026' }]
  6  |   let saved
  7  |   const appointment = () => ({ id: 9, customer_id: 7, customer_name: 'Khách Hoa', phone_number: '0900000000', branch_id: 1, branch_name: 'ROSA', appointment_date: '2026-11-03', note: 'Laser dịch vụ', status: 'Khách chưa đến', contact_notes: notes, extra_note: notes.map(n => `${n.contact_date}: ${n.content}`).join('\n') || null })
  8  |   await page.route('**/api/**', async route => {
  9  |     const url = new URL(route.request().url()), method = route.request().method()
  10 |     if (!url.pathname.startsWith('/api/')) return route.continue()
  11 |     const paged = data => ({ total: data.length, page: 1, pageSize: 20, totalPages: 1, data })
  12 |     if (url.pathname === '/api/auth/login') return route.fulfill({ json: { data: { token: 'test-token', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Nhân viên', system_role: 'STAFF' } } } })
  13 |     if (url.pathname.endsWith('/contact-notes') && method === 'POST') {
  14 |       expect(Object.keys(route.request().postDataJSON())).toEqual(['content'])
  15 |       notes = [...notes, { id: 16, content: route.request().postDataJSON().content, contact_date: '02/11/2026' }]
  16 |       return route.fulfill({ status: 201, json: { data: appointment() } })
  17 |     }
  18 |     if (url.pathname === '/api/appointments/9' && method === 'PUT') { saved = route.request().postDataJSON(); return route.fulfill({ json: { message: 'OK' } }) }
  19 |     if (url.pathname === '/api/appointments/9') return route.fulfill({ json: { data: appointment() } })
  20 |     if (['/api/appointments', '/api/appointments/tomorrow', '/api/appointments/not-arrived'].includes(url.pathname)) return route.fulfill({ json: paged([appointment()]) })
  21 |     return route.fulfill({ json: paged([]) })
  22 |   })
  23 |   await page.goto('/login')
  24 |   await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  25 |   await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  26 |   await page.getByRole('button', { name: 'Đăng nhập' }).click()
  27 |   const rows = page.locator('.dashboard-appointment-table tbody tr')
  28 |   await expect(rows).toHaveCount(2)
  29 |   for (const row of await rows.all()) {
  30 |     await expect(row).toContainText('Laser dịch vụ')
  31 |     await expect(row).toContainText('Khách cần tư vấn')
  32 |     await expect(row.getByRole('button', { name: /Thêm ghi chú/ })).toBeVisible()
  33 |   }
  34 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  35 |   await rows.first().getByRole('button', { name: /Thêm ghi chú/ }).click()
  36 |   await page.getByLabel('Nội dung ghi chú mới').fill('Khách xác nhận\nSẽ đến chiều mai')
  37 |   await page.getByRole('dialog').getByRole('button', { name: 'Thêm ghi chú', exact: true }).click()
  38 |   await expect(page.getByLabel('Nội dung ghi chú mới')).toHaveValue('')
  39 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  40 |   for (const row of await rows.all()) await expect(row).toContainText('Sẽ đến chiều mai')
  41 |   await page.goto('/appointments')
  42 |   await expect(page.locator('table')).toContainText('Sẽ đến chiều mai')
  43 |   await page.getByRole('button', { name: 'Xem 9', exact: true }).click()
> 44 |   await expect(page.getByRole('button', { name: 'Sửa lần liên hệ #16' })).toBeVisible()
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  45 |   await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  46 |   await expect(page.getByRole('combobox', { name: 'Tìm dịch vụ' })).toHaveValue('Laser dịch vụ')
  47 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  48 |   await expect.poll(() => saved?.note).toBe('Laser dịch vụ')
  49 |   expect(saved).not.toHaveProperty('extra_note')
  50 |   expect(saved).not.toHaveProperty('contact_notes')
  51 |   expect(saved).not.toHaveProperty('status')
  52 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  53 | })
```