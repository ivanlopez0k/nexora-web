import { Injectable, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import type { AuthErrorCode, AuthSession, RegisterPayload } from './auth-types';

export const MOCK_LOGIN_EMAIL = 'operaciones@nexora.com';
export const MOCK_LOGIN_PASSWORD = 'nexora2026';
export const LOGIN_LATENCY_MS = 1500;
export const REGISTER_LATENCY_MS = 1600;

/**
 * Typed, because the two forms' alerts carry DIFFERENT titles: login reports
 * "Credenciales incorrectas" and register "El email ya está registrado". A
 * rejected plain string would force each route wrapper to re-derive the rule
 * the service already owns, and R-S8's assertion could then pass for the wrong
 * reason.
 */
export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
  }
}

/**
 * Module-level by design, and therefore shared between tests — which is why
 * every address the spec registers is unique to its test. Seeded with the one
 * address the design treats as taken.
 */
const REGISTRY = new Set<string>([MOCK_LOGIN_EMAIL]);

/**
 * In-memory, no HTTP. `provideHttpClient()` is deliberately NOT added, so
 * `app.config.ts` does not change.
 *
 * `providedIn: 'root'` because the app is a single `provideRouter` app with no
 * feature providers: root costs zero configuration.
 */
@Injectable({ providedIn: 'root' })
export class MockAuthService {
  private readonly sessionState = signal<AuthSession | null>(null);

  readonly session: Signal<AuthSession | null> = this.sessionState.asReadonly();

  /**
   * `LoginForm.dc.html:123` verbatim: the email is trimmed and lowercased, the
   * password is compared EXACTLY. The asymmetry is the design's, so
   * `'  OPERACIONES@NEXORA.COM  '` succeeds while `'Nexora2026'` does not.
   * "Normalise both" is the obvious wrong refactor and it would be silent.
   */
  login(email: string, password: string): Promise<AuthSession> {
    const normalised = email.trim().toLowerCase();
    const ok = normalised === MOCK_LOGIN_EMAIL && password === MOCK_LOGIN_PASSWORD;
    return new Promise<AuthSession>((resolve, reject) => {
      setTimeout(() => {
        if (!ok) {
          reject(new AuthError('invalid-credentials'));
          return;
        }
        const session: AuthSession = { email: normalised, kind: 'login' };
        this.sessionState.set(session);
        resolve(session);
      }, LOGIN_LATENCY_MS);
    });
  }

  /**
   * `Reg:182` compared against a constant; ours is STATEFUL, a disclosed
   * divergence. The design's own copy says "Cualquier otro email válido crea la
   cuenta", and a registry that never grows would make that sentence a lie and
   * would let a second registration of a fresh address wrongly succeed.
   */
  register(payload: RegisterPayload): Promise<AuthSession> {
    const normalised = payload.email.trim().toLowerCase();
    return new Promise<AuthSession>((resolve, reject) => {
      setTimeout(() => {
        if (REGISTRY.has(normalised)) {
          reject(new AuthError('email-taken'));
          return;
        }
        REGISTRY.add(normalised);
        const session: AuthSession = { email: normalised, kind: 'register' };
        this.sessionState.set(session);
        resolve(session);
      }, REGISTER_LATENCY_MS);
    });
  }

  /** Public because it is the one question a reviewer asks about an in-memory mock. */
  isRegistered(email: string): boolean {
    return REGISTRY.has(email.trim().toLowerCase());
  }

  /**
   * Clears the SESSION, not the registry. The design's `reset` re-seeds the
   * FORM (`initFor('default')`); it is a form reset, not a backend reset, and
   * conflating the two would make a second "reset and try again" behave
   * differently from the first.
   */
  reset(): void {
    this.sessionState.set(null);
  }
}
