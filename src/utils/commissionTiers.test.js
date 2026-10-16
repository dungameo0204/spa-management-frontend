import { expect, it } from 'vitest'
import { serializeCommissionTiers, validateCommissionTiers } from './commissionTiers'
import { validateTreatmentDraft } from './validation'

const percent = (min_price = 0, max_price = null, role_id = 2) => ({ role_id, min_price, max_price, calculation_type: 'PERCENT', percent: 10 })
it('accepts one tier, adjacent tiers, and independent roles with numeric strings', () => {
  for (const tiers of [[], [percent()], [percent('0', '1000000'), { role_id: 2, min_price: '1000000', max_price: null, calculation_type: 'FIXED', fixed_amount: '100000' }, percent(0, null, 3)]]) expect(validateCommissionTiers(tiers)).toBe('')
})
it('rejects overlaps including an unbounded intermediate tier', () => {
  expect(validateCommissionTiers([percent(0, 100), percent(99)])).toMatch(/chồng lấn/)
  expect(validateCommissionTiers([percent(), percent(100)])).toMatch(/chồng lấn/)
})
it('rejects gaps at the start, middle and end', () => {
  for (const tiers of [[percent(1)], [percent(0, 100), percent(101)], [percent(0, 100)]]) expect(validateCommissionTiers(tiers)).toMatch(/trống/)
})
it('rejects empty, invalid, negative and reversed fields', () => {
  for (const patch of [{ min_price: '' }, { min_price: -1 }, { max_price: 0 }, { percent: '' }, { percent: 101 }, { percent: -1 }, { role_id: 0 }, { calculation_type: 'OTHER' }, { calculation_type: 'FIXED', fixed_amount: -1 }]) expect(validateCommissionTiers([{ ...percent(), ...patch }])).toBeTruthy()
})
it('serializes only API tier fields and preserves invalid empty values for validation', () => {
  expect(serializeCommissionTiers([{ ...percent('0', ''), id: 3, fixed_amount: 99 }])).toEqual([{ role_id: 2, min_price: 0, max_price: null, calculation_type: 'PERCENT', percent: 10 }])
  expect(validateCommissionTiers(serializeCommissionTiers([{ ...percent(), min_price: '' }]))).toBeTruthy()
})
it('validates manual treatment price, units and sessions, including zero price', () => {
  const draft = { customer_id: 1, product_id: 2, total_sessions: 1, commission_base_price: 0, commission_quantity: 1 }
  expect(validateTreatmentDraft(draft)).toBe('')
  for (const patch of [{ customer_id: '' }, { product_id: '' }, { total_sessions: 0 }, { total_sessions: 1.5 }, { commission_base_price: '' }, { commission_base_price: -1 }, { commission_base_price: Infinity }, { commission_quantity: 0 }, { commission_quantity: 1.5 }]) expect(validateTreatmentDraft({ ...draft, ...patch })).toBeTruthy()
})