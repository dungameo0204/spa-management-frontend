# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: invoice-date-repair.spec.js >> manager edits the Vietnam invoice day without shifting it through UTC
- Location: tests\e2e\invoice-date-repair.spec.js:3:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByLabel('Ngày hóa đơn', { exact: true })
Expected: "2026-10-31"
Received: "31/10/2026"
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" getByLabel('Ngày hóa đơn', { exact: true }) with timeout 5000ms
  - waiting for getByLabel('Ngày hóa đơn', { exact: true })
    13 × locator resolved to <input id="_r_4_" type="text" max="2026-11-06" autocomplete="off" value="31/10/2026" inputmode="numeric" aria-expanded="false" aria-haspopup="dialog" aria-label="Ngày hóa đơn"/>
       - unexpected value "31/10/2026"

```

```yaml
- textbox "Ngày hóa đơn": 31/10/2026
```

# Test source

```ts
  1  | import { test, expect } from './fixtures'
  2  | 
  3  | test('manager edits the Vietnam invoice day without shifting it through UTC', async ({ page }) => {
  4  |   let saved
  5  |   let invoice = { id: 91, customer_id: 1, customer_name: 'Khách ngày bán', branch_id: 1, invoice_date: '2026-10-30T17:00:00.000Z', total_amount: 100000, paid_amount: 100000, wallet_used: 0, debt_amount: 0, items: [{ id: 10, product_id: 3, snapshot_name: 'Serum', snapshot_price: 100000, quantity: 1, final_price: 100000, is_product: 1, consultants: [] }] }
  6  |   await page.addInitScript(() => {
  7  |     sessionStorage.setItem('xuly.branch', '1')
  8  |     localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, system_role: 'MANAGER' } }))
  9  |   })
  10 |   await page.route('**/api/**', route => {
  11 |     const path = new URL(route.request().url()).pathname
  12 |     if (!path.startsWith('/api/')) return route.continue()
  13 |     if (path === '/api/invoices/91' && route.request().method() === 'PUT') {
  14 |       saved = route.request().postDataJSON()
  15 |       invoice = { ...invoice, invoice_date: saved.invoice_date }
  16 |       return route.fulfill({ json: { message: 'Đã lưu' } })
  17 |     }
  18 |     const data = path === '/api/invoices/91' ? invoice : path === '/api/invoices' ? [invoice]
  19 |       : path === '/api/customers/1' ? { id: 1, fullname: invoice.customer_name, wallet_balance: 0, total_debt: 0 }
  20 |         : path === '/api/branches' ? [{ id: 1, name: 'Cơ sở chính' }] : []
  21 |     return route.fulfill({ json: { data, total: Array.isArray(data) ? data.length : 1 } })
  22 |   })
  23 |   await page.goto('/invoices')
  24 |   await page.getByRole('row', { name: /Khách ngày bán/ }).click()
  25 |   await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  26 |   const date = page.getByLabel('Ngày hóa đơn', { exact: true })
> 27 |   await expect(date).toHaveValue('2026-10-31')
     |                      ^ Error: expect(locator).toHaveValue(expected) failed
  28 |   await date.fill('2026-10-29')
  29 |   await page.getByRole('button', { name: 'Lưu hóa đơn', exact: true }).click()
  30 |   await expect.poll(() => saved?.invoice_date).toBe('2026-10-29 00:00:00')
  31 | })
```