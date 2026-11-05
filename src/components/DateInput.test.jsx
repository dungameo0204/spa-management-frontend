import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import DateInput, { dateInputDisplay, dateInputValue } from './DateInput'

it('converts a complete Vietnamese date to its ISO API value without losing the day', () => {
  const onChange = vi.fn()
  render(<DateInput aria-label="Ngày hóa đơn" value="" onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Ngày hóa đơn'), { target: { value: '15/09/2026' } })
  expect(screen.getByLabelText('Ngày hóa đơn')).toHaveValue('15/09/2026')
  expect(onChange).toHaveBeenLastCalledWith('2026-09-15')
})

it('keeps the fixed Vietnamese mask visible while numbers are typed one by one', () => {
  const onChange = vi.fn()
  render(<DateInput aria-label="Ngày sinh" birthDate value="" onChange={onChange} />)
  const input = screen.getByLabelText('Ngày sinh')
  expect(input).toHaveValue('dd/mm/yyyy')
  input.focus()
  ;['2', '1', '0', '8', '1', '9', '9', '5'].forEach(key => fireEvent.keyDown(input, { key }))
  expect(input).toHaveValue('21/08/1995')
  expect(onChange).toHaveBeenLastCalledWith('1995-08-21')
})

it('keeps invalid calendar dates out of the API value', () => {
  expect(dateInputValue('31/02/2026')).toBeNull()
  expect(dateInputValue('15/09/2026')).toBe('2026-09-15')
})

it('supports birth year and month-year while preserving omitted precision in the display', () => {
  expect(dateInputValue('1995', true)).toBe('1995-01-01')
  expect(dateInputValue('08/1995', true)).toBe('1995-08-01')
  expect(dateInputDisplay('1995-01-01', true)).toBe('1995')
  expect(dateInputDisplay('1995-08-01', true)).toBe('08/1995')
})