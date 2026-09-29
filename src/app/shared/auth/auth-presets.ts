import type { AuthErrors, AuthStatus, LoginField, RegisterField } from './auth-types';

/**
 * The 17 state seeds, transcribed from the two prototypes'
 * `initFor(p)` and nothing else: `LoginForm.dc.html:96-105` and
 * `RegisterForm.dc.html:148-158`.
 *
 * ONE pure source, so the dev gallery, both forms' specs and these specs
 * cannot drift. State is SEEDED here, never produced: a card that submitted
 * would have `loading` auto-resolve after 1500/1600ms and be wrong by the time
 * it was read.
 *
 * `errors` carries KEYS, not the design's sentences. The design rendered its
 * message strings directly; ours renders `messageFor(field, key)`. That is what
 * makes a copy edit unable to break a state assertion.
 *
 * The design's `show` field is deliberately NOT carried. No seed sets it true
 * (every `s` literal has `show: false`), and D2 makes the reveal a private
 * signal, so a preset field for it would be a field that is always false.
 */
export type LoginPatch = { email?: string; password?: string };
export type RegisterPatch = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: boolean;
};

export type LoginPreset = Readonly<{
  form: 'login';
  id: string;
  patch: LoginPatch;
  status: AuthStatus;
  errors: AuthErrors<LoginField>;
  focus: LoginField | null;
  caps: boolean;
}>;

export type RegisterPreset = Readonly<{
  form: 'register';
  id: string;
  patch: RegisterPatch;
  status: AuthStatus;
  errors: AuthErrors<RegisterField>;
  focus: RegisterField | null;
  caps: boolean;
}>;

export const LOGIN_PRESETS = [
  { form: 'login', id: 'default', patch: {}, status: 'idle', errors: {}, focus: null, caps: false },
  {
    form: 'login',
    id: 'focus',
    patch: { email: 'operaciones@nex' },
    status: 'idle',
    errors: {},
    focus: 'email',
    caps: false,
  },
  {
    form: 'login',
    id: 'emailInvalid',
    patch: { email: 'operaciones@nexora' },
    status: 'idle',
    errors: { email: 'email' },
    focus: null,
    caps: false,
  },
  {
    form: 'login',
    id: 'passwordRequired',
    patch: { email: 'operaciones@nexora.com' },
    status: 'idle',
    errors: { password: 'required' },
    focus: null,
    caps: false,
  },
  {
    form: 'login',
    id: 'capsLock',
    patch: { email: 'operaciones@nexora.com', password: 'NEXORA' },
    status: 'idle',
    errors: {},
    focus: 'password',
    caps: true,
  },
  {
    form: 'login',
    id: 'loading',
    patch: { email: 'operaciones@nexora.com', password: 'nexora2026' },
    status: 'loading',
    errors: {},
    focus: null,
    caps: false,
  },
  {
    form: 'login',
    id: 'error',
    patch: { email: 'operaciones@nexora.com', password: 'nexora2025' },
    status: 'error',
    errors: {},
    focus: null,
    caps: false,
  },
  {
    form: 'login',
    id: 'success',
    patch: { email: 'operaciones@nexora.com', password: 'nexora2026' },
    status: 'success',
    errors: {},
    focus: null,
    caps: false,
  },
] as const satisfies readonly LoginPreset[];

export const REGISTER_PRESETS = [
  {
    form: 'register',
    id: 'default',
    patch: {},
    status: 'idle',
    errors: {},
    focus: null,
    caps: false,
  },
  {
    form: 'register',
    id: 'focus',
    patch: { name: 'Lucía Fernández', email: 'lucia.fer' },
    status: 'idle',
    errors: {},
    focus: 'email',
    caps: false,
  },
  {
    form: 'register',
    id: 'validation',
    patch: { name: 'Lucía Fernández', email: 'lucia@transur' },
    status: 'idle',
    errors: { email: 'email', password: 'required', confirm: 'required', terms: 'required' },
    focus: null,
    caps: false,
  },
  {
    form: 'register',
    id: 'weak',
    patch: { name: 'Lucía Fernández', email: 'lucia.fernandez@transur.com', password: 'transur' },
    status: 'idle',
    errors: {},
    focus: 'password',
    caps: false,
  },
  {
    form: 'register',
    id: 'mismatch',
    patch: {
      name: 'Lucía Fernández',
      email: 'lucia.fernandez@transur.com',
      password: 'Transur2026',
      confirm: 'Transur2025',
      terms: true,
    },
    status: 'idle',
    errors: { confirm: 'mismatch' },
    focus: null,
    caps: false,
  },
  {
    // Reg:154 spreads `s`, NOT `f` — so confirm is '' and terms is UNCHECKED.
    // spec #429 R-S6 says `terms: true` and is wrong. See the spec's own note.
    form: 'register',
    id: 'capsLock',
    patch: {
      name: 'Lucía Fernández',
      email: 'lucia.fernandez@transur.com',
      password: 'TRANSUR',
    },
    status: 'idle',
    errors: {},
    focus: 'password',
    caps: true,
  },
  {
    form: 'register',
    id: 'loading',
    patch: {
      name: 'Lucía Fernández',
      email: 'lucia.fernandez@transur.com',
      password: 'Transur2026',
      confirm: 'Transur2026',
      terms: true,
    },
    status: 'loading',
    errors: {},
    focus: null,
    caps: false,
  },
  {
    form: 'register',
    id: 'error',
    patch: {
      name: 'Lucía Fernández',
      email: 'operaciones@nexora.com',
      password: 'Transur2026',
      confirm: 'Transur2026',
      terms: true,
    },
    status: 'error',
    errors: {},
    focus: null,
    caps: false,
  },
  {
    form: 'register',
    id: 'success',
    patch: {
      name: 'Lucía Fernández',
      email: 'lucia.fernandez@transur.com',
      password: 'Transur2026',
      confirm: 'Transur2026',
      terms: true,
    },
    status: 'success',
    errors: {},
    focus: null,
    caps: false,
  },
] as const satisfies readonly RegisterPreset[];

export type LoginPresetId = (typeof LOGIN_PRESETS)[number]['id'];
export type RegisterPresetId = (typeof REGISTER_PRESETS)[number]['id'];

/**
 * `form:id`, and NOT the design's bare name: six of the seventeen names belong
 * to BOTH forms, so a bare id is a duplicate key for the gallery's `@for`
 * tracking and an ambiguous argument for this lookup. The `id` field keeps the
 * design's own spelling, which is what the gallery captions read.
 */
export type PresetKey = `login:${LoginPresetId}` | `register:${RegisterPresetId}`;

const BY_KEY: Record<string, LoginPreset | RegisterPreset> = {
  ...Object.fromEntries(LOGIN_PRESETS.map((p) => [`login:${p.id}`, p])),
  ...Object.fromEntries(REGISTER_PRESETS.map((p) => [`register:${p.id}`, p])),
};

export function presetFor(key: PresetKey): LoginPreset | RegisterPreset {
  const preset = BY_KEY[key];
  if (!preset) {
    throw new Error(`Unknown auth preset: ${key}`);
  }
  return preset;
}
