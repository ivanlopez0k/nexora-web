import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthTokenService } from './auth-token.service';

function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

describe('authGuard', () => {
  let tokenService: AuthTokenService;
  let router: Router;

  const mockRoute = (data: Record<string, unknown> = {}): ActivatedRouteSnapshot =>
    ({ data } as unknown as ActivatedRouteSnapshot);

  const mockState = (url = '/dashboard'): RouterStateSnapshot =>
    ({ url } as unknown as RouterStateSnapshot);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    tokenService = TestBed.inject(AuthTokenService);
    router = TestBed.inject(Router);
    tokenService.clearToken();
  });

  it('redirects to /login with returnUrl query param when no token is present', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute(), mockState('/protected-feature')),
    );

    expect(result instanceof UrlTree).toBe(true);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree)).toBe('/login?returnUrl=%2Fprotected-feature');
  });

  it('allows access (returns true) when an active token is present and no roles are required', () => {
    tokenService.setToken('valid-token');

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute(), mockState('/dashboard')),
    );

    expect(result).toBe(true);
  });

  it('allows access when user holds the required role', () => {
    const token = createMockJwt({ role: 'ADMIN_EMPRESA' });
    tokenService.setToken(token);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute({ roles: ['ADMIN_EMPRESA', 'SUPER_ADMIN'] }), mockState('/admin')),
    );

    expect(result).toBe(true);
  });

  it('redirects with unauthorized param when user lacks the required role', () => {
    const token = createMockJwt({ role: 'OPERADOR' });
    tokenService.setToken(token);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute({ roles: ['SUPER_ADMIN'] }), mockState('/admin')),
    );

    expect(result instanceof UrlTree).toBe(true);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree)).toBe('/login?unauthorized=true');
  });
});
