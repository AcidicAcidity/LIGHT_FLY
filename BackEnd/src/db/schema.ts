import { randomUUID } from 'node:crypto'
import { relations } from 'drizzle-orm'
import { boolean, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

const id = () => text('id').primaryKey().$defaultFn(() => randomUUID())

// ------------------- Перечисления -------------------
export const roleEnum = pgEnum('role', ['USER', 'MANAGER', 'ADMIN'])
export const tierEnum = pgEnum('loyalty_tier', ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'])
export const authPurposeEnum = pgEnum('auth_code_purpose', ['REGISTER', 'LOGIN'])
export const flightStatusEnum = pgEnum('flight_status', [
  'SCHEDULED',
  'BOARDING',
  'DEPARTED',
  'ARRIVED',
  'DELAYED',
  'CANCELLED',
])
export const cabinClassEnum = pgEnum('cabin_class', ['ECONOMY', 'BUSINESS', 'FIRST'])
export const bookingStatusEnum = pgEnum('booking_status', ['BOOKED', 'PAID', 'CANCELLED'])

// ------------------- Пользователи -------------------
export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  role: roleEnum('role').notNull().default('USER'),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  tier: tierEnum('tier').notNull().default('BRONZE'),
  bonusMiles: integer('bonus_miles').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const authCodes = pgTable('auth_codes', {
  id: id(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  purpose: authPurposeEnum('purpose').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  consumedAt: timestamp('consumed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ------------------- Справочники -------------------
export const airports = pgTable('airports', {
  id: id(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  timezone: text('timezone').notNull().default('Europe/Moscow'),
  isHome: boolean('is_home').notNull().default(false),
})

export const airlines = pgTable('airlines', {
  id: id(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  logoText: text('logo_text').notNull(),
  color: text('color').notNull().default('#1d4ed8'),
  description: text('description').notNull(),
})

// ------------------- Рейсы и билеты -------------------
export const flights = pgTable('flights', {
  id: id(),
  flightNumber: text('flight_number').notNull(),
  airlineId: text('airline_id')
    .notNull()
    .references(() => airlines.id),
  departureId: text('departure_id')
    .notNull()
    .references(() => airports.id),
  arrivalId: text('arrival_id')
    .notNull()
    .references(() => airports.id),
  departureTime: timestamp('departure_time').notNull(),
  arrivalTime: timestamp('arrival_time').notNull(),
  aircraft: text('aircraft').notNull().default('Airbus A320'),
  terminal: text('terminal'),
  gate: text('gate'),
  status: flightStatusEnum('status').notNull().default('SCHEDULED'),
})

export const ticketOffers = pgTable('ticket_offers', {
  id: id(),
  flightId: text('flight_id')
    .notNull()
    .references(() => flights.id, { onDelete: 'cascade' }),
  cabinClass: cabinClassEnum('cabin_class').notNull().default('ECONOMY'),
  price: integer('price').notNull(),
  seatsTotal: integer('seats_total').notNull().default(60),
  seatsAvailable: integer('seats_available').notNull().default(60),
  baggageKg: integer('baggage_kg').notNull().default(20),
  refundable: boolean('refundable').notNull().default(false),
})

export const bookings = pgTable('bookings', {
  id: id(),
  bookingRef: text('booking_ref').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  offerId: text('offer_id')
    .notNull()
    .references(() => ticketOffers.id),
  passengerName: text('passenger_name').notNull(),
  seat: text('seat'),
  status: bookingStatusEnum('status').notNull().default('PAID'),
  basePrice: integer('base_price').notNull(),
  discountPct: integer('discount_pct').notNull().default(0),
  pricePaid: integer('price_paid').notNull(),
  milesEarned: integer('miles_earned').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ------------------- Связи (для relational queries) -------------------
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  authCodes: many(authCodes),
}))

export const authCodesRelations = relations(authCodes, ({ one }) => ({
  user: one(users, { fields: [authCodes.userId], references: [users.id] }),
}))

export const airlinesRelations = relations(airlines, ({ many }) => ({
  flights: many(flights),
}))

export const airportsRelations = relations(airports, ({ many }) => ({
  departures: many(flights, { relationName: 'departureAirport' }),
  arrivals: many(flights, { relationName: 'arrivalAirport' }),
}))

export const flightsRelations = relations(flights, ({ one, many }) => ({
  airline: one(airlines, { fields: [flights.airlineId], references: [airlines.id] }),
  departure: one(airports, {
    fields: [flights.departureId],
    references: [airports.id],
    relationName: 'departureAirport',
  }),
  arrival: one(airports, {
    fields: [flights.arrivalId],
    references: [airports.id],
    relationName: 'arrivalAirport',
  }),
  offers: many(ticketOffers),
}))

export const ticketOffersRelations = relations(ticketOffers, ({ one, many }) => ({
  flight: one(flights, { fields: [ticketOffers.flightId], references: [flights.id] }),
  bookings: many(bookings),
}))

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  offer: one(ticketOffers, { fields: [bookings.offerId], references: [ticketOffers.id] }),
}))

// Типы
export type User = typeof users.$inferSelect
export type Airport = typeof airports.$inferSelect
export type Airline = typeof airlines.$inferSelect
export type Flight = typeof flights.$inferSelect
export type TicketOffer = typeof ticketOffers.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type Role = (typeof roleEnum.enumValues)[number]
export type LoyaltyTier = (typeof tierEnum.enumValues)[number]
export type CabinClass = (typeof cabinClassEnum.enumValues)[number]
