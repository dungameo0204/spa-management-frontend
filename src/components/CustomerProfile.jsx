import { historyFields, referralSources, skinTypes } from '../utils/customerForm'
import { formatSpaDate } from '../utils/format'
import DetailNote from './DetailNote'
import { dateInputDisplay } from './DateInput'

const choices = (value, options) => value == null ? 'Chưa ghi nhận' : value.length ? value.map(code => options.find(([key]) => key === code)?.[1] || code).join(', ') : 'Không có lựa chọn'
export default function CustomerProfile({ customer, onPrint, onShare, printing = false, sharing = false }) {
  const fields = [
    ['Mã hồ sơ', customer.profile_code], ['Ngày lập hồ sơ', customer.profile_date && formatSpaDate(customer.profile_date)],
    ['Ngày sinh', customer.date_of_birth && dateInputDisplay(customer.date_of_birth, true)], ['Giới tính', { FEMALE: 'Nữ', MALE: 'Nam', OTHER: 'Khác' }[customer.gender]],
    ['Địa chỉ', customer.address], ['Loại da', choices(customer.skin_types, skinTypes)], ['Nguồn giới thiệu', choices(customer.referral_sources, referralSources)],
    ['Ghi chú nguồn giới thiệu', customer.referral_note], ['Đánh giá tình trạng da', customer.skin_assessment], ['Dịch vụ điều trị', customer.consultation_note],
  ]
  return <section className="customer-profile customer-panel" aria-label="Hồ sơ khách hàng"><div className="customer-panel-heading"><h3>Hồ sơ khách hàng</h3><div className="customer-record-actions"><button type="button" className="btn secondary" onClick={onPrint} disabled={printing || sharing}>{printing ? 'Đang chuẩn bị...' : 'In hồ sơ'}</button><button type="button" className="btn secondary" onClick={onShare} disabled={printing || sharing}>{sharing ? 'Đang tạo ảnh...' : 'Chia sẻ'}</button></div></div><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Chưa ghi nhận'}</dd></div>)}</dl><DetailNote note={customer.note} /><details><summary>Tiền sử và chăm sóc da</summary><dl>{historyFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{customer[key] || 'Chưa ghi nhận'}</dd></div>)}</dl></details></section>
}