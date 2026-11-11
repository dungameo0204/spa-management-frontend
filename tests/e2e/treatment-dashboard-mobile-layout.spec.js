import { test, expect } from './fixtures'

test('mobile dashboard renders grouped and standalone treatments in the compact Xuly card layout', async ({ page }, testInfo) => {
  const day = '2026-11-10'
  const group = {
    id: 10,
    customer_name: 'Đào Thu Hà 2523',
    product_name: 'Liệu Trình Điều Trị Nám',
    branch_id: 1,
    histories: [{ id: 50, execution_date: day, branch_id: 1, note: 'Theo dõi phản ứng da', children: [{ id: 51, treatment_id: 11, execution_date: day, branch_id: 1, staffs: [] }] }],
    children: [{ id: 11, customer_name: 'Đào Thu Hà 2523', product_name: 'meso tranexamic', histories: [] }, { id: 12, customer_name: 'Đào Thu Hà 2523', product_name: 'laser sắc tố', histories: [] }],
  }
  const standalone = { id: 20, customer_name: 'Tạ Thị Tố Uyên 2049', product_name: 'Phục Hồi PRP ( Buổi )', branch_id: 1, histories: [{ id: 60, execution_date: day, branch_id: 1, staffs: [] }] }

  await page.setViewportSize({ width: 393, height: 852 })
  await page.clock.setFixedTime(new Date('2026-11-10T12:00:00+07:00'))
  await page.addInitScript(user => localStorage.setItem('xuly.session', JSON.stringify({ token: 'mobile-layout', user })), { id: 1, branch_id: 1, system_role: 'MANAGER', fullname: 'Quản lý' })
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/treatments') return route.fulfill({ json: { data: [group, standalone], total: 2, totalPages: 1 } })
    if (path === '/api/roles') return route.fulfill({ json: { data: [] } })
    if (path === '/api/staffs') return route.fulfill({ json: { data: [] } })
    if (path === '/api/reports/revenue') return route.fulfill({ json: {} })
    return route.fulfill({ json: { data: [], total: 0, totalPages: 1 } })
  })

  await page.goto('/')
  const treatments = page.locator('.today-treatments')
  await expect(treatments.getByText('Đào Thu Hà 2523')).toBeVisible()
  await expect(treatments.getByText('Tạ Thị Tố Uyên 2049')).toBeVisible()
  await expect(treatments.getByText('Chữ ký khách hàng')).toHaveCount(0)
  await expect(treatments.getByText('Khách hàng', { exact: true })).toHaveCount(0)

  const layout = await treatments.evaluate(element => {
    const groupRow = element.querySelector('.today-treatment-group')
    const childRow = element.querySelector('.today-treatment-child')
    const standaloneRow = element.querySelector('.today-treatment-standalone')
    const group = groupRow.getBoundingClientRect(), child = childRow.getBoundingClientRect(), standalone = standaloneRow.getBoundingClientRect()
    const groupStyle = getComputedStyle(groupRow), childStyle = getComputedStyle(childRow), standaloneStyle = getComputedStyle(standaloneRow)
    const checkbox = standaloneRow.querySelector('input[type="checkbox"]').getBoundingClientRect()
    return {
      fits: document.documentElement.scrollWidth <= innerWidth,
      groupBackground: groupStyle.backgroundColor,
      childBackground: childStyle.backgroundColor,
      standaloneBackground: standaloneStyle.backgroundColor,
      childBelowGroup: child.top >= group.bottom - 1,
      standaloneCheckboxAtRight: checkbox.right >= standalone.right - 22 && checkbox.top <= standalone.top + 38,
    }
  })
  expect(layout.fits).toBe(true)
  expect(layout.groupBackground).not.toBe(layout.childBackground)
  expect(layout.standaloneBackground).toBe(layout.groupBackground)
  expect(layout.childBelowGroup).toBe(true)
  expect(layout.standaloneCheckboxAtRight).toBe(true)
  await treatments.screenshot({ path: testInfo.outputPath('today-treatments-mobile-393.png') })
})