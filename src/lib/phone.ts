const DZ_PATTERN = /^(\+213|0)(5|6|7)\d{8}$/
const DZ_OPERATORS: Record<string, string> = { '5': 'Ooredoo', '6': 'Mobilis', '7': 'Djezzy' }

export function formatAlgerianPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.startsWith('213') && digits.length > 3) {
    const op = digits[3]
    const rest = digits.slice(4)
    return `+213 ${op}${rest.length >= 1 ? ' ' : ''}${rest.slice(0, 2)}${rest.length >= 3 ? ' ' : ''}${rest.slice(2, 4)}${rest.length >= 5 ? ' ' : ''}${rest.slice(4, 6)}`
  }
  if (digits.startsWith('0') && digits.length > 1) {
    const op = digits[1]
    const rest = digits.slice(2)
    return `+213 ${op}${rest.length >= 1 ? ' ' : ''}${rest.slice(0, 2)}${rest.length >= 3 ? ' ' : ''}${rest.slice(2, 4)}${rest.length >= 5 ? ' ' : ''}${rest.slice(4, 6)}`
  }
  return value
}

export function validateAlgerianPhone(phone: string): boolean {
  return DZ_PATTERN.test(phone.replace(/\s/g, ''))
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+213' + digits.slice(1)
  if (digits.startsWith('213')) return '+' + digits
  if (digits.startsWith('5') || digits.startsWith('6') || digits.startsWith('7')) return '+213' + digits
  return phone
}

export function getOperator(phone: string): string | null {
  const match = phone.replace(/\s/g, '').match(/^(\+213|0)(5|6|7)/)
  return match ? DZ_OPERATORS[match[2]] ?? null : null
}
