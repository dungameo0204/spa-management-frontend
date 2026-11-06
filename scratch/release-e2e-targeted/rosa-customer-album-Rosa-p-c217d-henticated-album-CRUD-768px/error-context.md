# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rosa-customer-album.spec.js >> Rosa profile and authenticated album CRUD 768px
- Location: tests\e2e\rosa-customer-album.spec.js:5:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('region', { name: 'Album ảnh da' }).locator('.skin-session')
Expected: 1
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('region', { name: 'Album ảnh da' }).locator('.skin-session') with timeout 5000ms
  - waiting for getByRole('region', { name: 'Album ảnh da' }).locator('.skin-session')
    14 × locator resolved to 0 elements
       - unexpected value "0"

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
    - generic [ref=e76]:
      - button "Chuyển sang giao diện tối" [ref=e77] [cursor=pointer]: Giao diện tối
      - button "Đăng xuất" [ref=e81] [cursor=pointer]
      - generic [ref=e85]: ROSA · v0.1.2
  - generic [ref=e86]:
    - banner [ref=e87]:
      - button "Mở menu" [ref=e88] [cursor=pointer]
      - generic [ref=e90]:
        - generic [ref=e91]: KHÔNG GIAN QUẢN LÝ
        - strong [ref=e92]: Khách hàng
      - generic [ref=e93]:
        - generic [ref=e94]: Cơ sở của bạn
        - generic [ref=e95]: X
    - main [ref=e96]:
      - generic [ref=e97]:
        - generic [ref=e98]:
          - generic [ref=e99]:
            - text: KHÔNG GIAN VẬN HÀNH
            - heading "Khách hàng" [level=1] [ref=e100]
            - paragraph [ref=e101]: Thông tin được đồng bộ trực tiếp từ spa của bạn.
          - generic [ref=e102]:
            - button "Xuất Excel" [ref=e104] [cursor=pointer]
            - button "Thêm mới" [ref=e105] [cursor=pointer]
        - generic [ref=e107]:
          - generic [ref=e108]:
            - textbox "Tìm kiếm" [ref=e113]:
              - /placeholder: Tìm kiếm...
            - generic [ref=e114]:
              - generic [ref=e115]: 1 kết quả
              - button "Tải lại khách hàng" [ref=e116] [cursor=pointer]
          - table [ref=e123]:
            - rowgroup [ref=e124]:
              - row [ref=e125]:
                - columnheader "Họ tên" [ref=e126]
                - columnheader "Số điện thoại" [ref=e127]
                - columnheader "Mã hồ sơ" [ref=e128]
                - columnheader "Công nợ" [ref=e129]
                - columnheader [ref=e130]
            - rowgroup [ref=e131]:
              - row [ref=e132] [cursor=pointer]:
                - cell "Khách Rosa" [ref=e133]
                - cell "0901234567" [ref=e134]
                - cell "ROSA-17" [ref=e135]
                - cell "0 ₫" [ref=e136]
                - cell [ref=e137]:
                  - button "Xem Khách Rosa" [ref=e138]
        - generic [ref=e142]:
          - button "Đóng" [ref=e143] [cursor=pointer]
          - dialog "Chi tiết khách hàng" [ref=e144]:
            - generic [ref=e145]:
              - heading "Chi tiết khách hàng" [level=2] [ref=e146]
              - button "Đóng" [ref=e147] [cursor=pointer]
            - generic [ref=e151]:
              - generic [ref=e152]:
                - generic [ref=e153]:
                  - strong [ref=e154]: Khách Rosa
                  - generic [ref=e155]: "0901234567"
                  - generic [ref=e156]: Chưa có địa chỉ
                  - generic [ref=e157]: "Ví: 0 ₫"
                  - generic [ref=e158]: "Nợ: 0 ₫"
                - generic [ref=e159]:
                  - generic [ref=e160]:
                    - heading "Lịch sử mua và chăm sóc" [level=3] [ref=e161]
                    - generic [ref=e162]:
                      - time [ref=e163]: 27/10/2026
                      - generic [ref=e164]:
                        - generic [ref=e165]: Dịch vụ đã mua
                        - strong [ref=e166]: Chăm sóc da
                        - generic [ref=e167]: "Hóa đơn #1 · 1 × 200.000 ₫"
                        - generic [ref=e168]:
                          - generic [ref=e169]: Thành tiền
                          - strong [ref=e170]: 200.000 ₫
                  - complementary [ref=e171]:
                    - region "Hồ sơ khách hàng" [ref=e172]:
                      - generic [ref=e173]:
                        - heading "Hồ sơ khách hàng" [level=3] [ref=e174]
                        - generic [ref=e175]:
                          - button "In hồ sơ" [ref=e176] [cursor=pointer]
                          - button "Chia sẻ" [ref=e177] [cursor=pointer]
                      - generic [ref=e178]:
                        - generic [ref=e179]:
                          - term [ref=e180]: Mã hồ sơ
                          - definition [ref=e181]: ROSA-17
                        - generic [ref=e182]:
                          - term [ref=e183]: Ngày lập hồ sơ
                          - definition [ref=e184]: Chưa ghi nhận
                        - generic [ref=e185]:
                          - term [ref=e186]: Ngày sinh
                          - definition [ref=e187]: Chưa ghi nhận
                        - generic [ref=e188]:
                          - term [ref=e189]: Giới tính
                          - definition [ref=e190]: Chưa ghi nhận
                        - generic [ref=e191]:
                          - term [ref=e192]: Địa chỉ
                          - definition [ref=e193]: Chưa ghi nhận
                        - generic [ref=e194]:
                          - term [ref=e195]: Loại da
                          - definition [ref=e196]: Da khô
                        - generic [ref=e197]:
                          - term [ref=e198]: Nguồn giới thiệu
                          - definition [ref=e199]: Chưa ghi nhận
                        - generic [ref=e200]:
                          - term [ref=e201]: Ghi chú nguồn giới thiệu
                          - definition [ref=e202]: Chưa ghi nhận
                        - generic [ref=e203]:
                          - term [ref=e204]: Đánh giá tình trạng da
                          - definition [ref=e205]: Chưa ghi nhận
                        - generic [ref=e206]:
                          - term [ref=e207]: Nội dung tư vấn
                          - definition [ref=e208]: Phục hồi da Chống nắng
                      - region "Ghi chú" [ref=e209]:
                        - heading "Ghi chú" [level=3] [ref=e210]
                        - paragraph [ref=e211]: Ghi chú nhiều dòng Không mất nội dung
                      - group [ref=e212]:
                        - generic "Tiền sử và chăm sóc da" [ref=e213] [cursor=pointer]
                    - region "Album ảnh da" [ref=e214]:
                      - generic [ref=e215]:
                        - generic [ref=e216]:
                          - heading "Album ảnh da" [level=3] [ref=e217]
                          - paragraph [ref=e218]: Theo dõi thay đổi qua từng lần chụp
                        - button "Thêm lần chụp" [disabled] [ref=e219]
                      - group [ref=e225]:
                        - generic [ref=e226]:
                          - generic [ref=e227]:
                            - text: Ngày chụp
                            - generic [ref=e228]:
                              - textbox "Ngày chụp" [active] [ref=e229]: 20/26/1027
                              - button "Mở lịch Ngày chụp" [ref=e230] [cursor=pointer]
                          - generic [ref=e233]:
                            - text: Ghi chú lần chụp
                            - textbox "Ghi chú lần chụp" [ref=e234]:
                              - /placeholder: Trước / sau điều trị, tình trạng da…
                              - text: Trước điều trị
                        - generic [ref=e235] [cursor=pointer]:
                          - button "Chọn ảnh" [ref=e236]
                          - generic [ref=e240]:
                            - strong [ref=e241]: Chọn ảnh hoặc kéo thả vào đây
                            - generic [ref=e242]: JPEG, PNG, WebP · tối đa 10 MiB/ảnh · 10 ảnh/lượt lưu
                        - generic [ref=e244]:
                          - button "Xem ảnh skin.png" [ref=e245] [cursor=pointer]:
                            - img "skin.png" [ref=e246]
                          - generic: Chưa lưu
                          - button "Bỏ ảnh 1" [ref=e247] [cursor=pointer]
                          - generic "skin.png" [ref=e251]
                        - status [ref=e252]: 1/10 ảnh mới đang chờ lưu · Chọn tiếp để thêm ảnh
                        - generic [ref=e253]:
                          - button "Hủy nhập ảnh" [ref=e254] [cursor=pointer]
                          - button "Lưu album" [ref=e255] [cursor=pointer]
                      - paragraph [ref=e256]: Chưa có lần chụp nào.
              - generic [ref=e257]:
                - button "Sửa" [ref=e258] [cursor=pointer]
                - button "Xóa" [ref=e262] [cursor=pointer]
  - navigation "Điều hướng nhanh" [ref=e266]:
    - link "Tổng quan" [ref=e267] [cursor=pointer]:
      - /url: /
    - link "Khách hàng" [ref=e274] [cursor=pointer]:
      - /url: /customers
    - link "Khách đặt lịch" [ref=e280] [cursor=pointer]:
      - /url: /customer-bookings
    - link "Bán hàng" [ref=e284] [cursor=pointer]:
      - /url: /invoices
    - button "Thêm" [ref=e289] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from './fixtures'
  2   | 
  3   | const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
  4   | for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  5   |   test(`Rosa profile and authenticated album CRUD ${viewport.width}px`, async ({ page }) => {
  6   |     await page.setViewportSize(viewport)
  7   |     await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, branch_id: 1, system_role: 'STAFF' } })))
  8   |     const errors = [], writes = []
  9   |     page.on('pageerror', error => errors.push(error.message))
  10  |     let sessions = [], nextId = 1
  11  |     await page.route('**/api/**', async route => {
  12  |       const request = route.request(), path = new URL(request.url()).pathname, method = request.method()
  13  |       if (!path.startsWith('/api/')) return route.continue()
  14  |       const customer = { id: 17, fullname: 'Khách Rosa', phone_number: '0901234567', skin_types: ['DRY'], profile_code: 'ROSA-17', consultation_note: 'Phục hồi da\nChống nắng', note: 'Ghi chú nhiều dòng\nKhông mất nội dung', wallet_balance: 0, total_debt: 0 }
  15  |       if (path.endsWith('/file')) {
  16  |         expect(request.headers().authorization).toBe('Bearer test')
  17  |         expect(request.url()).not.toContain('token=')
  18  |         return route.fulfill({ contentType: 'image/png', body: png })
  19  |       }
  20  |       if (path.includes('/skin-image-sessions')) {
  21  |         const parts = path.split('/'), sessionId = Number(parts[5]), session = sessions.find(item => item.id === sessionId)
  22  |         if (method !== 'GET') writes.push({ method, body: request.postData() || '', contentType: request.headers()['content-type'] })
  23  |         if (method === 'POST') {
  24  |           expect(request.headers()['content-type']).toContain('multipart/form-data; boundary=')
  25  |           const names = [...request.postData().matchAll(/filename="([^"]+)"/g)].map(match => match[1])
  26  |           const images = names.map(name => ({ id: nextId++, original_filename: name }))
  27  |           if (path.endsWith('/images')) session.images.push(...images)
  28  |           else sessions = [{ id: 1, captured_date: '2026-10-27', note: 'Trước điều trị', images }]
  29  |         }
  30  |         if (method === 'PUT') Object.assign(session, request.postDataJSON())
  31  |         if (method === 'DELETE') {
  32  |           if (parts[6] === 'images') session.images = session.images.filter(image => image.id !== Number(parts[7]))
  33  |           else sessions = sessions.filter(item => item.id !== sessionId)
  34  |         }
  35  |         return route.fulfill({ json: { data: sessions, total: sessions.length, totalPages: sessions.length ? 1 : 0 } })
  36  |       }
  37  |       if (path === '/api/customers') return route.fulfill({ json: { data: [customer], total: 1 } })
  38  |       if (path.endsWith('/overview')) return route.fulfill({ json: { data: { customer, timeline: [{ type: 'purchase', date: '2026-10-27', item: { invoice_item_id: 1, invoice_id: 1, product_name: 'Chăm sóc da', quantity: 1, unit_price: 200000, final_price: 200000 } }] } } })
  39  |       return route.fulfill({ json: { data: [], total: 0 } })
  40  |     })
  41  |     await page.goto('/customers')
  42  |     await page.getByRole('button', { name: 'Xem Khách Rosa' }).click()
  43  |     const dialog = page.getByRole('dialog'), album = page.getByRole('region', { name: 'Album ảnh da' })
  44  |     await expect(page.getByRole('region', { name: 'Hồ sơ khách hàng' })).toContainText('ROSA-17')
  45  |     await expect(album.getByText('Chưa có lần chụp nào.')).toBeVisible()
  46  |     const layout = await dialog.evaluate(element => {
  47  |       const left = element.querySelector('.customer-timeline').getBoundingClientRect(), right = element.querySelector('.customer-profile-column').getBoundingClientRect()
  48  |       return { sideBySide: Math.abs(left.top - right.top) < 2, fits: element.scrollWidth <= element.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth }
  49  |     })
  50  |     expect(layout).toEqual({ sideBySide: viewport.width > 1100, fits: true })
  51  |     if (viewport.width > 1100) {
  52  |       const ratio = await page.locator('.customer-overview-columns').evaluate(element => element.children[0].getBoundingClientRect().width / element.children[1].getBoundingClientRect().width)
  53  |       expect(ratio).toBeGreaterThanOrEqual(1)
  54  |       expect(ratio).toBeCloseTo(1.4 / 0.9, 1)
  55  |     }
  56  |     await album.getByRole('button', { name: 'Thêm lần chụp' }).click()
  57  |     await album.getByLabel('Ngày chụp', { exact: true }).fill('2026-10-27')
  58  |     await album.getByLabel('Ghi chú lần chụp').fill('Trước điều trị')
  59  |     await album.locator('input[type=file]').setInputFiles({ name: 'bad.gif', mimeType: 'image/gif', buffer: png })
  60  |     await expect(album.getByRole('alert')).toContainText('JPEG, PNG hoặc WebP')
  61  |     await album.locator('input[type=file]').setInputFiles({ name: 'skin.png', mimeType: 'image/png', buffer: png })
  62  |     await album.getByRole('button', { name: 'Xem ảnh skin.png' }).click()
  63  |     await expect(page.getByRole('dialog', { name: 'Xem ảnh da' })).toBeVisible()
  64  |     await page.keyboard.press('Escape')
  65  |     await album.getByRole('button', { name: 'Lưu album' }).click()
