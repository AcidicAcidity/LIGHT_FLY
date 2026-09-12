import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

// Транспорт создаётся лениво и только если заданы SMTP-настройки.
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (!env.smtp.host) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  }
  return transporter
}

/**
 * Отправляет код подтверждения.
 * Если SMTP настроен — уходит реальное письмо.
 * Иначе код печатается в консоль сервера (для учебного/dev-режима).
 */
export async function sendAuthCode(to: string, code: string, purpose: 'REGISTER' | 'LOGIN'): Promise<void> {
  const subject =
    purpose === 'REGISTER' ? 'Подтверждение регистрации — LIGHT FLY' : 'Код для входа — LIGHT FLY'
  const text = `Ваш код подтверждения: ${code}\nКод действует 10 минут.\n\nЕсли вы не запрашивали код, просто проигнорируйте это письмо.`

  const tx = getTransporter()
  if (tx) {
    await tx.sendMail({ from: env.smtp.from, to, subject, text })
    return
  }

  // Fallback: печать в консоль
  console.log('\n──────────────────────────────────────────')
  console.log(`✉️  [2FA] Код для ${to} (${purpose}): ${code}`)
  console.log('   (SMTP не настроен — письмо не отправлено, код показан в консоли)')
  console.log('──────────────────────────────────────────\n')
}
