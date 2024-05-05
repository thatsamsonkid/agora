import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const client = postgres(process.env['DATABASE_URL'] ?? '');
export const db = drizzle(client);

export const migrateToLatest = async () => {
  await migrate(db, { migrationsFolder: 'drizzle' });
  await client.end();
};
