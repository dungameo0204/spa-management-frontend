# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vietnam-timezone.spec.js >> ngày Việt Nam khi trình duyệt ở Asia/Ho_Chi_Minh >> thẻ mới từ timestamp UTC hiển thị và gửi ngày Việt Nam không đổi
- Location: tests\e2e\vietnam-timezone.spec.js:39:5

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByLabel('Ngày thực hiện')
Expected: "2026-10-28"
Error: strict mode violation: getByLabel('Ngày thực hiện') resolved to 2 elements:
    1) <input id="_r_3_" required="" type="text" autocomplete="off" value="28/10/2026" inputmode="numeric" aria-expanded="false" aria-haspopup="dialog" aria-label="Ngày thực hiện"/> aka getByRole('textbox', { name: 'Ngày thực hiện' })
    2) <button type="button" class="date-input-toggle" aria-label="Mở lịch Ngày thực hiện">…</button> aka getByRole('button', { name: 'Mở lịch Ngày thực hiện' })

Call log:
  - Expect "toHaveValue" getByLabel('Ngày thực hiện') with timeout 5000ms
  - waiting for getByLabel('Ngày thực hiện')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e6]:
      - strong [ref=e7]: ROSA
      - text: CLINIC & AESTHETIC
    - generic [ref=e8]: KHÔNG GIAN CỦA BẠN
    - navigation "Điều hướng chính" [ref=e9]:
      - generic [ref=e10]:
        - paragraph [ref=e11]: LÀM VIỆC
        - link "Tổng quan" [ref=e12] [cursor=pointer]:
          - /url: /
        - link "Khách hàng" [ref=e18] [cursor=pointer]:
          - /url: /customers
        - link "Khách đặt lịch" [ref=e23] [cursor=pointer]:
          - /url: /customer-bookings
        - link "Bán hàng" [ref=e26] [cursor=pointer]:
          - /url: /invoices
      - generic [ref=e30]:
        - paragraph [ref=e31]: VẬN HÀNH
        - link "Sản phẩm & dịch vụ" [ref=e32] [cursor=pointer]:
          - /url: /products
        - link "Lịch hẹn" [ref=e37] [cursor=pointer]:
          - /url: /appointments
        - link "Liệu trình" [ref=e40] [cursor=pointer]:
          - /url: /treatments
        - link "Nhập kho" [ref=e43] [cursor=pointer]:
          - /url: /imports
        - link "Tồn kho" [ref=e54] [cursor=pointer]:
          - /url: /inventory
        - link "Phiếu chi" [ref=e59] [cursor=pointer]:
          - /url: /expenses
        - link "Thu công nợ" [ref=e62] [cursor=pointer]:
          - /url: /debts
      - generic [ref=e65]:
        - paragraph [ref=e66]: NHÂN SỰ
        - link "Hồ sơ nhân sự" [ref=e67] [cursor=pointer]:
          - /url: /staffs
        - link "Công ca" [ref=e72] [cursor=pointer]:
          - /url: /commissions
        - link "Hoa hồng · tư vấn" [ref=e79] [cursor=pointer]:
          - /url: /consultants
      - generic [ref=e83]:
        - paragraph [ref=e84]: QUẢN LÝ
        - link "Báo cáo" [ref=e85] [cursor=pointer]:
          - /url: /reports
        - link "Chi nhánh" [ref=e88] [cursor=pointer]:
          - /url: /branches
        - link "Chức vụ" [ref=e93] [cursor=pointer]:
          - /url: /roles
        - link "Tài khoản" [ref=e97] [cursor=pointer]:
          - /url: /users
    - generic [ref=e110]:
      - button "Chuyển sang giao diện tối" [ref=e111] [cursor=pointer]: Giao diện tối
      - button "Đăng xuất" [ref=e115] [cursor=pointer]
      - generic [ref=e119]: ROSA · v0.1.2
  - generic [ref=e120]:
    - banner [ref=e121]:
      - generic [ref=e122]:
        - generic [ref=e123]: KHÔNG GIAN QUẢN LÝ
        - strong [ref=e124]: Tổng quan
      - generic [ref=e125]:
        - button "Chọn chi nhánh" [ref=e127] [cursor=pointer]:
          - generic [ref=e128]: Cơ sở
          - strong [ref=e129]: Tất cả chi nhánh
        - generic "Quản lý" [ref=e132]: Q
    - main [ref=e133]:
      - generic [ref=e134]:
        - generic [ref=e135]:
          - generic [ref=e136]:
            - text: THỨC DẬY CÙNG ROSA ✦
            - heading "Chào lý, một ngày thật đẹp!" [level=1] [ref=e137]
            - paragraph [ref=e138]: Mọi điều quan trọng trong spa, gọn gàng ở đây.
          - generic [ref=e139]: 28/10/2026
        - generic [ref=e142]:
          - generic [ref=e143]:
            - text: HÔM NAY LÀ MỘT NGÀY TUYỆT VỜI
            - heading [level=2] [ref=e144]:
              - text: Chăm chỉ tạo giá trị,
              - emphasis [ref=e145]: giá trị tạo thu nhập.
            - paragraph [ref=e146]: Chào đón khách hàng bằng trải nghiệm tuyệt vời nhất.
            - link "Xem lịch hẹn" [ref=e147] [cursor=pointer]:
              - /url: /appointments
          - generic [ref=e155]: ✺
        - generic [ref=e156]:
          - generic [ref=e157]:
            - text: BỨC TRANH TỔNG QUAN
            - heading "Hiệu quả trong tháng" [level=2] [ref=e158]
          - link "Xem báo cáo" [ref=e159] [cursor=pointer]:
            - /url: /reports
        - generic [ref=e163]:
          - generic [ref=e164]:
            - generic [ref=e169]: Doanh thu tháng
            - strong [ref=e170]: —
          - generic [ref=e171]:
            - generic [ref=e176]: Doanh thu thu nợ cũ
            - strong [ref=e177]: —
          - generic [ref=e178]:
            - generic [ref=e183]: Tổng tiền thực thu
            - strong [ref=e184]: —
          - generic [ref=e185]:
            - generic [ref=e189]: Tổng chi
            - strong [ref=e190]: —
          - generic [ref=e191]:
            - generic [ref=e196]: Dòng tiền thuần
            - strong [ref=e197]: —
        - paragraph [ref=e198]: Doanh thu ≠ tiền thực thu; dòng tiền thuần = thực thu − tổng chi, không phải lợi nhuận.
        - generic [ref=e199]:
          - generic [ref=e200]:
            - text: HÓA ĐƠN
            - heading "Hóa đơn & khách hàng" [level=2] [ref=e201]
          - link "Đến bán hàng" [ref=e202] [cursor=pointer]:
            - /url: /invoices
        - generic [ref=e206]:
          - link [ref=e207] [cursor=pointer]:
            - /url: /invoices
            - strong [ref=e211]: Tạo hóa đơn
          - link [ref=e215] [cursor=pointer]:
            - /url: /customers
            - strong [ref=e220]: Tìm khách hàng
        - generic [ref=e224]:
          - generic [ref=e225]:
            - generic [ref=e226]:
              - text: KHÁCH LÀM DỊCH VỤ
              - heading "Khách hàng hôm nay" [level=2] [ref=e227]
            - generic "Chọn ngày xem khách hàng" [ref=e228]:
              - button "Ngày trước" [ref=e229] [cursor=pointer]
              - generic [ref=e232]:
                - generic [ref=e233]: Ngày xem
                - generic [ref=e234]:
                  - textbox "Ngày xem" [ref=e235]: 28/10/2026
                  - button "Mở lịch Ngày xem" [ref=e236] [cursor=pointer]
              - button "Hôm nay" [disabled] [ref=e239]
              - button "Ngày tiếp theo" [disabled] [ref=e240]
          - paragraph [ref=e243]: Thẻ tạo hôm nay hoặc có buổi thực hiện hôm nay. Tick để ghi nhận, bấm tên nhân viên để sửa, bỏ tick để hoàn tác.
          - generic [ref=e245]:
            - generic [ref=e246]: 1 lượt khách
            - button "Tải lại danh sách khách hàng" [ref=e247] [cursor=pointer]
          - table [ref=e254]:
            - rowgroup [ref=e255]:
              - row [ref=e256]:
                - columnheader "Khách hàng" [ref=e257]
                - columnheader "Dịch vụ" [ref=e258]
                - columnheader "Đã làm hôm nay" [ref=e259]
                - columnheader "Nhân viên thực hiện" [ref=e260]
                - columnheader "Chữ ký khách hàng" [ref=e261]
            - rowgroup [ref=e262]:
              - row [ref=e263]:
                - cell "Khách mới" [ref=e264]
                - cell "Chăm sóc da" [ref=e265]
                - cell [ref=e266]:
                  - checkbox "Đã làm Khách mới - Chăm sóc da" [checked] [active] [ref=e267]
                - cell "Đang chọn nhân viên bên dưới" [ref=e268]
                - cell "—" [ref=e269]
              - row [ref=e270]:
                - cell [ref=e271]:
                  - generic [ref=e272]:
                    - generic [ref=e273]:
                      - text: Cơ sở thực hiện
                      - combobox "Cơ sở thực hiện":
                        - option "Chọn cơ sở" [selected]
                        - option "Cơ sở Một"
                      - button "Cơ sở thực hiện" [ref=e274] [cursor=pointer]:
                        - generic [ref=e275]: Chọn cơ sở
                    - generic [ref=e278]:
                      - text: Ngày thực hiện
                      - generic [ref=e279]:
                        - textbox "Ngày thực hiện" [ref=e280]: 28/10/2026
                        - button "Mở lịch Ngày thực hiện" [ref=e281] [cursor=pointer]
                    - generic "Nhân viên thực hiện"
                    - button "Xác nhận" [ref=e284] [cursor=pointer]
                    - button "Hủy" [ref=e285] [cursor=pointer]
        - generic [ref=e286]:
          - generic [ref=e287]:
            - generic [ref=e288]:
              - text: CẦN QUAN TÂM
              - heading "Khách cần quan tâm" [level=2] [ref=e289]
            - generic [ref=e290]:
              - button "Tải lại khách cần quan tâm" [ref=e291] [cursor=pointer]
              - link "Xem tất cả" [ref=e297] [cursor=pointer]:
                - /url: /appointments
          - generic [ref=e301]:
            - generic [ref=e302]:
              - heading "Lịch hẹn ngày mai" [level=3] [ref=e303]
              - button "Tải lại lịch hẹn ngày mai" [ref=e304] [cursor=pointer]
            - paragraph [ref=e310]: Không có lịch hẹn.
          - generic [ref=e311]:
            - generic [ref=e312]:
              - heading "Khách chưa đến" [level=3] [ref=e313]
              - button "Tải lại khách chưa đến" [ref=e314] [cursor=pointer]
            - paragraph [ref=e320]: Không có lịch hẹn.
        - generic [ref=e322]:
          - text: LỐI TẮT
          - heading "Thao tác nhanh" [level=2] [ref=e323]
        - generic [ref=e324]:
          - link [ref=e325] [cursor=pointer]:
            - /url: /appointments
            - strong [ref=e329]: Đặt lịch hẹn
          - link [ref=e333] [cursor=pointer]:
            - /url: /customers
            - strong [ref=e339]: Khách hàng
          - link [ref=e343] [cursor=pointer]:
            - /url: /invoices
            - strong [ref=e348]: Bán hàng
          - link [ref=e352] [cursor=pointer]:
            - /url: /treatments
            - strong [ref=e356]: Liệu trình
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | for (const timezoneId of ['UTC', 'America/Los_Angeles', 'Asia/Ho_Chi_Minh']) {
  4  |   test.describe(`ngày Việt Nam khi trình duyệt ở ${timezoneId}`, () => {
  5  |     test.use({ timezoneId })
  6  | 
  7  |     test('lọc đúng buổi và cho hoàn tác cùng ngày Việt Nam', async ({ page }) => {
  8  |       await page.clock.setFixedTime(new Date('2026-10-27T17:00:00Z'))
  9  |       await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'timezone-test', user: { id: 1, fullname: 'Nhân viên', system_role: 'STAFF', branch_id: 1 } })))
  10 |       const writes = []
  11 |       const histories = [
  12 |         { id: 77, branch_id: 1, execution_date: '2026-10-27T17:00:00Z', created_at: '2026-10-27T17:00:00Z', staffs: [] },
  13 |         { id: 78, branch_id: 1, execution_date: '2026-10-28', created_at: '2026-10-27T17:00:00Z', staffs: [] },
  14 |         { id: 79, branch_id: 1, execution_date: '2026-10-27T16:59:59Z', created_at: '2026-10-27T16:59:59Z', staffs: [] },
  15 |       ]
  16 |       await page.route('**/api/**', route => {
  17 |         const path = new URL(route.request().url()).pathname
  18 |         if (!path.startsWith('/api/')) return route.continue()
  19 |         if (path === '/api/treatments/execute/77' && route.request().method() === 'DELETE') {
  20 |           writes.push(77)
  21 |           return route.fulfill({ json: {} })
  22 |         }
  23 |         if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách múi giờ', product_name: 'Chăm sóc da', created_at: '2026-10-01', remaining_sessions: 3 }], total: 1 } })
  24 |         if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories } } })
  25 |         return route.fulfill({ json: { data: [], total: 0 } })
  26 |       })
  27 |       await page.goto('/')
  28 |       await expect(page.locator('tr[data-history-id="77"]')).toBeVisible()
  29 |       await expect(page.locator('tr[data-history-id="78"]')).toBeVisible()
  30 |       await expect(page.locator('tr[data-history-id="79"]')).toHaveCount(0)
  31 |       const checkbox = page.locator('tr[data-history-id="77"]').getByRole('checkbox')
  32 |       await expect(checkbox).toBeChecked()
  33 |       await expect(checkbox).toBeEnabled()
  34 |       await checkbox.click()
  35 |       await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  36 |       await expect.poll(() => writes).toEqual([77])
  37 |     })
  38 | 
  39 |     test('thẻ mới từ timestamp UTC hiển thị và gửi ngày Việt Nam không đổi', async ({ page }) => {
  40 |       await page.clock.setFixedTime(new Date('2026-10-27T17:00:00Z'))
  41 |       await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'timezone-manager', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  42 |       const writes = []
  43 |       await page.route('**/api/**', route => {
  44 |         const path = new URL(route.request().url()).pathname
  45 |         if (!path.startsWith('/api/')) return route.continue()
  46 |         if (path === '/api/treatments/execute' && route.request().method() === 'POST') {
  47 |           writes.push(route.request().postDataJSON())
  48 |           return route.fulfill({ json: { treatmentHistoryId: 80 } })
  49 |         }
  50 |         if (path === '/api/treatments') return route.fulfill({ json: { data: [{ id: 10, customer_name: 'Khách mới', product_name: 'Chăm sóc da', created_at: '2026-10-27T17:00:00Z', remaining_sessions: 3 }], total: 1 } })
  51 |         if (path === '/api/treatments/10') return route.fulfill({ json: { data: { id: 10, histories: [] } } })
  52 |         if (path === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'Cơ sở Một' }], total: 1 } })
  53 |         return route.fulfill({ json: { data: [], total: 0 } })
  54 |       })
  55 |       await page.goto('/')
  56 |       await page.getByRole('checkbox', { name: /Đã làm Khách mới/ }).check()
> 57 |       await expect(page.getByLabel('Ngày thực hiện')).toHaveValue('2026-10-28')
     |                                                       ^ Error: expect(locator).toHaveValue(expected) failed
  58 |       await page.getByRole('combobox', { name: 'Cơ sở thực hiện', exact: true }).selectOption('1')
  59 |       await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
  60 |       await expect.poll(() => writes).toEqual([{ treatment_id: 10, branch_id: 1, execution_date: '2026-10-28', staffs: [] }])
  61 |     })
  62 |   })
  63 | }
```