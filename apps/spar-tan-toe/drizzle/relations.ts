import { relations } from 'drizzle-orm/relations'
import { game, leaderboard, moves, profile, usersInAuth } from './schema'

export const profileRelations = relations(profile, ({ one, many }) => ({
	usersInAuth: one(usersInAuth, {
		fields: [profile.id],
		references: [usersInAuth.id],
	}),
	games_player_1: many(game, {
		relationName: 'game_player_1_profile_id',
	}),
	games_player_2: many(game, {
		relationName: 'game_player_2_profile_id',
	}),
	leaderboards: many(leaderboard),
	moves: many(moves),
}))

export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
	profiles: many(profile),
}))

export const gameRelations = relations(game, ({ one }) => ({
	profile_player_1: one(profile, {
		fields: [game.player_1],
		references: [profile.id],
		relationName: 'game_player_1_profile_id',
	}),
	profile_player_2: one(profile, {
		fields: [game.player_2],
		references: [profile.id],
		relationName: 'game_player_2_profile_id',
	}),
}))

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
	profile: one(profile, {
		fields: [leaderboard.player_id],
		references: [profile.id],
	}),
}))

export const movesRelations = relations(moves, ({ one }) => ({
	profile: one(profile, {
		fields: [moves.player_id],
		references: [profile.id],
	}),
}))
