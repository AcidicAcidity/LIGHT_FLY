// Генерация 6-значного кода 2FA и номера брони.

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateBookingRef(): string {
  let s = 'LF'
  for (let i = 0; i < 4; i++) {
    s += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)]
  }
  return s
}

export function generateSeat(): string {
  const row = Math.floor(1 + Math.random() * 32)
  const letter = 'ABCDEF'[Math.floor(Math.random() * 6)]
  return `${row}${letter}`
}
