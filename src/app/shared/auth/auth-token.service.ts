import { Injectable, signal } from '@angular/core';
import type { Signal } from '@angular/core';

export interface DecodedToken {
  sub?: string;
  email?: string;
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  exp?: number;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Manages the active JWT in application memory and extracts claims/roles.
 * Provided in root as an application-level singleton.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly tokenState = signal<string | null>(null);

  readonly token: Signal<string | null> = this.tokenState.asReadonly();

  getToken(): string | null {
    return this.tokenState();
  }

  setToken(token: string | null): void {
    this.tokenState.set(token);
  }

  clearToken(): void {
    this.tokenState.set(null);
  }

  hasToken(): boolean {
    return !!this.tokenState();
  }

  getClaims(): DecodedToken | null {
    const current = this.tokenState();
    if (!current) return null;
    return decodeJwtPayload(current);
  }

  getRoles(): string[] {
    const claims = this.getClaims();
    if (!claims) return [];

    const roleClaim =
      claims.role ?? claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (!roleClaim) return [];
    if (Array.isArray(roleClaim)) return roleClaim;
    if (typeof roleClaim === 'string') return [roleClaim];
    return [];
  }

  hasRole(required: string | string[]): boolean {
    const userRoles = this.getRoles();
    if (userRoles.length === 0) return false;

    const requiredArray = Array.isArray(required) ? required : [required];
    return requiredArray.some((r) => userRoles.includes(r));
  }
}
