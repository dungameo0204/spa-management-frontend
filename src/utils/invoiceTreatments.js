import { assignTreatmentStaffs, executeTreatment, getResource } from '../api/resources'

export async function recordInvoiceSessions(invoiceId, lines, branchId, itemMappings) {
  const requested = lines.flatMap((line, requestIndex) => Number(line.is_product) ? [] : line.serviceChildren?.length
    ? line.serviceChildren.filter(child => child.performNow).map(child => ({ line: { ...child, product_name: child.product_name || `${line.product_name} / #${child.product_id}`, sessionNote: line.sessionNote, sessionSignature: line.sessionSignature }, requestIndex, child: true }))
    : line.performNow ? [{ line, requestIndex }] : [])
  if (!requested.length) return []
  const mappings = Array.isArray(itemMappings) ? itemMappings : []
  const skipped = []
  const usedIds = new Set()
  for (const { line, requestIndex, child } of requested) {
    const matches = mappings.filter(mapping => mapping.request_index === requestIndex)
    if (matches.length !== 1) { skipped.push(line.product_name || 'Dịch vụ'); continue }
    const childMatches = child && Array.isArray(matches[0].children) ? matches[0].children.filter(card => Number(card.product_id) === Number(line.product_id)) : []
    if (child && childMatches.length !== 1) { skipped.push(line.product_name); continue }
    const treatmentId = child ? childMatches[0].id : matches[0].treatment_id
    // null means the backend did not create a card for this line.
    if (treatmentId === null) continue
    const allIds = mappings.flatMap(mapping => [mapping.treatment_id, ...(Array.isArray(mapping.children) ? mapping.children : []).map(card => card.id)])
    if (!Number.isSafeInteger(treatmentId) || treatmentId <= 0 || allIds.filter(id => id === treatmentId).length !== 1 || usedIds.has(treatmentId)) { skipped.push(line.product_name || 'Dịch vụ'); continue }
    usedIds.add(treatmentId)
    const detail = await getResource('treatments', treatmentId)
    if (detail.closed_at || (detail.remaining_sessions !== null && Number(detail.remaining_sessions) < 1) || detail.histories?.length || detail.children?.length || (child && (Number(detail.parent_treatment_id) !== Number(matches[0].treatment_id) || Number(detail.product_id) !== Number(line.product_id)))) throw new Error(`Hóa đơn #${invoiceId} đã lưu; thẻ ${line.product_name} đã có lịch sử, hết buổi hoặc không đúng thẻ con. Kiểm tra thẻ trước khi tick lại.`)
    let created
    try { created = await executeTreatment({ treatment_id: treatmentId, ...(branchId ? { branch_id: branchId } : {}), staffs: child ? (line.performStaffs || []) : [], ...(line.sessionNote?.trim() ? { note: line.sessionNote.trim() } : {}), ...(line.sessionSignature ? { customer_signature_svg: line.sessionSignature } : {}) }) }
    catch (error) { throw new Error(`Hóa đơn #${invoiceId} đã lưu; không xác nhận được buổi cho ${line.product_name}: ${error.message}. Kiểm tra lịch sử thẻ trước khi thực hiện lại.`) }
    if (!child && line.performStaffs?.length) {
      try { await assignTreatmentStaffs(created.treatmentHistoryId, line.performStaffs) }
      catch (error) { throw new Error(`Hóa đơn #${invoiceId} và buổi #${created.treatmentHistoryId} đã lưu nhưng chưa gán được nhân viên: ${error.message}. Gán lại trong Thẻ liệu trình, không tick thêm.`) }
    }
  }
  return skipped
}