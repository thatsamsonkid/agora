import { bigint, integer, pgTable, primaryKey, serial, smallint, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const profile = pgTable('profile', {
	id: uuid('id')
		.primaryKey()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar('name', { length: 256 }).notNull(),
	email: varchar('email', { length: 256 }),
})

export const game = pgTable('game', {
	id: uuid('id').defaultRandom().primaryKey().notNull(),
	created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	player_1: uuid('player_1').references(() => profile.id),
	player_2: uuid('player_2').references(() => profile.id),
})

export const leaderboard = pgTable('leaderboard', {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint('id', { mode: 'number' }).primaryKey().notNull(),
	created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	game_id: uuid('game_id'),
	player_id: uuid('player_id').references(() => profile.id),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	score: bigint('score', { mode: 'number' }),
})

export const moves = pgTable(
	'moves',
	{
		id: serial('id').notNull(),
		created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
		game_id: uuid('game_id').notNull(),
		player_id: uuid('player_id').references(() => profile.id),
		symbol: smallint('symbol'),
		row: integer('row'),
		column: integer('column'),
	},
	(table) => {
		return {
			moves_game_id_id_pk: primaryKey({ columns: [table.id, table.game_id], name: 'moves_game_id_id_pk' }),
		}
	},
)
