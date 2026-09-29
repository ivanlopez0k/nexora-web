import { FormControl, FormGroup } from '@angular/forms';
import type {
  AuthErrors,
  ErrorKey,
  FieldId,
  LoginControls,
  LoginField,
  RegisterControls,
  RegisterField,
} from './auth-types';
import { copy } from '../i18n/copy';

/**
 * The design's EXACT regex, on the trimmed value. This is NOT
 * `Validators.email`, and the `{2,}` tail is the design's: `"a@b.c"` is
 * rejected here and accepted by `Validators.email`. Preserved and asserted,
 * because a stock-Angular substitution is a silent change to the contract.
 */
export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/**
 * The password ladder, in rule order. A LADDER, not a score: rule 0 is not
 * implied by rules 1 and 2. One implementation, two consumers (the strength
 * meter and `validateRegister`) — two implementations of one ladder is the
 * drift this codebase has avoided since the foundation.
 *
 * The return is a 3-TUPLE, not `boolean[]`, so the meter's `input.required`
 * makes a wrong arity a compile error.
 */
export function checks(pw: string): readonly [boolean, boolean, boolean] {
  return [pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw)] as const;
}

type MessageKey = `${FieldId}:${ErrorKey}`;

/**
 * The 11 field-by-key pairs, keyed so that a pair both forms share resolves to
 * one string — which is what makes the table correct rather than duplicated.
 * The fallback is unreachable over the pairs the two validators can emit, and
 * the spec asserts exactly that.
 */
const MESSAGES: Partial<Record<MessageKey, string>> = {
  'email:required': copy.auth.common.emailRequired,
  'email:email': copy.auth.common.emailInvalid,
  'password:required': copy.auth.common.passwordRequired,
  'name:required': copy.auth.register.nameRequired,
  'password:rules': copy.auth.register.passwordRulesFailed,
  'confirm:required': copy.auth.register.confirmRequired,
  'confirm:mismatch': copy.auth.register.confirmMismatch,
  'terms:required': copy.auth.register.termsRequired,
};

/** The ONLY place a validation message is chosen. */
export function messageFor(field: FieldId, key: ErrorKey): string {
  return MESSAGES[`${field}:${key}`] ?? '';
}

export function validateLogin(controls: LoginControls): AuthErrors<LoginField> {
  const errors: AuthErrors<LoginField> = {};
  const email = controls.email.value;
  if (!email.trim()) {
    errors.email = 'required';
  } else if (!validEmail(email)) {
    errors.email = 'email';
  }
  if (!controls.password.value) {
    errors.password = 'required';
  }
  return errors;
}

export function validateRegister(controls: RegisterControls): AuthErrors<RegisterField> {
  const errors: AuthErrors<RegisterField> = {};
  const { name, email, password, confirm, terms } = controls;
  if (!name.value.trim()) {
    errors.name = 'required';
  }
  if (!email.value.trim()) {
    errors.email = 'required';
  } else if (!validEmail(email.value)) {
    errors.email = 'email';
  }
  if (!password.value) {
    errors.password = 'required';
  } else if (!checks(password.value).every(Boolean)) {
    errors.password = 'rules';
  }
  if (!confirm.value) {
    errors.confirm = 'required';
  } else if (confirm.value !== password.value) {
    errors.confirm = 'mismatch';
  }
  if (!terms.value) {
    errors.terms = 'required';
  }
  return errors;
}

/**
 * The design's rule, with the `|| ''` preserved: the success body renders
 * "Te damos la bienvenida, ." rather than the word `undefined` (R18).
 */
export function firstName(value: string): string {
  return value.trim().split(' ')[0] || '';
}

/**
 * `Reg:203` verbatim. The error-set suppression is PART of the rule, not a
 * refinement of it: the match line stays hidden whenever the mismatch error
 * is set, including right after a failed submit (R-S5).
 */
export function cfMatch(
  errors: AuthErrors<RegisterField>,
  confirm: string,
  password: string,
): boolean {
  return !errors.confirm && !!confirm && confirm === password;
}

/**
 * The one construction path, shared by both route wrappers, the dev gallery
 * and every spec, so the gallery cannot drift from the real pages.
 *
 * ZERO validators, deliberately. A `ValidatorFn` recomputes on every
 * `valueChanges`, which IS live validation: it would immediately mark the
 * `weak` and `focus` presets invalid where the design shows neither. The group
 * is a value container; validation is an explicit, pure, on-demand call.
 *
 * The consequence is a trap worth stating: with no validators `valid` is
 * ALWAYS true, so the submit path must never consult it.
 */
export function loginFormGroup(): FormGroup<LoginControls> {
  return new FormGroup<LoginControls>({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });
}

export function registerFormGroup(): FormGroup<RegisterControls> {
  return new FormGroup<RegisterControls>({
    name: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    confirm: new FormControl('', { nonNullable: true }),
    terms: new FormControl(false, { nonNullable: true }),
  });
}
