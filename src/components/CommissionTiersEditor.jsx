import MoneyInput from './MoneyInput'
import MobileSelect from './MobileSelect'
import { validateCommissionTiers } from '../utils/commissionTiers'

const newTier = roleId => ({ role_id: roleId, min_price: 0, max_price: null, calculation_type: 'PERCENT', percent: 0, fixed_amount: 0 })

export default function CommissionTiersEditor({ roles, value = [], onChange }) {
  const roleChoices = [...roles, ...value.filter(tier => !roles.some(role => Number(role.id) === Number(tier.role_id))).map(tier => ({ id: tier.role_id, name: tier.role_name || `Chức vụ #${tier.role_id}` }))].filter((role, index, all) => all.findIndex(item => Number(item.id) === Number(role.id)) === index)
  const replace = (roleId, tiers) => onChange([...value.filter(tier => Number(tier.role_id) !== Number(roleId)), ...tiers])
  const warning = validateCommissionTiers(value)
  return <section className="section-card"><h3>Tính công theo chức vụ</h3><p className="small-muted">Một mức công áp dụng mọi giá. Thêm mức công để chia khoảng giá: từ giá đã nhập đến dưới giá kế tiếp. Bậc cuối để trống giá đến là không giới hạn.</p>
    {!roleChoices.length && <p className="small-muted">Chưa có chức vụ để cấu hình công.</p>}
    {roleChoices.map(role => {
      const tiers = value.filter(tier => Number(tier.role_id) === Number(role.id))
      const showRanges = tiers.length > 1 || (tiers.length === 1 && (Number(tiers[0].min_price) !== 0 || tiers[0].max_price != null))
      const change = (index, key, next) => replace(role.id, tiers.map((tier, position) => position === index ? { ...tier, [key]: next } : tier))
      return <fieldset className="commission-role" key={role.id}><legend><label className="choice-row"><input type="checkbox" checked={tiers.length > 0} onChange={event => replace(role.id, event.target.checked ? [newTier(role.id)] : [])} />{role.name}</label></legend>
        {tiers.map((tier, index) => <div className="section-card" key={index}><strong>Mức công {index + 1}</strong><div className="field-grid">
          {showRanges && <><label className="field">Giá từ (đ)<MoneyInput required value={tier.min_price} onChange={next => change(index, 'min_price', next)} /></label><label className="field">Giá đến, không bao gồm (đ)<MoneyInput placeholder="Không giới hạn" value={tier.max_price} onChange={next => change(index, 'max_price', next === '' ? null : next)} /></label></>}
          <label className="field">Cách tính công<MobileSelect value={tier.calculation_type} onChange={event => change(index, 'calculation_type', event.target.value)}><option value="PERCENT">Phần trăm (%)</option><option value="FIXED">Số tiền cố định</option></MobileSelect></label>
          {tier.calculation_type === 'PERCENT' ? <label className="field">Tiền công (%)<input required type="number" min="0" max="100" step="any" value={tier.percent ?? ''} onChange={event => change(index, 'percent', event.target.value)} /></label> : <label className="field">Tiền công cố định (đ)<MoneyInput required value={tier.fixed_amount ?? ''} onChange={next => change(index, 'fixed_amount', next)} /></label>}
        </div>{tiers.length > 1 && <button type="button" className="btn secondary" onClick={() => { const remaining = tiers.filter((_, position) => position !== index); if (remaining.length === 1) replace(role.id, [{ ...remaining[0], min_price: 0, max_price: null }]); else replace(role.id, remaining) }}>Xóa mức công {index + 1}</button>}</div>)}
        {tiers.length > 0 && <button type="button" className="btn secondary" onClick={() => { const last = tiers.at(-1); const boundary = last.max_price ?? ''; replace(role.id, [...tiers.slice(0, -1), { ...last, max_price: boundary }, { ...newTier(role.id), min_price: boundary }]) }}>Thêm mức công cho {role.name}</button>}
      </fieldset>
    })}{warning && <p className="form-alert" role="alert">{warning}</p>}
  </section>
}