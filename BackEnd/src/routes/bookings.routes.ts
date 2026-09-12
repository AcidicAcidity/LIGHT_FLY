import { Router } from 'express'
import { z } from 'zod'
import { desc, eq, sql } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { authRequired } from '../middleware/auth.js'
import { asyncHandler, ApiError } from '../middleware/errorHandler.js'
import { generateBookingRef, generateSeat } from '../utils/codes.js'
import { discountForTier, tierForSpent } from '../utils/discount.js'
import { serializeFlight } from './reference.routes.js'

export const bookingsRouter = Router()

function serializeBooking(b: any) {
  return {
    id: b.id,
    bookingRef: b.bookingRef,
    passengerName: b.passengerName,
    seat: b.seat,
    status: b.status,
    cabinClass: b.offer.cabinClass,
    basePrice: b.basePrice,
    discountPct: b.discountPct,
    pricePaid: b.pricePaid,
    milesEarned: b.milesEarned,
    createdAt: b.createdAt,
    flight: b.offer.flight ? serializeFlight(b.offer.flight) : undefined,
  }
}

const withOfferFlight = {
  offer: { with: { flight: { with: { departure: true, arrival: true, airline: true, offers: true } } } },
} as const

// POST /api/bookings — покупка билета по тарифному предложению
const createSchema = z.object({
  offerId: z.string().min(1),
  passengerName: z.string().min(1, 'Укажите имя пассажира').optional(),
})

bookingsRouter.post(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body)
    const userId = req.user!.sub

    const bookingId = await db.transaction(async (tx) => {
      const offer = await tx.query.ticketOffers.findFirst({ where: eq(schema.ticketOffers.id, data.offerId) })
      if (!offer) throw new ApiError(404, 'Тарифное предложение не найдено')
      if (offer.seatsAvailable <= 0) throw new ApiError(409, 'Мест на этот тариф больше нет')

      const user = await tx.query.users.findFirst({ where: eq(schema.users.id, userId) })
      if (!user) throw new ApiError(404, 'Пользователь не найден')

      const discountPct = discountForTier(user.tier)
      const basePrice = offer.price
      const pricePaid = Math.round(basePrice * (1 - discountPct / 100))
      const milesEarned = Math.round(pricePaid / 100)

      await tx
        .update(schema.ticketOffers)
        .set({ seatsAvailable: sql`${schema.ticketOffers.seatsAvailable} - 1` })
        .where(eq(schema.ticketOffers.id, offer.id))

      const passengerName = data.passengerName ?? `${user.firstName} ${user.lastName}`

      const [created] = await tx
        .insert(schema.bookings)
        .values({
          bookingRef: generateBookingRef(),
          userId,
          offerId: offer.id,
          passengerName,
          seat: generateSeat(),
          status: 'PAID',
          basePrice,
          discountPct,
          pricePaid,
          milesEarned,
        })
        .returning()

      const newTotal = user.totalSpent + pricePaid
      await tx
        .update(schema.users)
        .set({
          totalSpent: newTotal,
          bonusMiles: sql`${schema.users.bonusMiles} + ${milesEarned}`,
          tier: tierForSpent(newTotal),
        })
        .where(eq(schema.users.id, userId))

      return created!.id
    })

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, bookingId),
      with: withOfferFlight,
    })
    res.status(201).json(serializeBooking(booking))
  }),
)

// GET /api/bookings — мои брони
bookingsRouter.get(
  '/',
  authRequired,
  asyncHandler(async (req, res) => {
    const bookings = await db.query.bookings.findMany({
      where: eq(schema.bookings.userId, req.user!.sub),
      orderBy: (b) => desc(b.createdAt),
      with: withOfferFlight,
    })
    res.json(bookings.map(serializeBooking))
  }),
)

// POST /api/bookings/:id/cancel — отмена брони
bookingsRouter.post(
  '/:id/cancel',
  authRequired,
  asyncHandler(async (req, res) => {
    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, req.params.id) })
    if (!booking || booking.userId !== req.user!.sub) throw new ApiError(404, 'Бронь не найдена')
    if (booking.status === 'CANCELLED') throw new ApiError(400, 'Бронь уже отменена')

    await db.transaction(async (tx) => {
      await tx
        .update(schema.ticketOffers)
        .set({ seatsAvailable: sql`${schema.ticketOffers.seatsAvailable} + 1` })
        .where(eq(schema.ticketOffers.id, booking.offerId))
      await tx.update(schema.bookings).set({ status: 'CANCELLED' }).where(eq(schema.bookings.id, booking.id))
    })

    const updated = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, booking.id),
      with: withOfferFlight,
    })
    res.json(serializeBooking(updated))
  }),
)
