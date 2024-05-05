import { router } from '../trpc';
import { gameRouter } from './games';
// import { noteRouter } from './notes';

export const appRouter = router({
  game: gameRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
