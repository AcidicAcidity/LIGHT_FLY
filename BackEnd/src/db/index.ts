import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '../config/env.js'
import * as schema from './schema.js'

const pool = new pg.Pool({ connectionString: env.databaseUrl })

export const db = drizzle(pool, { schema })
export { schema }
export type DB = typeof db
