import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { moves } from '../drizzle/schema';
import { z } from 'zod';

const client = postgres(process.env['DATABASE_URL'] ?? '');
export const db = drizzle(client);

export const migrateToLatest = async () => {
  await migrate(db, { migrationsFolder: 'drizzle' });
  await client.end();
};

export const insertMovesSchema = createInsertSchema(moves, { id: z.number() });
