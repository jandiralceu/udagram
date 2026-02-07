import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.js'

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING!,
})

export const db = drizzle({ client: pool, schema })
