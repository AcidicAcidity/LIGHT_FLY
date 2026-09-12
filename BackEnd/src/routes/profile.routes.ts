import { Router } from 'express'
import { z } from 'zod'
import { and, eq, ne, count } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { authRequired } from '../middleware/auth.js'
import { asyncHandler, ApiError } from '../middleware/errorHandler.js'
import { tierInfo, discountForTier, TIERS } from '../utils/discount.js'

export const profileRouter = Router()

// GET /api/profile — профиль + скидочная программа + статистика
profileRouter.get(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, req.user!.sub) })
    if (!user) throw new ApiError(404, 'Пользователь не найден')

    const info = tierInfo(user.tier)
    const [{ value: bookingsCount }] = await db
      .select({ value: count() })
      .from(schema.bookings)
      .where(and(eq(schema.bookings.userId, user.id), ne(schema.bookings.status, 'CANCELLED')))

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
      loyalty: {
        tier: user.tier,
        tierLabel: info.current.label,
        discountPct: discountForTier(user.tier),
        bonusMiles: user.bonusMiles,
        totalSpent: user.totalSpent,
        next: info.next
          ? {
              tier: info.next.tier,
              label: info.next.label,
              discountPct: info.next.discountPct,
              minSpent: info.next.minSpent,
              remaining: Math.max(0, info.next.minSpent - user.totalSpent),
            }
          : null,
        allTiers: TIERS,
      },
      stats: { bookingsCount: bookingsCount ?? 0 },
    })
  }),
)

// PATCH /api/profile — обновление профиля
const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
})

profileRouter.patch(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body)
    const [user] = await db.update(schema.users).set(data).where(eq(schema.users.id, req.user!.sub)).returning()
    if (!user) throw new ApiError(404, 'Пользователь не найден')
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    })
  }),
)
