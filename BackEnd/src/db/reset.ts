import 'dotenv/config'
import pg from 'pg'

// Полный сброс схемы public (удобно при изменении схемы в учебном проекте)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;')
  console.log('🗑️  Схема public сброшена.')
}

main()
  .then(() => pool.end())
  .catch(async (e) => {
    console.error(e)
    await pool.end()
    process.exit(1)
  })
