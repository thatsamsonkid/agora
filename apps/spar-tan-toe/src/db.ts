import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { createInsertSchema } from 'drizzle-zod'
import postgres from 'postgres'
import { z } from 'zod'
import { moves } from './db/schema'

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(process.env.DATABASE_URL ?? '', { prepare: false })
export const db = drizzle(client)

export const migrateToLatest = async () => {
	await migrate(db, { migrationsFolder: 'drizzle' })
	await client.end()
}

export const insertMovesSchema = createInsertSchema(moves, { id: z.number() })