> 66  |     await expect(album.locator('.skin-session')).toHaveCount(1)
      |                                                  ^ Error: expect(locator).toHaveCount(expected) failed
  67  |     expect(writes[0].body).toContain('name="captured_date"')
  68  |     expect(writes[0].body).toContain('name="images"')
  69  |     await album.getByRole('button', { name: 'Xem ảnh skin.png' }).click()
  70  |     await expect(page.getByRole('dialog', { name: 'Xem ảnh da' }).locator('img')).toHaveJSProperty('naturalWidth', 1)
  71  |     await page.getByRole('button', { name: 'Đóng ảnh' }).click()
  72  |     await album.getByRole('button', { name: 'Sửa lần chụp', exact: true }).click()
  73  |     await album.getByLabel('Ghi chú lần chụp').fill('Sau điều trị\nDa cải thiện')
  74  |     await album.getByRole('button', { name: 'Lưu album' }).click()
  75  |     await expect(album.locator('.skin-note')).toHaveText('Sau điều trị\nDa cải thiện')
  76  |     await album.getByRole('button', { name: 'Thêm ảnh', exact: true }).click()
  77  |     const session = album.locator('.skin-session')
  78  |     await expect(session.locator('input[type=file]')).toHaveCount(1)
  79  |     await session.locator('input[type=file]').setInputFiles({ name: 'second.png', mimeType: 'image/png', buffer: png })
  80  |     await session.locator('input[type=file]').setInputFiles({ name: 'third.png', mimeType: 'image/png', buffer: png })
  81  |     await expect(session.locator('.is-pending')).toHaveCount(2)
  82  |     await expect(session.locator('.skin-image-grid').first().locator('.skin-thumbnail')).toHaveCount(3)
  83  |     await session.locator('.skin-dropzone').evaluate((element, bytes) => {
  84  |       const transfer = new DataTransfer()
  85  |       transfer.items.add(new File([new Uint8Array(bytes)], 'dropped.png', { type: 'image/png' }))
  86  |       element.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }))
  87  |     }, [...png])
  88  |     await expect(session.locator('.is-pending')).toHaveCount(3)
  89  |     const imageLayout = await session.locator('.skin-image-grid').evaluate(element => {
  90  |       const cards = [...element.children].map(child => child.getBoundingClientRect())
  91  |       return { sameRow: Math.abs(cards[0].top - cards[1].top) < 2, fits: cards.every(card => card.right <= element.getBoundingClientRect().right + 1) }
  92  |     })
  93  |     expect(imageLayout).toEqual({ sameRow: true, fits: true })
  94  |     await session.getByRole('button', { name: 'Bỏ ảnh 3', exact: true }).click()
  95  |     await expect(session.locator('.is-pending')).toHaveCount(2)
  96  |     await album.getByRole('button', { name: 'Lưu album' }).click()
  97  |     await expect(album.locator('.skin-session .skin-thumbnail')).toHaveCount(3)
  98  |     expect(writes.find(write => write.method === 'POST' && !write.body.includes('name="captured_date"'))).toBeTruthy()
  99  |     await album.getByRole('button', { name: 'Xem ảnh skin.png', exact: true }).click()
  100 |     const viewer = page.getByRole('dialog', { name: 'Xem ảnh da' })
  101 |     await expect(viewer.locator('.skin-viewer-arrow')).toHaveCount(2)
  102 |     await expect(viewer.getByRole('button', { name: 'Ảnh trước', exact: true })).toHaveText('')
  103 |     await expect(viewer.getByText('skin.png', { exact: true })).toHaveCount(0)
  104 |     await expect(viewer.getByRole('button', { name: 'Ảnh trước', exact: true })).toBeDisabled()
  105 |     await viewer.getByRole('button', { name: 'Phóng to', exact: true }).click()
  106 |     await expect(viewer.getByLabel('Mức phóng đại')).toHaveText('125%')
  107 |     const stage = viewer.locator('.skin-viewer-stage')
  108 |     await expect(stage.locator('img')).toHaveJSProperty('naturalWidth', 1)
  109 |     await stage.hover()
  110 |     const scrollBeforeZoom = await dialog.locator('.drawer-body').evaluate(element => element.scrollTop)
  111 |     await page.mouse.wheel(0, -100)
  112 |     await expect.poll(() => viewer.getByLabel('Mức phóng đại').textContent()).toBe('153%')
  113 |     await page.mouse.wheel(0, 100)
  114 |     await expect(viewer.getByLabel('Mức phóng đại')).toHaveText('125%')
  115 |     expect(await dialog.locator('.drawer-body').evaluate(element => element.scrollTop)).toBe(scrollBeforeZoom)
  116 |     await stage.dblclick()
  117 |     await expect(viewer.getByLabel('Mức phóng đại')).toHaveText('100%')
  118 |     await page.mouse.wheel(0, 100)
  119 |     await expect(viewer.getByLabel('Mức phóng đại')).toHaveText('100%')
  120 |     await page.keyboard.press('ArrowRight')
  121 |     await expect(viewer.getByLabel('Mức phóng đại')).toHaveText('100%')
  122 |     await expect(viewer).toContainText('2 / 3')
  123 |     await page.keyboard.press('ArrowRight')
  124 |     await expect(viewer.getByRole('button', { name: 'Ảnh tiếp theo', exact: true })).toBeDisabled()
  125 |     await page.keyboard.press('ArrowRight')
  126 |     await expect(viewer).toContainText('3 / 3')
  127 |     await page.keyboard.press('Escape')
  128 |     await expect(viewer).toHaveCount(0)
  129 |     await expect(page.getByRole('dialog', { name: 'Chi tiết khách hàng' })).toBeVisible()
  130 |     await album.getByRole('button', { name: 'Sửa lần chụp', exact: true }).click()
  131 |     await album.getByLabel('Ghi chú lần chụp').fill('Bản nháp giữ lại')
  132 |     await album.getByRole('button', { name: 'Hủy nhập ảnh' }).click()
  133 |     await page.getByRole('alertdialog').getByRole('button', { name: 'Giữ lại' }).click()
  134 |     await expect(album.getByLabel('Ghi chú lần chụp')).toHaveValue('Bản nháp giữ lại')
  135 |     await page.keyboard.press('Escape')
  136 |     await expect(page.getByRole('alertdialog')).toBeVisible()
  137 |     await page.getByRole('alertdialog').getByRole('button', { name: 'Giữ lại' }).click()
  138 |     await album.getByRole('button', { name: 'Hủy nhập ảnh' }).click()
  139 |     await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  140 |     await album.getByRole('button', { name: 'Xóa ảnh skin.png', exact: true }).first().click()
  141 |     await page.getByRole('alertdialog').getByRole('button', { name: 'Giữ lại' }).click()
  142 |     await expect(album.locator('.skin-session .skin-thumbnail')).toHaveCount(3)
  143 |     await album.getByRole('button', { name: 'Xóa ảnh skin.png', exact: true }).first().click()
  144 |     await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  145 |     await expect(album.locator('.skin-session .skin-thumbnail')).toHaveCount(2)
  146 |     await album.getByRole('button', { name: 'Xóa lần chụp', exact: true }).click()
  147 |     await page.getByRole('alertdialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  148 |     await expect(album.getByText('Chưa có lần chụp nào.')).toBeVisible()
  149 |     await page.setViewportSize({ width: viewport.height, height: viewport.width })
  150 |     expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  151 |     expect(errors).toEqual([])
  152 |     await page.screenshot({ path: `test-results/rosa-detail-${viewport.width}.png`, fullPage: true })
  153 |   })
  154 | }
```