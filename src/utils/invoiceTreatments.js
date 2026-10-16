import { assignTreatmentStaffs, executeTreatment, getResource } from '../api/resources'

export async function recordInvoiceSessions(invoiceId, lines, branchId, itemMappings) {
  const requested = lines.map((line, requestIndex) => ({ line, requestIndex })).filter(({ line }) => !Number(line.is_product) && line.performNow)
  if (!requested.length) return []
  const mappings = Array.isArray(itemMappings) ? itemMappings : []
  const skipped = []
  for (const { line, requestIndex } of requested) {
    const matches = mappings.filter(mapping => mapping.request_index === requestIndex)
    if (matches.length !== 1) { skipped.push(line.product_name || 'Dịch vụ'); continue }
    const treatmentId = matches[0].treatment_id
    // null means the backend did not create a card for this line.
    if (treatmentId === null) continue
    if (!Number.isSafeInteger(treatmentId) || treatmentId <= 0 || mappings.filter(mapping => mapping.treatment_id === treatmentId).length !== 1) { skipped.push(line.product_name || 'Dịch vụ'); continue }
    const detail = await getResource('treatments', treatmentId)
    if (Number(detail.remaining_sessions) < 1 || detail.histories?.length) throw new Error(`Hóa đơn #${invoiceId} đã lưu; thẻ ${line.product_name} đã có lịch sử hoặc hết buổi. Kiểm tra thẻ trước khi tick lại.`)
    let created
    try { created = await executeTreatment({ treatment_id: treatmentId, ...(branchId ? { branch_id: branchId } : {}), staffs: [] }) }
    catch (error) { throw new Error(`Hóa đơn #${invoiceId} đã lưu; không xác nhận được buổi cho ${line.product_name}: ${error.message}. Kiểm tra lịch sử thẻ trước khi thực hiện lại.`) }
    if (line.performStaffs?.length) {
      try { await assignTreatmentStaffs(created.treatmentHistoryId, line.performStaffs) }
      catch (error) { throw new Error(`Hóa đơn #${invoiceId} và buổi #${created.treatmentHistoryId} đã lưu nhưng chưa gán được nhân viên: ${error.message}. Gán lại trong Thẻ liệu trình, không tick thêm.`) }
    }
  }
  return skipped
}