import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'

import * as schema from '../db/schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const setupTestDb = async () => {
  const client = new PGlite()
  const db = drizzle(client, { schema })

  // Run migrations to create tables
  // Adjust path to point to your migrations folder relative to this file
  await migrate(db, {
    migrationsFolder: path.join(__dirname, '../../migrations'),
  })

  return { db, client }
}
