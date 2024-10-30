import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db'
import { game } from '../../../db/schema'
import { authProcedure, publicProcedure, router } from '../trpc'

export const gameRouter = router({
	create: authProcedure.mutation(
		async ({ ctx }) => await db.insert(game).values({ player_1: ctx.session.user.id }).returning({ id: game.id }),
	),
	select: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(async ({ input }) => await db.select().from(game).where(eq(game.id, input.id))),
	// list: publicProcedure.query(() => async () => {
	//   const selectedNotes = await db.select().from(game);
	//   return selectedNotes.map((note) => ({ ...note, id: +note.id }));
	// }),
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
