import type { FormControl } from '@angular/forms';

/** The four states both forms expose. A gallery card seeds one of these. */
export type AuthStatus = 'idle' | 'loading' | 'error' | 'success';

export type LoginField = 'email' | 'password';
export type RegisterField = 'name' | 'email' | 'password' | 'confirm' | 'terms';

/** The union a `focused` signal holds, or `null` when nothing is focused. */
export type FieldId = LoginField | RegisterField;

/** Why a field is in error. A KEY, never a sentence — see `messageFor`. */
export type ErrorKey = 'required' | 'email' | 'rules' | 'mismatch';

/**
 * `Partial` because a field with no error is simply absent — and a `Record`
 * keyed by the form's own fields makes it impossible to set an error on a
 * field the form does not have.
 */
export type AuthErrors<F extends string> = Partial<Record<F, ErrorKey>>;

export type LoginControls = {
  email: FormControl<string>;
  password: FormControl<string>;
};

/**
 * `terms` is a control, not component state, because `validateRegister` reads
 * it and it carries `aria-invalid`. Its lack of a field-block wrapper is a
 * layout fact, not a modelling one.
 */
export type RegisterControls = {
  name: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirm: FormControl<string>;
  terms: FormControl<boolean>;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthSession = Readonly<{ email: string; kind: 'login' | 'register' }>;

/**
 * The two failures the two forms report, typed because their alerts carry
 * different titles. A rejected string would force each route wrapper to
 * re-derive the rule the service already owns.
 */
export type AuthErrorCode = 'invalid-credentials' | 'email-taken';
