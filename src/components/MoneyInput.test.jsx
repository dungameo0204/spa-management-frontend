import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import MoneyInput from './MoneyInput'

it('keeps Vietnamese thousands separators visible while typing', async () => {
  const onChange = vi.fn()
  function Example() {
    const [value, setValue] = useState('')
    return <MoneyInput aria-label="Số tiền" value={value} onChange={next => { setValue(next); onChange(next) }} />
  }
  render(<Example />)
  const input = screen.getByLabelText('Số tiền'), actor = userEvent.setup()
  await actor.click(input)
  await actor.type(input, '3000000')
  expect(input).toHaveValue('3.000.000')
  expect(onChange).toHaveBeenLastCalledWith('3000000')
  await actor.tab()
  expect(input).toHaveValue('3.000.000')
})

it('accepts separator-formatted paste as digits', async () => {
  const onChange = vi.fn()
  render(<MoneyInput aria-label="Số tiền" value="" onChange={onChange} />)
  const input = screen.getByLabelText('Số tiền')
  const actor = userEvent.setup()
  await actor.click(input)
  await actor.paste('3,000,000')
  expect(onChange).toHaveBeenLastCalledWith('3000000')
})

it('does not normalize an IME composition until composition ends', () => {
  const onChange = vi.fn()
  render(<MoneyInput aria-label="Số tiền" value="" onChange={onChange} />)
  const input = screen.getByLabelText('Số tiền')
  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '３' }, nativeEvent: { isComposing: true } })
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.compositionEnd(input, { target: { value: '3000000' } })
  expect(onChange).toHaveBeenLastCalledWith('3000000')
})