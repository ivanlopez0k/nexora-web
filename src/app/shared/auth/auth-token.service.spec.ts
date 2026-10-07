import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthTokenService } from './auth-token.service';

function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

describe('AuthTokenService', () => {
  let service: AuthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthTokenService);
    service.clearToken();
  });

  it('starts with a null token and refresh token', () => {
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.refreshToken()).toBeNull();
    expect(service.hasToken()).toBe(false);
    expect(service.getClaims()).toBeNull();
    expect(service.getRoles()).toEqual([]);
  });

  it('updates token and signal when setToken is called', () => {
    service.setToken('jwt-sample-token');
    expect(service.getToken()).toBe('jwt-sample-token');
    expect(service.token()).toBe('jwt-sample-token');
    expect(service.hasToken()).toBe(true);
  });

  it('updates tokens together when setTokens is called', () => {
    service.setTokens('access-123', 'refresh-456');
    expect(service.getToken()).toBe('access-123');
    expect(service.getRefreshToken()).toBe('refresh-456');
    expect(service.token()).toBe('access-123');
    expect(service.refreshToken()).toBe('refresh-456');
  });

  it('clears both tokens when clearToken is called', () => {
    service.setTokens('jwt-sample-token', 'refresh-token');
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.refreshToken()).toBeNull();
    expect(service.hasToken()).toBe(false);
  });

  it('decodes claims from a valid JWT structure', () => {
    const token = createMockJwt({
      sub: 'usr-123',
      email: 'operaciones@nexora.com',
      role: 'SUPER_ADMIN',
    });
    service.setToken(token);

    const claims = service.getClaims();
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe('usr-123');
    expect(claims?.email).toBe('operaciones@nexora.com');
  });

  it('extracts single and array roles from standard and Microsoft claims', () => {
    const tokenSingle = createMockJwt({ role: 'OPERADOR' });
    service.setToken(tokenSingle);
    expect(service.getRoles()).toEqual(['OPERADOR']);
    expect(service.hasRole('OPERADOR')).toBe(true);
    expect(service.hasRole('ADMIN')).toBe(false);

    const tokenArray = createMockJwt({ role: ['ADMIN_EMPRESA', 'SUPER_ADMIN'] });
    service.setToken(tokenArray);
    expect(service.getRoles()).toEqual(['ADMIN_EMPRESA', 'SUPER_ADMIN']);
    expect(service.hasRole(['SUPER_ADMIN'])).toBe(true);
    expect(service.hasRole('GUEST')).toBe(false);

    const tokenMs = createMockJwt({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'SUPER_ADMIN',
    });
    service.setToken(tokenMs);
    expect(service.getRoles()).toEqual(['SUPER_ADMIN']);
  });
});
