import { test, expect } from './fixtures'

for (const theme of ['light', 'dark']) {
  for (const width of [390, 960, 1440]) {
    test(`ROSA branding and action contrast ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.addInitScript(theme => localStorage.setItem('xuly.theme', theme), theme)
      await page.goto('/login')
      await expect(page).toHaveTitle('ROSA · Quản lý Spa')
      const logo = page.getByRole('img', { name: /ROSA Clinic/ })
      await expect(logo).toBeVisible()
      await expect.poll(() => logo.evaluate(img => img.complete && img.naturalWidth)).toBe(1280)
      await page.screenshot({ path: `test-results/rosa-login-${theme}-${width}.png`, fullPage: true })
      await page.evaluate(() => {
        localStorage.setItem('xuly.session', JSON.stringify({ token: 'test', user: { id: 1, fullname: 'ROSA Test', system_role: 'MANAGER' } }))
      })
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname
        if (!path.startsWith('/api/')) return route.continue()
        const data = path === '/api/treatments' ? [
          { id: 1, customer_id: 1, customer_name: 'ROSA Test', product_name: 'Chăm sóc da', total_sessions: 6, remaining_sessions: 4, histories: [] },
          { id: 2, customer_id: 1, customer_name: 'ROSA Test', product_name: 'Hoàn thành', total_sessions: 6, remaining_sessions: 0, histories: [] },
        ] : path === '/api/customers/1' ? { id: 1, fullname: 'ROSA Test', phone_number: '0901234567' } : []
        return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1, totalPages: 1 } })
      })
      await page.goto('/treatments')
      const badge = page.locator('.treatment-service-badge').first()
      await expect(badge).toBeVisible()
      const exportButton = page.getByRole('button', { name: 'Xuất Excel', exact: true }).first()
      await expect(exportButton).toBeEnabled()
      for (const control of [badge, exportButton]) {
        const contrast = await control.evaluate(el => {
          const style = getComputedStyle(el)
          const luminance = color => {
            const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
            return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
          }
          const a = luminance(style.color), b = luminance(style.backgroundColor)
          return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
        })
        expect(contrast).toBeGreaterThanOrEqual(4.5)
      }
      await badge.click()
      await expect(badge).toHaveAttribute('aria-expanded', 'true')
      await page.screenshot({ path: `test-results/rosa-treatments-${theme}-${width}.png`, fullPage: true })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.route('**/api/treatments?**', route => route.fulfill({ json: { data: [], total: 0, totalPages: 1 } }))
      await page.reload()
      await expect(exportButton).toBeDisabled()
    })
  }
}