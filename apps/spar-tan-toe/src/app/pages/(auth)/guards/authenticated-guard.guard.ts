import { SupabaseAuth } from '@agora/supabase/auth';
import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';

export const authenticatedGuardGuard: CanActivateFn = (_route, _state) => {
	const _authService = inject(SupabaseAuth);
	return !!_authService.isAuthenticated();
};
