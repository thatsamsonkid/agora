import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { game } from '../../../../drizzle/schema'
import { db } from '../../../db'
import { publicProcedure, router } from '../trpc'

export const gameRouter = router({
	create: publicProcedure
		.input(z.object({}))
		.mutation(async ({ input }) => await db.insert(game).values({}).returning({ id: game.id })),
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
