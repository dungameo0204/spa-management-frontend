import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import DateInput, { dateInputDisplay, dateInputValue } from './DateInput'

it('allows an empty optional date but rejects partial dates and empty required dates', () => {
  const { rerender } = render(<DateInput aria-label="Ngày" value="" onChange={vi.fn()} />)
  const input = screen.getByLabelText('Ngày')
  expect(input.checkValidity()).toBe(true)
  fireEvent.change(input, { target: { value: '15/09' } })
  expect(input.checkValidity()).toBe(false)
  fireEvent.change(input, { target: { value: '' } })
  expect(input.checkValidity()).toBe(true)
  rerender(<DateInput aria-label="Ngày" required value="" onChange={vi.fn()} />)
  expect(input.checkValidity()).toBe(false)
})

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

it('accepts an ISO date from autofill while displaying the Vietnamese date', () => {
  const onChange = vi.fn()
  render(<DateInput aria-label="Ngày" value="" onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Ngày'), { target: { value: '2026-10-27' } })
  expect(screen.getByLabelText('Ngày')).toHaveValue('27/10/2026')
  expect(onChange).toHaveBeenLastCalledWith('2026-10-27')
})

it('clears the entire optional date when all masked text is selected', async () => {
  const onChange = vi.fn(), actor = userEvent.setup()
  render(<DateInput aria-label="Ngày sinh" birthDate value="1995-08-21" onChange={onChange} />)
  const input = screen.getByLabelText('Ngày sinh')
  await actor.clear(input)
  expect(input).toHaveValue('dd/mm/yyyy')
  expect(onChange).toHaveBeenLastCalledWith('')
  expect(input.checkValidity()).toBe(true)
})

it('supports birth year and month-year while preserving omitted precision in the display', () => {
  expect(dateInputValue('1995', true)).toBe('1995-01-01')
  expect(dateInputValue('08/1995', true)).toBe('1995-08-01')
  expect(dateInputDisplay('1995-01-01', true)).toBe('1995')
  expect(dateInputDisplay('1995-08-01', true)).toBe('08/1995')
})