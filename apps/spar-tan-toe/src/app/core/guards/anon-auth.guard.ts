import { SupabaseAuth } from '@agora/supabase/auth'
import { SupabaseClientService } from '@agora/supabase/core'
import { inject } from '@angular/core'
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'

export const anonAuthGuard: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => Promise<boolean | null> =
	// route: ActivatedRouteSnapshot, state: RouterStateSnapshot
	async () => {
		const authService = inject(SupabaseAuth)
		const supabase = inject(SupabaseClientService)

		/**
		 * On client we will only call getSession, which only checks browser cookie for auth
		 * getSession also auto refresh token if needed, so no need for us to do especially since we run this on any page change
		 * On Serverside, for any api call we will call getUser to verify the user session is actually valid
		 *
		 */
		const { data } = await supabase.client.auth.getSession()
		if (data?.session) {
			console.log(data?.session)
			return true
		}
		const { data: newAnonSess } = await authService.signInAnon()
		console.log('new non ', newAnonSess)
		return !!newAnonSess
	}

// const router = inject(Router)

// console.log(_authService.isAuthenticated())

// This should only happen if you refreshed page or never authed
// console.log('Is Authed', _authService.isAuthenticated())

// if (_authService.isAuthenticated()) {
// 	_authService.user().
// 	// We may want to do a check against the refresh token
// 	return true
// }
// On client we only consider getSession.
// const expiresAt = session?.data?.session?.expires_at // Unix timestamp of token expiry
// const currentTime = Math.floor(Date.now() / 1000) // Current Unix timestamp

// if (expiresAt && expiresAt - currentTime < 60) {
// 	// Refresh token if it's about to expire (less than a minute left)
// 	const { error } = await supabase._supabase.auth.refreshSession()
// 	// cosnt {error} = await authService.session().
// 	if (error) {
// 		console.error('Token refresh failed:', error.message)
// 		return null
// 	}
// }

// Double check its actually the user
// const { data, error } = await _supabase.client.auth.getUser(session.data.session?.access_token)
// // console.log('User: ', data?.user)
// if (data?.user) {
// 	return true
// }
// TODO:
// We may want to doa few things different if maybe auth just needs refresh
// For now we will assume anon sign in
