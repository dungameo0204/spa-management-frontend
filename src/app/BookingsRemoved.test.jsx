import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import App from './App'
import { routes } from './routes'
import { canAccess } from '../auth/permissions'
import { listResource, paths } from '../api/resources'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

it('không còn Booking từ khách trong menu, vẫn giữ Lịch hẹn', () => {
  expect(routes.some(route => route.path === '/bookings' || route.label === 'Booking từ khách')).toBe(false)
  expect(routes.find(route => route.path === '/appointments')).toMatchObject({ label: 'Lịch hẹn' })
})

it('URL booking cũ hiển thị trang không tìm thấy thay vì mở ResourcePage', () => {
  window.history.replaceState({}, '', '/bookings')
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/')
})

it.each(['STAFF', 'MANAGER'])('không còn quyền booking cho %s', system_role => {
  expect(canAccess({ system_role }, 'bookings.view')).toBe(false)
})

it('loại bỏ tài nguyên booking nhưng giữ API lịch hẹn', () => {
  expect(paths).not.toHaveProperty('bookings')
  expect(() => listResource('bookings')).toThrow('Tài nguyên không hợp lệ')
  expect(paths.appointments).toBe('/api/appointments')
})