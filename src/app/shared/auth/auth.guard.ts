import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { AuthTokenService } from './auth-token.service';

/**
 * Functional Route Guard (Angular 21) that:
 * 1. Restricts access to authenticated users with a valid token,
 *    redirecting unauthenticated users to `/login` with `returnUrl`.
 * 2. Optionally checks required roles defined in `route.data.roles`.
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const tokenService = inject(AuthTokenService);
  const router = inject(Router);

  if (!tokenService.hasToken()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const expectedRoles = route.data?.['roles'] as string | string[] | undefined;
  if (expectedRoles && (Array.isArray(expectedRoles) ? expectedRoles.length > 0 : true)) {
    const hasRequiredRole = tokenService.hasRole(expectedRoles);
    if (!hasRequiredRole) {
      return router.createUrlTree(['/login'], {
        queryParams: { unauthorized: 'true' },
      });
    }
  }

  return true;
};
