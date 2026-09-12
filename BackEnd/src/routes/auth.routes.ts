import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { signToken } from '../lib/jwt.js'
import { sendAuthCode } from '../lib/mailer.js'
import { generateCode } from '../utils/codes.js'
import { ApiError, asyncHandler } from '../middleware/errorHandler.js'
import { authRequired } from '../middleware/auth.js'
import { env } from '../config/env.js'
import { tierInfo, discountForTier } from '../utils/discount.js'
import type { User } from '../db/schema.js'

export const authRouter = Router()

const CODE_TTL_MIN = 10

async function issueCode(userId: string, purpose: 'REGISTER' | 'LOGIN', email: string) {
  // Гасим прошлые невыполненные коды этой цели
  await db
    .update(schema.authCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(schema.authCodes.userId, userId),
        eq(schema.authCodes.purpose, purpose),
        isNull(schema.authCodes.consumedAt),
      ),
    )

  const code = generateCode()
  await db.insert(schema.authCodes).values({
    userId,
    purpose,
    code,
    expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
  })
  await sendAuthCode(email, code, purpose)
  // В dev-режиме возвращаем код, чтобы можно было проверить без почты
  return env.isDev ? code : undefined
}

function publicUser(u: User) {
  const info = tierInfo(u.tier)
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    tier: u.tier,
    tierLabel: info.current.label,
    discountPct: discountForTier(u.tier),
    bonusMiles: u.bonusMiles,
    totalSpent: u.totalSpent,
    nextTier: info.next ? { tier: info.next.tier, label: info.next.label, minSpent: info.next.minSpent } : null,
    isEmailVerified: u.isEmailVerified,
  }
}

// POST /api/auth/register — регистрация, отправка кода подтверждения email
const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  firstName: z.string().min(1, 'Укажите имя'),
  lastName: z.string().min(1, 'Укажите фамилию'),
  phone: z.string().optional(),
})

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body)
    const existing = await db.query.users.findFirst({ where: eq(schema.users.email, data.email) })
    if (existing) {
      throw new ApiError(409, 'Пользователь с таким email уже зарегистрирован')
    }
    const passwordHash = await bcrypt.hash(data.password, 10)
    const [user] = await db
      .insert(schema.users)
      .values({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
      })
      .returning()

    const devCode = await issueCode(user!.id, 'REGISTER', user!.email)
    res.status(201).json({
      message: 'Код подтверждения отправлен на email',
      email: user!.email,
      purpose: 'REGISTER',
      devCode,
    })
  }),
)

// POST /api/auth/login — проверка пароля, отправка кода 2FA
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body)
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, data.email) })
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new ApiError(401, 'Неверный email или пароль')
    }
    const purpose = user.isEmailVerified ? 'LOGIN' : 'REGISTER'
    const devCode = await issueCode(user.id, purpose, user.email)
    res.json({
      message: purpose === 'LOGIN' ? 'Код для входа отправлен на email' : 'Подтвердите email',
      email: user.email,
      purpose,
      devCode,
    })
  }),
)

// POST /api/auth/verify — подтверждение кода → выдача JWT
const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Код состоит из 6 цифр'),
  purpose: z.enum(['REGISTER', 'LOGIN']),
})

authRouter.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const data = verifySchema.parse(req.body)
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, data.email) })
    if (!user) throw new ApiError(404, 'Пользователь не найден')

    const record = await db.query.authCodes.findFirst({
      where: and(
        eq(schema.authCodes.userId, user.id),
        eq(schema.authCodes.purpose, data.purpose),
        isNull(schema.authCodes.consumedAt),
      ),
      orderBy: (c) => desc(c.createdAt),
    })
    if (!record) throw new ApiError(400, 'Код не запрашивался или уже использован')
    if (record.expiresAt < new Date()) throw new ApiError(400, 'Срок действия кода истёк')
    if (record.code !== data.code) throw new ApiError(400, 'Неверный код')

    await db.update(schema.authCodes).set({ consumedAt: new Date() }).where(eq(schema.authCodes.id, record.id))

    let updated = user
    if (data.purpose === 'REGISTER') {
      const [u] = await db
        .update(schema.users)
        .set({ isEmailVerified: true })
        .where(eq(schema.users.id, user.id))
        .returning()
      updated = u!
    }

    const token = signToken({ sub: updated.id, role: updated.role, email: updated.email })
    res.json({ token, user: publicUser(updated) })
  }),
)

// POST /api/auth/resend — повторно отправить код
authRouter.post(
  '/resend',
  asyncHandler(async (req, res) => {
    const data = z.object({ email: z.string().email(), purpose: z.enum(['REGISTER', 'LOGIN']) }).parse(req.body)
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, data.email) })
    if (!user) throw new ApiError(404, 'Пользователь не найден')
    const devCode = await issueCode(user.id, data.purpose, user.email)
    res.json({ message: 'Код отправлен повторно', devCode })
  }),
)

// GET /api/auth/me — текущий пользователь
authRouter.get(
  '/me',
  authRequired,
  asyncHandler(async (req, res) => {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, req.user!.sub) })
    if (!user) throw new ApiError(404, 'Пользователь не найден')
    res.json({ user: publicUser(user) })
  }),
)
