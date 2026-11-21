export const paymentMethods = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'TRANSFER', label: 'Chuyển khoản' },
  { value: 'CARD', label: 'Thẻ' },
]

export const isPaymentMethod = value => paymentMethods.some(method => method.value === value)