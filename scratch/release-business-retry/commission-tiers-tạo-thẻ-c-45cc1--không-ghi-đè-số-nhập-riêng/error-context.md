# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: commission-tiers.spec.js >> tạo thẻ cũ tổng 10, còn 0 buổi và không ghi đè số nhập riêng
- Location: tests\e2e\commission-tiers.spec.js:75:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('option', { name: 'Điều trị sẹo' })

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
        - strong [ref=e124]: Liệu trình
      - generic [ref=e125]:
        - button "Chọn chi nhánh" [ref=e127] [cursor=pointer]:
          - generic [ref=e128]: Cơ sở
          - strong [ref=e129]: Tất cả chi nhánh
        - generic [ref=e132]: X
    - main [ref=e133]:
      - generic [ref=e134]:
        - generic [ref=e135]:
          - generic [ref=e136]:
            - text: ĐỒNG HÀNH CÙNG KHÁCH HÀNG
            - heading "Thẻ liệu trình" [level=1] [ref=e137]
            - paragraph [ref=e138]: Mỗi buổi chăm sóc, một bước gần hơn tới sự rạng rỡ.
          - group "Thao tác liệu trình" [ref=e139]:
            - button "Xuất Excel" [disabled] [ref=e141]
            - button "Tạo thẻ" [ref=e142] [cursor=pointer]
        - generic [ref=e145]:
          - generic [ref=e146]: Lọc theo
          - combobox "Lọc theo":
            - option "Ngày tạo thẻ" [selected]
            - option "Ngày thực hiện"
          - button "Ngày tạo thẻ" [ref=e147] [cursor=pointer]
        - group "Khoảng ngày" [ref=e151]:
          - generic [ref=e152]:
            - generic [ref=e153]: Từ ngày
            - generic [ref=e154]:
              - textbox "Từ ngày" [ref=e155]: dd/mm/yyyy
              - button "Mở lịch Từ ngày" [ref=e156] [cursor=pointer]
          - generic [ref=e159]:
            - generic [ref=e160]: Đến ngày
            - generic [ref=e161]:
              - textbox "Đến ngày" [ref=e162]: dd/mm/yyyy
              - button "Mở lịch Đến ngày" [ref=e163] [cursor=pointer]
        - generic [ref=e166]:
          - generic [ref=e167]:
            - textbox "Tìm kiếm" [ref=e172]:
              - /placeholder: Tìm kiếm...
            - generic [ref=e173]:
              - generic [ref=e174]: 0 khách hàng
              - button "Tải lại thẻ liệu trình" [ref=e175] [cursor=pointer]
          - generic [ref=e181]:
            - heading "Chưa có thẻ liệu trình" [level=3] [ref=e182]
            - paragraph [ref=e183]: Thử từ khóa hoặc khoảng ngày khác.
        - generic [ref=e184]:
          - button "Đóng" [ref=e185] [cursor=pointer]
          - dialog "Tạo thẻ liệu trình" [ref=e186]:
            - generic [ref=e187]:
              - heading "Tạo thẻ liệu trình" [level=2] [ref=e188]
              - button "Đóng" [ref=e189] [cursor=pointer]
            - generic [ref=e194]:
              - generic [ref=e195]:
                - generic [ref=e196]: Khách hàng *
                - combobox "Tìm khách hàng" [ref=e197]: Khách A
                - textbox "Mã khách hàng đã chọn": "3"
              - generic [ref=e198]:
                - generic [ref=e199]: Dịch vụ *
                - combobox "Tìm dịch vụ" [expanded] [active] [ref=e200]
                - textbox "Mã dịch vụ đã chọn"
                - listbox [ref=e201]:
                  - paragraph [ref=e202]: Không tìm thấy kết quả
              - generic [ref=e203]:
                - text: Tổng số buổi
                - spinbutton "Tổng số buổi" [ref=e204]: "1"
              - generic [ref=e205]:
                - text: Số buổi còn lại
                - spinbutton "Số buổi còn lại" [ref=e206]: "1"
              - generic [ref=e207]:
                - text: Số lượng tính công
                - spinbutton "Số lượng tính công" [ref=e208]: "1"
              - generic [ref=e209]:
                - text: Đơn giá tính công
                - textbox "Đơn giá tính công" [ref=e210]
              - generic [ref=e211]:
                - text: Ghi chú
                - textbox "Ghi chú" [ref=e212]
              - generic [ref=e213]:
                - button "Hủy" [ref=e214] [cursor=pointer]
                - button "Lưu thẻ" [ref=e215] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from './fixtures'
  2   | 
  3   | async function setup(page, role = 'MANAGER', tiers = [], inventory = []) {
  4   |   const writes = []
  5   |   const product = { id: 5, name: 'Điều trị sẹo', price: '500000.00', is_product: 0, is_treatment_combo: 0, default_sessions: 1, commissions: [], commission_tiers: tiers, inventory }
  6   |   await page.addInitScript(role => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, system_role: role, branch_id: 1 } })), role)
  7   |   await page.route('**/api/**', route => {
  8   |     const path = new URL(route.request().url()).pathname
  9   |     if (!path.startsWith('/api/')) return route.continue()
  10  |     if (['POST', 'PUT'].includes(route.request().method())) { writes.push({ path, body: route.request().postDataJSON() }); return route.fulfill({ json: { message: 'OK' } }) }
  11  |     const data = path === '/api/products/5' ? product : path === '/api/products' ? [product] : path === '/api/roles' ? [{ id: 2, name: 'Kỹ thuật viên' }] : path === '/api/customers' ? [{ id: 3, fullname: 'Khách A' }] : []
  12  |     return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1, totalPages: 1, page: 1, pageSize: 20 } })
  13  |   })
  14  |   return writes
  15  | }
  16  | 
  17  | for (const role of ['MANAGER', 'STAFF']) {
  18  |   for (const inventory of [[], [{ branch_name: 'Kho dịch vụ cũ', quantity: 10 }]]) {
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
> 82  |     await page.getByRole('option', { name: 'Điều trị sẹo' }).click()
      |                                                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  119 |   await expect(page.getByRole('alert')).toContainText('trống')
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