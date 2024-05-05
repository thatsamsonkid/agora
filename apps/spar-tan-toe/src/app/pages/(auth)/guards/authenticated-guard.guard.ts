import { SupabaseAuth } from '@agora/supabase/auth';
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

export const authenticatedGuardGuard: CanActivateFn = (route, state) => {
  const _authService = inject(SupabaseAuth);
  return !!_authService.isAuthenticated();
};
