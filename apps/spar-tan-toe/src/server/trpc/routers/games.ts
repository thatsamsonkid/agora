import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { db } from '../../../db';
import { game } from '../../../drizzle/schema';
// import { eq } from 'drizzle-orm';

export const gameRouter = router({
  create: publicProcedure
    .input(z.object({}))
    .mutation(
      async ({ input }) =>
        await db.insert(game).values({}).returning({ id: game.id })
    ),
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
});
