import { LOGIN_PRESETS, REGISTER_PRESETS, presetFor } from './auth-presets';
import type {
  LoginPreset,
  LoginPresetId,
  PresetKey,
  RegisterPreset,
  RegisterPresetId,
} from './auth-presets';
import { checks } from './auth-validation';

/** `presetFor` is form-agnostic by design; these narrow it for the assertions. */
const loginPreset = (id: LoginPresetId): LoginPreset => presetFor(`login:${id}`) as LoginPreset;
const registerPreset = (id: RegisterPresetId): RegisterPreset =>
  presetFor(`register:${id}`) as RegisterPreset;

describe('auth-presets — the 17 seeds the gallery and every spec share', () => {
  it('holds 8 login and 9 register states', () => {
    expect(LOGIN_PRESETS).toHaveLength(8);
    expect(REGISTER_PRESETS).toHaveLength(9);
  });

  it("keys every preset uniquely, because the design's names collide across forms", () => {
    // 'default', 'focus', 'capsLock', 'loading', 'error' and 'success' name
    // BOTH forms. Tracking the gallery by the design's bare name would be a
    // duplicate key, so the key is `form:id` and the id stays the design's.
    const keys = [...LOGIN_PRESETS, ...REGISTER_PRESETS].map((p) => `${p.form}:${p.id}`);
    expect(new Set(keys).size).toBe(17);
  });

  describe('LOGIN — LoginForm.dc.html:96-105, the 8 states', () => {
    it('seeds default quiet: no value, no status, no focus, no caps, no error', () => {
      expect(loginPreset('default')).toEqual({
        form: 'login',
        id: 'default',
        patch: {},
        status: 'idle',
        errors: {},
        focus: null,
        caps: false,
      });
    });

    it('seeds focus with a half-typed email and the email field focused', () => {
      const p = loginPreset('focus');
      expect(p.patch).toEqual({ email: 'operaciones@nex' });
      expect(p.focus).toBe('email');
      expect(p.errors).toEqual({});
    });

    it("seeds emailInvalid with the email KEY, never the design's sentence", () => {
      const p = loginPreset('emailInvalid');
      expect(p.patch).toEqual({ email: 'operaciones@nexora' });
      expect(p.errors).toEqual({ email: 'email' });
    });

    it('seeds passwordRequired with a valid email that stays quiet', () => {
      const p = loginPreset('passwordRequired');
      expect(p.patch).toEqual({ email: 'operaciones@nexora.com' });
      expect(p.errors).toEqual({ password: 'required' });
    });

    it('seeds capsLock with a 1-of-3 password, the password focused and caps on', () => {
      const p = loginPreset('capsLock');
      expect(p.patch).toEqual({ email: 'operaciones@nexora.com', password: 'NEXORA' });
      expect(p.focus).toBe('password');
      expect(p.caps).toBe(true);
      expect(p.errors).toEqual({});
    });

    it('seeds loading, error and success on the same valid payload', () => {
      expect(loginPreset('loading').status).toBe('loading');
      expect(loginPreset('error')).toMatchObject({
        status: 'error',
        patch: { password: 'nexora2025' },
      });
      expect(loginPreset('success')).toMatchObject({
        status: 'success',
        patch: { password: 'nexora2026' },
      });
    });

    it('leaves every field quiet in the error state — a server failure is not a field error', () => {
      expect(loginPreset('error').errors).toEqual({});
    });
  });

  describe('REGISTER — RegisterForm.dc.html:148-158, the 9 states', () => {
    it('seeds default with terms UNCHECKED and confirm empty', () => {
      expect(registerPreset('default')).toEqual({
        form: 'register',
        id: 'default',
        patch: {},
        status: 'idle',
        errors: {},
        focus: null,
        caps: false,
      });
    });

    it('seeds focus on the email field with a name filled and quiet', () => {
      const p = registerPreset('focus');
      expect(p.patch).toEqual({ name: 'Lucía Fernández', email: 'lucia.fer' });
      expect(p.focus).toBe('email');
      expect(p.errors).toEqual({});
    });

    it('seeds validation with FOUR errors, and name NOT among them', () => {
      // The asymmetry is the design's: a filled name stays quiet.
      const p = registerPreset('validation');
      expect(Object.keys(p.errors).sort()).toEqual(['confirm', 'email', 'password', 'terms']);
      expect(p.patch.email).toBe('lucia@transur');
    });

    it('seeds weak with a 0-of-3 password, focused, and NO error (R15)', () => {
      const p = registerPreset('weak');
      expect(p.patch.password).toBe('transur');
      expect(p.focus).toBe('password');
      expect(p.errors).toEqual({});
    });

    it('seeds mismatch with an agreed password and a disagreeing confirm', () => {
      const p = registerPreset('mismatch');
      expect(p.patch).toMatchObject({ password: 'Transur2026', confirm: 'Transur2025' });
      expect(p.errors).toEqual({ confirm: 'mismatch' });
    });

    it('seeds capsLock from Reg:154, which spreads `s` and NOT `f`', () => {
      // spec #429 R-S6 says `terms: true`. The design does not: Reg:154 spreads
      // the empty base, so confirm is '' and terms is UNCHECKED. That card
      // carries `errors: {}`, so R-S6's square-vs-circle shape comparison has
      // nothing to compare against and belongs to R-Sc6, not here.
      const p = registerPreset('capsLock');
      expect(p.patch).toEqual({
        name: 'Lucía Fernández',
        email: 'lucia.fernandez@transur.com',
        password: 'TRANSUR',
      });
      expect(p.errors).toEqual({});
    });

    it('seeds loading, error and success from the full payload', () => {
      expect(registerPreset('loading')).toMatchObject({
        status: 'loading',
        patch: { terms: true },
      });
      // The error card uses the TAKEN address, which is what makes the alert
      // mean what its title says.
      expect(registerPreset('error')).toMatchObject({
        status: 'error',
        patch: { email: 'operaciones@nexora.com' },
      });
      expect(registerPreset('success').status).toBe('success');
    });
  });

  describe('the strength ladder, on the seeds that disagree (R7)', () => {
    it('gives the register capsLock card 1 of 3 — the case the design gets wrong', () => {
      const { password } = registerPreset('capsLock').patch;
      expect(checks(password ?? '')).toEqual([false, true, false]);
      expect(checks(password ?? '').filter(Boolean)).toHaveLength(1);
    });

    it("gives 'transur9' 2 of 3 — the case in no preset at all", () => {
      expect(checks('transur9')).toEqual([true, false, true]);
      expect(checks('transur9').filter(Boolean)).toHaveLength(2);
    });

    it('gives the agreeing register cards 3 of 3, which is why the defect hid', () => {
      for (const id of ['mismatch', 'loading', 'success'] as const) {
        const { password } = registerPreset(id).patch;
        expect(checks(password ?? '')).toEqual([true, true, true]);
      }
    });
  });

  it('rejects an unknown key loudly rather than returning undefined', () => {
    expect(() => presetFor('login:nope' as PresetKey)).toThrowError(/Unknown auth preset/);
  });
});
