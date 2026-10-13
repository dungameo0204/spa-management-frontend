import { assignTreatmentStaffs, executeTreatment, getResource, listResource } from '../api/resources'

export async function recordInvoiceSessions(invoiceId, lines, branchId) {
  const requested = lines.filter(line => !Number(line.is_product) && line.performNow)
  if (!requested.length) return
  const first = await listResource('treatments', { invoiceId }, 1, 100)
  const rest = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) => listResource('treatments', { invoiceId }, index + 2, 100)))
  const cards = [first, ...rest].flatMap(page => page.data)
  const used = new Set()
  for (const line of requested) {
    const matches = cards.filter(card => Number(card.product_id) === Number(line.product_id) && !used.has(card.id))
    if (matches.length !== 1) throw new Error(`Hóa đơn #${invoiceId} đã lưu, nhưng không thể xác định duy nhất thẻ của ${line.product_name}. Mở trang Thẻ liệu trình để ghi nhận buổi, không tạo lại hóa đơn.`)
    const card = matches[0]
    used.add(card.id)
    const detail = await getResource('treatments', card.id)
    if (Number(detail.remaining_sessions) < 1 || detail.histories?.length) throw new Error(`Hóa đơn #${invoiceId} đã lưu; thẻ ${line.product_name} đã có lịch sử hoặc hết buổi. Kiểm tra thẻ trước khi tick lại.`)
    let created
    try { created = await executeTreatment({ treatment_id: card.id, ...(branchId ? { branch_id: branchId } : {}), staffs: [] }) }
    catch (error) { throw new Error(`Hóa đơn #${invoiceId} đã lưu; không xác nhận được buổi cho ${line.product_name}: ${error.message}. Kiểm tra lịch sử thẻ trước khi thực hiện lại.`) }
    if (line.performStaffs?.length) {
      try { await assignTreatmentStaffs(created.treatmentHistoryId, line.performStaffs) }
      catch (error) { throw new Error(`Hóa đơn #${invoiceId} và buổi #${created.treatmentHistoryId} đã lưu nhưng chưa gán được nhân viên: ${error.message}. Gán lại trong Thẻ liệu trình, không tick thêm.`) }
    }
  }
}