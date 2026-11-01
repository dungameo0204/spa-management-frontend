import { beforeEach, expect, it, vi } from 'vitest'
import { request } from './client'
import { listCustomerBookings, createCustomerBooking, updateCustomerBooking, deleteCustomerBooking } from './customerBookings'

vi.mock('./client', async importOriginal => ({ ...await importOriginal(), request: vi.fn() }))
beforeEach(() => vi.clearAllMocks())

it('giữ booking NULL từ API, lấy đủ các trang rồi mới xếp giờ', async () => {
  request.mockImplementation(async (_path, options) => ({ total: 2, totalPages: 2, data: [{ id: options.query.page, arrival_date: '2026-11-01', arrival_time: options.query.page === 1 ? null : '07:00:00' }] }))
  const controller = new AbortController()
  const rows = await listCustomerBookings({ startTime: '07:00', endTime: '08:00' }, controller.signal)
  expect(rows.map(row => row.id)).toEqual([2, 1])
  expect(request).toHaveBeenCalledWith('/api/customer-bookings', { query: { startTime: '07:00', endTime: '08:00', page: 2, pageSize: 100 }, signal: controller.signal })
})

it('gửi đúng verb và payload CRUD', async () => {
  request.mockResolvedValue({})
  const body = { customer_type: 'NEW' }
  await createCustomerBooking(body); await updateCustomerBooking(7, body); await deleteCustomerBooking(7)
  expect(request.mock.calls).toEqual([
    ['/api/customer-bookings', { method: 'POST', body }],
    ['/api/customer-bookings/7', { method: 'PUT', body }],
    ['/api/customer-bookings/7', { method: 'DELETE' }],
  ])
})