import { Router } from 'express'
import { asc, eq, gte } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { asyncHandler, ApiError } from '../middleware/errorHandler.js'

export const referenceRouter = Router()

// GET /api/airports — список аэропортов
referenceRouter.get(
  '/airports',
  asyncHandler(async (_req, res) => {
    const airports = await db.query.airports.findMany({ orderBy: (a) => asc(a.city) })
    res.json(airports)
  }),
)

// GET /api/airlines — список авиакомпаний с числом рейсов
referenceRouter.get(
  '/airlines',
  asyncHandler(async (_req, res) => {
    const airlines = await db.query.airlines.findMany({
      orderBy: (a) => asc(a.name),
      with: { flights: { columns: { id: true } } },
    })
    res.json(
      airlines.map((a) => {
        const { flights, ...rest } = a
        return { ...rest, flightsCount: flights.length }
      }),
    )
  }),
)

// GET /api/airlines/:code — авиакомпания и её ближайшие рейсы
referenceRouter.get(
  '/airlines/:code',
  asyncHandler(async (req, res) => {
    const airline = await db.query.airlines.findFirst({
      where: eq(schema.airlines.code, req.params.code.toUpperCase()),
    })
    if (!airline) throw new ApiError(404, 'Авиакомпания не найдена')

    const flights = await db.query.flights.findMany({
      where: (f, { and }) => and(eq(f.airlineId, airline.id), gte(f.departureTime, new Date())),
      orderBy: (f) => asc(f.departureTime),
      limit: 30,
      with: { departure: true, arrival: true, airline: true, offers: true },
    })
    res.json({ airline, flights: flights.map(serializeFlight) })
  }),
)

// Сериализация рейса с минимальной ценой
export function serializeFlight(f: any) {
  const prices = (f.offers ?? []).map((o: any) => o.price)
  return {
    id: f.id,
    flightNumber: f.flightNumber,
    airline: { code: f.airline.code, name: f.airline.name, logoText: f.airline.logoText, color: f.airline.color },
    departure: { code: f.departure.code, city: f.departure.city, name: f.departure.name },
    arrival: { code: f.arrival.code, city: f.arrival.city, name: f.arrival.name },
    departureTime: f.departureTime,
    arrivalTime: f.arrivalTime,
    durationMin: Math.round((new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()) / 60000),
    aircraft: f.aircraft,
    terminal: f.terminal,
    gate: f.gate,
    status: f.status,
    minPrice: prices.length ? Math.min(...prices) : null,
    offers: (f.offers ?? [])
      .slice()
      .sort((a: any, b: any) => a.price - b.price)
      .map((o: any) => ({
        id: o.id,
        cabinClass: o.cabinClass,
        price: o.price,
        seatsAvailable: o.seatsAvailable,
        baggageKg: o.baggageKg,
        refundable: o.refundable,
      })),
  }
}
