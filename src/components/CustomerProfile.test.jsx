import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import CustomerProfile from './CustomerProfile'

it('uses the treatment-service label in the customer profile', () => {
  render(<CustomerProfile customer={{ consultation_note: 'Laser nám' }} onPrint={() => {}} onShare={() => {}} />)

  expect(screen.getByText('Dịch vụ điều trị')).toBeInTheDocument()
  expect(screen.queryByText('Nội dung tư vấn')).not.toBeInTheDocument()
  expect(screen.getByText('Laser nám')).toBeInTheDocument()
})