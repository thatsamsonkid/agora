import {
  pgTable,
  uuid,
  timestamp,
  bigint,
  varchar,
  primaryKey,
  serial,
  smallint,
  integer,
  pgSchema,
} from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');

export const users = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const game = pgTable('game', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
});

export const leaderboard = pgTable('leaderboard', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint('id', { mode: 'number' }).primaryKey().notNull(),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  game_id: uuid('game_id'),
  player_id: uuid('player_id'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  score: bigint('score', { mode: 'number' }),
});

export const profile = pgTable('profile', {
  id: uuid('id')
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }),
});

export const moves = pgTable(
  'moves',
  {
    id: serial('id').notNull(),
    created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    game_id: uuid('game_id').notNull(),
    player_id: uuid('player_id'),
    symbol: smallint('symbol'),
    row: integer('row'),
    column: integer('column'),
  },
  (table) => {
    return {
      moves_game_id_id_pk: primaryKey({
        columns: [table.id, table.game_id],
        name: 'moves_game_id_id_pk',
      }),
    };
  }
);
