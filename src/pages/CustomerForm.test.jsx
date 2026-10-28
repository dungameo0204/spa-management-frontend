import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ResourcePage from './ResourcePage'
import { createResource, getCustomerOverview, listResource, updateResource } from '../api/resources'

vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 1, system_role: 'MANAGER' } }) }))
vi.mock('../components/AppShell', () => ({ useBranch: () => ({ branchId: null }) }))
vi.mock('../api/resources', () => ({
  listResource: vi.fn(), getResource: vi.fn(), getCustomerOverview: vi.fn(),
  createResource: vi.fn(), updateResource: vi.fn(), deleteResource: vi.fn(), restoreResource: vi.fn(), getReportDetails: vi.fn(),
  executeTreatment: vi.fn(), assignTreatmentStaffs: vi.fn(),
}))

const customer = { id: 20, fullname: 'Lan', phone_number: '0900000000', wallet_balance: 100, total_debt: 20 }
beforeEach(() => {
  vi.resetAllMocks()
  listResource.mockImplementation(async resource => ({ data: resource === 'customers' ? [customer] : [], totalPages: 1 }))
  getCustomerOverview.mockResolvedValue({ customer, timeline: [] })
  createResource.mockResolvedValue({})
  updateResource.mockResolvedValue({})
})
afterEach(cleanup)

function show() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ResourcePage resource="customers" /></QueryClientProvider>)
  return userEvent.setup()
}

async function createForm(actor) {
  await actor.click(screen.getByRole('button', { name: 'Thêm mới' }))
  const form = screen.getByRole('button', { name: 'Lưu thay đổi' }).closest('form')
  await actor.type(within(form).getByLabelText(/^Họ tên/), 'Khách mới')
  await actor.type(within(form).getByLabelText(/^Số điện thoại/), '0912345678')
  return within(form)
}

it('creates a customer with multiple skin types, referrals, multiline notes and history', async () => {
  const actor = show()
  const form = await createForm(actor)
  await actor.type(form.getByLabelText('Mã hồ sơ'), 'ROSA-123')
  await actor.selectOptions(form.getByLabelText('Giới tính'), 'FEMALE')
  fireEvent.change(form.getByLabelText('Ngày lập hồ sơ'), { target: { value: '2026-10-27' } })
  await actor.click(form.getByLabelText('Da khô'))
  await actor.click(form.getByLabelText('Da nhạy cảm, tổn thương'))
  await actor.click(form.getByLabelText('TikTok'))
  await actor.click(form.getByLabelText('Bạn bè giới thiệu'))
  await actor.click(form.getByText('Khai thác tiền sử'))
  await actor.type(form.getByLabelText('Điều trị da trước đây'), 'Đã chăm sóc da')
  await actor.type(form.getByLabelText('Nội dung tư vấn'), 'Phục hồi da\nChống nắng')
  await actor.type(form.getByLabelText('Ghi chú khách hàng'), 'Dòng một\nDòng hai')
  await actor.click(form.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(createResource).toHaveBeenCalledWith('customers', {
    fullname: 'Khách mới', phone_number: '0912345678', profile_code: 'ROSA-123', gender: 'FEMALE', profile_date: '2026-10-27',
    skin_types: ['DRY', 'SENSITIVE_DAMAGED'], referral_sources: ['TIKTOK', 'FRIEND'], previous_skin_treatments: 'Đã chăm sóc da', consultation_note: 'Phục hồi da\nChống nắng', note: 'Dòng một\nDòng hai',
  }))
}, 15000)

