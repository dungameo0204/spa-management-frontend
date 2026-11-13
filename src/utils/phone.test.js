import { expect, it } from 'vitest'
import { digitsOnly, isDigitsOnly } from './phone'

it('keeps only ASCII digits in phone input values', () => {
  expect(digitsOnly(' 0901 abc-234.567 ')).toBe('0901234567')
  expect(digitsOnly(null)).toBe('')
  expect(isDigitsOnly('0901234567')).toBe(true)
  expect(isDigitsOnly('0901 234 567')).toBe(false)
  expect(isDigitsOnly('0901abc')).toBe(false)
})