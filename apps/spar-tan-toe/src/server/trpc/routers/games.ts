import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db'
import { game } from '../../../db/schema'
import { authProcedure, publicProcedure, router } from '../trpc'

//Interesting concept
// async ({ input }) => {
// 	const { data, error } = await supabase.rpc('create_record', { data: input })
// 	if (error) {
// 		throw new Error(error.message)
// 	}

// 	return data
// 	// Return the response data
// },

export const gameRouter = router({
	create: authProcedure.mutation(async ({ ctx }) => {
		try {
			if (!ctx.supabase?.user) {
				throw new Error('Unauthenticated')
			}
			const newGame = (
				await db
					.insert(game)
					.values({ player_1: ctx.supabase.user?.id } as any)
					.returning()
			).at(0)

			if (!newGame) {
				throw new Error('Failed to create a new game')
			}
			return newGame
		} catch (error) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'An unexpected error occurred, please try again later.',
				cause: error,
			})
		}
	}),
	join: authProcedure
		.input(
			z.object({
				gameId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const joinedGame = await db
				.update(game)
				.set({ id: input.gameId, player_2: ctx.supabase.user?.id })
				.where(eq(game.id, input.gameId))
				.returning()
			if (!joinedGame) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unexpected error occurred, please try again later.',
				})
			}
			return joinedGame
		}),
	select: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input }) => await db.select().from(game).where(eq(game.id, input.id))),
	// remove: publicProcedure
	//   .input(
	//     z.object({
	//       id: z.number(),
	//     })
	//   )
	//   .mutation(
	//     async ({ input }) =>
	//       await db.delete(game).where(eq(game.id, input.id)).returning()
	//   ),
})
