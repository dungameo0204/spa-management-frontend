import { assignTreatmentStaffs, executeTreatment, getResource, updateGroupedTreatmentExecution } from '../api/resources'
import { dateOnly, toSqlDateTime } from './format'

const validId = value => Number.isSafeInteger(value) && value > 0

function mappingFor(mappings, requestIndex, name, skipped) {
  const matches = mappings.filter(mapping => mapping.request_index === requestIndex)
  if (matches.length !== 1) { skipped.push(name || 'Dịch vụ'); return null }
  return matches[0]
}

function rootIdFor(mapping) {
  const rootId = mapping.parent_treatment_id == null ? mapping.treatment_id : mapping.root_treatment_id
  return validId(rootId) ? rootId : null
}

async function assertStandaloneCard(invoiceId, treatmentId, name) {
  const detail = await getResource('treatments', treatmentId)
  if (detail.closed_at || detail.parent_treatment_id != null || detail.children?.length || (detail.remaining_sessions !== null && Number(detail.remaining_sessions) < 1)) throw new Error(`Hóa đơn #${invoiceId} đã lưu; thẻ ${name} đã hết buổi hoặc không đúng thẻ độc lập. Kiểm tra thẻ trước khi tick lại.`)
}

async function assertGroupChild(invoiceId, rootId, child, name) {
  const detail = await getResource('treatments', child.treatment_id)
  if (detail.closed_at || (detail.remaining_sessions !== null && Number(detail.remaining_sessions) < 1) || Number(detail.parent_treatment_id) !== Number(rootId) || Number(detail.product_id) !== Number(child.product_id)) throw new Error(`Hóa đơn #${invoiceId} đã lưu; thẻ ${name} đã hết buổi hoặc không đúng thẻ con. Kiểm tra thẻ trước khi tick lại.`)
}

function addGroupChild(groups, rootId, child, metadata) {
  const group = groups.get(rootId) || { rootId, children: new Map(), ...metadata }
  if (!groups.has(rootId)) groups.set(rootId, group)
  if (group.children.has(child.treatment_id)) return false
  group.children.set(child.treatment_id, child)
  return true
}

function currentVisit(root, branchId, executionDate) {
  return (root.histories || []).find(history => !history.deleted_at && Array.isArray(history.children) && dateOnly(history.execution_date) === dateOnly(executionDate) && (!branchId || Number(history.branch_id) === Number(branchId)))
}

function groupPayload(rootId, branchId, executionDate, children, metadata) {
  return {
    treatment_id: rootId,
    ...(branchId ? { branch_id: branchId } : {}),
    execution_date: executionDate,
    children,
    ...(metadata.note?.trim() ? { note: metadata.note.trim() } : {}),
    ...(metadata.signature ? { customer_signature_svg: metadata.signature } : {}),
  }
}

export async function recordInvoiceSessions(invoiceId, lines, branchId, itemMappings, invoiceDate) {
  const executionDate = toSqlDateTime(invoiceDate)
  if (!executionDate) throw new Error(`Hóa đơn #${invoiceId} đã lưu nhưng không nhận được ngày hóa đơn hợp lệ để ghi nhận buổi. Kiểm tra thẻ liệu trình; không tạo lại hóa đơn.`)
  const mappings = Array.isArray(itemMappings) ? itemMappings : []
  const skipped = [], groups = new Map()
  for (const [requestIndex, line] of (lines || []).entries()) {
    if (Number(line.is_product)) continue
    const mapping = mappingFor(mappings, requestIndex, line.product_name, skipped)
    if (!mapping) continue

    if (line.serviceChildren?.length) {
      const selected = line.serviceChildren.filter(child => child.performNow)
      if (!selected.length) continue
      const rootId = rootIdFor(mapping), mappedChildren = Array.isArray(mapping.children) ? mapping.children : []
      if (!rootId) { skipped.push(line.product_name || 'Dịch vụ'); continue }
      for (const child of selected) {
        const matches = mappedChildren.filter(card => Number(card.product_id) === Number(child.product_id))
        const treatmentId = matches[0]?.id
        if (matches.length !== 1 || !validId(treatmentId) || !addGroupChild(groups, rootId, { treatment_id: treatmentId, product_id: child.product_id, staffs: child.performStaffs || [] }, { name: line.product_name, note: line.sessionNote, signature: line.sessionSignature })) skipped.push(child.product_name || line.product_name)
      }
      continue
    }

    if (!line.performNow || mapping.treatment_id === null) continue
    const treatmentId = mapping.treatment_id
    if (!validId(treatmentId)) { skipped.push(line.product_name || 'Dịch vụ'); continue }
    if (mapping.parent_treatment_id != null) {
      const rootId = rootIdFor(mapping)
      if (!rootId || !addGroupChild(groups, rootId, { treatment_id: treatmentId, product_id: line.product_id, staffs: line.performStaffs || [] }, { name: line.product_name, note: line.sessionNote, signature: line.sessionSignature })) skipped.push(line.product_name || 'Dịch vụ')
      continue
    }
    await assertStandaloneCard(invoiceId, treatmentId, line.product_name)
    let created
    try { created = await executeTreatment({ treatment_id: treatmentId, ...(branchId ? { branch_id: branchId } : {}), execution_date: executionDate, staffs: [], ...(line.sessionNote?.trim() ? { note: line.sessionNote.trim() } : {}), ...(line.sessionSignature ? { customer_signature_svg: line.sessionSignature } : {}) }) }
    catch (error) { throw new Error(`Hóa đơn #${invoiceId} đã lưu; không xác nhận được buổi cho ${line.product_name}: ${error.message}. Kiểm tra lịch sử thẻ trước khi thực hiện lại.`) }
    if (line.performStaffs?.length) {
      try { await assignTreatmentStaffs(created.treatmentHistoryId, line.performStaffs) }
      catch (error) { throw new Error(`Hóa đơn #${invoiceId} và buổi #${created.treatmentHistoryId} đã lưu nhưng chưa gán được nhân viên: ${error.message}. Gán lại trong Thẻ liệu trình, không tick lần nữa.`) }
    }
  }

  for (const group of groups.values()) {
    const children = [...group.children.values()]
    for (const child of children) await assertGroupChild(invoiceId, group.rootId, child, group.name)
    const root = await getResource('treatments', group.rootId)
    if (root.closed_at) throw new Error(`Hóa đơn #${invoiceId} đã lưu; liệu trình cha của ${group.name} không còn hoạt động. Kiểm tra thẻ trước khi tick lại.`)
    const visit = currentVisit(root, branchId, executionDate)
    try {
      if (visit) {
        const existing = (visit.children || []).filter(child => !child.deleted_at).map(child => ({ treatment_id: child.treatment_id, staffs: child.staffs || [] }))
        const childByTreatmentId = new Map(existing.map(child => [Number(child.treatment_id), child]))
        children.forEach(child => childByTreatmentId.set(Number(child.treatment_id), { treatment_id: child.treatment_id, staffs: child.staffs }))
        await updateGroupedTreatmentExecution(visit.id, { treatment_id: group.rootId, children: [...childByTreatmentId.values()] })
      } else {
        await executeTreatment(groupPayload(group.rootId, branchId, executionDate, children.map(({ treatment_id, staffs }) => ({ treatment_id, staffs })), group))
      }
    } catch (error) {
      throw new Error(`Hóa đơn #${invoiceId} đã lưu; không xác nhận được buổi cho ${group.name}: ${error.message}. Kiểm tra lịch sử thẻ trước khi thực hiện lại.`)
    }
  }
  return skipped
}