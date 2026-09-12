import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.routes.js'
import { referenceRouter } from './routes/reference.routes.js'
import { flightsRouter } from './routes/flights.routes.js'
import { bookingsRouter } from './routes/bookings.routes.js'
import { profileRouter } from './routes/profile.routes.js'
import { infoRouter } from './routes/info.routes.js'

const app = express()

app.use(
  cors({
    origin(origin, cb) {
      // Разрешаем запросы без Origin (curl, серверные) и из списка разрешённых
      if (!origin || env.clientOrigin.includes(origin)) return cb(null, true)
      return cb(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json())

// Health-check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'LIGHT_FLY API', time: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api', referenceRouter) // /api/airports, /api/airlines
app.use('/api/flights', flightsRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/profile', profileRouter)
app.use('/api/info', infoRouter)

// 404
app.use((_req, res) => res.status(404).json({ message: 'Маршрут не найден' }))

app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`\n🛫  LIGHT_FLY API запущен на http://localhost:${env.port}`)
  console.log(`    Режим: ${env.nodeEnv}`)
  console.log(`    CORS origin: ${env.clientOrigin.join(', ')}\n`)
})
