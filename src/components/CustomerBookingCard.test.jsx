import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import CustomerBookingCard from './CustomerBookingCard'

it('uses medium visual hierarchy instead of strong markup for time, service and note labels', () => {
  render(<CustomerBookingCard booking={{ id: 1, customer_name: 'Lan', customer_phone: '0901', arrival_time: '09:30:00', product_name: 'Laser', branch_name: 'ROSA', promotion_note: 'Ưu đãi tháng này', note: 'Gọi trước' }} writable={false} onOpen={vi.fn()} />)
  expect(screen.getByText('Lan').tagName).toBe('BUTTON')
  expect(screen.getByText('09:30').tagName).toBe('SPAN')
  expect(screen.getByText('Laser').tagName).toBe('SPAN')
  expect(screen.getByText('Nhu cầu / ưu đãi:')).toHaveClass('booking-note-label')
  expect(screen.getByText('Ghi chú cho nhân viên:')).toHaveClass('booking-note-label')
})

it('shows consultation value above the branch for managers and hides the branch for staff', () => {
  const booking = { id: 1, customer_name: 'Lan', customer_phone: '0901', arrival_time: '09:30:00', branch_name: 'ROSA', consultation_total: 3000000 }
  const { container, rerender } = render(<CustomerBookingCard booking={booking} writable={false} showBranch onOpen={vi.fn()} />)
  const meta = container.querySelector('.booking-card-meta')
  expect(meta.children[0]).toHaveClass('booking-consultation')
  expect(meta).toHaveTextContent('3.000.000')
  expect(meta.children[1]).toHaveTextContent('ROSA')
  expect(container.querySelectorAll('svg')).toHaveLength(2)
  rerender(<CustomerBookingCard booking={booking} writable={false} showBranch={false} onOpen={vi.fn()} />)
  expect(container.querySelector('.booking-card-meta')).not.toHaveTextContent('ROSA')
})