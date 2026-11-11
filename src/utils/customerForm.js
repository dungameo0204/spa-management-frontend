import { validateCustomerBirthDate } from './validation'

export const skinTypes = [
  ['DRY', 'Da khô'], ['OILY_ACNE', 'Da dầu – mụn'],
  ['SENSITIVE_DAMAGED', 'Da nhạy cảm, tổn thương'], ['AGING', 'Da lão hóa'],
  ['COMBINATION', 'Da hỗn hợp'], ['PIGMENTED', 'Da tăng sắc tố'], ['OTHER', 'Khác'],
]
export const referralSources = [['TIKTOK', 'TikTok'], ['FACEBOOK', 'Facebook'], ['FRIEND', 'Bạn bè giới thiệu'], ['OTHER', 'Nguồn khác']]
export const historyFields = [
  ['previous_skin_treatments', 'Điều trị da trước đây'],
  ['peeling_products_history', 'Lịch sử dùng sản phẩm peel / bong tróc'],
  ['current_skincare_products', 'Sản phẩm chăm sóc da đang dùng'],
  ['skincare_routine', 'Quy trình chăm sóc da'],
  ['pigmentation_onset', 'Thời điểm và diễn biến xuất hiện sắc tố'],
  ['family_skin_history', 'Tiền sử da trong gia đình'],
  ['pregnancy_and_medical_history', 'Thai kỳ và tiền sử bệnh lý'],
  ['cosmetic_reaction_history', 'Tiền sử phản ứng mỹ phẩm'],
]
const textFields = ['fullname', 'phone_number', 'address', 'note', 'profile_code', 'referral_note', ...historyFields.map(([key]) => key), 'skin_assessment', 'consultation_note']
export const customerFields = [...textFields, 'date_of_birth', 'profile_date', 'gender', 'skin_types', 'referral_sources']

export function prepareCustomerForm(draft, original) {
  return Object.fromEntries(customerFields.filter(key => draft[key] !== undefined).map(key => {
    const value = draft[key]
    return [key, typeof value === 'string' ? value.trim() || null : value]
  }).filter(([key, value]) => !original || JSON.stringify(value) !== JSON.stringify(original[key] ?? null)))
}

export function validateCustomerForm(draft, currentDate) {
  if (!draft.fullname?.trim() || !draft.phone_number?.trim()) return 'Vui lòng nhập họ tên và số điện thoại.'
  const birthWarning = validateCustomerBirthDate(draft.date_of_birth, currentDate)
  if (birthWarning) return birthWarning
  if (validateCustomerBirthDate(draft.profile_date, currentDate)) return 'Ngày lập hồ sơ phải là ngày hợp lệ, năm từ 1000 đến 9999 và không ở tương lai.'
  if ((draft.profile_code?.trim().length || 0) > 50) return 'Mã hồ sơ tối đa 50 ký tự.'
  if (draft.gender != null && draft.gender !== '' && !['MALE', 'FEMALE', 'OTHER'].includes(draft.gender)) return 'Giới tính không hợp lệ.'
  for (const [key, options, label] of [['skin_types', skinTypes, 'Loại da'], ['referral_sources', referralSources, 'Nguồn giới thiệu']]) {
    const value = draft[key]
    if (value != null && (!Array.isArray(value) || value.some(code => !options.some(([allowed]) => allowed === code)))) return `${label} không hợp lệ. Vui lòng tải lại hồ sơ hoặc kiểm tra dữ liệu API.`
  }
  const encoder = new TextEncoder()
  for (const key of textFields.filter(key => !['fullname', 'phone_number', 'profile_code'].includes(key))) {
    if (typeof draft[key] === 'string' && encoder.encode(draft[key].trim()).length > 65535) return 'Nội dung quá dài. Mỗi trường ghi chú/tiền sử tối đa 65535 byte UTF-8.'
  }
  return ''
}