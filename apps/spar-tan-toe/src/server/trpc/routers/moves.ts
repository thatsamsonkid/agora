import { z } from 'zod'
import { db } from '../../../db'
import { game, moves } from '../../../db/schema'
import { publicProcedure, router } from '../trpc'

export const movesRouter = router({
	create: publicProcedure
		.input(
			z.object({
				gameId: z.string(),
				playerId: z.string(),
				row: z.number(),
				column: z.number(),
				symbol: z.number(),
			}),
		)
		.mutation(async ({ input }) => {
			console.log(moves.id?.default)
			return await db
				.insert(moves)
				.values({
					game_id: input.gameId,
					player_id: input.playerId,
					row: input.row,
					column: input.column,
					symbol: input.symbol,
				})
				.returning({ id: game.id })
		}),
	//   list: publicProcedure.query(() => async () => {
	//     const selectedNotes = await db.select().from(notes);
	//     return selectedNotes.map((note) => ({ ...note, id: +note.id }));
	//   }),
	//   remove: publicProcedure
	//     .input(
	//       z.object({
	//         id: z.number(),
	//       })
	//     )
	//     .mutation(
	//       async ({ input }) =>
	//         await db.delete(notes).where(eq(notes.id, input.id)).returning()
	//     ),
})
