export function validateDateRange({ startDate, endDate }) { return /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate) && startDate <= endDate ? '' : 'Vui lòng chọn khoảng ngày hợp lệ.' }
export function validateProductDraft(data) { if (!data.name?.trim()) return 'Vui lòng nhập tên sản phẩm.'; if (data.price === '' || !Number.isFinite(Number(data.price)) || Number(data.price) < 0) return 'Giá niêm yết phải từ 0 trở lên.'; if (data.sale_price === '' || data.sale_price == null || !Number.isFinite(Number(data.sale_price)) || Number(data.sale_price) < 0 || Number(data.sale_price) > Number(data.price)) return 'Giá bán phải từ 0 đến giá niêm yết.'; return '' }
export function validateTreatmentDraft(data) {
  if (!data.customer_id || !data.product_id) return 'Vui lòng chọn khách hàng và dịch vụ.'
  if (!/^[0-9]+$/.test(String(data.total_sessions)) || Number(data.total_sessions) < 1 || Number(data.total_sessions) > 2147483647) return 'Số buổi phải là số nguyên từ 1 đến 2147483647.'
  if (data.remaining_sessions !== undefined && (!/^[0-9]+$/.test(String(data.remaining_sessions)) || Number(data.remaining_sessions) > Number(data.total_sessions))) return 'Số buổi còn lại phải là số nguyên từ 0 đến tổng số buổi.'
  if (data.commission_base_price === '' || data.commission_base_price == null || !Number.isFinite(Number(data.commission_base_price)) || Number(data.commission_base_price) < 0) return 'Giá dịch vụ tính công ca phải từ 0 trở lên.'
  if (!Number.isInteger(Number(data.commission_quantity)) || Number(data.commission_quantity) <= 0) return 'Số đơn vị mỗi buổi phải là số nguyên lớn hơn 0.'
  return ''
}
export function validateCustomerBirthDate(value, currentDate) {
  if (value == null || value === '') return ''
  const invalid = 'Ngày sinh phải là ngày hợp lệ, năm từ 1000 đến 9999 và không ở tương lai.'
  if (!/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(value) || value > currentDate) return invalid
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? '' : invalid
}
export function validateInvoiceDraft(data) { if (!data.customer_id) return 'Vui lòng chọn khách hàng.'; if (!data.items?.length) return 'Hóa đơn cần ít nhất một sản phẩm hoặc dịch vụ.'; if (data.items.some(item => !item.product_id || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0)) return 'Sản phẩm và số lượng không hợp lệ.'; if (data.wallet_used != null && (!Number.isFinite(Number(data.wallet_used)) || Number(data.wallet_used) < 0 || (data.wallet_balance != null && Number(data.wallet_used) > Number(data.wallet_balance)) || (data.total_amount != null && Number(data.wallet_used) > Number(data.total_amount)))) return 'Tiền dùng ví phải từ 0 đến số dư ví và không vượt tổng hóa đơn.'; if (data.total_amount !== undefined && (!Number.isFinite(Number(data.paid_amount)) || Number(data.paid_amount) < 0 || Number(data.paid_amount) + Number(data.wallet_used) > Number(data.total_amount))) return 'Tiền khách trả phải từ 0 đến số tiền còn lại sau khi dùng ví.'; return '' }