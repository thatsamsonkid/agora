import { SupabaseAuth } from '@agora/supabase/auth'
import { inject } from '@angular/core'
import { type CanActivateFn, Router } from '@angular/router'

export const unauthenticatedGuard: CanActivateFn = () => {
	const _authService = inject(SupabaseAuth)
	const router = inject(Router)

	if (!_authService.isAuthenticated()) {
		return true
	}
	router.navigate(['/']) // Redirect to login or fallback route
	return false
}
