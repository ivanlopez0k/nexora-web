import { isDevMode } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthLogin } from './auth-login';
import { copy } from '../../shared/i18n/copy';
import {
  AuthError,
  MOCK_LOGIN_EMAIL,
  MOCK_LOGIN_PASSWORD,
  MockAuthService,
} from '../../shared/auth/mock-auth.service';
import type { AuthErrors, AuthStatus, LoginField } from '../../shared/auth/auth-types';

describe('AuthLogin', () => {
  let fixture: ComponentFixture<AuthLogin>;
  let host: AuthLogin;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthLogin],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AuthLogin);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    // The first render must happen here, not inside each test: every helper
    // below queries the DOM, and a helper that silently runs against an
    // unrendered fixture fails with a null dereference instead of a real
    // assertion.
    fixture.detectChanges();
  });

  const render = () => fixture.detectChanges();
  const q = <T extends Element = HTMLElement>(sel: string) => el.querySelector(sel) as T | null;
  const text = () => el.textContent ?? '';

  function type(selector: string, value: string): void {
    const input = q<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    render();
  }

  function submit(): void {
    q<HTMLFormElement>('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    render();
  }

  function fillDemo(): void {
    type('input[type="email"]', MOCK_LOGIN_EMAIL);
    type('input[autocomplete="current-password"]', MOCK_LOGIN_PASSWORD);
  }

  describe('D1 — the wrapper composes the shell and the presentational form', () => {
    it('renders the brand panel beside the form, so the login page exists as a page', () => {
      render();
      expect(q('app-auth-shell')).not.toBeNull();
      expect(q('.brand')).not.toBeNull();
      expect(q('.form-panel')).not.toBeNull();
      expect(q('.form-panel app-login-form')).not.toBeNull();
    });

    it('reuses the ONE layout shell and adds no second brand panel', () => {
      render();
      expect(el.querySelectorAll('.brand').length).toBe(1);
      expect(q('.wordmark')?.textContent).toBe(copy.auth.brand.wordmark);
    });
  });

  describe('R3 barrier 2 and barrier 3 — the demo credentials do not ship', () => {
    it('BARRIER 2: with the hint off, both credentials are absent from the render', () => {
      host.showHint.set(false);
      render();
      expect(text()).not.toContain(MOCK_LOGIN_EMAIL);
      expect(text()).not.toContain(MOCK_LOGIN_PASSWORD);
      expect(q('.hint')).toBeNull();
    });

    it('BARRIER 3: with the hint on it renders, so barrier 2 is a real default', () => {
      host.showHint.set(true);
      render();
      expect(text()).toContain(copy.auth.login.hintLine1);
      expect(text()).toContain(copy.auth.login.hintLine2);
    });

    it('seeds the hint from isDevMode(), and is neither hardcoded true nor hardcoded false', () => {
      // `ng test` runs with dev mode ON, so a fresh wrapper is `true`. The
      // assertion that matters is the one below it: the flag is WRITABLE, so
      // the pair above is provable in both directions — which the irreversible
      // process-global `isDevMode()` could never be.
      expect(host.showHint()).toBe(isDevMode());
      host.showHint.set(false);
      render();
      expect(q('.hint')).toBeNull();
    });
  });

  describe('R15 — the clauses only the wrapper can see', () => {
    it('never calls the service when validation produces an error', () => {
      const spy = vi.spyOn(TestBed.inject(MockAuthService), 'login');
      type('input[type="email"]', 'not-an-email');
      type('input[autocomplete="current-password"]', '');
      submit();
      expect(spy).not.toHaveBeenCalled();
      expect(host.status()).toBe('idle');
      expect(host.errors().email).toBeDefined();
    });

    it('holds status itself, so the form error -> idle reset propagates back out', () => {
      host.status.set('error');
      render();
      type('input[type="email"]', 'a');
      // The form writes `status: 'idle'` itself. If the four model() members
      // were not bound here, that write would land nowhere and this would
      // still read 'error'.
      expect(host.status()).toBe('idle');
    });
  });

  // `fakeAsync` is a zone.js helper and this app is ZONELESS — `angular.json`
  // carries no `polyfills` key at all — so Vitest's fake timers are the
  // substitute. The rejection handler is attached synchronously inside
  // `onSubmitted`, i.e. BEFORE any clock advance, so a rejected login never
  // surfaces as an unhandled rejection.
  describe('D1 — the real 1500ms latency', () => {
    it('resolves at exactly 1500ms and NOT at 1499ms', async () => {
      vi.useFakeTimers();
      try {
        fillDemo();
        submit();
        expect(host.status()).toBe('loading');
        await vi.advanceTimersByTimeAsync(1499);
        expect(host.status()).toBe('loading');
        await vi.advanceTimersByTimeAsync(1);
        expect(host.status()).toBe('success');
        // The app is ZONELESS, so a signal write does not flush the view on its
        // own: the tick is explicit, exactly as it would be in a browser frame.
        render();
        expect(q('[role="status"]')).not.toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it('maps the typed AuthError to the error status at 1500ms and renders the alert', async () => {
      vi.useFakeTimers();
      try {
        type('input[type="email"]', MOCK_LOGIN_EMAIL);
        type('input[autocomplete="current-password"]', 'wrong-password');
        submit();
        await vi.advanceTimersByTimeAsync(1500);
        expect(host.status()).toBe('error');
        render();
        expect(q('[role="alert"]')).not.toBeNull();
        expect(q('.nx-alert-title')?.textContent).toBe(copy.auth.login.alertTitle);
      } finally {
        vi.useRealTimers();
      }
    });

    it("leaves the page idle on a rejection that is not this page's AuthError", async () => {
      vi.useFakeTimers();
      try {
        vi.spyOn(TestBed.inject(MockAuthService), 'login').mockRejectedValue(
          new AuthError('email-taken'),
        );
        fillDemo();
        submit();
        await vi.advanceTimersByTimeAsync(1500);
        // `email-taken` is REGISTER's alert. Reporting "Credenciales
        // incorrectas" here would be a sentence the copy cannot justify.
        expect(host.status()).toBe('idle');
        expect(q('[role="alert"]')).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('reset — the design re-seeds the form, it does not only clear the badge', () => {
    it('clears the session, the status and both field values', async () => {
      vi.useFakeTimers();
      try {
        const auth = TestBed.inject(MockAuthService);
        fillDemo();
        submit();
        await vi.advanceTimersByTimeAsync(1500);
        expect(auth.session()).not.toBeNull();
        render();

        q<HTMLButtonElement>('.success-reset')!.dispatchEvent(new Event('click'));
        render();
        expect(auth.session()).toBeNull();
        expect(host.status()).toBe('idle');
        expect(q<HTMLInputElement>('input[type="email"]')!.value).toBe('');
        expect(q<HTMLInputElement>('input[autocomplete="current-password"]')!.value).toBe('');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('the state surface the wrapper owns', () => {
    it('starts every member at the design default, and owns the FormGroup', () => {
      expect(host.status()).toBe<AuthStatus>('idle');
      expect(host.errors()).toEqual<AuthErrors<LoginField>>({});
      expect(host.focused()).toBeNull();
      expect(host.caps()).toBe(false);
      // The factory, not a hand-rolled group: one construction path shared with
      // the dev gallery, so the gallery cannot drift from the real page.
      expect(host.form.controls.email.value).toBe('');
      expect(host.form.controls.password.value).toBe('');
    });
  });
});
