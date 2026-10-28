import { describe, expect, it } from 'vitest'
import { customerFields, prepareCustomerForm, validateCustomerForm } from './customerForm'

const basic = { fullname: 'Lan', phone_number: '0900000000' }
const currentDate = '2026-10-28'

describe('Rosa customer form payload', () => {
  it('only sends supported fields, trims text and preserves multiline text and real arrays', () => {
    expect(prepareCustomerForm({ ...basic, profile_code: ' ROSA-1 ', note: ' Dòng một\nDòng hai ', skin_types: ['DRY', 'AGING'], referral_sources: [], gender: '', wallet_balance: 50, total_debt: 10, tenant_id: 7, password: 'secret' })).toEqual({ ...basic, profile_code: 'ROSA-1', note: 'Dòng một\nDòng hai', skin_types: ['DRY', 'AGING'], referral_sources: [], gender: null })
  })
  it('does not send untouched optional fields when creating or editing legacy customers', () => {
    expect(prepareCustomerForm(basic)).toEqual(basic)
    expect(prepareCustomerForm({ ...basic, fullname: 'Tên mới' }, basic)).toEqual({ fullname: 'Tên mới' })
    expect(prepareCustomerForm({ ...basic, gender: '', note: '' }, { ...basic, gender: null, note: null })).toEqual({})
  })
  it('distinguishes clearing selections, resetting to unknown and removing text/date', () => {
    const original = { ...basic, skin_types: ['DRY'], referral_sources: [], profile_date: '2026-10-27', skin_assessment: 'Da khô' }
    expect(prepareCustomerForm({ ...original, skin_types: [], referral_sources: null, profile_date: '', skin_assessment: '' }, original)).toEqual({ skin_types: [], referral_sources: null, profile_date: null, skin_assessment: null })
    expect(prepareCustomerForm({ ...basic, skin_types: [] }, { ...basic, skin_types: null })).toEqual({ skin_types: [] })
  })
  it('can round-trip every supported Rosa field', () => {
    const draft = Object.fromEntries(customerFields.map(key => [key, ['skin_types', 'referral_sources'].includes(key) ? [] : 'value']))
    expect(Object.keys(prepareCustomerForm(draft)).sort()).toEqual([...customerFields].sort())
  })
})

describe('Rosa customer form validation', () => {
  it('requires a name and phone without imposing undocumented phone formats', () => {
    expect(validateCustomerForm(basic, currentDate)).toBe('')
    expect(validateCustomerForm({ ...basic, fullname: '  ' }, currentDate)).toMatch(/họ tên/)
    expect(validateCustomerForm({ ...basic, phone_number: '' }, currentDate)).toMatch(/số điện thoại/)
  })
  it('validates calendar dates without UTC conversion', () => {
    for (const profile_date of [undefined, null, '', '1000-01-01', '2000-02-29', currentDate]) expect(validateCustomerForm({ ...basic, profile_date }, currentDate)).toBe('')
    for (const profile_date of ['0999-01-01', '2026-10-29', '2026-02-30', '1900-02-29']) expect(validateCustomerForm({ ...basic, profile_date }, currentDate)).toMatch(/Ngày lập hồ sơ/)
    expect(validateCustomerForm({ ...basic, date_of_birth: '2026-10-29' }, currentDate)).toMatch(/Ngày sinh/)
  })
  it('rejects long profile codes and invalid enum/array values without coercing them', () => {
    expect(validateCustomerForm({ ...basic, profile_code: 'a'.repeat(51) }, currentDate)).toMatch(/50/)
    expect(validateCustomerForm({ ...basic, gender: 'female' }, currentDate)).toMatch(/Giới tính/)
    for (const skin_types of ['["DRY"]', ['dry'], ['UNKNOWN']]) expect(validateCustomerForm({ ...basic, skin_types }, currentDate)).toMatch(/Loại da/)
    expect(validateCustomerForm({ ...basic, referral_sources: ['UNKNOWN'] }, currentDate)).toMatch(/Nguồn giới thiệu/)
  })
  it('checks UTF-8 byte size rather than character count', () => {
    expect(validateCustomerForm({ ...basic, consultation_note: 'ế'.repeat(21845) }, currentDate)).toBe('')
    expect(validateCustomerForm({ ...basic, consultation_note: 'ế'.repeat(21846) }, currentDate)).toMatch(/65535 byte/)
  })
})