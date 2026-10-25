import { test as base, expect } from '@playwright/test'

// Existing business-flow tests use fake tokens. Model the new identity endpoint
// separately so their broad API mocks do not accidentally return an empty user.
export function mockSessionEndpoint(page) {
  const register = page.route.bind(page)
  page.route = (url, handler, options) => register(url, async (route, request) => {
      if (new URL(request.url()).pathname === '/api/auth/me') {
        const session = await page.evaluate(() => JSON.parse(localStorage.getItem('xuly.session') || sessionStorage.getItem('xuly.session') || 'null'))
        return route.fulfill({ json: { data: { user: session?.user, tenant: null, expires_at: null } } })
      }
      return handler(route, request)
  }, options)
}
export const test = base.extend({
  page: async ({ page }, use) => {
    mockSessionEndpoint(page)
    await use(page)
  },
})
export { expect }