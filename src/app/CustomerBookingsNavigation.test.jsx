import { expect, it } from 'vitest'
import { routes } from './routes'
import { canAccess } from '../auth/permissions'
import { paths } from '../api/resources'

it('ưu tiên Khách đặt lịch và giữ Lịch hẹn trong menu vận hành', () => {
  expect(routes.find(route => route.path === '/customer-bookings')).toMatchObject({ label: 'Khách đặt lịch', group: 'main', permission: 'bookings.manage' })
  expect(routes.find(route => route.path === '/appointments')).toMatchObject({ label: 'Lịch hẹn', group: 'operations' })
  expect(paths.bookings).toBe('/api/customer-bookings')
  expect(paths.appointments).toBe('/api/appointments')
})

it.each(['STAFF', 'MANAGER'])('cho phép %s quản lý lịch đặt', system_role => {
  expect(canAccess({ system_role }, 'bookings.manage')).toBe(true)
})

it('không cho khách tự truy cập chức năng nội bộ', () => {
  expect(canAccess({ system_role: 'CUSTOMER' }, 'bookings.manage')).toBe(false)
})