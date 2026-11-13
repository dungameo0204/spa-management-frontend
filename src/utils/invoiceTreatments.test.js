import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordInvoiceSessions } from './invoiceTreatments'
import { invoiceLineFromApi } from './invoice'
import { assignTreatmentStaffs, executeTreatment, getResource, updateGroupedTreatmentExecution } from '../api/resources'

vi.mock('../api/resources', () => ({ assignTreatmentStaffs: vi.fn(), executeTreatment: vi.fn(), getResource: vi.fn(), updateGroupedTreatmentExecution: vi.fn() }))

describe('ghi nhận dịch vụ bằng mapping response tạo hóa đơn', () => {
  const line = { product_id: 3, product_name: 'Dịch vụ', is_product: 0, performNow: true }
  const mappings = [{ request_index: 0, invoice_item_id: 31, treatment_id: 41 }]
  const invoiceDate = '2026-11-10 09:15:00'
  const recordSessions = (...args) => recordInvoiceSessions(...args, invoiceDate)
  beforeEach(() => {
    vi.resetAllMocks()
    getResource.mockResolvedValue({ remaining_sessions: 2, histories: [] })
    executeTreatment.mockResolvedValue({ treatmentHistoryId: 77 })
    updateGroupedTreatmentExecution.mockResolvedValue({ treatmentHistoryId: 77 })
  })

  it('không gọi thẻ nếu không chọn làm ngay', async () => {
    expect(await recordSessions(12, [{ ...line, performNow: false }], 1, mappings)).toEqual([])
    expect(getResource).not.toHaveBeenCalled()
  })

  it('không thực hiện thẻ cha có dịch vụ con kể cả khi còn cờ làm ngay', async () => {
    await recordSessions(12, [{ ...line, serviceChildren: [{ product_id: 12, total_sessions: null }] }], 1, mappings)
    expect(executeTreatment).not.toHaveBeenCalled()
    expect(getResource).not.toHaveBeenCalled()
  })

  it('dùng treatment_id và gán nhân viên bằng historyId', async () => {
    await recordSessions(12, [{ ...line, performStaffs: [{ staff_id: 2 }] }], 1, mappings)
    expect(getResource).toHaveBeenCalledWith('treatments', 41)
    expect(executeTreatment).toHaveBeenCalledWith({ treatment_id: 41, branch_id: 1, execution_date: invoiceDate, staffs: [] })
    expect(assignTreatmentStaffs).toHaveBeenCalledWith(77, [{ staff_id: 2 }])
  })

  it('hai dòng giống hệt nhau dùng request_index dù mapping đảo thứ tự', async () => {
    await recordSessions(12, [line, line], 1, [{ request_index: 1, invoice_item_id: 32, treatment_id: 42 }, ...mappings])
    expect(executeTreatment.mock.calls.map(([body]) => body.treatment_id)).toEqual([41, 42])
  })

  it('giữ chỉ số gốc khi có hàng hóa và dòng chưa làm xen kẽ', async () => {
    await recordSessions(12, [{ ...line, is_product: 1 }, { ...line, performNow: false }, line], undefined, [
      { request_index: 2, invoice_item_id: 33, treatment_id: 43 },
      { request_index: 0, invoice_item_id: 31, treatment_id: null },
      { request_index: 1, invoice_item_id: 32, treatment_id: 42 },
    ])
    expect(executeTreatment).toHaveBeenCalledExactlyOnceWith({ treatment_id: 43, execution_date: invoiceDate, staffs: [] })
  })

  it('không execute dòng không sinh thẻ', async () => {
    expect(await recordSessions(12, [line], 1, [{ ...mappings[0], treatment_id: null }])).toEqual([])
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it.each([undefined, [], [mappings[0], mappings[0]], [{ ...mappings[0], treatment_id: 0 }]])('không đoán thẻ khi mapping thiếu hoặc không hợp lệ: %j', async mapping => {
    expect(await recordSessions(12, [line], 1, mapping)).toEqual(['Dịch vụ'])
    expect(executeTreatment).not.toHaveBeenCalled()
    expect(getResource).not.toHaveBeenCalled()
  })

  it('vẫn thực hiện thẻ độc lập có lịch sử cũ; backend kiểm tra trùng trong ngày', async () => {
    getResource.mockResolvedValue({ remaining_sessions: 2, histories: [{ id: 77 }] })
    await recordSessions(12, [line], 1, mappings)
    expect(executeTreatment).toHaveBeenCalledWith({ treatment_id: 41, branch_id: 1, execution_date: invoiceDate, staffs: [] })
  })

  it('dừng an toàn nếu response tạo hóa đơn không trả ngày hóa đơn hợp lệ', async () => {
    await expect(recordInvoiceSessions(12, [line], 1, mappings, undefined)).rejects.toThrow('không nhận được ngày hóa đơn hợp lệ')
    expect(getResource).not.toHaveBeenCalled()
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it('nối child mua thêm vào parent visit cùng ngày thay vì tạo parent history mới', async () => {
    const massage = { ...line, product_id: 15, product_name: 'Massage', performStaffs: [{ staff_id: 8 }] }
    getResource.mockImplementation(async (_, id) => {
      if (id === 52) return { id: 52, product_id: 15, parent_treatment_id: 41, remaining_sessions: 2, histories: [] }
      return { id: 41, remaining_sessions: null, histories: [{ id: 90, branch_id: 1, execution_date: invoiceDate, children: [
        { id: 91, treatment_id: 42, staffs: [{ staff_id: 2 }] },
        { id: 92, treatment_id: 43, staffs: [{ staff_id: 3 }] },
      ] }] }
    })
    await recordSessions(12, [massage], 1, [{ request_index: 0, treatment_id: 52, parent_treatment_id: 41, root_treatment_id: 41 }])
    expect(updateGroupedTreatmentExecution).toHaveBeenCalledExactlyOnceWith(90, { treatment_id: 41, children: [
      { treatment_id: 42, staffs: [{ staff_id: 2 }] },
      { treatment_id: 43, staffs: [{ staff_id: 3 }] },
      { treatment_id: 52, staffs: [{ staff_id: 8 }] },
    ] })
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it('chỉ nối child vào parent visit đúng ngày hóa đơn, không dùng visit ngày khác', async () => {
    const massage = { ...line, product_id: 12, product_name: 'Massage', performStaffs: [{ staff_id: 3 }] }
    getResource.mockImplementation(async (_, id) => id === 52
      ? { id: 52, product_id: 12, parent_treatment_id: 41, remaining_sessions: 3 }
      : { id: 41, histories: [
        { id: 88, branch_id: 1, execution_date: '2026-11-09 09:15:00', children: [] },
        { id: 90, branch_id: 1, execution_date: invoiceDate, children: [{ treatment_id: 42, staffs: [{ staff_id: 2 }] }] },
      ] })
    await recordSessions(12, [massage], 1, [{ request_index: 0, treatment_id: 52, parent_treatment_id: 41, root_treatment_id: 41 }])
    expect(updateGroupedTreatmentExecution).toHaveBeenCalledExactlyOnceWith(90, {
      treatment_id: 41,
      children: [{ treatment_id: 42, staffs: [{ staff_id: 2 }] }, { treatment_id: 52, staffs: [{ staff_id: 3 }] }],
    })
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it('gộp nhiều child mua thêm cùng root thành một grouped execute', async () => {
    const laser = { ...line, product_id: 12, product_name: 'Laser', performStaffs: [{ staff_id: 2 }] }
    const massage = { ...line, product_id: 15, product_name: 'Massage', performStaffs: [{ staff_id: 3 }] }
    getResource.mockImplementation(async (_, id) => id === 52
      ? { id: 52, product_id: 12, parent_treatment_id: 41, remaining_sessions: 2, histories: [] }
      : id === 53
        ? { id: 53, product_id: 15, parent_treatment_id: 41, remaining_sessions: 2, histories: [] }
        : { id: 41, histories: [] })
    await recordSessions(12, [laser, massage], 1, [
      { request_index: 0, treatment_id: 52, parent_treatment_id: 41, root_treatment_id: 41 },
      { request_index: 1, treatment_id: 53, parent_treatment_id: 41, root_treatment_id: 41 },
    ])
    expect(executeTreatment).toHaveBeenCalledExactlyOnceWith({ treatment_id: 41, branch_id: 1, execution_date: invoiceDate, children: [
      { treatment_id: 52, staffs: [{ staff_id: 2 }] },
      { treatment_id: 53, staffs: [{ staff_id: 3 }] },
    ] })
    expect(updateGroupedTreatmentExecution).not.toHaveBeenCalled()
  })

  it('lỗi execute không tự thử lại hoặc thực hiện dòng tiếp theo', async () => {
    executeTreatment.mockRejectedValue(new Error('Mất mạng'))
    await expect(recordSessions(12, [line, line], 1, [...mappings, { request_index: 1, invoice_item_id: 32, treatment_id: 42 }])).rejects.toThrow('Kiểm tra lịch sử thẻ')
    expect(executeTreatment).toHaveBeenCalledTimes(1)
  })

  it('báo buổi đã lưu nếu bước gán nhân viên thất bại', async () => {
    assignTreatmentStaffs.mockRejectedValue(new Error('Mất mạng'))
    await expect(recordSessions(12, [{ ...line, performStaffs: [{ staff_id: 2 }] }], 1, mappings)).rejects.toThrow('buổi #77 đã lưu')
    expect(executeTreatment).toHaveBeenCalledTimes(1)
  })

  it('giữ ID dòng bán khi chuyển API sang form', () => {
    expect(invoiceLineFromApi({ id: 31, product_id: 3, snapshot_name: 'Sẹo', snapshot_price: '900000', quantity: 3 })).toMatchObject({ invoice_item_id: 31, product_id: 3, unit_price: '900000', quantity: 3 })
  })

  it('thực hiện child lifetime bằng một parent visit, gửi ghi chú/chữ ký và nhân viên theo child', async () => {
    const group = { ...line, sessionNote: ' Da đỏ ', sessionSignature: '<svg/>', serviceChildren: [{ product_id: 12, total_sessions: null, performNow: true, performStaffs: [{ staff_id: 2 }] }, { product_id: 15, total_sessions: 5, performNow: false }] }
    getResource.mockResolvedValue({ id: 52, product_id: 12, parent_treatment_id: 41, remaining_sessions: null, histories: [] })
    await recordSessions(12, [group], 1, [{ ...mappings[0], children: [{ id: 53, product_id: 15 }, { id: 52, product_id: 12 }] }])
    expect(executeTreatment).toHaveBeenCalledExactlyOnceWith({ treatment_id: 41, branch_id: 1, execution_date: invoiceDate, children: [{ treatment_id: 52, staffs: [{ staff_id: 2 }] }], note: 'Da đỏ', customer_signature_svg: '<svg/>' })
    expect(assignTreatmentStaffs).not.toHaveBeenCalled()
  })

  it('gộp nhiều child làm ngay của cùng một hóa đơn thành một parent visit', async () => {
    const group = { ...line, serviceChildren: [
      { product_id: 12, total_sessions: 5, performNow: true, performStaffs: [{ staff_id: 2 }] },
      { product_id: 15, total_sessions: 5, performNow: true, performStaffs: [{ staff_id: 3 }] },
    ] }
    getResource.mockImplementation(async (_, id) => ({ id, product_id: id === 52 ? 12 : 15, parent_treatment_id: 41, remaining_sessions: 5, histories: [] }))
    await recordSessions(12, [group], 1, [{ ...mappings[0], children: [{ id: 52, product_id: 12 }, { id: 53, product_id: 15 }] }])
    expect(executeTreatment).toHaveBeenCalledExactlyOnceWith({ treatment_id: 41, branch_id: 1, execution_date: invoiceDate, children: [{ treatment_id: 52, staffs: [{ staff_id: 2 }] }, { treatment_id: 53, staffs: [{ staff_id: 3 }] }] })
  })

  it('hai gói cùng con dùng mapping theo dòng, không trộn ID', async () => {
    const group = { ...line, serviceChildren: [{ product_id: 12, total_sessions: 5, performNow: true }] }
    getResource.mockImplementation(async (_, id) => ({ id, parent_treatment_id: id === 52 ? 41 : 42, product_id: 12, remaining_sessions: 5, histories: [] }))
    await recordSessions(12, [group, group], 1, [{ request_index: 1, treatment_id: 42, children: [{ id: 62, product_id: 12 }] }, { ...mappings[0], children: [{ id: 52, product_id: 12 }] }])
    expect(executeTreatment.mock.calls.map(([body]) => body.treatment_id)).toEqual([41, 42])
  })

  it.each([{ children: [] }, { children: [{ id: 52, product_id: 15 }] }, { children: [{ id: 52, product_id: 12 }, { id: 53, product_id: 12 }] }, { children: {} }])('không đoán mapping con khi thiếu hoặc trùng: %j', async ({ children }) => {
    const group = { ...line, serviceChildren: [{ product_id: 12, performNow: true }] }
    expect(await recordSessions(12, [group], 1, [{ ...mappings[0], children }])).toHaveLength(1)
    expect(executeTreatment).not.toHaveBeenCalled()
  })

  it('lỗi buổi con không retry, không thực hiện con tiếp theo', async () => {
    getResource.mockImplementation(async (_, id) => ({ id, product_id: id === 52 ? 12 : 15, parent_treatment_id: 41, remaining_sessions: 5, histories: [] }))
    executeTreatment.mockRejectedValue(new Error('Mất mạng'))
    await expect(recordSessions(12, [{ ...line, serviceChildren: [{ product_id: 12, performNow: true }, { product_id: 15, performNow: true }] }], 1, [{ ...mappings[0], children: [{ id: 52, product_id: 12 }, { id: 53, product_id: 15 }] }])).rejects.toThrow('Kiểm tra lịch sử thẻ')
    expect(executeTreatment).toHaveBeenCalledTimes(1)
  })
})