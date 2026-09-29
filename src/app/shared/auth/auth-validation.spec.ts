import {
  cfMatch,
  checks,
  firstName,
  loginFormGroup,
  messageFor,
  registerFormGroup,
  validEmail,
  validateLogin,
  validateRegister,
} from './auth-validation';
import { copy } from '../i18n/copy';

type LoginValue = { email?: string; password?: string };
type RegisterValue = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: boolean;
};

/** Seed a factory-built group and hand back its controls — one construction path. */
function seededLogin(value: LoginValue = {}) {
  const g = loginFormGroup();
  g.patchValue(value);
  return g.controls;
}

function seededRegister(value: RegisterValue = {}) {
  const g = registerFormGroup();
  g.patchValue(value);
  return g.controls;
}

describe('auth-validation', () => {
  describe('validEmail — the design regex, not Validators.email', () => {
    it('accepts a fully qualified address, on the trimmed value', () => {
      expect(validEmail('  lucia.fernandez@transur.com  ')).toBe(true);
    });

    it('rejects an address with no TLD', () => {
      expect(validEmail('operaciones@nexora')).toBe(false);
    });

    it('rejects an empty value', () => {
      expect(validEmail('')).toBe(false);
    });

    it('rejects "a@b.c" — the {2,} tail is the design\'s, and Validators.email accepts it', () => {
      expect(validEmail('a@b.c')).toBe(false);
    });
  });

  describe('checks — a ladder, not a score', () => {
    it('returns a 3-tuple in rule order', () => {
      expect(checks('Transur2026')).toEqual([true, true, true]);
    });

    it('fails all three rules for a 7-char lowercase word', () => {
      expect(checks('transur')).toEqual([false, false, false]);
    });

    it("is the register capsLock preset's case: only the uppercase rule passes", () => {
      expect(checks('TRANSUR')).toEqual([false, true, false]);
    });

    it('is the case in no preset: length and digit pass, uppercase does not', () => {
      expect(checks('transur9')).toEqual([true, false, true]);
    });
  });

  describe('messageFor — the 11 field-by-key pairs, the only place a message is chosen', () => {
    it('resolves the 3 login pairs', () => {
      expect(messageFor('email', 'required')).toBe(copy.auth.common.emailRequired);
      expect(messageFor('email', 'email')).toBe(copy.auth.common.emailInvalid);
      expect(messageFor('password', 'required')).toBe(copy.auth.common.passwordRequired);
    });

    it('resolves the 5 register pairs that share a key with login', () => {
      expect(messageFor('name', 'required')).toBe(copy.auth.register.nameRequired);
      expect(messageFor('email', 'required')).toBe(copy.auth.common.emailRequired);
      expect(messageFor('email', 'email')).toBe(copy.auth.common.emailInvalid);
      expect(messageFor('password', 'required')).toBe(copy.auth.common.passwordRequired);
      expect(messageFor('password', 'rules')).toBe(copy.auth.register.passwordRulesFailed);
    });

    it('resolves the 3 register-only pairs', () => {
      expect(messageFor('confirm', 'required')).toBe(copy.auth.register.confirmRequired);
      expect(messageFor('confirm', 'mismatch')).toBe(copy.auth.register.confirmMismatch);
      expect(messageFor('terms', 'required')).toBe(copy.auth.register.termsRequired);
    });

    it('returns a non-empty string for every pair the validators can emit', () => {
      const emitted: [Parameters<typeof messageFor>[0], Parameters<typeof messageFor>[1]][] = [
        ['email', 'required'],
        ['email', 'email'],
        ['password', 'required'],
        ['name', 'required'],
        ['password', 'rules'],
        ['confirm', 'required'],
        ['confirm', 'mismatch'],
        ['terms', 'required'],
      ];
      expect(emitted.map(([f, k]) => messageFor(f, k))).not.toContain('');
    });
  });

  describe('validateLogin — keys, never sentences', () => {
    it('reports an absent email as required', () => {
      expect(validateLogin(seededLogin()).email).toBe('required');
    });

    it('reports a whitespace-only email as required, because the rule trims', () => {
      expect(validateLogin(seededLogin({ email: '   ' })).email).toBe('required');
    });

    it('reports a malformed email as the email key, not required', () => {
      expect(validateLogin(seededLogin({ email: 'operaciones@nexora' })).email).toBe('email');
    });

    it('reports an absent password as required', () => {
      expect(validateLogin(seededLogin({ email: 'lucia@transur.com' })).password).toBe('required');
    });

    it('holds keys, not copy, so a copy edit cannot break a validation test', () => {
      const errors = validateLogin(seededLogin());
      expect(Object.values(errors)).not.toContain(copy.auth.common.emailRequired);
    });
  });

  describe('validateRegister', () => {
    it("accepts the design's full payload", () => {
      const errors = validateRegister(
        seededRegister({
          name: 'Lucía Fernández',
          email: 'lucia.fernandez@transur.com',
          password: 'Transur2026',
          confirm: 'Transur2026',
          terms: true,
        }),
      );
      expect(errors).toEqual({});
    });

    it('reports a weak-but-present password as the rules key, not required', () => {
      const errors = validateRegister(
        seededRegister({
          name: 'Lucía',
          email: 'lucia@transur.com',
          password: 'transur',
          confirm: 'transur',
        }),
      );
      expect(errors.password).toBe('rules');
    });

    it('reports a confirm mismatch as the mismatch key', () => {
      const errors = validateRegister(seededRegister({ password: 'Transur2026', confirm: 'x' }));
      expect(errors.confirm).toBe('mismatch');
    });

    it('reports an unchecked terms box', () => {
      expect(validateRegister(seededRegister({ terms: false })).terms).toBe('required');
    });
  });

  describe("firstName — the || '' is load-bearing (R18)", () => {
    it('takes the first token of a full name', () => {
      expect(firstName('Lucía Fernández')).toBe('Lucía');
    });

    it('trims leading and trailing whitespace first', () => {
      expect(firstName('  Lucía  Fernández  ')).toBe('Lucía');
    });

    it('returns the empty string, never undefined', () => {
      expect(firstName('')).toBe('');
    });

    it('returns the empty string for whitespace only', () => {
      expect(firstName('   ')).toBe('');
    });
  });

  describe('cfMatch — the error-set suppression is PART of the rule (R-S5)', () => {
    it('is true when both values agree and no error is set', () => {
      expect(cfMatch({}, 'Transur2026', 'Transur2026')).toBe(true);
    });

    it('is suppressed while the mismatch error is set, even on agreement', () => {
      expect(cfMatch({ confirm: 'mismatch' }, 'Transur2026', 'Transur2026')).toBe(false);
    });

    it('is false for an empty confirm', () => {
      expect(cfMatch({}, '', 'Transur2026')).toBe(false);
    });
  });

  describe('the group factories — one construction path, ZERO validators', () => {
    it('builds a login group that is valid even when empty', () => {
      // The trap this pins: a submit handler opening with `if (form.invalid)
      // return` would silently disable the whole validation system, because
      // with no validators the group is ALWAYS valid.
      const g = loginFormGroup();
      expect(g.controls.email.value).toBe('');
      expect(g.valid).toBe(true);
      expect(g.controls.email.validator).toBeNull();
      expect(g.controls.password.validator).toBeNull();
    });

    it('holds terms as a control, because validateRegister reads it', () => {
      const g = registerFormGroup();
      expect(g.controls.terms.value).toBe(false);
      expect(g.valid).toBe(true);
      expect(g.controls.terms.validator).toBeNull();
    });

    it('builds non-nullable controls, so value is string and never null', () => {
      expect(loginFormGroup().controls.email.value).toBe('');
      expect(registerFormGroup().controls.name.value).toBe('');
    });
  });
});
