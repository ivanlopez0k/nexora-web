import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthError,
  LOGIN_LATENCY_MS,
  MOCK_LOGIN_EMAIL,
  MOCK_LOGIN_PASSWORD,
  MockAuthService,
  REGISTER_LATENCY_MS,
} from './mock-auth.service';

/**
 * THE ONLY ASYNC TEST SURFACE IN THE CHANGE. Every one of the 17 state
 * assertions is synchronous because states are SEEDED, not produced; the only
 * async in the whole change is these two timers.
 *
 * VITEST FAKE TIMERS, NOT `fakeAsync`. `fakeAsync` is a zone.js helper and this
 * app is ZONELESS: `angular.json` carries no `polyfills` key at all, so
 * `zone-testing.js` is absent and `fakeAsync()` throws at the first call. Using
 * it would have meant adding `zone.js/testing` to the test target, i.e. editing
 * `angular.json` and reintroducing the zone dependency the foundation removed.
 * The property under test is identical: resolution at exactly 1500ms / 1600ms,
 * and not one millisecond earlier.
 *
 * The registry is module-level by design and therefore SHARED between tests.
 * Every address registered here is unique to its test for that reason — a real
 * constraint, not a style choice.
 */
describe('MockAuthService', () => {
  let service: MockAuthService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockAuthService);
    service.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('the login rule — its two halves are treated DIFFERENTLY', () => {
    it('succeeds for the exact pair and records the session', async () => {
      const pending = service.login(MOCK_LOGIN_EMAIL, MOCK_LOGIN_PASSWORD);
      await vi.advanceTimersByTimeAsync(LOGIN_LATENCY_MS);
      await expect(pending).resolves.toEqual({ email: MOCK_LOGIN_EMAIL, kind: 'login' });
      expect(service.session()).toEqual({ email: MOCK_LOGIN_EMAIL, kind: 'login' });
    });

    it('NORMALISES the email half: trimmed and lowercased', async () => {
      const pending = service.login('  OPERACIONES@NEXORA.COM  ', MOCK_LOGIN_PASSWORD);
      await vi.advanceTimersByTimeAsync(LOGIN_LATENCY_MS);
      await expect(pending).resolves.toBeTruthy();
    });

    it('does NOT normalise the password half: the comparison is exact', async () => {
      // "Normalise both" is the obvious wrong refactor, and it would be silent.
      // The rejection handler is attached BEFORE the clock advances, otherwise
      // the rejection lands inside the timer callback with no listener and
      // Node reports an unhandled rejection.
      const settled = service.login(MOCK_LOGIN_EMAIL, 'Nexora2026').then(
        () => null,
        (e: unknown) => e,
      );
      await vi.advanceTimersByTimeAsync(LOGIN_LATENCY_MS);
      expect(await settled).toMatchObject({ code: 'invalid-credentials' });
      expect(service.session()).toBeNull();
    });

    it('rejects with a TYPED AuthError, because the two forms alert differently', async () => {
      const settled = service.login('nadie@nexora.com', 'cualquiera').then(
        () => null,
        (e: unknown) => e,
      );
      await vi.advanceTimersByTimeAsync(LOGIN_LATENCY_MS);
      const caught = await settled;
      expect(caught).toBeInstanceOf(AuthError);
      expect((caught as AuthError).code).toBe('invalid-credentials');
    });

    it('resolves at 1500ms and NOT at 1499ms', async () => {
      const pending = service.login(MOCK_LOGIN_EMAIL, MOCK_LOGIN_PASSWORD);
      let settled = false;
      void pending.then(() => (settled = true));
      await vi.advanceTimersByTimeAsync(LOGIN_LATENCY_MS - 1);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(settled).toBe(true);
    });
  });

  describe('register — stateful, a disclosed divergence from the prototype', () => {
    it('rejects the seeded address at 1600ms, and NOT at 1500ms', async () => {
      // Handler attached up front — see the note in the login block.
      let code = '';
      const settled = service
        .register({ name: 'Lucía', email: MOCK_LOGIN_EMAIL, password: 'Transur2026' })
        .then(
          () => null,
          (e: unknown) => {
            code = (e as AuthError).code;
            return e;
          },
        );
      await vi.advanceTimersByTimeAsync(LOGIN_LATENCY_MS);
      expect(code).toBe('');
      await vi.advanceTimersByTimeAsync(REGISTER_LATENCY_MS - LOGIN_LATENCY_MS);
      expect(code).toBe('email-taken');
      await settled;
    });

    it('grows the registry, so "any other valid email creates the account" is true', async () => {
      const email = 'nueva.cuenta@transur.com';
      expect(service.isRegistered(email)).toBe(false);
      const pending = service.register({ name: 'Lucía', email, password: 'Transur2026' });
      await vi.advanceTimersByTimeAsync(REGISTER_LATENCY_MS);
      await pending;
      expect(service.isRegistered(email)).toBe(true);
    });

    it('normalises the address, so case and padding do not create two accounts', async () => {
      const pending = service.register({
        name: 'Lucía',
        email: '  OTRA.CUENTA@TRANSUR.COM  ',
        password: 'x',
      });
      await vi.advanceTimersByTimeAsync(REGISTER_LATENCY_MS);
      await pending;
      expect(service.isRegistered('otra.cuenta@transur.com')).toBe(true);
    });

    it('rejects a second registration of the same address', async () => {
      const payload = { name: 'Lucía', email: 'tercera.cuenta@transur.com', password: 'x' };
      const first = service.register(payload);
      await vi.advanceTimersByTimeAsync(REGISTER_LATENCY_MS);
      await first;
      const settled = service.register(payload).then(
        () => null,
        (e: unknown) => e,
      );
      await vi.advanceTimersByTimeAsync(REGISTER_LATENCY_MS);
      expect(await settled).toMatchObject({ code: 'email-taken' });
    });

    it('resolves a session of kind "register"', async () => {
      const pending = service.register({
        name: 'Lucía',
        email: 'cuarta.cuenta@transur.com',
        password: 'x',
      });
      await vi.advanceTimersByTimeAsync(REGISTER_LATENCY_MS);
      await pending;
      expect(service.session()?.kind).toBe('register');
    });
  });

  describe('reset()', () => {
    it('clears the SESSION', async () => {
      const pending = service.login(MOCK_LOGIN_EMAIL, MOCK_LOGIN_PASSWORD);
      await vi.advanceTimersByTimeAsync(LOGIN_LATENCY_MS);
      await pending;
      expect(service.session()).not.toBeNull();
      service.reset();
      expect(service.session()).toBeNull();
    });

    it("does NOT clear the registry — the design's reset is a FORM reset", async () => {
      // Conflating the two would make a second "reset and try again" behave
      // differently from the first, which is a subtle and silent test trap.
      const email = 'quinta.cuenta@transur.com';
      const pending = service.register({ name: 'Lucía', email, password: 'x' });
      await vi.advanceTimersByTimeAsync(REGISTER_LATENCY_MS);
      await pending;
      service.reset();
      expect(service.isRegistered(email)).toBe(true);
      expect(service.isRegistered(MOCK_LOGIN_EMAIL)).toBe(true);
    });
  });
});
