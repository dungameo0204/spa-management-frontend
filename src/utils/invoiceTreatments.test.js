import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordInvoiceSessions } from './invoiceTreatments'
import { invoiceLineFromApi } from './invoice'
import { assignTreatmentStaffs, executeTreatment, getResource } from '../api/resources'

vi.mock('../api/resources', () => ({ assignTreatmentStaffs: vi.fn(), executeTreatment: vi.fn(), getResource: vi.fn() }))

describe('ghi nhận dịch vụ bằng mapping response tạo hóa đơn', () => {
  const line = { product_id: 3, product_name: 'Dịch vụ', is_product: 0, performNow: true }
  const mappings = [{ request_index: 0, invoice_item_id: 31, treatment_id: 41 }]
  beforeEach(() => {
    vi.resetAllMocks()
    getResource.mockResolvedValue({ remaining_sessions: 2, histories: [] })
    executeTreatment.mockResolvedValue({ treatmentHistoryId: 77 })
  })

  it('không gọi thẻ nếu không chọn làm ngay', async () => {
    expect(await recordInvoiceSessions(12, [{ ...line, performNow: false }], 1, mappings)).toEqual([])
    expect(getResource).not.toHaveBeenCalled()
  })

  it('không thực hiện thẻ cha có dịch vụ con kể cả khi còn cờ làm ngay', async () => {
    await recordInvoiceSessions(12, [{ ...line, serviceChildren: [{ product_id: 12, total_sessions: null }] }], 1, mappings)
    expect(executeTreatment).not.toHaveBeenCalled()
    expect(getResource).not.toHaveBeenCalled()
  })

  it('dùng treatment_id và gán nhân viên bằng historyId', async () => {
    await recordInvoiceSessions(12, [{ ...line, performStaffs: [{ staff_id: 2 }] }], 1, mappings)
    expect(getResource).toHaveBeenCalledWith('treatments', 41)
    expect(executeTreatment).toHaveBeenCalledWith({ treatment_id: 41, branch_id: 1, staffs: [] })
    expect(assignTreatmentStaffs).toHaveBeenCalledWith(77, [{ staff_id: 2 }])
  })

  it('hai dòng giống hệt nhau dùng request_index dù mapping đảo thứ tự', async () => {
    await recordInvoiceSessions(12, [line, line], 1, [{ request_index: 1, invoice_item_id: 32, treatment_id: 42 }, ...mappings])
    expect(executeTreatment.mock.calls.map(([body]) => body.treatment_id)).toEqual([41, 42])
  })

  it('giữ chỉ số gốc khi có hàng hóa và dòng chưa làm xen kẽ', async () => {
    await recordInvoiceSessions(12, [{ ...line, is_product: 1 }, { ...line, performNow: false }, line], undefined, [
      { request_index: 2, invoice_item_id: 33, treatment_id: 43 },
      { request_index: 0, invoice_item_id: 31, treatment_id: null },
      { request_index: 1, invoice_item_id: 32, treatment_id: 42 },
    ])
    expect(executeTreatment).toHaveBeenCalledExactlyOnceWith({ treatment_id: 43, staffs: [] })
  })

  it('không execute dòng không sinh thẻ', async () => {
    expect(await recordInvoiceSessions(12, [line], 1, [{ ...mappings[0], treatment_id: null }])).toEqual([])
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it.each([undefined, [], [mappings[0], mappings[0]], [{ ...mappings[0], treatment_id: 0 }]])('không đoán thẻ khi mapping thiếu hoặc không hợp lệ: %j', async mapping => {
    expect(await recordInvoiceSessions(12, [line], 1, mapping)).toEqual(['Dịch vụ'])
    expect(executeTreatment).not.toHaveBeenCalled()
    expect(getResource).not.toHaveBeenCalled()
  })

  it('không thực hiện lại thẻ đã có lịch sử', async () => {
    getResource.mockResolvedValue({ remaining_sessions: 2, histories: [{ id: 77 }] })
    await expect(recordInvoiceSessions(12, [line], 1, mappings)).rejects.toThrow('đã có lịch sử')
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it('lỗi execute không tự thử lại hoặc thực hiện dòng tiếp theo', async () => {
    executeTreatment.mockRejectedValue(new Error('Mất mạng'))
    await expect(recordInvoiceSessions(12, [line, line], 1, [...mappings, { request_index: 1, invoice_item_id: 32, treatment_id: 42 }])).rejects.toThrow('Kiểm tra lịch sử thẻ')
    expect(executeTreatment).toHaveBeenCalledTimes(1)
  })

  it('báo buổi đã lưu nếu bước gán nhân viên thất bại', async () => {
    assignTreatmentStaffs.mockRejectedValue(new Error('Mất mạng'))
    await expect(recordInvoiceSessions(12, [{ ...line, performStaffs: [{ staff_id: 2 }] }], 1, mappings)).rejects.toThrow('buổi #77 đã lưu')
    expect(executeTreatment).toHaveBeenCalledTimes(1)
  })

  it('giữ ID dòng bán khi chuyển API sang form', () => {
    expect(invoiceLineFromApi({ id: 31, product_id: 3, snapshot_name: 'Sẹo', snapshot_price: '900000', quantity: 3 })).toMatchObject({ invoice_item_id: 31, product_id: 3, unit_price: '900000', quantity: 3 })
  })

  it('thực hiện con lifetime theo ID thật, không thực hiện cha, gửi ghi chú/chữ ký và nhân viên cùng buổi', async () => {
    const group = { ...line, sessionNote: ' Da đỏ ', sessionSignature: '<svg/>', serviceChildren: [{ product_id: 12, total_sessions: null, performNow: true, performStaffs: [{ staff_id: 2 }] }, { product_id: 15, total_sessions: 5, performNow: false }] }
    getResource.mockResolvedValue({ id: 52, product_id: 12, parent_treatment_id: 41, remaining_sessions: null, histories: [] })
    await recordInvoiceSessions(12, [group], 1, [{ ...mappings[0], children: [{ id: 53, product_id: 15 }, { id: 52, product_id: 12 }] }])
    expect(executeTreatment).toHaveBeenCalledExactlyOnceWith({ treatment_id: 52, branch_id: 1, staffs: [{ staff_id: 2 }], note: 'Da đỏ', customer_signature_svg: '<svg/>' })
    expect(assignTreatmentStaffs).not.toHaveBeenCalled()
  })

  it('hai gói cùng con dùng mapping theo dòng, không trộn ID', async () => {
    const group = { ...line, serviceChildren: [{ product_id: 12, total_sessions: 5, performNow: true }] }
    getResource.mockImplementation(async (_, id) => ({ id, parent_treatment_id: id === 52 ? 41 : 42, product_id: 12, remaining_sessions: 5, histories: [] }))
    await recordInvoiceSessions(12, [group, group], 1, [{ request_index: 1, treatment_id: 42, children: [{ id: 62, product_id: 12 }] }, { ...mappings[0], children: [{ id: 52, product_id: 12 }] }])
    expect(executeTreatment.mock.calls.map(([body]) => body.treatment_id)).toEqual([52, 62])
  })

  it.each([{ children: [] }, { children: [{ id: 52, product_id: 15 }] }, { children: [{ id: 52, product_id: 12 }, { id: 53, product_id: 12 }] }, { children: {} }])('không đoán mapping con khi thiếu hoặc trùng: %j', async ({ children }) => {
    const group = { ...line, serviceChildren: [{ product_id: 12, performNow: true }] }
    expect(await recordInvoiceSessions(12, [group], 1, [{ ...mappings[0], children }])).toHaveLength(1)
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it('lỗi buổi con không retry, không thực hiện con tiếp theo', async () => {
    getResource.mockResolvedValue({ product_id: 12, parent_treatment_id: 41, remaining_sessions: 5, histories: [] })
    executeTreatment.mockRejectedValue(new Error('Mất mạng'))
    await expect(recordInvoiceSessions(12, [{ ...line, serviceChildren: [{ product_id: 12, performNow: true }, { product_id: 15, performNow: true }] }], 1, [{ ...mappings[0], children: [{ id: 52, product_id: 12 }, { id: 53, product_id: 15 }] }])).rejects.toThrow('Kiểm tra lịch sử thẻ')
    expect(executeTreatment).toHaveBeenCalledTimes(1)
  })
})