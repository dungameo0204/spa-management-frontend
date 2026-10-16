const missing = value => value === '' || value == null
const nonnegative = value => !missing(value) && Number.isFinite(Number(value)) && Number(value) >= 0

export function validateCommissionTiers(tiers = []) {
  const groups = new Map()
  for (const tier of tiers) {
    if (!Number.isInteger(Number(tier.role_id)) || Number(tier.role_id) <= 0) return 'Chọn chức vụ hợp lệ cho bậc công.'
    if (!nonnegative(tier.min_price) || (!missing(tier.max_price) && (!nonnegative(tier.max_price) || Number(tier.max_price) <= Number(tier.min_price)))) return 'Khoảng giá phải không âm và giá đến phải lớn hơn giá từ.'
    if (!['FIXED', 'PERCENT'].includes(tier.calculation_type)) return 'Chọn cách tính công hợp lệ.'
    if (tier.calculation_type === 'PERCENT' && (!nonnegative(tier.percent) || Number(tier.percent) > 100)) return 'Tiền công phần trăm phải từ 0 đến 100.'
    if (tier.calculation_type === 'FIXED' && !nonnegative(tier.fixed_amount)) return 'Tiền công cố định phải từ 0 trở lên.'
    const key = Number(tier.role_id)
    groups.set(key, [...(groups.get(key) || []), tier])
  }
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => Number(a.min_price) - Number(b.min_price))
    if (Number(sorted[0].min_price) !== 0) return 'Khoảng giá bị trống: bậc đầu tiên phải bắt đầu từ 0.'
    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1]
      if (missing(previous.max_price) || Number(previous.max_price) > Number(sorted[i].min_price)) return 'Các khoảng giá của cùng chức vụ bị chồng lấn.'
      if (Number(previous.max_price) < Number(sorted[i].min_price)) return 'Các khoảng giá của cùng chức vụ bị trống, cần nối tiếp nhau.'
    }
    if (!missing(sorted.at(-1).max_price)) return 'Khoảng giá bị trống: bậc cuối phải để giá đến trống (không giới hạn).'
  }
  return ''
}

export function serializeCommissionTiers(tiers = []) {
  return tiers.map(tier => ({
    role_id: Number(tier.role_id), min_price: missing(tier.min_price) ? NaN : Number(tier.min_price),
    max_price: missing(tier.max_price) ? null : Number(tier.max_price), calculation_type: tier.calculation_type,
    ...(tier.calculation_type === 'PERCENT' ? { percent: missing(tier.percent) ? NaN : Number(tier.percent) } : { fixed_amount: missing(tier.fixed_amount) ? NaN : Number(tier.fixed_amount) }),
  }))
}