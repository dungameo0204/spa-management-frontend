import { afterEach, expect, it, vi } from 'vitest'
import { createLegacyDebtPayment } from './resources'

afterEach(() => vi.unstubAllGlobals())

it('posts legacy debt to the dedicated endpoint without adding invoice data', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { id: 5 } }) }))
  const body = { customer_id: 123, amount: 200000, collection_branch_id: 2, payment_method: 'CARD', note: 'Thu nợ cũ' }
  await expect(createLegacyDebtPayment(body)).resolves.toEqual({ data: { id: 5 } })
  const [url, options] = fetch.mock.calls[0]
  expect(url.pathname).toBe('/api/debt-payments/legacy')
  expect(options.method).toBe('POST')
  expect(JSON.parse(options.body)).toEqual(body)
  expect(JSON.parse(options.body)).not.toHaveProperty('invoice_id')
})