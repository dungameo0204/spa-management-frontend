# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: today-group-signature.spec.js >> parent signs once for performed children; pending children have no signature action
- Location: tests\e2e\today-group-signature.spec.js:3:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('textbox')
Expected: 1
Received: 2
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('textbox') with timeout 5000ms
  - waiting for getByRole('textbox')
    14 × locator resolved to 2 elements
       - unexpected value "2"

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
        - generic [ref=e132]: X
    - main [ref=e133]:
      - generic [ref=e134]:
        - generic [ref=e135]:
          - generic [ref=e136]:
            - text: THỨC DẬY CÙNG ROSA ✦
            - heading "Chào , một ngày thật đẹp!" [level=1] [ref=e137]
            - paragraph [ref=e138]: Mọi điều quan trọng trong spa, gọn gàng ở đây.
          - generic [ref=e139]: 06/11/2026
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
                  - textbox "Ngày xem" [ref=e235]: 06/11/2026
                  - button "Mở lịch Ngày xem" [ref=e236] [cursor=pointer]
              - button "Hôm nay" [disabled] [ref=e239]
              - button "Ngày tiếp theo" [disabled] [ref=e240]
          - paragraph [ref=e243]: Thẻ tạo hôm nay hoặc có buổi thực hiện hôm nay. Tick để ghi nhận, bấm tên nhân viên để sửa, bỏ tick để hoàn tác.
          - generic [ref=e245]:
            - generic [ref=e246]: 3 lượt khách
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
                - cell "Khách B" [ref=e264]
                - cell "pnp đơn lẻ" [ref=e265]
                - cell [ref=e266]:
                  - checkbox "Đã làm Khách B - pnp đơn lẻ" [checked] [ref=e267]
                - cell [ref=e268]:
                  - button "Sửa nhân viên Khách B - pnp đơn lẻ" [ref=e269] [cursor=pointer]: Lan
                - 'cell "Chưa ký Ghi chú và chữ ký #201 - Khách B" [ref=e270]':
                  - generic [ref=e271]:
                    - generic [ref=e272]: Chưa ký
                    - 'button "Ghi chú và chữ ký #201 - Khách B" [ref=e274] [cursor=pointer]': Ghi chú / Ký
            - rowgroup [ref=e278]:
              - row [ref=e279]:
                - cell "Khách B" [ref=e280]
                - cell "pnp đơn lẻ" [ref=e281]
                - cell [ref=e282]:
                  - checkbox "Đã làm Khách B - pnp đơn lẻ" [checked] [ref=e283]
                - cell [ref=e284]:
                  - button "Sửa nhân viên Khách B - pnp đơn lẻ" [ref=e285] [cursor=pointer]: Lan
                - 'cell "Chưa ký Ghi chú và chữ ký #202 - Khách B" [ref=e286]':
                  - generic [ref=e287]:
                    - generic [ref=e288]: Chưa ký
                    - 'button "Ghi chú và chữ ký #202 - Khách B" [ref=e290] [cursor=pointer]': Ghi chú / Ký
            - rowgroup [ref=e294]:
              - row [ref=e295]:
                - cell [ref=e296]:
                  - strong [ref=e297]: Khách A
                - cell "Gói trị nám 2 dịch vụ" [ref=e298]:
                  - generic [ref=e299]:
                    - strong [ref=e300]: Gói trị nám
                    - generic [ref=e301]: 2 dịch vụ
                - cell "Chữ ký nhóm Gói trị nám Đã ký Ghi chú và chữ ký nhóm Gói trị nám Ghi chú và chữ ký nhóm dịch vụ" [ref=e302]:
                  - generic [ref=e303]:
                    - generic [ref=e304]:
                      - img "Chữ ký nhóm Gói trị nám" [ref=e305]
                      - generic [ref=e306]: Đã ký
                    - button "Ghi chú và chữ ký nhóm Gói trị nám" [ref=e307] [cursor=pointer]: Ghi chú / Xem
                  - dialog "Ghi chú và chữ ký nhóm dịch vụ" [ref=e313]:
                    - text: XÁC NHẬN CÁC DỊCH VỤ ĐÃ LÀM
                    - heading "Ghi chú và chữ ký" [level=2] [ref=e314]
                    - paragraph [ref=e315]: Khách A · Gói trị nám
                    - generic [ref=e316]:
                      - generic [ref=e317]: Ghi chú buổi thực hiện
                      - textbox "Ghi chú buổi thực hiện" [active] [ref=e318]: làm lần 1
                    - strong [ref=e320]: "pnp · Buổi #101 · Đã ký"
                    - strong [ref=e322]: "Tàn nhang · Buổi #102 · Đã ký"
                    - img "Chữ ký đã lưu cho buổi thực hiện trong nhóm" [ref=e324]
                    - generic [ref=e325]:
                      - button "Đóng" [ref=e326] [cursor=pointer]
                      - button "Lưu ghi chú" [ref=e327] [cursor=pointer]
              - row [ref=e328]:
                - cell [ref=e329]
                - cell "↳ pnp" [ref=e330]
                - cell [ref=e332]:
                  - checkbox "Đã làm Khách A - pnp" [checked] [ref=e333]
                - cell [ref=e334]:
                  - button "Sửa nhân viên Khách A - pnp" [ref=e335] [cursor=pointer]: Lan
                - cell [ref=e336]
              - row [ref=e337]:
                - cell [ref=e338]
                - cell "↳ Tàn nhang" [ref=e339]
                - cell [ref=e341]:
                  - checkbox "Đã làm Khách A - Tàn nhang" [checked] [ref=e342]
                - cell [ref=e343]:
                  - button "Sửa nhân viên Khách A - Tàn nhang" [ref=e344] [cursor=pointer]: Chưa gán NV
                - cell [ref=e345]
              - row [ref=e346]:
                - cell [ref=e347]
                - cell "↳ Massage" [ref=e348]
                - cell [ref=e350]:
                  - checkbox "Đã làm Khách A - Massage" [ref=e351]
                - cell "Chưa thực hiện" [ref=e352]
                - cell [ref=e353]
        - generic [ref=e354]:
          - generic [ref=e355]:
            - generic [ref=e356]:
              - text: CẦN QUAN TÂM
              - heading "Khách cần quan tâm" [level=2] [ref=e357]
            - generic [ref=e358]:
              - button "Tải lại khách cần quan tâm" [ref=e359] [cursor=pointer]
              - link "Xem tất cả" [ref=e365] [cursor=pointer]:
                - /url: /appointments
          - generic [ref=e369]:
            - generic [ref=e370]:
              - heading "Lịch hẹn ngày mai" [level=3] [ref=e371]
              - button "Tải lại lịch hẹn ngày mai" [ref=e372] [cursor=pointer]
            - paragraph [ref=e378]: Không có lịch hẹn.
          - generic [ref=e379]:
            - generic [ref=e380]:
              - heading "Khách chưa đến" [level=3] [ref=e381]
              - button "Tải lại khách chưa đến" [ref=e382] [cursor=pointer]
            - paragraph [ref=e388]: Không có lịch hẹn.
        - generic [ref=e390]:
          - text: LỐI TẮT
          - heading "Thao tác nhanh" [level=2] [ref=e391]
        - generic [ref=e392]:
          - link [ref=e393] [cursor=pointer]:
            - /url: /appointments
            - strong [ref=e397]: Đặt lịch hẹn
          - link [ref=e401] [cursor=pointer]:
            - /url: /customers
            - strong [ref=e407]: Khách hàng
          - link [ref=e411] [cursor=pointer]:
            - /url: /invoices
            - strong [ref=e416]: Bán hàng
          - link [ref=e420] [cursor=pointer]:
            - /url: /treatments
            - strong [ref=e424]: Liệu trình
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | test('parent signs once for performed children; pending children have no signature action', async ({ page }) => {
  4  |   const signatures = []
  5  |   const notes = []
  6  |   const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  7  |   const children = [
  8  |     { id: 11, product_name: 'pnp', remaining_sessions: null, histories: [{ id: 101, execution_date: day, branch_id: 1, staffs: [{ staff_name: 'Lan' }] }] },
  9  |     { id: 12, product_name: 'Tàn nhang', remaining_sessions: 2, histories: [{ id: 102, execution_date: day, branch_id: 1, staffs: [] }] },
  10 |     { id: 13, product_name: 'Massage', remaining_sessions: 3, histories: [] },
  11 |   ]
  12 |   const root = { id: 10, customer_name: 'Khách A', product_name: 'Gói trị nám', created_at: '2020-01-01', branch_id: 1, children }
  13 |   const standalone = { id:20, customer_name:'Khách B', product_name:'pnp đơn lẻ', created_at:day, branch_id:1, remaining_sessions:5, histories:[{ id:201, execution_date:day, branch_id:1, staffs:[{ staff_name:'Lan' }] }] }
  14 |   const secondSession = { ...standalone, id:21, histories:[{ ...standalone.histories[0], id:202 }] }
  15 |   await page.addInitScript(() => { sessionStorage.setItem('xuly.branch', '1'); localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, system_role: 'MANAGER' } })) })
  16 |   await page.route('**/api/**', route => {
  17 |     const path = new URL(route.request().url()).pathname
  18 |     if (!path.startsWith('/api/')) return route.continue()
  19 |     if (path === '/api/treatments/execute/101/note') {
  20 |       const body = route.request().postDataJSON()
  21 |       notes.push(body)
  22 |       children[0].histories[0].note = body.note
  23 |       return route.fulfill({ json: { data: children[0].histories[0] } })
  24 |     }
  25 |     if (path === '/api/treatments') return route.fulfill({ json: { data: [standalone, secondSession, root], total: 3, totalPages: 1 } })
  26 |     if (path === '/api/treatments/21') return route.fulfill({ json:{ data:secondSession } })
  27 |     if (path === '/api/treatments/20') return route.fulfill({ json:{ data:standalone } })
  28 |     if (path === '/api/treatments/10') return route.fulfill({ json: { data: root } })
  29 |     for (const child of children) if (path === `/api/treatments/${child.id}`) return route.fulfill({ json: { data: child } })
  30 |     if (/\/execute\/\d+\/sign$/.test(path)) {
  31 |       const id = Number(path.split('/').at(-2)), body = route.request().postDataJSON()
  32 |       signatures.push({ id, ...body })
  33 |       const history = children.flatMap(child => child.histories).find(history => history.id === id)
  34 |       Object.assign(history, body)
  35 |       return route.fulfill({ json: { data: history } })
  36 |     }
  37 |     return route.fulfill({ json: { data: [], total: 0, totalPages: 1 } })
  38 |   })
  39 |   await page.goto('/')
  40 |   const table = page.locator('.today-treatments')
  41 |   await expect(table.getByRole('button', { name: 'Ghi chú và chữ ký nhóm Gói trị nám' })).toBeVisible()
  42 |   await expect(table.locator('.today-treatment-child').getByRole('button', { name: /Ký/ })).toHaveCount(0)
  43 |   const groupButton = table.getByRole('button', { name:'Ghi chú và chữ ký nhóm Gói trị nám' })
  44 |   const standaloneButton = table.getByRole('button', { name:'Ghi chú và chữ ký #201 - Khách B' })
  45 |   await expect(groupButton.locator('svg')).toHaveCount(1)
  46 |   await expect(standaloneButton.locator('svg')).toHaveCount(1)
  47 |   const buttonStyle = locator => locator.evaluate(el => {
  48 |     const style = getComputedStyle(el)
  49 |     return [style.backgroundColor, style.color, style.borderRadius, style.padding, style.display, style.gap]
  50 |   })
  51 |   expect(await buttonStyle(groupButton)).toEqual(await buttonStyle(standaloneButton))
  52 |   const groupCell = table.locator('.today-treatment-group td').first()
  53 |   const standaloneCell = table.locator('.today-treatment-standalone td').first()
  54 |   expect(await standaloneCell.evaluate(el => getComputedStyle(el).backgroundColor)).toEqual(await groupCell.evaluate(el => getComputedStyle(el).backgroundColor))
  55 |   await expect(standaloneCell).toHaveCSS('font-weight', '700')
  56 |   for (const row of await table.locator('.today-treatment-standalone, .today-treatment-group').all()) {
  57 |     await expect(row.locator('td').first()).toHaveCSS('border-top-width', '2px')
  58 |     await expect(row.locator('td').first()).toHaveCSS('border-left-width', '3px')
  59 |   }
  60 |   await expect(table.locator('.today-treatment-child td').first()).toHaveCSS('border-top-width', '1px')
  61 |   await table.scrollIntoViewIfNeeded()
  62 |   await page.screenshot({ path: 'test-results/today-group-parent-signature.png' })
  63 |   await table.getByRole('button', { name: 'Ghi chú và chữ ký nhóm Gói trị nám' }).click()
  64 |   const dialog = page.getByRole('dialog', { name: 'Ghi chú và chữ ký nhóm dịch vụ' })
  65 |   await expect(dialog.getByRole('textbox')).toHaveCount(1)
  66 |   await dialog.getByRole('textbox').fill('làm lần 1')
  67 |   await dialog.getByRole('button', { name:'Lưu ghi chú', exact:true }).click()
  68 |   await expect(dialog.getByRole('status')).toContainText('Đã lưu ghi chú buổi thực hiện')
  69 |   expect(notes).toEqual([{ note:'làm lần 1' }])
  70 |   await dialog.getByRole('button', { name: 'Khách hàng ký tên' }).click()
  71 |   const box = await page.getByRole('img', { name: 'Vùng ký tên khách hàng' }).boundingBox()
  72 |   await page.mouse.move(box.x + 20, box.y + 20)
  73 |   await page.mouse.down()
  74 |   await page.mouse.move(box.x + 100, box.y + 70, { steps: 8 })
  75 |   await page.mouse.up()
  76 |   await page.getByRole('button', { name: 'Dùng chữ ký này' }).click()
  77 |   await dialog.getByRole('button', { name: 'Lưu và ký xác nhận' }).click()
  78 |   await expect(dialog.getByRole('status')).toContainText('Đã ký xác nhận')
  79 |   expect(signatures.map(item => item.id)).toEqual([101, 102])
  80 |   expect(signatures[0].customer_signature_svg).toBe(signatures[1].customer_signature_svg)
  81 |   await dialog.getByRole('button', { name: 'Đóng', exact: true }).click()
  82 |   await expect(table.locator('.today-treatment-group')).toContainText('Đã ký')
  83 |   await groupButton.click()
  84 |   await expect(page.getByRole('textbox', { name:'Ghi chú buổi thực hiện' })).toHaveValue('làm lần 1')
> 85 |   await expect(page.getByRole('textbox')).toHaveCount(1)
     |                                           ^ Error: expect(locator).toHaveCount(expected) failed
  86 | })
```