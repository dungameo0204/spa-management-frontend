# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-workflows.spec.js >> customer overview uses compact embedded execution at 390px
- Location: tests\e2e\mobile-workflows.spec.js:287:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 2
Received:   12
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - strong [ref=e7]: ROSA
        - text: CLINIC & AESTHETIC
      - button "Đóng menu" [ref=e8] [cursor=pointer]
    - generic [ref=e12]: KHÔNG GIAN CỦA BẠN
    - navigation "Điều hướng chính" [ref=e13]:
      - generic [ref=e14]:
        - paragraph [ref=e15]: LÀM VIỆC
        - link "Tổng quan" [ref=e16] [cursor=pointer]:
          - /url: /
        - link "Khách hàng" [ref=e22] [cursor=pointer]:
          - /url: /customers
        - link "Khách đặt lịch" [ref=e27] [cursor=pointer]:
          - /url: /customer-bookings
        - link "Bán hàng" [ref=e30] [cursor=pointer]:
          - /url: /invoices
      - generic [ref=e34]:
        - paragraph [ref=e35]: VẬN HÀNH
        - link "Sản phẩm & dịch vụ" [ref=e36] [cursor=pointer]:
          - /url: /products
        - link "Lịch hẹn" [ref=e41] [cursor=pointer]:
          - /url: /appointments
        - link "Liệu trình" [ref=e44] [cursor=pointer]:
          - /url: /treatments
        - link "Nhập kho" [ref=e47] [cursor=pointer]:
          - /url: /imports
        - link "Tồn kho" [ref=e58] [cursor=pointer]:
          - /url: /inventory
        - link "Phiếu chi" [ref=e63] [cursor=pointer]:
          - /url: /expenses
        - link "Thu công nợ" [ref=e66] [cursor=pointer]:
          - /url: /debts
      - generic [ref=e69]:
        - paragraph [ref=e70]: NHÂN SỰ
        - link "Hồ sơ nhân sự" [ref=e71] [cursor=pointer]:
          - /url: /staffs
        - link "Công ca" [ref=e76] [cursor=pointer]:
          - /url: /commissions
        - link "Hoa hồng · tư vấn" [ref=e83] [cursor=pointer]:
          - /url: /consultants
      - generic [ref=e87]:
        - paragraph [ref=e88]: QUẢN LÝ
        - link "Báo cáo" [ref=e89] [cursor=pointer]:
          - /url: /reports
        - link "Chi nhánh" [ref=e92] [cursor=pointer]:
          - /url: /branches
        - link "Chức vụ" [ref=e97] [cursor=pointer]:
          - /url: /roles
        - link "Tài khoản" [ref=e101] [cursor=pointer]:
          - /url: /users
    - generic [ref=e114]:
      - button "Chuyển sang giao diện tối" [ref=e115] [cursor=pointer]: Giao diện tối
      - button "Đăng xuất" [ref=e119] [cursor=pointer]
      - generic [ref=e123]: ROSA · v0.1.2
  - generic [ref=e124]:
    - banner [ref=e125]:
      - button "Mở menu" [ref=e126] [cursor=pointer]
      - generic [ref=e128]:
        - generic [ref=e129]: KHÔNG GIAN QUẢN LÝ
        - strong [ref=e130]: Khách hàng
      - generic [ref=e131]:
        - button "Chọn chi nhánh" [ref=e133] [cursor=pointer]:
          - strong [ref=e134]: Cơ sở chính
        - generic [ref=e137]: X
    - main [ref=e138]:
      - generic [ref=e139]:
        - generic [ref=e140]:
          - generic [ref=e141]:
            - text: KHÔNG GIAN VẬN HÀNH
            - heading "Khách hàng" [level=1] [ref=e142]
            - paragraph [ref=e143]: Thông tin được đồng bộ trực tiếp từ spa của bạn.
          - generic [ref=e144]:
            - button "Xuất Excel" [ref=e146] [cursor=pointer]
            - button "Thêm mới" [ref=e147] [cursor=pointer]
        - generic [ref=e149]:
          - generic [ref=e150]:
            - textbox "Tìm kiếm" [ref=e155]:
              - /placeholder: Tìm kiếm...
            - generic [ref=e156]:
              - generic [ref=e157]: 1 kết quả
              - button "Tải lại khách hàng" [ref=e158] [cursor=pointer]
          - table [ref=e165]:
            - rowgroup [ref=e166]:
              - row [ref=e167] [cursor=pointer]:
                - cell "Họ tên Khách mobile" [ref=e168]
                - cell "Số điện thoại 0901234567" [ref=e169]
                - cell "Mã hồ sơ —" [ref=e170]
                - cell "Công nợ 0 ₫" [ref=e171]:
                  - text: Công nợ
                  - generic [ref=e172]: 0 ₫
                - cell [ref=e173]:
                  - button "Xem Khách mobile" [ref=e174]
        - generic [ref=e178]:
          - button "Đóng" [ref=e179] [cursor=pointer]
          - dialog "Chi tiết khách hàng" [ref=e180]:
            - generic [ref=e181]:
              - heading "Chi tiết khách hàng" [level=2] [ref=e182]
              - button "Đóng" [ref=e183] [cursor=pointer]
            - generic [ref=e187]:
              - generic [ref=e188]:
                - generic [ref=e189]:
                  - strong [ref=e190]: Khách mobile
                  - generic [ref=e191]: "0901234567"
                  - generic [ref=e192]: Chưa có địa chỉ
                  - generic [ref=e193]: "Ví: 0 ₫"
                  - generic [ref=e194]: "Nợ: 0 ₫"
                - generic [ref=e195]:
                  - generic [ref=e196]:
                    - heading "Lịch sử mua và chăm sóc" [level=3] [ref=e197]
                    - generic [ref=e198]:
                      - time [ref=e199]: 06/11/2026
                      - generic [ref=e200]:
                        - generic [ref=e201]: Dịch vụ đã mua
                        - strong [ref=e202]: Gói chăm sóc chuyên sâu dành cho khách hàng mobile
                        - article [ref=e203]:
                          - generic [ref=e205]:
                            - button "Xem lịch sử" [ref=e206] [cursor=pointer]: Lịch sử
                            - button "Thực hiện" [ref=e207] [cursor=pointer]
                          - generic [ref=e208]:
                            - group [ref=e209]:
                              - generic [ref=e210]:
                                - generic [ref=e213]:
                                  - generic [ref=e214] [cursor=pointer]:
                                    - checkbox "Chăm sóc phục hồi chuyên sâu và điều trị da nhạy cảm" [checked] [active] [ref=e215]
                                    - generic [ref=e216]: Chăm sóc phục hồi chuyên sâu và điều trị da nhạy cảm
                                  - generic [ref=e217]: 5/6 buổi
                                  - button "Nhân viên làm Chăm sóc phục hồi chuyên sâu và điều trị da nhạy cảm" [ref=e219] [cursor=pointer]:
                                    - generic [ref=e225]: Chọn nhân viên
                                - generic [ref=e227]:
                                  - generic [ref=e228]:
                                    - generic [ref=e229]:
                                      - generic [ref=e230]: Cơ sở thực hiện
                                      - combobox "Cơ sở thực hiện":
                                        - option "Chọn cơ sở"
                                        - option "Cơ sở chính" [selected]
                                      - button "Cơ sở thực hiện" [ref=e231] [cursor=pointer]:
                                        - generic [ref=e232]: Cơ sở chính
                                    - generic [ref=e235]:
                                      - generic [ref=e236]: Ngày thực hiện
                                      - generic [ref=e237]:
                                        - textbox "Ngày thực hiện" [ref=e238]: 06/11/2026
                                        - button "Mở lịch Ngày thực hiện" [ref=e239] [cursor=pointer]
                                  - generic [ref=e242]:
                                    - button "Ghi chú" [ref=e243] [cursor=pointer]
                                    - generic [ref=e244]: Chưa ký
                                    - button "Khách hàng ký tên" [ref=e248] [cursor=pointer]
                            - generic [ref=e249]:
                              - button "Đóng" [ref=e250] [cursor=pointer]
                              - button "Xác nhận" [ref=e251] [cursor=pointer]
                  - complementary [ref=e252]:
                    - region "Hồ sơ khách hàng" [ref=e253]:
                      - generic [ref=e254]:
                        - heading "Hồ sơ khách hàng" [level=3] [ref=e255]
                        - generic [ref=e256]:
                          - button "In hồ sơ" [ref=e257] [cursor=pointer]
                          - button "Chia sẻ" [ref=e258] [cursor=pointer]
                      - generic [ref=e259]:
                        - generic [ref=e260]:
                          - term [ref=e261]: Mã hồ sơ
                          - definition [ref=e262]: Chưa ghi nhận
                        - generic [ref=e263]:
                          - term [ref=e264]: Ngày lập hồ sơ
                          - definition [ref=e265]: Chưa ghi nhận
                        - generic [ref=e266]:
                          - term [ref=e267]: Ngày sinh
                          - definition [ref=e268]: Chưa ghi nhận
                        - generic [ref=e269]:
                          - term [ref=e270]: Giới tính
                          - definition [ref=e271]: Chưa ghi nhận
                        - generic [ref=e272]:
                          - term [ref=e273]: Địa chỉ
                          - definition [ref=e274]: Chưa ghi nhận
                        - generic [ref=e275]:
                          - term [ref=e276]: Loại da
                          - definition [ref=e277]: Chưa ghi nhận
                        - generic [ref=e278]:
                          - term [ref=e279]: Nguồn giới thiệu
                          - definition [ref=e280]: Chưa ghi nhận
                        - generic [ref=e281]:
                          - term [ref=e282]: Ghi chú nguồn giới thiệu
                          - definition [ref=e283]: Chưa ghi nhận
                        - generic [ref=e284]:
                          - term [ref=e285]: Đánh giá tình trạng da
                          - definition [ref=e286]: Chưa ghi nhận
                        - generic [ref=e287]:
                          - term [ref=e288]: Nội dung tư vấn
                          - definition [ref=e289]: Chưa ghi nhận
                      - group [ref=e290]:
                        - generic "Tiền sử và chăm sóc da" [ref=e291] [cursor=pointer]
                    - region "Album ảnh da" [ref=e292]:
                      - generic [ref=e293]:
                        - generic [ref=e294]:
                          - heading "Album ảnh da" [level=3] [ref=e295]
                          - paragraph [ref=e296]: Theo dõi thay đổi qua từng lần chụp
                        - button "Thêm lần chụp" [ref=e297] [cursor=pointer]
                      - paragraph [ref=e302]: Chưa có lần chụp nào.
              - generic [ref=e303]:
                - button "Sửa" [ref=e304] [cursor=pointer]
                - button "Xóa" [ref=e308] [cursor=pointer]
  - navigation "Điều hướng nhanh" [ref=e312]:
    - link "Tổng quan" [ref=e313] [cursor=pointer]:
      - /url: /
    - link "Khách hàng" [ref=e320] [cursor=pointer]:
      - /url: /customers
    - link "Khách đặt lịch" [ref=e326] [cursor=pointer]:
      - /url: /customer-bookings
    - link "Bán hàng" [ref=e330] [cursor=pointer]:
      - /url: /invoices
    - button "Thêm" [ref=e335] [cursor=pointer]
