# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: commission-tiers.spec.js >> tạo dịch vụ một mức mặc định, thêm hai bậc và chặn khoảng hở/chồng
- Location: tests\e2e\commission-tiers.spec.js:99:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "trống"
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <div role="alert" tabindex="-1" class="form-alert alert-attention">Các khoảng giá của cùng chức vụ bị chồng lấn.</div> aka getByText('Các khoảng giá của cùng chức vụ bị chồng lấn.')
    2) <p role="alert" tabindex="-1" class="form-alert alert-attention">Các khoảng giá của cùng chức vụ bị trống, cần nối…</p> aka getByText('Các khoảng giá của cùng chức vụ bị trống, cần nối tiếp nhau.')

Call log:
  - Expect "toContainText" getByRole('alert') with timeout 5000ms
  - waiting for getByRole('alert')

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
        - strong [ref=e124]: Sản phẩm & dịch vụ
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
            - heading "Sản phẩm & dịch vụ" [level=1] [ref=e137]
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
              - button "Tải lại sản phẩm & dịch vụ" [ref=e153] [cursor=pointer]
          - table [ref=e160]:
            - rowgroup [ref=e161]:
              - row [ref=e162]:
                - columnheader "Tên" [ref=e163]
                - columnheader "Giá niêm yết" [ref=e164]
                - columnheader "Giá bán" [ref=e165]
                - columnheader "Đơn vị" [ref=e166]
                - columnheader "Loại" [ref=e167]
                - columnheader [ref=e168]
            - rowgroup [ref=e169]:
              - row [ref=e170] [cursor=pointer]:
                - cell [ref=e171]:
                  - strong [ref=e172]: Điều trị sẹo
                - cell [ref=e173]:
                  - strong [ref=e174]: 500.000 ₫
                - cell [ref=e175]:
                  - strong [ref=e176]: —
                - cell "—" [ref=e177]
                - cell "Dịch vụ" [ref=e178]
                - cell [ref=e179]:
                  - button "Xem Điều trị sẹo" [ref=e180]
        - generic [ref=e184]:
          - button "Đóng" [ref=e185] [cursor=pointer]
          - dialog "Thêm sản phẩm & dịch vụ" [ref=e186]:
            - generic [ref=e187]:
              - heading "Thêm sản phẩm & dịch vụ" [level=2] [ref=e188]
              - button "Đóng" [ref=e189] [cursor=pointer]
            - generic [ref=e193]:
              - alert [ref=e194]: Các khoảng giá của cùng chức vụ bị chồng lấn.
              - generic [ref=e195]:
                - generic [ref=e196]:
                  - generic [ref=e197]:
                    - text: Tên sản phẩm / dịch vụ
                    - textbox "Tên sản phẩm / dịch vụ" [ref=e198]:
                      - /placeholder: Nhập tên sản phẩm / dịch vụ
                      - text: Dịch vụ mới
                  - generic [ref=e199]:
                    - text: Phân loại
                    - combobox "Phân loại":
                      - option "Chọn phân loại"
                      - option "Sản phẩm"
                      - option "Dịch vụ" [selected]
                    - button "Dịch vụ" [ref=e200] [cursor=pointer]
                  - generic [ref=e204]:
                    - text: Giá bán
                    - textbox "Giá bán" [ref=e205]: "0"
                  - generic [ref=e206]:
                    - text: Đơn vị
                    - textbox "Đơn vị" [ref=e207]:
                      - /placeholder: Nhập đơn vị
                  - generic [ref=e208]:
                    - checkbox "Là liệu trình" [checked] [ref=e209]
                    - text: Là liệu trình
                  - generic [ref=e210]:
                    - text: Số buổi tạo tự động khi mua liệu trình
                    - spinbutton "Số buổi tạo tự động khi mua liệu trình" [ref=e211]: "1"
                  - generic [ref=e212]:
                    - text: Ngày tới lần hẹn kế tiếp
                    - spinbutton "Ngày tới lần hẹn kế tiếp" [ref=e213]
                - region "Dịch vụ con" [ref=e214]:
                  - generic [ref=e215]:
                    - heading "Dịch vụ con 0" [level=3] [ref=e216]:
                      - text: Dịch vụ con
                      - generic [ref=e221]: "0"
                    - button "Thêm dịch vụ con" [ref=e222] [cursor=pointer]
                  - paragraph [ref=e224]: Chọn các dịch vụ thành phần. Thứ tự bên dưới là thứ tự hiển thị; bỏ mục chỉ gỡ liên kết, không xóa dịch vụ.
                  - paragraph [ref=e225]: Chưa có dịch vụ con.
                - generic [ref=e226]:
                  - heading "Tính công theo chức vụ" [level=3] [ref=e227]
                  - paragraph [ref=e228]: "Một mức công áp dụng mọi giá. Thêm mức công để chia khoảng giá: từ giá đã nhập đến dưới giá kế tiếp. Bậc cuối để trống giá đến là không giới hạn."
                  - group [ref=e229]:
                    - generic [ref=e231]:
                      - checkbox "Kỹ thuật viên" [checked] [ref=e232]
                      - text: Kỹ thuật viên
                    - generic [ref=e233]:
                      - strong [ref=e234]: Mức công 1
                      - generic [ref=e235]:
                        - generic [ref=e236]:
                          - text: Giá từ (đ)
                          - textbox "Giá từ (đ)" [ref=e237]: "0"
                        - generic [ref=e238]:
                          - text: Giá đến, không bao gồm (đ)
                          - textbox "Giá đến, không bao gồm (đ)" [ref=e239]:
                            - /placeholder: Không giới hạn
                            - text: 1.000.000
                        - generic [ref=e240]:
                          - text: Cách tính công
                          - combobox "Cách tính công":
                            - option "Phần trăm (%)" [selected]
                            - option "Số tiền cố định"
                          - button "Phần trăm (%)" [ref=e241] [cursor=pointer]
                        - generic [ref=e245]:
                          - text: Tiền công (%)
                          - spinbutton "Tiền công (%)" [ref=e246]: "10"
                      - button "Xóa mức công 1" [ref=e247] [cursor=pointer]
                    - generic [ref=e248]:
                      - strong [ref=e249]: Mức công 2
                      - generic [ref=e250]:
                        - generic [ref=e251]:
                          - text: Giá từ (đ)
                          - textbox "Giá từ (đ)" [active] [ref=e252]: 1.100.000
                        - generic [ref=e253]:
                          - text: Giá đến, không bao gồm (đ)
                          - textbox "Giá đến, không bao gồm (đ)" [ref=e254]:
                            - /placeholder: Không giới hạn
                        - generic [ref=e255]:
                          - text: Cách tính công
                          - combobox "Cách tính công":
                            - option "Phần trăm (%)"
                            - option "Số tiền cố định" [selected]
                          - button "Số tiền cố định" [ref=e256] [cursor=pointer]
                        - generic [ref=e260]:
                          - text: Tiền công cố định (đ)
                          - textbox "Tiền công cố định (đ)" [ref=e261]: "100.000"
                      - button "Xóa mức công 2" [ref=e262] [cursor=pointer]
                    - button "Thêm mức công cho Kỹ thuật viên" [ref=e263] [cursor=pointer]
                  - alert [ref=e264]: Các khoảng giá của cùng chức vụ bị trống, cần nối tiếp nhau.
                - generic [ref=e265]:
                  - button "Hủy" [ref=e266] [cursor=pointer]
                  - button "Lưu thay đổi" [ref=e267] [cursor=pointer]
