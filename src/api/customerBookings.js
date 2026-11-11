import { request, normalizePagedResponse } from './client'
import { compareBookings } from '../utils/customerBookings'

const path = '/api/customer-bookings'

// Sort the complete filtered set, not just one server page: unknown times must
// remain last within each day even when the API paginates NULL times first.
export async function listCustomerBookings(filters, signal) {
  const load = page => request(path, { query: { ...filters, page, pageSize: 100 }, signal }).then(result => normalizePagedResponse(result, page, 100))
  const first = await load(1)
  const data = [...first.data]
  for (let page = 2; page <= first.totalPages; page += 4) {
    const pages = await Promise.all(Array.from({ length: Math.min(4, first.totalPages - page + 1) }, (_, offset) => load(page + offset)))
    pages.forEach(result => data.push(...result.data))
  }
  return [...new Map(data.map(item => [item.id, item])).values()].sort(compareBookings)
}

export const getCustomerBooking = (id, signal) => request(`${path}/${encodeURIComponent(id)}`, { signal }).then(result => result.data)
export const createCustomerBooking = body => request(path, { method: 'POST', body })
export const updateCustomerBooking = (id, body) => request(`${path}/${encodeURIComponent(id)}`, { method: 'PUT', body })
export const deleteCustomerBooking = id => request(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' })