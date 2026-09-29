import { ChangeDetectionStrategy, Component, inject, isDevMode, signal } from '@angular/core';
import { AuthShell } from '../../layout/auth-shell/auth-shell';
import { LoginForm } from '../../shared/auth-forms/login-form/login-form';
import { loginFormGroup } from '../../shared/auth/auth-validation';
import { AuthError, MockAuthService } from '../../shared/auth/mock-auth.service';
import type { AuthErrors, AuthStatus, LoginField } from '../../shared/auth/auth-types';

/**
 * The `/login` route wrapper. It owns exactly three things, per D1: the
 * FormGroup's construction, the service call, and the dev hint flag. It has no
 * markup of its own beyond composing the shell around the form, and — by the
 * same decision — it ships NO stylesheet: every geometry value here belongs to
 * `auth-shell` or to the form that owns it, and a two-declaration stylesheet
 * written to satisfy a pattern is a byte and a lie.
 */
@Component({
  selector: 'app-auth-login',
  imports: [AuthShell, LoginForm],
  templateUrl: './auth-login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLogin {
  private readonly auth = inject(MockAuthService);

  /**
   * The shared factory, never a hand-rolled group: the dev gallery builds its
   * 17 cards from the same function, so there is exactly ONE construction path
   * and the gallery cannot drift from the real page.
   */
  readonly form = loginFormGroup();

  /**
   * R3 BARRIER 2. `isDevMode()` is the only source, and it is never inverted
   * or defaulted to `true`. It is a WRITABLE signal purely so the barrier can be
   * proven in both directions: `isDevMode()` is a process-global, one-way flag
   * that a test can never turn off, so a read-only binding would make the
   * "absent" half of the pair untestable and the assertion worthless.
   */
  readonly showHint = signal(isDevMode());

  /**
   * All four are bound because `model()` on the form behaves like a plain
   * INPUT when no two-way binding is present: the form's own writes — R15's
   * `error -> idle` reset, its focus and blur handlers, its caps reader — would
   * be silently dropped. They live here so the wrapper, not the form, is the
   * owner of the page's state.
   */
  readonly status = signal<AuthStatus>('idle');
  readonly errors = signal<AuthErrors<LoginField>>({});
  readonly focused = signal<LoginField | null>(null);
  readonly caps = signal(false);

  /**
   * The form has already validated and already set `loading` before it emits
   * `submitted`, so this handler is reached only on a valid payload. The
   * `.then(onOk, onErr)` pair attaches BOTH handlers synchronously, before any
   * timer can fire: attaching the rejection handler late would let a failed
   * login reject with no listener and surface as an unhandled rejection.
   */
  onSubmitted(): void {
    const { email, password } = this.form.controls;
    this.auth.login(email.value, password.value).then(
      () => {
        this.status.set('success');
      },
      (error: unknown) => {
        this.status.set(this.statusFor(error));
      },
    );
  }

  /**
   * The error -> status mapping, and the reason it is CODE-SPECIFIC. The mock
   * can only reject with `invalid-credentials` on this route, so the guard is
   * defensive rather than decorative: were `email-taken` ever to arrive here,
   * reporting it as "Credenciales incorrectas" would show a sentence the copy
   * cannot justify. Anything unrecognised leaves the page idle rather than
   * inventing an alert for a failure this page does not describe.
   */
  private statusFor(error: unknown): AuthStatus {
    return error instanceof AuthError && error.code === 'invalid-credentials' ? 'error' : 'idle';
  }

  /**
   * The design's `reset` re-seeds the FORM (`initFor('default')`), so this is a
   * form reset and not merely a badge clear: the session, the status and both
   * field values all go back to the design's `default` state.
   */
  onReset(): void {
    this.auth.reset();
    this.status.set('idle');
    this.errors.set({});
    this.focused.set(null);
    this.caps.set(false);
    this.form.reset({ email: '', password: '' });
  }
}
