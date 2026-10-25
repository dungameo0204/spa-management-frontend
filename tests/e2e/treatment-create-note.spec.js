import { test, expect } from './fixtures'

test('ô ghi chú tạo thẻ liệu trình đồng bộ với các ô nhập khác', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })))
  // Match only API paths; **/api/** also captures Vite's /src/api/*.js modules.
  await page.route('**/api/**', route => new URL(route.request().url()).pathname.startsWith('/api/') ? route.fulfill({ json: { data: [], total: 0 } }) : route.continue())
  await page.goto('/treatments')
  await expect(page.getByRole('heading', { name: 'Thẻ liệu trình' })).toBeVisible()
  await page.getByRole('button', { name: 'Tạo thẻ', exact: true }).click()

  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 844 })
      const drawer = page.getByRole('dialog', { name: 'Tạo thẻ liệu trình' })
      const note = drawer.getByRole('textbox', { name: 'Ghi chú' })
      await expect(note).toBeVisible()
      const layout = await drawer.evaluate(element => {
        const input = element.querySelector('input[type="number"]')
        const textarea = element.querySelector('textarea')
        const inputStyle = getComputedStyle(input), noteStyle = getComputedStyle(textarea)
        const box = textarea.getBoundingClientRect(), parent = textarea.closest('.field').getBoundingClientRect()
        return {
          sameBorder: noteStyle.borderWidth === inputStyle.borderWidth && noteStyle.borderStyle === inputStyle.borderStyle,
          sameRadius: noteStyle.borderRadius === inputStyle.borderRadius,
          backgrounds: [noteStyle.backgroundColor, inputStyle.backgroundColor],
          samePadding: noteStyle.paddingLeft === inputStyle.paddingLeft,
          fullWidth: Math.abs(box.width - parent.width) < 1,
          contained: box.right <= innerWidth,
        }
      })
      expect(layout.sameBorder && layout.sameRadius && layout.samePadding && layout.fullWidth && layout.contained).toBe(true)
      expect(layout.backgrounds[0]).toBe(layout.backgrounds[1])
      await note.fill('Ghi chú kiểm tra')
      await expect(note).toHaveValue('Ghi chú kiểm tra')
    }
  }
})