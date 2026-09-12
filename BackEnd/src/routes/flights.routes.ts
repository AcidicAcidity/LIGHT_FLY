import { Router } from 'express'
import { z } from 'zod'
import { and, asc, eq, gte, lte, ne, type SQL } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { asyncHandler, ApiError } from '../middleware/errorHandler.js'
import { serializeFlight } from './reference.routes.js'

export const flightsRouter = Router()

// GET /api/flights/board?type=departures|arrivals — табло рейсов аэропорта LIGHT FLY
flightsRouter.get(
  '/board',
  asyncHandler(async (req, res) => {
    const type = req.query.type === 'arrivals' ? 'arrivals' : 'departures'
    const home = await db.query.airports.findFirst({ where: eq(schema.airports.isHome, true) })
    if (!home) throw new ApiError(500, 'Домашний аэропорт не настроен')

    const flights = await db.query.flights.findMany({
      where: (f) => (type === 'departures' ? eq(f.departureId, home.id) : eq(f.arrivalId, home.id)),
      orderBy: (f) => asc(f.departureTime),
      limit: 40,
      with: { departure: true, arrival: true, airline: true, offers: true },
    })
    res.json({ type, airport: home, flights: flights.map(serializeFlight) })
  }),
)

// GET /api/flights — поиск рейсов (используется маркетом)
const searchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(), // YYYY-MM-DD
  airline: z.string().optional(),
  cabinClass: z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).optional(),
  sort: z.enum(['price', 'departure', 'duration']).optional(),
})

flightsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = searchSchema.parse(req.query)

    // Разрешаем коды аэропортов/авиакомпаний в id
    let fromId: string | undefined
    let toId: string | undefined
    let airlineId: string | undefined
    if (q.from) {
      const a = await db.query.airports.findFirst({ where: eq(schema.airports.code, q.from.toUpperCase()) })
      if (!a) return res.json({ count: 0, flights: [] })
      fromId = a.id
    }
    if (q.to) {
      const a = await db.query.airports.findFirst({ where: eq(schema.airports.code, q.to.toUpperCase()) })
      if (!a) return res.json({ count: 0, flights: [] })
      toId = a.id
    }
    if (q.airline) {
      const a = await db.query.airlines.findFirst({ where: eq(schema.airlines.code, q.airline.toUpperCase()) })
      if (!a) return res.json({ count: 0, flights: [] })
      airlineId = a.id
    }

    const conds: SQL[] = [ne(schema.flights.status, 'CANCELLED')]
    if (fromId) conds.push(eq(schema.flights.departureId, fromId))
    if (toId) conds.push(eq(schema.flights.arrivalId, toId))
    if (airlineId) conds.push(eq(schema.flights.airlineId, airlineId))
    if (q.date) {
      conds.push(gte(schema.flights.departureTime, new Date(`${q.date}T00:00:00`)))
      conds.push(lte(schema.flights.departureTime, new Date(`${q.date}T23:59:59`)))
    } else {
      conds.push(gte(schema.flights.departureTime, new Date()))
    }

    const flights = await db.query.flights.findMany({
      where: and(...conds),
      orderBy: (f) => asc(f.departureTime),
      limit: 100,
      with: { departure: true, arrival: true, airline: true, offers: true },
    })

    let result = flights.map(serializeFlight)

    // Фильтр по классу (среди тарифов с доступными местами)
    if (q.cabinClass) {
      result = result.filter((f) =>
        f.offers.some((o: any) => o.cabinClass === q.cabinClass && o.seatsAvailable > 0),
      )
    }

    if (q.sort === 'price') {
      result = result.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity))
    } else if (q.sort === 'duration') {
      result = result.sort((a, b) => a.durationMin - b.durationMin)
    }

    res.json({ count: result.length, flights: result })
  }),
)

// GET /api/flights/:id — детали рейса
flightsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const flight = await db.query.flights.findFirst({
      where: eq(schema.flights.id, req.params.id),
      with: { departure: true, arrival: true, airline: true, offers: true },
    })
    if (!flight) throw new ApiError(404, 'Рейс не найден')
    res.json(serializeFlight(flight))
  }),
)
