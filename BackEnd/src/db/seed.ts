import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'
import type { CabinClass } from './schema.js'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

const AIRPORTS = [
  { code: 'LFL', name: 'Международный аэропорт LIGHT FLY', city: 'Светлоград', country: 'Россия', isHome: true },
  { code: 'SVO', name: 'Шереметьево', city: 'Москва', country: 'Россия', isHome: false },
  { code: 'LED', name: 'Пулково', city: 'Санкт-Петербург', country: 'Россия', isHome: false },
  { code: 'AER', name: 'Сочи', city: 'Сочи', country: 'Россия', isHome: false },
  { code: 'SVX', name: 'Кольцово', city: 'Екатеринбург', country: 'Россия', isHome: false },
  { code: 'KZN', name: 'Казань', city: 'Казань', country: 'Россия', isHome: false },
  { code: 'OVB', name: 'Толмачёво', city: 'Новосибирск', country: 'Россия', isHome: false },
  { code: 'KRR', name: 'Пашковский', city: 'Краснодар', country: 'Россия', isHome: false },
  { code: 'UFA', name: 'Уфа', city: 'Уфа', country: 'Россия', isHome: false },
  { code: 'VVO', name: 'Кневичи', city: 'Владивосток', country: 'Россия', isHome: false },
]

const AIRLINES = [
  { code: 'SU', name: 'Аэрофлот', country: 'Россия', logoText: 'SU', color: '#00458b', description: 'Флагманский перевозчик России с широкой сетью внутренних и международных маршрутов.' },
  { code: 'S7', name: 'S7 Airlines', country: 'Россия', logoText: 'S7', color: '#5aa800', description: 'Крупнейшая частная авиакомпания России, современный парк и удобные стыковки.' },
  { code: 'DP', name: 'Победа', country: 'Россия', logoText: 'DP', color: '#00954c', description: 'Лоукостер группы Аэрофлот — низкие цены на прямые рейсы по стране.' },
  { code: 'U6', name: 'Уральские авиалинии', country: 'Россия', logoText: 'U6', color: '#e30613', description: 'Авиакомпания с развитой маршрутной сетью по России, СНГ и за рубежом.' },
  { code: 'FV', name: 'Россия', country: 'Россия', logoText: 'FV', color: '#d52b1e', description: 'Авиакомпания группы Аэрофлот, выполняет рейсы по России и популярным курортам.' },
  { code: 'UT', name: 'ЮТэйр', country: 'Россия', logoText: 'UT', color: '#005baa', description: 'Перевозчик с сильной региональной сетью и вертолётными операциями.' },
]

const AIRCRAFT = ['Airbus A320', 'Airbus A321', 'Boeing 737-800', 'Sukhoi Superjet 100', 'Boeing 777-300ER']

const ROUTE_BASE_PRICE: Record<string, number> = {
  SVO: 4500, LED: 5200, AER: 7800, SVX: 6900, KZN: 5600,
  OVB: 11200, KRR: 7400, UFA: 6300, VVO: 18500,
}
const CLASS_MULT: Record<CabinClass, number> = { ECONOMY: 1, BUSINESS: 2.6, FIRST: 4.2 }
const CLASS_BAGGAGE: Record<CabinClass, number> = { ECONOMY: 20, BUSINESS: 32, FIRST: 40 }

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}
function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}

