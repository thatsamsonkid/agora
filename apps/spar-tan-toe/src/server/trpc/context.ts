import type { inferAsyncReturnType } from '@trpc/server'
import { type H3Event, getRequestHeader } from 'h3'
/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */

// Splitting context and having supabase available in inner context on all procedures could be handy

// inner context
// interface CreateInnerContextOptions extends Partial<CreateNextContextOptions> {
// 	supabase: SupabaseClient | null
// }

// outer context
// export async function createContextInner(opts?: CreateInnerContextOptions) {
// 	return {
// 		supabase: (opts?.supabase as SupabaseClient) ?? null,
// 	}
// }

export async function createContext(event: H3Event) {
	const authorization = getRequestHeader(event, 'authorization')
	// const supabase = createBrowserClient(import.meta.env.VITE_PROJECT_URL, import.meta.env.VITE_DATABASE_PUB_KEY)
	// const contextInner = await createContextInner({ supabase })
	const authToken = authorization?.split(' ')[1]
	return {
		isAuthed: authToken && authToken?.length > 0,
		authToken: authToken,
	}
}

export type Context = inferAsyncReturnType<typeof createContext>
