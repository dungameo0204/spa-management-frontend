export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function isDigitsOnly(value) {
  return /^\d+$/.test(String(value ?? ''))
}