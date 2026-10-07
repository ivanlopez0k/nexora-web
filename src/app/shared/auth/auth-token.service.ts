import { Injectable, signal } from '@angular/core';
import type { Signal } from '@angular/core';

/**
 * Manages the active JWT in application memory.
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
}
