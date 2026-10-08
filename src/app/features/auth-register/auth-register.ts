import { ChangeDetectionStrategy, Component, inject, isDevMode, signal } from '@angular/core';
import { AuthShell } from '../../layout/auth-shell/auth-shell';
import { RegisterForm } from '../../shared/auth-forms/register-form/register-form';
import { registerFormGroup } from '../../shared/auth/auth-validation';
import { AuthError, MockAuthService } from '../../shared/auth/mock-auth.service';
import type { AuthErrors, AuthStatus, RegisterField } from '../../shared/auth/auth-types';

@Component({
  selector: 'app-auth-register',
  imports: [AuthShell, RegisterForm],
  templateUrl: './auth-register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthRegister {
  private readonly auth = inject(MockAuthService);

  readonly form = registerFormGroup();

  readonly showHint = signal(isDevMode());

  readonly status = signal<AuthStatus>('idle');
  readonly errors = signal<AuthErrors<RegisterField>>({});
  readonly focused = signal<RegisterField | null>(null);
  readonly caps = signal(false);

  onSubmitted(): void {
    const { name, email, password } = this.form.controls;
    this.auth
      .register({
        name: name.value,
        email: email.value,
        password: password.value,
      })
      .then(
        () => {
          this.status.set('success');
        },
        (error: unknown) => {
          this.status.set(this.statusFor(error));
        },
      );
  }

  private statusFor(error: unknown): AuthStatus {
    return error instanceof AuthError && error.code === 'email-taken' ? 'error' : 'idle';
  }

  onReset(): void {
    this.auth.reset();
    this.status.set('idle');
    this.errors.set({});
    this.focused.set(null);
    this.caps.set(false);
    this.form.reset({
      name: '',
      email: '',
      password: '',
      confirm: '',
      terms: false,
    });
  }
}
