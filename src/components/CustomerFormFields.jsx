import { useLayoutEffect, useRef } from 'react'
import { ClipboardList, HeartPulse, Sparkles, UserRound } from 'lucide-react'
import MobileSelect from './MobileSelect'
import { today } from '../utils/format'
import { historyFields, referralSources, skinTypes } from '../utils/customerForm'
import './CustomerFormFields.css'

function TextArea({ fieldKey, label, value, onChange }) {
  const ref = useRef(null)
  const text = value[fieldKey] ?? ''
  useLayoutEffect(() => {
    const element = ref.current
    const resize = () => { element.style.height = 'auto'; element.style.height = `${element.scrollHeight + 2}px` }
    resize()
    const details = element.closest('details')
    details?.addEventListener('toggle', resize)
    return () => details?.removeEventListener('toggle', resize)
  }, [text])
  return <label className="field">{label}<textarea ref={ref} rows={2} value={text} onChange={event => onChange(fieldKey, event.target.value)} placeholder="Nhập nội dung nếu có" /></label>
}

function MultipleChoices({ fieldKey, label, options, value, onChange }) {
  const selected = value[fieldKey]
  const codes = Array.isArray(selected) ? selected : []
  return <fieldset className="customer-choice-group"><legend>{label}</legend>
    <p className="customer-form-hint">Có thể chọn nhiều · {selected == null ? 'Chưa ghi nhận' : `${codes.length} lựa chọn`}</p>
    <div className="customer-choice-grid">{options.map(([code, name]) => <label key={code} className={`customer-choice ${codes.includes(code) ? 'is-selected' : ''}`}>
      <input type="checkbox" checked={codes.includes(code)} onChange={event => onChange(fieldKey, event.target.checked ? [...codes, code] : codes.filter(item => item !== code))} /><span>{name}</span>
    </label>)}</div>
    <div className="customer-choice-actions"><button type="button" onClick={() => onChange(fieldKey, [])}>Bỏ chọn tất cả</button><button type="button" onClick={() => onChange(fieldKey, null)}>Đặt lại chưa ghi nhận</button></div>
  </fieldset>
}

export default function CustomerFormFields({ value, onChange }) {
  const input = (key, label, type = 'text', required = false) => <label className="field"><span>{label}{required && <span className="customer-required" aria-hidden="true"> *</span>}</span><input aria-label={label} type={type} required={required} value={value[key] ?? ''} maxLength={key === 'profile_code' ? 50 : undefined} min={type === 'date' ? '1000-01-01' : undefined} max={type === 'date' ? today() : undefined} onChange={event => onChange(key, event.target.value)} /></label>
  return <div className="customer-form-sections">
    <div className="customer-form-intro"><Sparkles size={17} /><p>Nhập họ tên và số điện thoại; hồ sơ chăm sóc có thể bổ sung sau.</p></div>
    <section className="customer-form-card" aria-labelledby="customer-basic-title">
      <h3 id="customer-basic-title"><UserRound size={19} /> Thông tin khách hàng</h3>
      <div className="customer-form-grid">{input('fullname', 'Họ tên', 'text', true)}{input('phone_number', 'Số điện thoại', 'tel', true)}
        {input('profile_code', 'Mã hồ sơ')}{input('profile_date', 'Ngày lập hồ sơ', 'date')}
        {input('date_of_birth', 'Ngày sinh', 'date')}<label className="field">Giới tính<MobileSelect value={value.gender ?? ''} onChange={event => onChange('gender', event.target.value)}><option value="">Chưa ghi nhận</option><option value="FEMALE">Nữ</option><option value="MALE">Nam</option><option value="OTHER">Khác</option></MobileSelect></label>
        <div className="customer-form-full">{input('address', 'Địa chỉ')}</div>
      </div>
    </section>
    <section className="customer-form-card" aria-labelledby="customer-skin-title"><h3 id="customer-skin-title"><Sparkles size={19} /> Loại da / tình trạng da</h3>
      <MultipleChoices fieldKey="skin_types" label="Loại da" options={skinTypes} value={value} onChange={onChange} />
    </section>
    <section className="customer-form-card" aria-labelledby="customer-referral-title"><h3 id="customer-referral-title"><UserRound size={19} /> Nguồn biết đến</h3>
      <MultipleChoices fieldKey="referral_sources" label="Nguồn giới thiệu" options={referralSources} value={value} onChange={onChange} />
      <TextArea fieldKey="referral_note" label="Ghi chú nguồn giới thiệu" value={value} onChange={onChange} />
    </section>
    <details className="customer-form-card customer-history"><summary><HeartPulse size={19} /><span>Khai thác tiền sử<small>Điều trị, chăm sóc da và thông tin sức khỏe</small></span></summary>
      <div className="customer-form-grid">{historyFields.map(([key, label]) => <TextArea key={key} fieldKey={key} label={label} value={value} onChange={onChange} />)}</div>
    </details>
    <section className="customer-form-card" aria-labelledby="customer-advice-title"><h3 id="customer-advice-title"><ClipboardList size={19} /> Đánh giá và tư vấn</h3>
      <TextArea fieldKey="skin_assessment" label="Đánh giá tình trạng da" value={value} onChange={onChange} />
      <TextArea fieldKey="consultation_note" label="Nội dung tư vấn" value={value} onChange={onChange} />
      <TextArea fieldKey="note" label="Ghi chú khách hàng" value={value} onChange={onChange} />
    </section>
  </div>
}