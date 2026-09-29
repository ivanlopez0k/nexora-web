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
import { messageFor, validEmail, validateLogin } from '../../auth/auth-validation';
import type {
  AuthErrors,
  AuthStatus,
  ErrorKey,
  LoginControls,
  LoginField,
} from '../../auth/auth-types';

/**
 * A module-scoped incrementing counter, replacing the design's
 * `'nx' + Math.random().toString(36)` ids. Two reasons, and the second is
 * load-bearing: a random id is not assertable, and a SHARED id would let the
 * dev gallery's 17 cards satisfy an `aria-describedby`-style lookup against
 * each other. A counter is deterministic in tests and collision-free across
 * every instance the app ever builds.
 */
let domIdCounter = 0;

function nextDomId(prefix: string): string {
  domIdCounter += 1;
  return `nx-login-${prefix}-${domIdCounter}`;
}

/**
 * The presentational login form. ZERO DI: the FormGroup arrives as an input and
 * the only router import is `RouterLink`, which D1 grants this directory as a
 * named exception so the 17 gallery cards need no routing logic. No `Router`,
 * no `ActivatedRoute`, no navigate, no guards, no resolvers — a rule, not a
 * precedent, so it cannot spread.
 *
 * R1: there is no `fieldBorder()` and no `fieldShadow()` here, and there is no
 * inline appearance binding anywhere. Presets set STATE; primitives set
 * APPEARANCE. State reaches the stylesheet as the `aria-invalid` ATTRIBUTE and
 * the `:focus` pseudo-class, which is what keeps the primitive's autofill
 * override at `src/styles.css:187-200` intact — an inline `box-shadow` would
 * beat it by cascade origin and Chrome would paint its own background over the
 * dark field, with no build error and no failing test.
 */
@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginForm {
  readonly copy = copy.auth.login;
  readonly common = copy.auth.common;

  readonly form = input.required<FormGroup<LoginControls>>();

  /**
   * `model()`, not `input()`, for all four of these: the presets seed them AND
   * this form writes them — R15's four error writes, the `error -> idle` reset,
   * the focus and blur handlers, and the keyup/keydown caps reader. They are
   * genuinely two-way, and `model()` is the signal-era encoding of that.
   */
  readonly status = model<AuthStatus>('idle');
  readonly errors = model<AuthErrors<LoginField>>({});
  readonly focused = model<LoginField | null>(null);
  readonly caps = model(false);

  /**
   * R3 BARRIER 1. The default is `false` and NEVER true, and this form's own
   * spec asserts the demo credentials are absent from its default render. The
   * route wrapper binds `isDevMode()`; the dev gallery deliberately binds
   * `true`. A `true` default here would make the chain's merge order void.
   */
  readonly showHint = input(false);

  /** No payload on either output: the parent already holds the FormGroup. */
  readonly submitted = output<void>();
  readonly reset = output<void>();

  /**
   * Deliberately NOT part of the D2 surface — no preset seeds it and no parent
   * drives it, so it is neither an input, a `model()` nor an output. Public
   * only because a template cannot read a private member.
   */
  readonly reveal = signal(false);

  readonly loading = computed(() => this.status() === 'loading');
  readonly showError = computed(() => this.status() === 'error');
  readonly isSuccess = computed(() => this.status() === 'success');

  /**
   * R6. There is NO `&& !errors().password`, and the design's login guard is
   * the defect being corrected: with Caps Lock on AND a wrong password the
   * error surfaces and the only diagnostic explaining it disappears, so the
   * user retries blind in a security-adjacent control. Unified on register's
   * rule (`Reg:204`). The stack stays legible because the caps badge is a 3px
   * SQUARE and the inline error is a 50% CIRCLE — a shape-plus-colour code.
   */
  readonly showCaps = computed(() => this.caps() && this.focused() === 'password');

  readonly pwType = computed(() => (this.reveal() ? 'text' : 'password'));
  readonly showText = computed(() =>
    this.reveal() ? this.common.hidePassword : this.common.showPassword,
  );
  readonly showLabel = computed(() =>
    this.reveal() ? this.common.hidePasswordLabel : this.common.showPasswordLabel,
  );

  readonly emailId = nextDomId('email');
  readonly passwordId = nextDomId('password');

  /**
   * The design writes `disabled="{{ loading }}"` on both inputs. The Angular
   * equivalent is to drive the CONTROL state, not the attribute: the reactive
   * forms directive owns that attribute and a template binding on it conflicts
   * with the directive, which Angular reports with a "changed after checked"
   * warning. The value survives a disable, so `validateLogin` — which reads the
   * controls individually, never `group.value` — still sees it.
   */
  constructor() {
    effect(() => {
      const disabled = this.loading();
      for (const control of Object.values(this.form().controls)) {
        if (control.disabled !== disabled) {
          if (disabled) {
            control.disable();
          } else {
            control.enable();
          }
        }
      }
    });
  }

  /** The one place a message string is reached from a key. */
  errorText(field: LoginField, key: ErrorKey): string {
    return messageFor(field, key);
  }

  focus(field: LoginField): void {
    this.focused.set(field);
  }

  /**
   * `(input)`, NOT `(change)`: an Angular `(change)` on a text input fires on
   * BLUR, which would leave the global alert on screen through the user's
   * entire first attempt at correcting it. The value is written explicitly
   * rather than read back from the control, so the handler does not depend on
   * the relative order of two listeners on the same element.
   */
  onInput(field: LoginField, event: Event): void {
    this.form().controls[field].setValue((event.target as HTMLInputElement).value);
    this.clearError(field);
    if (this.status() === 'error') {
      this.status.set('idle');
    }
  }

  toggleReveal(): void {
    this.reveal.update((shown) => !shown);
  }

  onCapsKey(event: KeyboardEvent): void {
    this.caps.set(capsLockOn(event));
  }

  /**
   * Only the EMAIL blur can add an error, and only when the field has content.
   * Faithful in both directions: the design does NOT clear the error when the
   * email becomes valid, so neither do we — a "helpful" fix here would be a
   * behaviour change nobody would notice.
   */
  onEmailBlur(): void {
    this.focused.set(null);
    const email = this.form().controls.email.value;
    if (email && !validEmail(email)) {
      this.errors.set({ ...this.errors(), email: 'email' });
    }
  }

  /**
   * The password blur adds NOTHING: password errors are submit-only, and it
   * clears the caps row for free because both `showCaps` inputs require
   * `focused() === 'password'`. A caps blur handler would be an unverified
   * addition to a pinned behaviour.
   */
  onPasswordBlur(): void {
    this.focused.set(null);
  }

  /**
   * The submit path NEVER consults `form().valid`. The group carries zero
   * validators, so `valid` is ALWAYS true; a handler opening with
   * `if (form().invalid) return` would silently disable the entire validation
   * system and no scenario would catch it, because every one drives the form
   * into its error state through this very handler.
   */
  submit(event: Event): void {
    event.preventDefault();
    if (this.loading()) {
      return;
    }
    const found = validateLogin(this.form().controls);
    if (Object.keys(found).length > 0) {
      this.errors.set(found);
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

  private clearError(field: LoginField): void {
    if (!(field in this.errors())) {
      return;
    }
    const next = { ...this.errors() };
    delete next[field];
    this.errors.set(next);
  }
}
