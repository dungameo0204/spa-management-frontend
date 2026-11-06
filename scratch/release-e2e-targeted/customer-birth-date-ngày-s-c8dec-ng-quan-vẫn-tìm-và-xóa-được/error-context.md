# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-birth-date.spec.js >> ngày sinh trong thêm/sửa khách, không hiện ở danh sách và tổng quan; vẫn tìm và xóa được
- Location: tests\e2e\customer-birth-date.spec.js:30:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 3
Received: 2

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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
        - strong [ref=e124]: Khách hàng
      - generic [ref=e125]:
        - button "Chọn chi nhánh" [ref=e127] [cursor=pointer]:
          - generic [ref=e128]: Cơ sở
          - strong [ref=e129]: Tất cả chi nhánh
        - generic [ref=e132]: X
    - main [ref=e133]:
      - generic [ref=e134]:
        - generic [ref=e135]:
          - generic [ref=e136]:
            - text: KHÔNG GIAN VẬN HÀNH
            - heading "Khách hàng" [level=1] [ref=e137]
            - paragraph [ref=e138]: Thông tin được đồng bộ trực tiếp từ spa của bạn.
          - generic [ref=e139]:
            - button "Xuất Excel" [ref=e141] [cursor=pointer]
            - button "Thêm mới" [ref=e142] [cursor=pointer]
        - generic [ref=e144]:
          - generic [ref=e145]:
            - textbox "Tìm kiếm" [ref=e150]:
              - /placeholder: Tìm kiếm...
            - generic [ref=e151]:
              - generic [ref=e152]: 1 kết quả
              - button "Tải lại khách hàng" [ref=e153] [cursor=pointer]
          - table [ref=e160]:
            - rowgroup [ref=e161]:
              - row [ref=e162]:
                - columnheader "Họ tên" [ref=e163]
                - columnheader "Số điện thoại" [ref=e164]
                - columnheader "Mã hồ sơ" [ref=e165]
                - columnheader "Công nợ" [ref=e166]
                - columnheader [ref=e167]
            - rowgroup [ref=e168]:
              - row [ref=e169] [cursor=pointer]:
                - cell "Khách ngày sinh" [ref=e170]
                - cell "0901234567" [ref=e171]
                - cell "—" [ref=e172]
                - cell "—" [ref=e173]
                - cell [ref=e174]:
                  - button "Xem Khách ngày sinh" [ref=e175]
        - generic [ref=e179]:
          - button "Đóng" [ref=e180] [cursor=pointer]
          - dialog "Chỉnh sửa khách hàng" [ref=e181]:
            - generic [ref=e182]:
              - heading "Chỉnh sửa khách hàng" [level=2] [ref=e183]
              - button "Đóng" [ref=e184] [cursor=pointer]
            - generic [ref=e189]:
              - generic [ref=e190]:
                - paragraph [ref=e194]: Nhập họ tên và số điện thoại; hồ sơ chăm sóc có thể bổ sung sau.
                - region [ref=e195]:
                  - heading "Thông tin khách hàng" [level=3] [ref=e196]
                  - generic [ref=e200]:
                    - generic [ref=e201]:
                      - generic [ref=e202]: Họ tên *
                      - textbox "Họ tên" [ref=e203]: Khách ngày sinh
                    - generic [ref=e204]:
                      - generic [ref=e205]: Số điện thoại *
                      - textbox "Số điện thoại" [ref=e206]: "0901234567"
                    - generic [ref=e207]:
                      - generic [ref=e208]: Mã hồ sơ
                      - textbox "Mã hồ sơ" [ref=e209]
                    - generic [ref=e210]:
                      - generic [ref=e211]: Ngày lập hồ sơ
                      - generic [ref=e212]:
                        - textbox "Ngày lập hồ sơ" [ref=e213]: dd/mm/yyyy
                        - button "Mở lịch Ngày lập hồ sơ" [ref=e214] [cursor=pointer]
                    - generic [ref=e217]:
                      - generic [ref=e218]: Ngày sinh
                      - generic [ref=e219]:
                        - textbox "Ngày sinh" [active] [ref=e220]: d1/08/1995
                        - button "Mở lịch Ngày sinh" [ref=e221] [cursor=pointer]
                    - generic [ref=e224]:
                      - text: Giới tính
                      - combobox "Giới tính":
                        - option "Chưa ghi nhận" [selected]
                        - option "Nữ"
                        - option "Nam"
                        - option "Khác"
                      - button "Chưa ghi nhận" [ref=e225] [cursor=pointer]
                    - generic [ref=e230]:
                      - generic [ref=e231]: Địa chỉ
                      - textbox "Địa chỉ" [ref=e232]
                - region [ref=e233]:
                  - heading "Loại da / tình trạng da" [level=3] [ref=e234]
                  - group "Loại da" [ref=e237]:
                    - paragraph [ref=e239]: Có thể chọn nhiều · Chưa ghi nhận
                    - generic [ref=e240]:
                      - generic [ref=e241] [cursor=pointer]:
                        - checkbox "Da khô" [ref=e242]
                        - generic [ref=e243]: Da khô
                      - generic [ref=e244] [cursor=pointer]:
                        - checkbox "Da dầu – mụn" [ref=e245]
                        - generic [ref=e246]: Da dầu – mụn
                      - generic [ref=e247] [cursor=pointer]:
                        - checkbox "Da nhạy cảm, tổn thương" [ref=e248]
                        - generic [ref=e249]: Da nhạy cảm, tổn thương
                      - generic [ref=e250] [cursor=pointer]:
                        - checkbox "Da lão hóa" [ref=e251]
                        - generic [ref=e252]: Da lão hóa
                      - generic [ref=e253] [cursor=pointer]:
                        - checkbox "Da hỗn hợp" [ref=e254]
                        - generic [ref=e255]: Da hỗn hợp
                      - generic [ref=e256] [cursor=pointer]:
                        - checkbox "Da tăng sắc tố" [ref=e257]
                        - generic [ref=e258]: Da tăng sắc tố
                      - generic [ref=e259] [cursor=pointer]:
                        - checkbox "Khác" [ref=e260]
                        - generic [ref=e261]: Khác
                    - generic [ref=e262]:
                      - button "Bỏ chọn tất cả" [ref=e263] [cursor=pointer]
                      - button "Đặt lại chưa ghi nhận" [ref=e264] [cursor=pointer]
                - region [ref=e265]:
                  - heading "Nguồn biết đến" [level=3] [ref=e266]
                  - group "Nguồn giới thiệu" [ref=e270]:
                    - paragraph [ref=e272]: Có thể chọn nhiều · Chưa ghi nhận
                    - generic [ref=e273]:
                      - generic [ref=e274] [cursor=pointer]:
                        - checkbox "TikTok" [ref=e275]
                        - generic [ref=e276]: TikTok
                      - generic [ref=e277] [cursor=pointer]:
                        - checkbox "Facebook" [ref=e278]
                        - generic [ref=e279]: Facebook
                      - generic [ref=e280] [cursor=pointer]:
                        - checkbox "Bạn bè giới thiệu" [ref=e281]
                        - generic [ref=e282]: Bạn bè giới thiệu
                      - generic [ref=e283] [cursor=pointer]:
                        - checkbox "Nguồn khác" [ref=e284]
                        - generic [ref=e285]: Nguồn khác
                    - generic [ref=e286]:
                      - button "Bỏ chọn tất cả" [ref=e287] [cursor=pointer]
                      - button "Đặt lại chưa ghi nhận" [ref=e288] [cursor=pointer]
                  - generic [ref=e289]:
                    - text: Ghi chú nguồn giới thiệu
                    - textbox "Ghi chú nguồn giới thiệu" [ref=e290]:
                      - /placeholder: Nhập nội dung nếu có
                - group [ref=e291]:
                  - generic "Khai thác tiền sử Điều trị, chăm sóc da và thông tin sức khỏe +" [ref=e292] [cursor=pointer]:
                    - generic [ref=e296]:
                      - text: Khai thác tiền sử
                      - generic [ref=e297]: Điều trị, chăm sóc da và thông tin sức khỏe
                    - text: +
                - region [ref=e298]:
                  - heading "Đánh giá và tư vấn" [level=3] [ref=e299]
                  - generic [ref=e303]:
                    - text: Đánh giá tình trạng da
                    - textbox "Đánh giá tình trạng da" [ref=e304]:
                      - /placeholder: Nhập nội dung nếu có
                  - generic [ref=e305]:
                    - text: Nội dung tư vấn
                    - textbox "Nội dung tư vấn" [ref=e306]:
                      - /placeholder: Nhập nội dung nếu có
                  - generic [ref=e307]:
                    - text: Ghi chú khách hàng
                    - textbox "Ghi chú khách hàng" [ref=e308]:
                      - /placeholder: Nhập nội dung nếu có
              - generic [ref=e309]:
                - button "Hủy" [ref=e310] [cursor=pointer]
                - button "Lưu thay đổi" [ref=e311] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | test('tạo nhanh khách trong hóa đơn cũng gửi ngày sinh', async ({ page }) => {
  4  |   const writes = []
  5  |   await page.setViewportSize({ width: 390, height: 844 })
  6  |   await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: 'STAFF', branch_id: 1 } })))
  7  |   await page.route('**/api/**', route => {
  8  |     const path = new URL(route.request().url()).pathname
  9  |     if (!path.startsWith('/api/')) return route.continue()
  10 |     if (path === '/api/customers' && route.request().method() === 'POST') {
  11 |       writes.push(route.request().postDataJSON())
  12 |       return route.fulfill({ json: { customerId: 3 } })
  13 |     }
  14 |     if (path === '/api/customers/3') return route.fulfill({ json: { data: { id: 3, fullname: 'Khách mới', phone_number: '0901234567', date_of_birth: '1995-08-21' } } })
  15 |     return route.fulfill({ json: { data: [], total: 0 } })
  16 |   })
  17 |   await page.goto('/invoices')
  18 |   await page.getByRole('button', { name: 'Tạo hóa đơn' }).click()
  19 |   await page.getByRole('combobox', { name: 'Tìm khách hàng' }).fill('Khách mới')
  20 |   await page.getByRole('button', { name: /Tạo khách “Khách mới”/ }).click()
  21 |   const dialog = page.getByRole('dialog', { name: 'Tạo khách hàng', exact: true })
  22 |   await dialog.getByLabel('Số điện thoại', { exact: true }).fill('0901234567')
  23 |   await dialog.getByLabel('Ngày sinh', { exact: true }).fill('1995-08-21')
  24 |   await dialog.getByRole('button', { name: 'Lưu khách hàng' }).click()
  25 |   await expect.poll(() => writes.length).toBe(1)
  26 |   expect(writes[0].date_of_birth).toBe('1995-08-21')
  27 |   await expect(page.getByRole('combobox', { name: 'Tìm khách hàng' })).toHaveValue('Khách mới')
  28 | })
  29 | 
  30 | test('ngày sinh trong thêm/sửa khách, không hiện ở danh sách và tổng quan; vẫn tìm và xóa được', async ({ page }) => {
  31 |   let customer = { id: 3, fullname: 'Khách ngày sinh', phone_number: '0901234567', date_of_birth: '1995-08-21' }
  32 |   const writes = []
  33 |   const searches = []
  34 |   await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: 'MANAGER' } })))
  35 |   await page.route('**/api/**', route => {
  36 |     const url = new URL(route.request().url())
  37 |     if (!url.pathname.startsWith('/api/')) return route.continue()
  38 |     const method = route.request().method()
  39 |     if (['POST', 'PUT', 'DELETE'].includes(method)) {
  40 |       const body = method === 'DELETE' ? null : route.request().postDataJSON()
  41 |       writes.push({ method, path: url.pathname, body })
  42 |       if (body) customer = { ...customer, ...body }
  43 |       return route.fulfill({ json: { message: 'OK' } })
  44 |     }
  45 |     if (url.pathname === '/api/customers/3/overview') return route.fulfill({ json: { data: { customer, timeline: [] } } })
  46 |     if (url.pathname === '/api/customers') {
  47 |       searches.push(url.searchParams.get('search'))
  48 |       return route.fulfill({ json: { data: [customer], total: 1, totalPages: 1 } })
  49 |     }
  50 |     return route.fulfill({ json: { data: [], total: 0 } })
  51 |   })
  52 |   await page.goto('/customers')
  53 |   await expect(page.getByRole('button', { name: 'Xem Khách ngày sinh' })).toBeVisible()
  54 |   await expect(page.getByRole('columnheader', { name: 'Ngày sinh' })).toHaveCount(0)
  55 |   await page.getByRole('button', { name: 'Thêm mới' }).click()
  56 |   await page.getByLabel('Họ tên', { exact: true }).fill('Khách ngày sinh')
  57 |   await page.getByLabel('Số điện thoại', { exact: true }).fill('0901234567')
  58 |   await page.getByLabel('Ngày sinh', { exact: true }).fill('29/02/2000')
  59 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  60 |   await expect.poll(() => writes.length).toBe(1)
  61 |   expect(writes[0].body.date_of_birth).toBe('2000-02-29')
  62 |   await page.getByRole('button', { name: 'Xem Khách ngày sinh' }).click()
  63 |   await expect(page.locator('.customer-identity')).toContainText('0901234567')
  64 |   await expect(page.locator('.customer-identity')).not.toContainText('2000')
  65 |   await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  66 |   await expect(page.getByLabel('Ngày sinh', { exact: true })).toHaveValue('29/02/2000')
  67 |   await page.getByLabel('Ngày sinh', { exact: true }).fill('21/08/1995')
  68 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  69 |   await expect.poll(() => writes.length).toBe(2)
  70 |   expect(writes[1].body.date_of_birth).toBe('1995-08-21')
  71 |   await page.getByRole('button', { name: 'Xem Khách ngày sinh' }).click()
  72 |   await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  73 |   await page.getByLabel('Ngày sinh', { exact: true }).fill('')
  74 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
> 75 |   await expect.poll(() => writes.length).toBe(3)
     |                                          ^ Error: expect(received).toBe(expected) // Object.is equality
  76 |   expect(writes[2].body.date_of_birth).toBeNull()
  77 |   await page.getByPlaceholder(/Tìm/).fill('0901234567')
  78 |   await expect.poll(() => searches.includes('0901234567')).toBe(true)
  79 |   await page.getByRole('button', { name: 'Xem Khách ngày sinh' }).click()
  80 |   await page.getByRole('button', { name: 'Xóa', exact: true }).click()
  81 |   await page.getByRole('button', { name: 'Xác nhận', exact: true }).click()
  82 |   await expect.poll(() => writes.length).toBe(4)
  83 |   expect(writes[3]).toEqual({ method: 'DELETE', path: '/api/customers/3', body: null })
  84 | })
```