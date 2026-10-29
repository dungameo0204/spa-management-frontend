export function serviceGroupForProduct(product) {
  return Number(product.is_product) ? [] : (product.child_service_ids || []).map(id => ({ product_id: Number(id), total_sessions: 1, performNow: true }))
}

export function validateInvoiceServiceGroups(lines) {
  for (const line of lines || []) {
    if (!line.serviceChildren?.length && !line.treatmentConfigured) continue
    const perSession = !line.serviceChildren?.length && line.treatmentConfigured && line.treatmentTotalSessions !== null && Number(line.quantity) === Number(line.treatmentTotalSessions)
    if (Number(line.quantity) !== 1 && !perSession) return 'Dòng có cấu hình liệu trình cần số lượng 1 hoặc số lượng bằng số buổi của dịch vụ đơn lẻ.'
    const cards = [...(line.serviceChildren || []), ...(line.treatmentConfigured ? [{ total_sessions: line.treatmentTotalSessions }] : [])]
    if (cards.some(child => child.total_sessions !== null && (!/^[0-9]+$/.test(String(child.total_sessions)) || Number(child.total_sessions) < 1 || Number(child.total_sessions) > 2147483647))) return 'Số buổi phải là số nguyên từ 1 đến 2147483647, hoặc chọn Trọn đời.'
  }
  return ''
}

export function invoiceServiceGroupPayload(line) {
  if ((!line.serviceChildren?.length && !line.treatmentConfigured) || Number(line.is_product)) return {}
  return { treatment: { total_sessions: line.treatmentConfigured ? (line.treatmentTotalSessions === null ? null : Number(line.treatmentTotalSessions)) : null, children: (line.serviceChildren || []).map(child => ({ product_id: Number(child.product_id), total_sessions: child.total_sessions === null ? null : Number(child.total_sessions) })) } }
}

export function hasInvoiceSessionsToPerform(line) {
  return !Number(line.is_product) && (line.serviceChildren?.length ? line.serviceChildren.some(child => child.performNow) : Boolean(line.performNow))
}

export function unsignedInvoiceSessions(lines) {
  return (lines || []).filter(line => hasInvoiceSessionsToPerform(line) && !line.sessionSignature).map(line => line.product_name || 'Dịch vụ')
}

export function validateInvoiceSessionMetadata(lines, branchId, availableStaffs) {
  for (const line of lines || []) {
    const active = line.serviceChildren?.length ? line.serviceChildren.filter(child => child.performNow) : line.performNow ? [line] : []
    if (!active.length) continue
    if (line.sessionNote && new TextEncoder().encode(line.sessionNote).length > 65535) return 'Ghi chú buổi thực hiện tối đa 65535 byte UTF-8.'
    if (line.serviceChildren?.length && active.some(child => child.performStaffs?.length && (Number(child.staffBranchId) !== Number(branchId) || child.performStaffs.some(person => !availableStaffs?.some(staff => Number(staff.id) === Number(person.staff_id) && Number(staff.branch_id) === Number(branchId)))))) return 'Cơ sở hoặc danh sách nhân viên đã thay đổi. Vui lòng chọn lại nhân viên làm cho dịch vụ con.'
  }
  return ''
}