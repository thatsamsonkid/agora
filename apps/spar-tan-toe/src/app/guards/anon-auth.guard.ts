import { SupabaseAuth } from '@agora/supabase/auth'
import { inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'

export const anonAuthGuard: CanActivateFn = async (route, state) => {
	const _authService = inject(SupabaseAuth)
	if (!_authService.isAuthenticated()) {
		const res = await _authService.signInAnon()
		console.log(res)
	}
	return true
}
