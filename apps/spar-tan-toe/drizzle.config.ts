import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config({
	path: '.env.local',
})

export default defineConfig({
	schema: ['./src/db.ts', './drizzle/schema.ts'],
	dialect: 'postgresql',
	out: './drizzle',
	dbCredentials: {
		url: process.env['DATABASE_URL'] || '',
	},
	verbose: true,
	strict: true,
})
