import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { copy } from '../../i18n/copy';
import { capsLockOn } from '../../auth/caps-lock';
import {
  cfMatch,
  checks,
  firstName,
  messageFor,
  validEmail,
  validateRegister,
} from '../../auth/auth-validation';
import type {
  AuthErrors,
  AuthStatus,
  ErrorKey,
  RegisterControls,
  RegisterField,
} from '../../auth/auth-types';

let domIdCounter = 0;

function nextDomId(prefix: string): string {
  domIdCounter += 1;
  return `nx-reg-${prefix}-${domIdCounter}`;
}

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-form.html',
  styleUrl: './register-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterForm {
  readonly copy = copy;
  readonly common = copy.auth.common;

  readonly form = input.required<FormGroup<RegisterControls>>();

  readonly status = model<AuthStatus>('idle');
  readonly errors = model<AuthErrors<RegisterField>>({});
  readonly focused = model<RegisterField | null>(null);
  readonly caps = model(false);
  readonly showHint = input(false);

  readonly submitted = output<void>();
  readonly reset = output<void>();

  private readonly reveal = signal(false);

  readonly nameId = nextDomId('name');
  readonly emailId = nextDomId('email');
  readonly passwordId = nextDomId('password');
  readonly confirmId = nextDomId('confirm');
  readonly rulesId = nextDomId('rules');

  readonly passwordValue = signal('');
  readonly confirmValue = signal('');
  readonly nameValue = signal('');
  readonly emailValue = signal('');

  readonly loading = computed(() => this.status() === 'loading');
  readonly showError = computed(() => this.status() === 'error');
  readonly isSuccess = computed(() => this.status() === 'success');

  readonly pwType = computed(() => (this.reveal() ? 'text' : 'password'));
  readonly showText = computed(() =>
    this.reveal() ? copy.auth.common.hidePassword : copy.auth.common.showPassword,
  );
  readonly showLabel = computed(() =>
    this.reveal() ? copy.auth.common.hidePasswordLabel : copy.auth.common.showPasswordLabel,
  );

  readonly showCaps = computed(() => this.caps() && this.focused() === 'password');

  readonly passwordChecks = computed(() => {
    return checks(this.passwordValue());
  });

  readonly passedRulesCount = computed(() => {
    return this.passwordChecks().filter(Boolean).length;
  });

  readonly ruleBarColor = computed(() => {
    const passed = this.passedRulesCount();
    return passed === 3
      ? 'var(--nx-success)'
      : passed === 2
        ? 'var(--nx-warning)'
        : 'var(--nx-error)';
  });

  readonly rules = computed(() => {
    const c = this.passwordChecks();
    const passed = this.passedRulesCount();
    const barOn = this.ruleBarColor();
    const labels = [
      copy.auth.register.ruleLength,
      copy.auth.register.ruleUpper,
      copy.auth.register.ruleDigit,
    ];
    return labels.map((label, i) => ({
      label,
      mark: c[i] ? '✓' : '·',
      color: c[i] ? 'var(--nx-success)' : 'var(--nx-text-muted)',
      barColor: i < passed ? barOn : 'var(--nx-border)',
    }));
  });

  readonly showRules = computed(() => {
    return (this.focused() === 'password' || !!this.passwordValue()) && !this.loading();
  });

  readonly isConfirmMatching = computed(() => {
    return cfMatch(this.errors(), this.confirmValue(), this.passwordValue());
  });

  readonly userFirstName = computed(() => {
    return firstName(this.nameValue());
  });

  constructor() {
    effect((onCleanup) => {
      const form = this.form();
      const syncValues = () => {
        this.passwordValue.set(form.controls.password.value);
        this.confirmValue.set(form.controls.confirm.value);
        this.nameValue.set(form.controls.name.value);
        this.emailValue.set(form.controls.email.value);
      };
      syncValues();
      const sub = form.valueChanges.subscribe(syncValues);
      onCleanup(() => sub.unsubscribe());
    });

    effect(() => {
      const disabled = this.loading();
      for (const control of Object.values(this.form().controls)) {
        if (control.disabled !== disabled) {
          if (disabled) {
            control.disable({ emitEvent: false });
          } else {
            control.enable({ emitEvent: false });
          }
        }
      }
    });
  }

  toggleReveal(): void {
    this.reveal.update((v) => !v);
  }

  focus(field: RegisterField): void {
    this.focused.set(field);
  }

  onNameBlur(): void {
    this.focused.set(null);
  }

  onEmailBlur(): void {
    this.focused.set(null);
    const email = this.form().controls.email.value;
    if (email && !validEmail(email)) {
      this.errors.update((errs) => ({ ...errs, email: 'email' }));
    }
  }

  onPasswordBlur(): void {
    this.focused.set(null);
  }

  onConfirmBlur(): void {
    this.focused.set(null);
    const { password, confirm } = this.form().controls;
    if (confirm.value && confirm.value !== password.value) {
      this.errors.update((errs) => ({ ...errs, confirm: 'mismatch' }));
    }
  }

  onCapsKey(event: KeyboardEvent): void {
    this.caps.set(capsLockOn(event));
  }

  onInput(field: RegisterField, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.form().controls[field].setValue(val as never);
    if (field === 'password') {
      this.passwordValue.set(val);
    } else if (field === 'confirm') {
      this.confirmValue.set(val);
    } else if (field === 'name') {
      this.nameValue.set(val);
    } else if (field === 'email') {
      this.emailValue.set(val);
    }

    const current = { ...this.errors() };
    delete current[field];
    if (field === 'password') {
      delete current.confirm;
    }
    this.errors.set(current);
    if (this.status() === 'error') {
      this.status.set('idle');
    }
  }

  onTermsChange(): void {
    const current = { ...this.errors() };
    delete current.terms;
    this.errors.set(current);
    if (this.status() === 'error') {
      this.status.set('idle');
    }
  }

  submit(event: Event): void {
    event.preventDefault();
    if (this.loading()) return;
    const errs = validateRegister(this.form().controls);
    if (Object.keys(errs).length > 0) {
      this.errors.set(errs);
      this.status.set('idle');
      return;
    }
    this.errors.set({});
    this.status.set('loading');
    this.focused.set(null);
    this.submitted.emit();
  }

  onReset(): void {
    this.reset.emit();
  }

  errorText(field: RegisterField, key: ErrorKey): string {
    return messageFor(field, key);
  }
}
