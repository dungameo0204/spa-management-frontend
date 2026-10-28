import { historyFields, referralSources, skinTypes } from '../utils/customerForm'
import { formatSpaDate } from '../utils/format'
import DetailNote from './DetailNote'

const choices = (value, options) => value == null ? 'Chưa ghi nhận' : value.length ? value.map(code => options.find(([key]) => key === code)?.[1] || code).join(', ') : 'Không có lựa chọn'
export default function CustomerProfile({ customer }) {
  const fields = [
    ['Mã hồ sơ', customer.profile_code], ['Ngày lập hồ sơ', customer.profile_date && formatSpaDate(customer.profile_date)],
    ['Ngày sinh', customer.date_of_birth && formatSpaDate(customer.date_of_birth)], ['Giới tính', { FEMALE: 'Nữ', MALE: 'Nam', OTHER: 'Khác' }[customer.gender]],
    ['Địa chỉ', customer.address], ['Loại da', choices(customer.skin_types, skinTypes)], ['Nguồn giới thiệu', choices(customer.referral_sources, referralSources)],
    ['Ghi chú nguồn giới thiệu', customer.referral_note], ['Đánh giá tình trạng da', customer.skin_assessment], ['Nội dung tư vấn', customer.consultation_note],
  ]
  return <section className="customer-profile customer-panel" aria-label="Hồ sơ khách hàng"><h3>Hồ sơ khách hàng</h3><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Chưa ghi nhận'}</dd></div>)}</dl><DetailNote note={customer.note} /><details><summary>Tiền sử và chăm sóc da</summary><dl>{historyFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{customer[key] || 'Chưa ghi nhận'}</dd></div>)}</dl></details></section>
}