```

# Test source

```ts
  19  |     test(`${role}: dịch vụ không hiện tồn kho dù API trả ${inventory.length} dòng tồn`, async ({ page }) => {
  20  |       await setup(page, role, [], inventory)
  21  |       await page.goto('/products')
  22  |       await page.getByText('Điều trị sẹo', { exact: true }).first().click()
  23  |       await expect(page.getByRole('button', { name: 'Sửa', exact: true })).toBeEnabled()
  24  |       await expect(page.getByRole('heading', { name: 'Tồn kho', exact: true })).toHaveCount(0)
  25  |       await expect(page.getByText('Chưa có dữ liệu tồn kho.', { exact: true })).toHaveCount(0)
  26  |       await expect(page.getByText(/Kho dịch vụ cũ/)).toHaveCount(0)
  27  |       await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  28  |       await expect(page.getByText(/Điều chỉnh tồn kho qua phiếu nhập/)).toHaveCount(0)
  29  |       await expect(page.getByRole('heading', { name: 'Tồn kho ban đầu theo cơ sở', exact: true })).toHaveCount(0)
  30  |     })
  31  |   }
  32  | }
  33  | 
  34  | for (const editing of [false, true]) {
  35  |   test(`${editing ? 'sửa' : 'thêm'} dịch vụ: bỏ là liệu trình ẩn số buổi và gửi 1 thay vì số đã nhập`, async ({ page }) => {
  36  |     const writes = await setup(page)
  37  |     await page.goto('/products')
  38  |     if (editing) {
  39  |       await page.getByText('Điều trị sẹo', { exact: true }).first().click()
  40  |       await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  41  |       await expect(page.getByLabel('Số buổi tạo tự động khi mua liệu trình')).toHaveCount(0)
  42  |     } else {
  43  |       await page.getByRole('button', { name: 'Thêm mới' }).click()
  44  |       await page.getByLabel('Tên sản phẩm / dịch vụ').fill('Dịch vụ một buổi')
  45  |       await page.getByLabel('Phân loại').selectOption('0')
  46  |     }
  47  |     await page.getByRole('checkbox', { name: 'Là liệu trình', exact: true }).check()
  48  |     await page.getByLabel('Số buổi tạo tự động khi mua liệu trình').fill('12')
  49  |     await page.getByRole('checkbox', { name: 'Là liệu trình', exact: true }).uncheck()
  50  |     await expect(page.getByLabel('Số buổi tạo tự động khi mua liệu trình')).toHaveCount(0)
  51  |     await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  52  |     await expect.poll(() => writes.length).toBe(1)
  53  |     expect(writes[0].body).toMatchObject({ is_treatment_combo: false, default_sessions: 1 })
  54  |   })
  55  | }
  56  | 
  57  | test('tạo thẻ lấy giá catalog, cho sửa giá và gửi đúng ID, số đơn vị', async ({ page }) => {
  58  |   const writes = await setup(page)
  59  |   await page.goto('/treatments')
  60  |   await page.getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
  61  |   await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  62  |   await page.getByRole('option', { name: 'Khách A' }).click()
  63  |   await page.getByRole('combobox', { name: 'Tìm dịch vụ' }).click()
  64  |   await page.getByRole('option', { name: 'Điều trị sẹo' }).click()
  65  |   const price = page.getByLabel('Giá dịch vụ', { exact: true })
  66  |   await expect(price).toHaveValue('500.000')
  67  |   await price.fill('5000000')
  68  |   await page.getByLabel('Số đơn vị mỗi buổi').fill('2')
  69  |   await page.getByRole('dialog').getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
  70  |   await expect.poll(() => writes.length).toBe(1)
  71  |   expect(writes[0]).toEqual({ path: '/api/treatments', body: { customer_id: 3, product_id: 5, total_sessions: 1, remaining_sessions: 1, commission_base_price: 5000000, commission_quantity: 2, note: null } })
  72  | })
  73  | 
  74  | for (const remaining of [0, 4]) {
  75  |   test(`tạo thẻ cũ tổng 10, còn ${remaining} buổi và không ghi đè số nhập riêng`, async ({ page }) => {
  76  |     const writes = await setup(page)
  77  |     await page.goto('/treatments')
  78  |     await page.getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
  79  |     await page.getByRole('combobox', { name: 'Tìm khách hàng' }).click()
  80  |     await page.getByRole('option', { name: 'Khách A' }).click()
  81  |     await page.getByRole('combobox', { name: 'Tìm dịch vụ' }).click()
  82  |     await page.getByRole('option', { name: 'Điều trị sẹo' }).click()
  83  |     await page.getByLabel('Số buổi', { exact: true }).fill('8')
  84  |     const balance = page.getByLabel('Số buổi còn lại', { exact: false })
  85  |     await expect(balance).toHaveValue('8')
  86  |     await balance.fill(String(remaining))
  87  |     await page.getByLabel('Số buổi', { exact: true }).fill('10')
  88  |     await expect(balance).toHaveValue(String(remaining))
  89  |     await balance.fill('11')
  90  |     await page.getByRole('dialog').getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
  91  |     expect(writes).toHaveLength(0)
  92  |     await balance.fill(String(remaining))
  93  |     await page.getByRole('dialog').getByRole('button', { name: 'Tạo thẻ', exact: true }).click()
  94  |     await expect.poll(() => writes.length).toBe(1)
  95  |     expect(writes[0].body).toMatchObject({ total_sessions: 10, remaining_sessions: remaining })
  96  |   })
  97  | }
  98  | 
  99  | test('tạo dịch vụ một mức mặc định, thêm hai bậc và chặn khoảng hở/chồng', async ({ page }) => {
  100 |   const writes = await setup(page)
  101 |   await page.goto('/products')
  102 |   await page.getByRole('button', { name: 'Thêm mới' }).click()
  103 |   await page.getByLabel('Tên sản phẩm / dịch vụ').fill('Dịch vụ mới')
  104 |   await page.getByLabel('Phân loại').selectOption('0')
  105 |   await expect(page.getByText('Mức công dự phòng (cấu hình cũ)', { exact: true })).toHaveCount(0)
  106 |   await expect(page.getByRole('heading', { name: 'Tính công theo chức vụ', exact: true })).toBeVisible()
  107 |   await page.getByRole('checkbox', { name: 'Kỹ thuật viên', exact: true }).first().check()
  108 |   await expect(page.getByLabel('Giá từ (đ)')).toHaveCount(0)
  109 |   await page.getByLabel('Tiền công (%)', { exact: true }).first().fill('10')
  110 |   await page.getByRole('button', { name: 'Thêm mức công cho Kỹ thuật viên' }).click()
  111 |   await page.getByLabel('Giá đến, không bao gồm (đ)').first().fill('1000000')
  112 |   await page.getByLabel('Giá từ (đ)').nth(1).fill('900000')
  113 |   await page.getByLabel('Cách tính công').nth(1).selectOption('FIXED')
  114 |   await page.getByLabel('Tiền công cố định (đ)').first().fill('100000')
  115 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  116 |   await expect(page.getByText(/chồng lấn/).first()).toBeVisible()
  117 |   expect(writes).toHaveLength(0)
  118 |   await page.getByLabel('Giá từ (đ)').nth(1).fill('1100000')
> 119 |   await expect(page.getByRole('alert')).toContainText('trống')
      |                                         ^ Error: expect(locator).toContainText(expected) failed
  120 |   await page.getByLabel('Giá từ (đ)').nth(1).fill('1000000')
  121 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  122 |   await expect.poll(() => writes.length).toBe(1)
  123 |   expect(writes[0].body.commission_tiers).toEqual([{ role_id: 2, min_price: 0, max_price: 1000000, calculation_type: 'PERCENT', percent: 10 }, { role_id: 2, min_price: 1000000, max_price: null, calculation_type: 'FIXED', fixed_amount: 100000 }])
  124 | })
  125 | 
  126 | test('sửa tải lại bậc giá và cho xóa toàn bộ bằng PUT', async ({ page }) => {
  127 |   const writes = await setup(page, 'MANAGER', [{ role_id: 2, min_price: '0', max_price: null, calculation_type: 'FIXED', fixed_amount: '100000' }])
  128 |   await page.goto('/products')
  129 |   await page.getByText('Điều trị sẹo', { exact: true }).first().click()
  130 |   await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  131 |   await expect(page.getByLabel('Tiền công cố định (đ)').first()).toHaveValue('100.000')
  132 |   await page.getByRole('checkbox', { name: 'Kỹ thuật viên', exact: true }).first().uncheck()
  133 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  134 |   await expect.poll(() => writes.length).toBe(1)
  135 |   expect(writes[0].path).toBe('/api/products/5')
  136 |   expect(writes[0].body.commission_tiers).toEqual([])
  137 | })
  138 | 
  139 | test('STAFF sửa dịch vụ không gửi hai field công ca bị cấm', async ({ page }) => {
  140 |   const writes = await setup(page, 'STAFF')
  141 |   await page.goto('/products')
  142 |   await page.getByText('Điều trị sẹo', { exact: true }).first().click()
  143 |   await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  144 |   await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  145 |   await expect.poll(() => writes.length).toBe(1)
  146 |   expect(writes[0].body).not.toHaveProperty('commission_tiers')
  147 |   expect(writes[0].body).not.toHaveProperty('commissions')
  148 | })
```