it('loads full profile before editing and sends only the edited basic field', async () => {
  let resolveOverview
  getCustomerOverview.mockImplementation(() => new Promise(resolve => { resolveOverview = resolve }))
  const actor = show()
  await actor.click(await screen.findByRole('button', { name: 'Xem Lan' }))
  expect(screen.getByRole('button', { name: 'Sửa' })).toBeDisabled()
  resolveOverview({ customer: { ...customer, profile_code: 'ROSA-20', profile_date: '2026-10-27', skin_types: ['DRY', 'AGING'], referral_sources: ['FACEBOOK'], pregnancy_and_medical_history: 'Không có', consultation_note: 'Tư vấn cũ' }, timeline: [] })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Sửa' })).toBeEnabled())
  await actor.click(screen.getByRole('button', { name: 'Sửa' }))
  expect(screen.getByLabelText('Mã hồ sơ')).toHaveValue('ROSA-20')
  expect(screen.getByLabelText('Da khô')).toBeChecked()
  expect(screen.getByLabelText('Da lão hóa')).toBeChecked()
  expect(screen.getByLabelText('Facebook')).toBeChecked()
  expect(screen.getByLabelText('Nội dung tư vấn')).toHaveValue('Tư vấn cũ')
  await actor.click(screen.getByText('Khai thác tiền sử'))
  expect(screen.getByLabelText('Thai kỳ và tiền sử bệnh lý')).toHaveValue('Không có')
  await actor.type(screen.getByLabelText(/^Họ tên/), ' mới')
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(updateResource).toHaveBeenCalledWith('customers', 20, { fullname: 'Lan mới' }))
})

it('supports clearing arrays, resetting unknown and removing optional values on edit', async () => {
  getCustomerOverview.mockResolvedValue({ customer: { ...customer, skin_types: ['DRY'], referral_sources: ['FRIEND'], profile_date: '2026-10-27', consultation_note: 'Tư vấn' }, timeline: [] })
  const actor = show()
  await actor.click(await screen.findByRole('button', { name: 'Xem Lan' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Sửa' })).toBeEnabled())
  await actor.click(screen.getByRole('button', { name: 'Sửa' }))
  await actor.click(screen.getByLabelText('Da khô'))
  await actor.click(within(screen.getByRole('group', { name: 'Nguồn giới thiệu' })).getByRole('button', { name: 'Đặt lại chưa ghi nhận' }))
  fireEvent.change(screen.getByLabelText('Ngày lập hồ sơ'), { target: { value: '' } })
  await actor.clear(screen.getByLabelText('Nội dung tư vấn'))
  await actor.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
  await waitFor(() => expect(updateResource).toHaveBeenCalledWith('customers', 20, { skin_types: [], referral_sources: null, profile_date: null, consultation_note: null }))
})

it('keeps the form and entered values when backend rejects duplicate phone/profile code', async () => {
  createResource.mockRejectedValue(new Error('Mã hồ sơ đã tồn tại'))
  const actor = show()
  const form = await createForm(actor)
  await actor.type(form.getByLabelText('Mã hồ sơ'), 'ROSA-123')
  await actor.click(form.getByRole('button', { name: 'Lưu thay đổi' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Mã hồ sơ đã tồn tại')
  expect(form.getByLabelText('Mã hồ sơ')).toHaveValue('ROSA-123')
})

it('does not allow editing a profile when full detail failed to load', async () => {
  getCustomerOverview.mockRejectedValue(new Error('Không tải được hồ sơ'))
  const actor = show()
  await actor.click(await screen.findByRole('button', { name: 'Xem Lan' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được hồ sơ')
  expect(screen.getByRole('button', { name: 'Sửa' })).toBeDisabled()
  expect(updateResource).not.toHaveBeenCalled()
})

it('asks before discarding a customer draft and preserves it when cancelled', async () => {
  const actor = show()
  await actor.click(screen.getByRole('button', { name: 'Thêm mới' }))
  await actor.type(screen.getByLabelText(/^Họ tên/), 'Bản nháp')
  await actor.click(screen.getByRole('button', { name: 'Hủy', exact: true }))
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Bỏ thay đổi chưa lưu?')
  await actor.click(screen.getByRole('button', { name: 'Giữ lại' }))
  expect(screen.getByLabelText(/^Họ tên/)).toHaveValue('Bản nháp')
  await actor.click(screen.getByRole('button', { name: 'Hủy', exact: true }))
  await actor.click(screen.getByRole('button', { name: 'Xác nhận', exact: true }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(createResource).not.toHaveBeenCalled()
})

it('closes an unchanged new form without a discard prompt', async () => {
  const actor = show()
  await actor.click(screen.getByRole('button', { name: 'Thêm mới' }))
  await actor.click(screen.getByRole('button', { name: 'Hủy', exact: true }))
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})