```

# Test source

```ts
  55  |     expect(textareaBox.y + textareaBox.height).toBeLessThanOrEqual(actionsBox.y)
  56  |     await form.getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
  57  |     await expect(note).toBeHidden()
  58  |     await form.getByRole('button', { name: 'Ghi chú ✓', exact: true }).click()
  59  |     await expect(note).toHaveValue('Theo dõi da')
  60  |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  61  |     await page.screenshot({ path: `test-results/single-note-signature-${width}.png`, fullPage: true })
  62  |   })
  63  | }
  64  | 
  65  | for (const width of [320, 360, 390, 430, 1280]) {
  66  |   for (const single of [false, true]) {
  67  |     test(`closable ${single ? 'single' : 'grouped'} actions fit ${width}px`, async ({ page }) => {
  68  |       await page.setViewportSize({ width, height: 900 })
  69  |       await setup(page, { single, closable: true })
  70  |       await page.goto('/treatments')
  71  |       await page.locator('.treatment-service-badge').first().click()
  72  |       const panel = page.locator(`.treatment-root-panel.is-${single ? 'single' : 'grouped'}-treatment`).first()
  73  |       const buttons = panel.locator('.is-page-actions > button')
  74  |       await expect(buttons).toHaveCount(3)
  75  |       const geometry = await buttons.evaluateAll(nodes => nodes.map(node => {
  76  |         const rect = node.getBoundingClientRect()
  77  |         const style = getComputedStyle(node)
  78  |         return { x: rect.x, y: rect.y, right: rect.right, height: rect.height, fontSize: style.fontSize, fits: node.scrollWidth <= node.clientWidth + 1 }
  79  |       }))
  80  |       expect(geometry.every(box => Math.abs(box.y - geometry[0].y) < 2)).toBe(true)
  81  |       expect(geometry[0].right).toBeLessThanOrEqual(geometry[1].x)
  82  |       expect(geometry[1].right).toBeLessThanOrEqual(geometry[2].x)
  83  |       expect(geometry.every(box => box.fits)).toBe(true)
  84  |       if (!single && width < 768) {
  85  |         expect(geometry.every(box => box.height === 30 && box.fontSize === '11px')).toBe(true)
  86  |         expect(geometry[0].right - geometry[0].x).toBeLessThan(85)
  87  |       }
  88  |       await expect(panel.locator('.treatment-close-action')).toHaveText('Ký kết thúc liệu trình')
  89  |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  90  |       await page.screenshot({ path: `test-results/closable-${single ? 'single' : 'grouped'}-${width}.png`, fullPage: true })
  91  |       await panel.getByRole('button', { name: 'Ký kết thúc liệu trình', exact: true }).click()
  92  |       await expect(page.getByRole('dialog', { name: 'Ký kết thúc liệu trình', exact: true })).toBeVisible()
  93  |     })
  94  |   }
  95  | }
  96  | 
  97  | test('desktop workflow geometry is unchanged by mobile overrides', async ({ page }) => {
  98  |   await page.setViewportSize({ width: 1280, height: 900 })
  99  |   await setup(page)
  100 |   for (const path of ['/', '/treatments', '/customers']) {
  101 |     await page.goto(path)
  102 |     if (path === '/treatments') await page.getByRole('button', { name: /Khách mobile:.*dịch vụ/ }).click()
  103 |     if (path === '/customers') await page.getByRole('button', { name: 'Xem Khách mobile', exact: true }).click()
  104 |     const selector = path === '/' ? '.today-treatments' : path === '/customers' ? '.customer-overview .treatment-root-panel' : '.treatment-root-panel'
  105 |     const panel = page.locator(selector).first()
  106 |     await expect(panel).toBeVisible()
  107 |     if (path !== '/') await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
  108 |     const geometry = () => panel.evaluate(element => [element, ...element.querySelectorAll('button, input, .treatment-execution-form')].map(node => {
  109 |       const { x, y, width, height } = node.getBoundingClientRect()
  110 |       return { x, y, width, height }
  111 |     }))
  112 |     const before = await geometry()
  113 |     const disabled = await page.evaluate(() => {
  114 |       const sheet = [...document.styleSheets].find(sheet => sheet.ownerNode?.dataset.viteDevId?.replaceAll('\\', '/').endsWith('/src/styles/mobile-workflows.css'))
  115 |       if (!sheet) return false
  116 |       sheet.disabled = true
  117 |       return true
  118 |     })
  119 |     expect(disabled).toBe(true)
  120 |     const after = await geometry()
  121 |     expect(after).toHaveLength(before.length)
  122 |     after.forEach((box, index) => {
  123 |       for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(box[key] - before[index][key])).toBeLessThan(1)
  124 |     })
  125 |     await page.evaluate(() => {
  126 |       for (const sheet of document.styleSheets) sheet.disabled = false
  127 |     })
  128 |   }
  129 | })
  130 | 
  131 | async function expectContained(locator) {
  132 |   await expect(locator).toBeVisible()
  133 |   const overflow = await locator.evaluate(el => {
  134 |     const bounds = el.getBoundingClientRect()
  135 |     return { fits: el.scrollWidth <= el.clientWidth + 1, outside: [...el.querySelectorAll('*')].filter(node => node.getBoundingClientRect().right > bounds.right + 1).map(node => ({ className: node.className, width: node.getBoundingClientRect().width })) }
  136 |   })
  137 |   expect(overflow.fits, JSON.stringify(overflow.outside)).toBe(true)
  138 |   const box = await locator.boundingBox()
  139 |   expect(box.x).toBeGreaterThanOrEqual(-1)
  140 |   expect(box.x + box.width).toBeLessThanOrEqual(await locator.page().evaluate(() => innerWidth + 1))
  141 | }
  142 | 
  143 | async function expectCompactSubmit(locator) {
  144 |   const box = await locator.boundingBox()
  145 |   expect(box.height).toBeGreaterThanOrEqual(38)
  146 |   expect(box.height).toBeLessThanOrEqual(40)
  147 | }
  148 | 
  149 | async function expectTwoColumns(locator) {
  150 |   const boxes = await locator.locator(':scope > .field').evaluateAll(fields => fields.map(field => {
  151 |     const { top, right, bottom, left } = field.getBoundingClientRect()
  152 |     return { top, right, bottom, left }
  153 |   }))
  154 |   expect(boxes).toHaveLength(2)
> 155 |   expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(2)
      |                                                 ^ Error: expect(received).toBeLessThan(expected)
  156 |   expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].left)
  157 | }
  158 | 
  159 | async function auditExecution(page, panel, width, context) {
  160 |   const form = panel.locator('.treatment-execution-form')
  161 |   const staff = form.getByRole('button', { name: /^Nhân viên làm/ })
  162 |   await staff.click()
  163 |   const picker = page.getByRole('dialog', { name: /^Nhân viên làm/ })
  164 |   await picker.getByRole('checkbox', { name: 'Lan', exact: true }).check()
  165 |   await picker.getByRole('button', { name: 'Xong', exact: true }).click()
  166 |   await expect(staff).toContainText('Lan')
  167 |   const actions = form.locator('.treatment-execution-actions')
  168 |   const boxes = await actions.locator('button').evaluateAll(nodes => nodes.map(node => {
  169 |     const { left, right } = node.getBoundingClientRect()
  170 |     return { left, right }
  171 |   }))
  172 |   expect(boxes[1].left - boxes[0].right).toBeGreaterThanOrEqual(8)
  173 |   const submit = actions.getByRole('button', { name: 'Xác nhận', exact: true })
  174 |   await submit.scrollIntoViewIfNeeded()
  175 |   await submit.click({ trial: true })
  176 |   if (context === 'treatment') {
  177 |     const nav = await page.locator('.mobile-nav').boundingBox()
  178 |     const button = await submit.boundingBox()
  179 |     expect(button.y + button.height).toBeLessThanOrEqual(nav.y - 8)
  180 |   }
  181 |   await page.screenshot({ path: `test-results/mobile-${context}-actions-${width}.png` })
  182 |   await submit.click()
  183 |   const confirmation = page.getByRole('alertdialog', { name: 'Ghi nhận buổi chưa có chữ ký?' })
  184 |   await expect(confirmation).toBeVisible()
  185 |   await confirmation.getByRole('button', { name: 'Quay lại ký' }).click()
  186 |   await actions.getByRole('button', { name: 'Đóng', exact: true }).click()
  187 |   await expect(form).toHaveCount(0)
  188 | }
  189 | 
  190 | for (const width of [320, 360, 390, 430]) {
  191 |   for (const single of [true, false]) test(`history metadata stays readable (${single ? 'single' : 'grouped'}) at ${width}px`, async ({ page }) => {
  192 |     await page.setViewportSize({ width, height: 900 })
  193 |     await setup(page, { single, history: true })
  194 |     await page.goto('/customers')
  195 |     await page.getByRole('button', { name: 'Xem Khách mobile', exact: true }).click()
  196 |     const panel = page.locator('.customer-overview .treatment-root-panel').first()
  197 |     const toggle = panel.getByRole('button', { name: 'Xem lịch sử', exact: true })
  198 |     if (await toggle.count()) await toggle.click()
  199 |     const history = panel.locator('.treatment-history')
  200 |     await expectContained(history)
  201 |     const heading = history.locator(single ? '.treatment-history-meta strong' : '.treatment-history-day-heading > strong').first()
  202 |     await expect(heading).toBeVisible()
  203 |     const geometry = await heading.evaluate(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(node).lineHeight) }))
  204 |     expect(geometry.width).toBeGreaterThan(120)
  205 |     expect(geometry.height).toBeLessThan(geometry.lineHeight * 5)
  206 |   })
  207 | 
  208 |   test(`single execution collapses without blank space at ${width}px`, async ({ page }) => {
  209 |     await page.setViewportSize({ width, height: 900 })
  210 |     await setup(page, { single: true })
  211 |     for (const path of ['/treatments', '/customers']) {
  212 |       await page.goto(path)
  213 |       if (path === '/treatments') await page.getByRole('button', { name: /Khách mobile:.*dịch vụ/ }).click()
  214 |       else await page.getByRole('button', { name: 'Xem Khách mobile', exact: true }).click()
  215 |       const panel = page.locator('.treatment-root-panel').first()
  216 |       await panel.getByRole('button', { name: 'Thực hiện', exact: true }).click()
  217 |       const form = panel.locator('.treatment-execution-form')
  218 |       await expectContained(form)
  219 |       const initial = await form.boundingBox()
  220 |       expect(initial.height).toBeLessThan(330)
  221 |       const staff = await form.locator('.treatment-single-staff').boundingBox()
  222 |       const note = form.getByRole('button', { name: 'Ghi chú', exact: true })
  223 |       expect((await note.boundingBox()).y - (staff.y + staff.height)).toBeLessThan(20)
  224 |       await note.click()
  225 |       await form.getByRole('textbox', { name: 'Ghi chú buổi thực hiện' }).fill('Theo dõi sau buổi')
  226 |       await form.getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
  227 |       expect(Math.abs((await form.boundingBox()).height - initial.height)).toBeLessThan(2)
  228 |       await form.getByRole('button', { name: 'Khách hàng ký tên', exact: true }).click()
  229 |       await page.getByRole('dialog', { name: 'Chữ ký khách hàng', exact: true }).getByRole('button', { name: 'Đóng vùng ký', exact: true }).click()
  230 |       expect(Math.abs((await form.boundingBox()).height - initial.height)).toBeLessThan(2)
  231 |       await form.getByRole('button', { name: 'Xác nhận', exact: true }).click({ trial: true })
  232 |     }
  233 |   })
  234 | 
  235 |   test(`completed customer actions stay inside their cells at ${width}px`, async ({ page }) => {
  236 |     await page.setViewportSize({ width, height: 900 })
  237 |     await setup(page, { completedCount: 123 })
  238 |     await page.goto('/treatments')
  239 |     const row = page.locator('.treatment-customers tr.clickable').first()
  240 |     const completed = row.getByRole('button', { name: 'Khách mobile: 123 đã hoàn thành', exact: true })
  241 |     await expect(completed).toBeVisible()
  242 |     for (const button of [completed, row.locator('.treatment-service-badge')]) {
  243 |       const fits = await button.evaluate(node => {
  244 |         const box = node.getBoundingClientRect(), cell = node.closest('td').getBoundingClientRect()
  245 |         return box.left >= cell.left - 1 && box.right <= cell.right + 1 && node.scrollWidth <= node.clientWidth + 1
  246 |       })
  247 |       expect(fits).toBe(true)
  248 |     }
  249 |     await completed.click()
  250 |     await expect(page.locator('.treatment-expanded-row')).toBeVisible()
  251 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  252 |   })
  253 | 
  254 |   test(`today visit and execution controls fit ${width}px`, async ({ page }) => {
  255 |     await page.setViewportSize({ width, height: 900 })
```