async function main() {
  console.log('🌱 Очистка и заполнение базы данных...')
  // Очистка (в порядке зависимостей)
  await db.delete(schema.bookings)
  await db.delete(schema.ticketOffers)
  await db.delete(schema.flights)
  await db.delete(schema.authCodes)
  await db.delete(schema.users)
  await db.delete(schema.airlines)
  await db.delete(schema.airports)

  const airports = await db.insert(schema.airports).values(AIRPORTS).returning()
  const home = airports.find((a) => a.isHome)!
  const destinations = airports.filter((a) => !a.isHome)

  const airlines = await db.insert(schema.airlines).values(AIRLINES).returning()

  const now = new Date()
  const offerRows: (typeof schema.ticketOffers.$inferInsert)[] = []
  const flightRows: (typeof schema.flights.$inferInsert)[] = []

  // Собираем рейсы, затем тарифы (нужен flightId, поэтому вставляем рейсы, потом тарифы)
  type Pending = { row: typeof schema.flights.$inferInsert; destCode: string }
  const pending: Pending[] = []

  for (let day = 0; day < 14; day++) {
    for (const dest of destinations) {
      const flightsToday = randInt(1, 2)
      for (let n = 0; n < flightsToday; n++) {
        const durationMin = randInt(90, 540)

        // Вылет из LFL
        const airline = rand(airlines)
        const dep = new Date(now)
        dep.setDate(now.getDate() + day)
        dep.setHours(randInt(6, 22), rand([0, 15, 30, 45]), 0, 0)
        pending.push({
          row: {
            flightNumber: `${airline.code}${randInt(1000, 9999)}`,
            airlineId: airline.id,
            departureId: home.id,
            arrivalId: dest.id,
            departureTime: dep,
            arrivalTime: new Date(dep.getTime() + durationMin * 60000),
            aircraft: rand(AIRCRAFT),
            terminal: rand(['A', 'B']),
            gate: `${rand(['A', 'B', 'C', 'D'])}${randInt(1, 24)}`,
            status: day === 0 ? rand(['SCHEDULED', 'SCHEDULED', 'BOARDING', 'DELAYED'] as const) : 'SCHEDULED',
          },
          destCode: dest.code,
        })

        // Прилёт в LFL
        const airline2 = rand(airlines)
        const dep2 = new Date(now)
        dep2.setDate(now.getDate() + day)
        dep2.setHours(randInt(6, 22), rand([0, 15, 30, 45]), 0, 0)
        pending.push({
          row: {
            flightNumber: `${airline2.code}${randInt(1000, 9999)}`,
            airlineId: airline2.id,
            departureId: dest.id,
            arrivalId: home.id,
            departureTime: dep2,
            arrivalTime: new Date(dep2.getTime() + durationMin * 60000),
            aircraft: rand(AIRCRAFT),
            terminal: rand(['A', 'B']),
            gate: `${rand(['A', 'B', 'C', 'D'])}${randInt(1, 24)}`,
            status: day === 0 ? rand(['SCHEDULED', 'SCHEDULED', 'ARRIVED', 'DELAYED'] as const) : 'SCHEDULED',
          },
          destCode: dest.code,
        })
      }
    }
  }

  flightRows.push(...pending.map((p) => p.row))
  const insertedFlights = await db.insert(schema.flights).values(flightRows).returning()

  // Тарифы
  insertedFlights.forEach((f, i) => {
    const destCode = pending[i]!.destCode
    const base = ROUTE_BASE_PRICE[destCode] ?? 6000
    const classes: CabinClass[] = ['ECONOMY', 'BUSINESS', 'FIRST']
    const active = Math.random() > 0.5 ? classes : classes.slice(0, 2)
    for (const c of active) {
      const jitter = 0.85 + Math.random() * 0.4
      const price = Math.round((base * CLASS_MULT[c] * jitter) / 100) * 100
      const seatsTotal = c === 'ECONOMY' ? 120 : c === 'BUSINESS' ? 20 : 8
      offerRows.push({
        flightId: f.id,
        cabinClass: c,
        price,
        seatsTotal,
        seatsAvailable: randInt(Math.floor(seatsTotal * 0.3), seatsTotal),
        baggageKg: CLASS_BAGGAGE[c],
        refundable: c !== 'ECONOMY' || Math.random() > 0.6,
      })
    }
  })
  await db.insert(schema.ticketOffers).values(offerRows)

  // Пользователи
  await db.insert(schema.users).values([
    {
      email: 'demo@lightfly.ru',
      passwordHash: await bcrypt.hash('password123', 10),
      firstName: 'Артём',
      lastName: 'Фарниев',
      phone: '+7 999 123-45-67',
      role: 'USER',
      isEmailVerified: true,
      tier: 'SILVER',
      totalSpent: 42000,
      bonusMiles: 420,
    },
    {
      email: 'admin@lightfly.ru',
      passwordHash: await bcrypt.hash('admin123', 10),
      firstName: 'Ника',
      lastName: 'Толстикова',
      role: 'ADMIN',
      isEmailVerified: true,
      tier: 'PLATINUM',
      totalSpent: 300000,
      bonusMiles: 3000,
    },
  ])

  console.log(
    `✅ Готово: ${airports.length} аэропортов, ${airlines.length} авиакомпаний, ${insertedFlights.length} рейсов, ${offerRows.length} тарифов.`,
  )
  console.log('   Демо-логины: demo@lightfly.ru / password123  и  admin@lightfly.ru / admin123')
}

main()
  .then(() => pool.end())
  .catch(async (e) => {
    console.error(e)
    await pool.end()
    process.exit(1)
  })
