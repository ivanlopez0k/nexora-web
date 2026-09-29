import { copy } from './shared/i18n/copy';
import { routes } from './app.routes';
import type { Route } from '@angular/router';

const find = (path: string): Route | undefined => routes.find((r) => r.path === path);

describe('app.routes', () => {
  it('redirects the empty path to login, and only on a full match', () => {
    const root = find('');
    expect(root?.redirectTo).toBe('login');
    expect(root?.pathMatch).toBe('full');
  });

  it('routes /login to the wrapper lazily', () => {
    const login = find('login');
    expect(login).toBeDefined();
    expect(typeof login?.loadComponent).toBe('function');
    // Eager would put the form, the shell and the illustration in `initial`
    // before the user asked for a page.
    expect(login?.component).toBeUndefined();
  });

  it("carries the title with the ACCENT, matching the copy leaf's own spelling", () => {
    // #438 §10 records a real defect that shipped here: revision 1 wrote
    // 'Iniciar sesion · Nexora' with no accent, a silent near-duplicate of an
    // already-ratified leaf. The middle dot is U+00B7.
    const title = find('login')?.title;
    expect(title).toBe('Iniciar sesión · Nexora');
    expect(String(title).startsWith(`${copy.auth.common.signIn} ·`)).toBe(true);
  });

  it('ends with a wildcard redirect to login, and it is disclosed as a placeholder', () => {
    // A wildcard is a product decision and this change contains no 404 page.
    // It is kept, and kept LAST, because an earlier wildcard would swallow
    // every route after it.
    const last = routes[routes.length - 1];
    expect(last.path).toBe('**');
    expect(last.redirectTo).toBe('login');
    expect(routes.findIndex((r) => r.path === '**')).toBe(routes.length - 1);
  });

  it('declares no dev gallery route yet, and the gate is not the reason', () => {
    // Interim, and deliberately so: the gallery route and its isDevMode()
    // spread ship in the SAME slice as the gallery, so a route that existed
    // before its component would be a credential-gate hole. Asserting its
    // absence here is what makes that ordering mistake loud.
    expect(find('dev/auth')).toBeUndefined();
  });
});
