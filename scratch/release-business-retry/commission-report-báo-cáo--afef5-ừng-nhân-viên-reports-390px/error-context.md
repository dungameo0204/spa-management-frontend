# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: commission-report.spec.js >> báo cáo mức công ca từng nhân viên /reports 390px
- Location: tests\e2e\commission-report.spec.js:7:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Xem báo cáo công ca', exact: true })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - complementary [ref=f1e4]:
    - generic [ref=f1e5]:
      - generic [ref=f1e6]:
        - strong [ref=f1e7]: ROSA
        - text: CLINIC & AESTHETIC
      - button "Đóng menu" [ref=f1e8] [cursor=pointer]
    - generic [ref=f1e12]: KHÔNG GIAN CỦA BẠN
    - navigation "Điều hướng chính" [ref=f1e13]:
      - generic [ref=f1e14]:
        - paragraph [ref=f1e15]: LÀM VIỆC
        - link "Tổng quan" [ref=f1e16] [cursor=pointer]:
          - /url: /
        - link "Khách hàng" [ref=f1e22] [cursor=pointer]:
          - /url: /customers
        - link "Khách đặt lịch" [ref=f1e27] [cursor=pointer]:
          - /url: /customer-bookings
        - link "Bán hàng" [ref=f1e30] [cursor=pointer]:
          - /url: /invoices
      - generic [ref=f1e34]:
        - paragraph [ref=f1e35]: VẬN HÀNH
        - link "Sản phẩm & dịch vụ" [ref=f1e36] [cursor=pointer]:
          - /url: /products
        - link "Lịch hẹn" [ref=f1e41] [cursor=pointer]:
          - /url: /appointments
        - link "Liệu trình" [ref=f1e44] [cursor=pointer]:
          - /url: /treatments
        - link "Nhập kho" [ref=f1e47] [cursor=pointer]:
          - /url: /imports
        - link "Tồn kho" [ref=f1e58] [cursor=pointer]:
          - /url: /inventory
        - link "Phiếu chi" [ref=f1e63] [cursor=pointer]:
          - /url: /expenses
        - link "Thu công nợ" [ref=f1e66] [cursor=pointer]:
          - /url: /debts
      - generic [ref=f1e69]:
        - paragraph [ref=f1e70]: NHÂN SỰ
        - link "Hồ sơ nhân sự" [ref=f1e71] [cursor=pointer]:
          - /url: /staffs
        - link "Công ca" [ref=f1e76] [cursor=pointer]:
          - /url: /commissions
        - link "Hoa hồng · tư vấn" [ref=f1e83] [cursor=pointer]:
          - /url: /consultants
      - generic [ref=f1e87]:
        - paragraph [ref=f1e88]: QUẢN LÝ
        - link "Báo cáo" [ref=f1e89] [cursor=pointer]:
          - /url: /reports
        - link "Chi nhánh" [ref=f1e92] [cursor=pointer]:
          - /url: /branches
        - link "Chức vụ" [ref=f1e97] [cursor=pointer]:
          - /url: /roles
        - link "Tài khoản" [ref=f1e101] [cursor=pointer]:
          - /url: /users
    - generic [ref=f1e114]:
      - button "Chuyển sang giao diện tối" [ref=f1e115] [cursor=pointer]: Giao diện tối
      - button "Đăng xuất" [ref=f1e119] [cursor=pointer]
      - generic [ref=f1e123]: ROSA · v0.1.2
  - generic [ref=f1e124]:
    - banner [ref=f1e125]:
      - button "Mở menu" [ref=f1e126] [cursor=pointer]
      - generic [ref=f1e128]:
        - generic [ref=f1e129]: KHÔNG GIAN QUẢN LÝ
        - strong [ref=f1e130]: Báo cáo
      - generic [ref=f1e131]:
        - button "Chọn chi nhánh" [ref=f1e133] [cursor=pointer]:
          - strong [ref=f1e134]: Tất cả chi nhánh
        - generic "Quản lý" [ref=f1e137]: Q
    - main [ref=f1e138]:
      - generic [ref=f1e139]:
        - generic [ref=f1e140]:
          - generic [ref=f1e141]:
            - text: THẤU HIỂU ĐỂ PHÁT TRIỂN
            - heading "Báo cáo kinh doanh" [level=1] [ref=f1e142]
            - paragraph [ref=f1e143]: Nhìn rõ các con số, đưa ra quyết định tự tin hơn.
          - button "Xuất Excel toàn kỳ" [ref=f1e145] [cursor=pointer]
        - generic [ref=f1e146]:
          - generic [ref=f1e147]:
            - generic [ref=f1e148]: Từ ngày
            - generic [ref=f1e149]:
              - textbox "Từ ngày" [ref=f1e150]: 01/11/2026
              - button "Mở lịch Từ ngày" [ref=f1e151] [cursor=pointer]
          - generic [ref=f1e154]:
            - generic [ref=f1e155]: Đến ngày
            - generic [ref=f1e156]:
              - textbox "Đến ngày" [ref=f1e157]: 06/11/2026
              - button "Mở lịch Đến ngày" [ref=f1e158] [cursor=pointer]
        - generic [ref=f1e161]:
          - generic [ref=f1e162]:
            - generic [ref=f1e163]: Tổng doanh thu
            - strong [ref=f1e164]: —
            - generic [ref=f1e165]: Dịch vụ + sản phẩm + thu nợ cũ
          - generic [ref=f1e166]:
            - generic [ref=f1e167]: Doanh thu dịch vụ
            - strong [ref=f1e168]: —
            - generic [ref=f1e169]: Dịch vụ sau chiết khấu
          - generic [ref=f1e170]:
            - generic [ref=f1e171]: Doanh thu sản phẩm
            - strong [ref=f1e172]: —
            - generic [ref=f1e173]: Hàng hóa sau chiết khấu
          - generic [ref=f1e174]:
            - generic [ref=f1e175]: Doanh thu thu nợ cũ
            - strong [ref=f1e176]: —
            - generic [ref=f1e177]: Theo cơ sở thu và ngày thu tiền
          - generic [ref=f1e178]:
            - generic [ref=f1e179]: Tiền thực thu
            - strong [ref=f1e180]: —
            - generic [ref=f1e181]: Không cộng lại tiền ví đã sử dụng
          - generic [ref=f1e182]:
            - generic [ref=f1e183]: Tổng chi
            - strong [ref=f1e184]: —
            - generic [ref=f1e185]: Gồm chi phí và nhập kho
          - generic [ref=f1e186]:
            - generic [ref=f1e187]: Dòng tiền thuần
            - strong [ref=f1e188]: —
            - generic [ref=f1e189]: Không phải lợi nhuận
        - region [ref=f1e190]:
          - generic [ref=f1e191]:
            - generic [ref=f1e192]:
              - text: CHI TIẾT THEO NGÀY
              - heading "Báo cáo theo ngày" [level=2] [ref=f1e193]
              - paragraph [ref=f1e194]: Tiền thực thu không cộng lại ví đã dùng. Dòng tiền thuần = tiền thực thu − tổng chi, không phải lợi nhuận.
            - button "Xuất Excel theo ngày" [ref=f1e196] [cursor=pointer]
          - region "Bảng báo cáo theo ngày, cuộn ngang để xem các cột" [ref=f1e197]:
            - table "Báo cáo theo ngày" [ref=f1e198]:
              - rowgroup [ref=f1e199]:
                - row [ref=f1e200]:
                  - columnheader "Ngày" [ref=f1e201]
                  - columnheader "Tổng doanh thu" [ref=f1e202]
                  - columnheader "Doanh thu dịch vụ" [ref=f1e203]
                  - columnheader "Doanh thu sản phẩm" [ref=f1e204]
                  - columnheader "Doanh thu thu nợ cũ" [ref=f1e205]
                  - columnheader "Thu hóa đơn" [ref=f1e206]
                  - columnheader "Thu nợ" [ref=f1e207]
                  - columnheader "Nạp ví" [ref=f1e208]
                  - columnheader "Tiền thực thu" [ref=f1e209]
                  - columnheader "Ví đã dùng (không cộng thu)" [ref=f1e210]
                  - columnheader "Phiếu chi" [ref=f1e211]
                  - columnheader "Nhập kho" [ref=f1e212]
                  - columnheader "Tổng chi" [ref=f1e213]
                  - columnheader "Dòng tiền thuần" [ref=f1e214]
              - rowgroup [ref=f1e215]:
                - row [ref=f1e216]:
                  - rowheader "01/10/2026" [ref=f1e217]
                  - cell "1.200.000 ₫" [ref=f1e218]
                  - cell "—" [ref=f1e219]
                  - cell "—" [ref=f1e220]
                  - cell "—" [ref=f1e221]
                  - cell "—" [ref=f1e222]
                  - cell "—" [ref=f1e223]
                  - cell "—" [ref=f1e224]
                  - cell "—" [ref=f1e225]
                  - cell "—" [ref=f1e226]
                  - cell "—" [ref=f1e227]
                  - cell "—" [ref=f1e228]
                  - cell "—" [ref=f1e229]
                  - cell "-50.000 ₫" [ref=f1e230]
        - generic [ref=f1e231]:
          - generic [ref=f1e233]:
            - text: CƠ CẤU DOANH THU
            - heading "Doanh thu từng sản phẩm và dịch vụ" [level=2] [ref=f1e234]
          - generic [ref=f1e235]:
            - generic [ref=f1e236]:
              - heading "10 loại bán chạy theo doanh thu" [level=3] [ref=f1e237]
              - paragraph [ref=f1e238]: Chưa có doanh thu trong kỳ.
            - generic [ref=f1e239]:
              - heading "So sánh doanh thu theo mặt hàng" [level=3] [ref=f1e240]
              - paragraph [ref=f1e241]: Chưa có doanh thu trong kỳ.
          - generic [ref=f1e242]:
            - generic [ref=f1e243]:
              - textbox "Tìm kiếm" [ref=f1e248]:
                - /placeholder: Tìm kiếm...
              - generic [ref=f1e249]:
                - generic [ref=f1e250]: 0 kết quả
                - button "Tải lại báo cáo" [ref=f1e251] [cursor=pointer]
            - generic [ref=f1e257]:
              - heading "Chưa có dữ liệu" [level=3] [ref=f1e261]
              - paragraph [ref=f1e262]: Thử từ khóa khác hoặc thêm bản ghi mới.
        - generic [ref=f1e263]:
          - generic [ref=f1e264]:
            - generic [ref=f1e265]:
              - text: CHI TIẾT THEO CHỨNG TỪ
              - heading "Giao dịch trong kỳ" [level=2] [ref=f1e266]
            - tablist [ref=f1e267]:
              - tab "Hóa đơn" [ref=f1e268] [cursor=pointer]
              - tab "Thu nợ" [ref=f1e269] [cursor=pointer]
              - tab "Nạp ví" [ref=f1e270] [cursor=pointer]
              - tab "Phiếu chi" [ref=f1e271] [cursor=pointer]
              - tab "Nhập kho" [ref=f1e272] [cursor=pointer]
              - tab "Công ca" [active] [selected] [ref=f1e273] [cursor=pointer]
              - tab "Tư vấn" [ref=f1e274] [cursor=pointer]
          - generic [ref=f1e275]:
            - generic [ref=f1e276]: Tổng doanh số tư vấn toàn kỳ · 0 nhóm nhân viên
            - strong [ref=f1e277]: —
  - navigation "Điều hướng nhanh" [ref=f1e278]:
    - link "Tổng quan" [ref=f1e279] [cursor=pointer]:
      - /url: /
    - link "Khách hàng" [ref=f1e286] [cursor=pointer]:
      - /url: /customers
    - link "Khách đặt lịch" [ref=f1e292] [cursor=pointer]:
      - /url: /customer-bookings
    - link "Bán hàng" [ref=f1e296] [cursor=pointer]:
      - /url: /invoices
    - button "Thêm" [ref=f1e301] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | import { createRequire } from 'node:module'
  3  | const ExcelJS = createRequire(import.meta.url)('exceljs')
  4  | 
  5  | for (const path of ['/commissions', '/reports']) {
  6  |   for (const width of [1440, 390]) {
  7  |     test(`báo cáo mức công ca từng nhân viên ${path} ${width}px`, async ({ page }) => {
  8  |       await page.setViewportSize({ width, height: 900 })
  9  |       const requests = []
  10 |       await page.route('**/api/**', route => {
  11 |         const url = new URL(route.request().url()), api = url.pathname
  12 |         if (!api.startsWith('/api/')) return route.continue()
  13 |         if (api === '/api/auth/login') return route.fulfill({ json: { data: { token: 'manager-test', user: { id: 1, tenant_id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } } } })
  14 |         if (api === '/api/reports/commissions') return route.fulfill({ json: { staffTotals: [{ branch_id: 2, branch_name: 'Cơ sở 2', staff_id: 3, staff_name: 'Nhân viên B', record_count: 3, total_amount: 90000 }], total: 1, totalAmount: 90000, totalPages: 1 } })
  15 |         if (api === '/api/reports/revenue') return route.fulfill({ json: { daily: [{ date: '2026-10-01', totalRevenue: 1200000, netCashFlow: -50000 }] } })
  16 |         if (api === '/api/reports/details/commissions') {
  17 |           requests.push(Object.fromEntries(url.searchParams))
  18 |           const second = url.searchParams.get('page') === '2'
  19 |           return route.fulfill({ json: { data: second ? [{ id: 3, commission_amount: '20000.00' }] : [{ id: 1, commission_amount: 20000 }, { id: 2, commission_amount: 50000 }], total: 3, totalPages: 2, totalAmount: 90000 } })
  20 |         }
  21 |         return route.fulfill({ json: { data: [], total: 0 } })
  22 |       })
  23 |       await page.goto('/login')
  24 |       await page.getByPlaceholder('Nhập tên đăng nhập').fill('demo')
  25 |       await page.getByPlaceholder('Nhập mật khẩu').fill('demo')
  26 |       await page.getByRole('button', { name: 'Đăng nhập' }).click()
  27 |       await page.goto(path)
  28 |       if (path === '/reports') await page.getByRole('tab', { name: 'Công ca', exact: true }).click()
> 29 |       await page.getByRole('button', { name: 'Xem báo cáo công ca', exact: true }).click()
     |                                                                                    ^ Error: locator.click: Test timeout of 30000ms exceeded.
  30 |       const drawer = page.getByRole('region', { name: 'Báo cáo công ca Nhân viên B', exact: true })
  31 |       await expect(drawer).toBeVisible()
  32 |       await expect(page.getByRole('dialog')).toHaveCount(0)
  33 |       expect(await drawer.evaluate(el => el.getBoundingClientRect().top >= el.closest('.staff-group').querySelector('header').getBoundingClientRect().bottom)).toBe(true)
  34 |       const rows = drawer.getByRole('table', { name: 'Công ca theo mức tiền' }).locator('tbody tr')
  35 |       await expect(rows).toHaveCount(2)
  36 |       await expect(rows.nth(0).locator('td').nth(0)).toContainText('20.000')
  37 |       await expect(rows.nth(0).locator('td').nth(1)).toHaveText('2')
  38 |       await expect(rows.nth(0).locator('td').nth(2)).toContainText('40.000')
  39 |       await expect(rows.nth(1).locator('td').nth(0)).toContainText('50.000')
  40 |       await expect(rows.nth(1).locator('td').nth(1)).toHaveText('1')
  41 |       await expect(rows.nth(1).locator('td').nth(2)).toContainText('50.000')
  42 |       await expect(drawer.getByText('Tổng cộng · 3 ca')).toBeVisible()
  43 |       await expect(drawer.locator('.report-total strong')).toContainText('90.000')
  44 |       expect(requests.filter(r => r.staffId === '3').map(r => r.page)).toEqual(['1', '2'])
  45 |       expect(requests.filter(r => r.staffId === '3').every(r => r.branchId === '2' && r.startDate && r.endDate)).toBe(true)
  46 |       expect(await drawer.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
  47 |       const downloaded = page.waitForEvent('download')
  48 |       await drawer.getByRole('button', { name: 'Xuất Excel', exact: true }).click()
  49 |       const download = await downloaded
  50 |       expect(download.suggestedFilename()).toMatch(/^ROSA-cong-ca-3-2-.*\.xlsx$/)
  51 |       const book = new ExcelJS.Workbook()
  52 |       await book.xlsx.readFile(await download.path())
  53 |       const sheet = book.worksheets[0]
  54 |       expect(sheet.getRow(4).values.slice(1)).toEqual(['Ca', 'Số lượng', 'Tổng tiền'])
  55 |       expect(sheet.getRow(5).values.slice(1)).toEqual([20000, 2, 40000])
  56 |       expect(sheet.getRow(6).values.slice(1)).toEqual([50000, 1, 50000])
  57 |       expect(sheet.getRow(7).values.slice(1)).toEqual(['Tổng cộng', 3, 90000])
  58 |       await page.getByRole('button', { name: 'Thu gọn báo cáo công ca', exact: true }).click()
  59 |       await expect(drawer).toHaveCount(0)
  60 |       const allDownloaded = page.waitForEvent('download')
  61 |       await page.getByRole('button', { name: 'Xuất Excel công ca toàn bộ nhân viên', exact: true }).click()
  62 |       const allDownload = await allDownloaded
  63 |       expect(allDownload.suggestedFilename()).toMatch(/^ROSA-cong-ca-tat-ca-nhan-vien-.*\.xlsx$/)
  64 |       const allBook = new ExcelJS.Workbook()
  65 |       await allBook.xlsx.readFile(await allDownload.path())
  66 |       expect(allBook.getWorksheet('Công ca theo mức tiền')).toBeUndefined()
  67 |       expect(allBook.getWorksheet('Nhân viên B').getRow(5).values.slice(1)).toEqual([20000, 2, 40000])
  68 |       expect(allBook.getWorksheet('Nhân viên B').getRow(7).values.slice(1)).toEqual(['Tổng cộng', 3, 90000])
  69 |       if (path === '/reports') {
  70 |         const fullDownloaded = page.waitForEvent('download')
  71 |         await page.getByRole('button', { name: 'Xuất Excel toàn kỳ', exact: true }).click()
  72 |         const fullDownload = await fullDownloaded
  73 |         const fullBook = new ExcelJS.Workbook()
  74 |         await fullBook.xlsx.readFile(await fullDownload.path())
  75 |         expect(fullBook.worksheets).toHaveLength(9)
  76 |         expect(fullBook.getWorksheet('Nhân viên B').getRow(5).values.slice(1)).toEqual([20000, 2, 40000])
  77 |         expect(fullBook.getWorksheet('Doanh thu theo ngày').getCell('B5').value).toBe(1200000)
  78 |         expect(fullBook.getWorksheet('Doanh thu theo ngày').getCell('M5').value).toBe(-50000)
  79 |       }
  80 |     })
  81 |   }
  82 | }
```