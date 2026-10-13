import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordInvoiceSessions } from './invoiceTreatments'
import { assignTreatmentStaffs, executeTreatment, getResource, listResource } from '../api/resources'

vi.mock('../api/resources', () => ({ assignTreatmentStaffs: vi.fn(), executeTreatment: vi.fn(), getResource: vi.fn(), listResource: vi.fn() }))

describe('ghi nhận dịch vụ sau khi hóa đơn đã lưu', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    listResource.mockResolvedValue({ data: [{ id: 9, product_id: 3 }], totalPages: 1 })
    getResource.mockResolvedValue({ remaining_sessions: 2, histories: [] })
    executeTreatment.mockResolvedValue({ treatmentHistoryId: 77 })
  })

  it('không gọi liệu trình nếu không tick', async () => {
    await recordInvoiceSessions(12, [{ product_id: 3, is_product: 0 }])
    expect(listResource).not.toHaveBeenCalled()
  })

  it('lấy thẻ theo invoiceId, thực hiện và gán nhân viên bằng historyId', async () => {
    await recordInvoiceSessions(12, [{ product_id: 3, product_name: 'Dịch vụ', is_product: 0, performNow: true, performStaffs: [{ staff_id: 2 }] }], 1)
    expect(listResource).toHaveBeenCalledWith('treatments', { invoiceId: 12 }, 1, 100)
    expect(executeTreatment).toHaveBeenCalledWith({ treatment_id: 9, branch_id: 1, staffs: [] })
    expect(assignTreatmentStaffs).toHaveBeenCalledWith(77, [{ staff_id: 2 }])
  })

  it('không thực hiện lần nữa nếu thẻ đã có lịch sử', async () => {
    getResource.mockResolvedValue({ remaining_sessions: 2, histories: [{ id: 77 }] })
    await expect(recordInvoiceSessions(12, [{ product_id: 3, product_name: 'Dịch vụ', is_product: 0, performNow: true }])).rejects.toThrow('đã có lịch sử')
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it('báo đã lưu buổi nếu bước gán nhân viên thất bại', async () => {
    assignTreatmentStaffs.mockRejectedValue(new Error('Mất mạng'))
    await expect(recordInvoiceSessions(12, [{ product_id: 3, product_name: 'Dịch vụ', is_product: 0, performNow: true, performStaffs: [{ staff_id: 2 }] }])).rejects.toThrow('buổi #77 đã lưu')
    expect(executeTreatment).toHaveBeenCalledTimes(1)
  })
})