import { copyEs } from './copy.es';
import type { Copy } from './copy';

/** The 13 rioplatense voseo forms the design ships. #428 §2 — none may survive. */
const VOSEO = [
  'Iniciá sesión para continuar.',
  '¿No tenés una cuenta?',
  '¿Ya tenés una cuenta?',
  'Ingresá tu contraseña',
  'Ingresá un email válido, por ejemplo nombre@empresa.com.',
  'Completá tus datos para acceder a la plataforma.',
  'Creá una contraseña',
  'Repetí la contraseña',
  'Confirmá tu contraseña.',
  'Verificá tus datos e intentá nuevamente.',
  'Iniciá sesión',
  'o usá otro email.',
  'Tenés que aceptar los términos para continuar.',
];

/** Their neutral tuteo counterparts, paired 1:1. A "fix" that deletes a string fails too. */
const TUTEO = [
  'Inicia sesión para continuar.',
  '¿No tienes una cuenta?',
  '¿Ya tienes una cuenta?',
  'Ingresa tu contraseña',
  'Ingresa un email válido, por ejemplo nombre@empresa.com.',
  'Completa tus datos para acceder a la plataforma.',
  'Crea una contraseña',
  'Repite la contraseña',
  'Confirma tu contraseña.',
  'Verifica tus datos e intenta nuevamente.',
  'Inicia sesión',
  'o usa otro email.',
  'Tienes que aceptar los términos para continuar.',
];

/** An accented voseo imperative, and the voseo present of `tener`. */
const VOSEO_IMPERATIVE = /\b(inici|ingres|complet|cre|repet|confirm|verific|intent|us)á\b/;
const VOSEO_TENER = /\btenés\b/;

function leaves(node: unknown): string[] {
  if (typeof node === 'string') {
    return [node];
  }
  if (node !== null && typeof node === 'object') {
    return Object.values(node as Record<string, unknown>).flatMap(leaves);
  }
  return [];
}

describe('copy (es) — the language contract', () => {
  const all = leaves(copyEs.auth);
  const serialised = JSON.stringify(copyEs.auth);

  it('carries none of the 13 voseo forms the design ships', () => {
    const leaked = VOSEO.filter((form) => serialised.includes(form));
    expect(leaked).toEqual([]);
  });

  it('carries all 13 tuteo counterparts', () => {
    // Presence, not leaf-equality: two counterparts are fragments the copy
    // table stores inside a longer leaf (row 18 wraps the login alert body),
    // and row 30's link text is its own leaf only by accident of the split.
    const missing = TUTEO.filter((form) => !serialised.includes(form));
    expect(missing).toEqual([]);
  });

  it('holds exactly 62 user-facing strings', () => {
    expect(all).toHaveLength(62);
  });

  it('survives no accented voseo imperative in any leaf', () => {
    const offenders = all.filter((leaf) => VOSEO_IMPERATIVE.test(leaf) || VOSEO_TENER.test(leaf));
    expect(offenders).toEqual([]);
  });

  it('keeps slots out of the literals — no leaf interpolates', () => {
    const interpolated = all.filter((leaf) => /[{}]/.test(leaf));
    expect(interpolated).toEqual([]);
  });

  it('satisfies the Copy type, so a future copy.en.ts is checked the same way', () => {
    const _parity: Copy = copyEs;
    expect(_parity).toBe(copyEs);
  });

  it('holds the demo credentials in the two hint lines and nowhere else', () => {
    const carriers = all.filter(
      (leaf) => leaf.includes('operaciones@nexora.com') || leaf.includes('nexora2026'),
    );
    expect(carriers.sort()).toEqual(
      [copyEs.auth.login.hintLine1, copyEs.auth.register.hintLine1].sort(),
    );
  });
});
