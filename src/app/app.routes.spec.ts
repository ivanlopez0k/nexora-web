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
    expect(login?.component).toBeUndefined();
  });

  it("carries the login title with the ACCENT, matching the copy leaf's own spelling", () => {
    const title = find('login')?.title;
    expect(title).toBe('Iniciar sesión · Nexora');
    expect(String(title).startsWith(`${copy.auth.common.signIn} ·`)).toBe(true);
  });

  it('routes /register to the wrapper lazily with matching title', () => {
    const register = find('register');
    expect(register).toBeDefined();
    expect(typeof register?.loadComponent).toBe('function');
    expect(register?.component).toBeUndefined();
    expect(register?.title).toBe('Crear cuenta · Nexora');
    expect(String(register?.title).startsWith(`${copy.auth.common.createAccount} ·`)).toBe(true);
  });

  it('ends with a wildcard redirect to login, and it is disclosed as a placeholder', () => {
    const last = routes[routes.length - 1];
    expect(last.path).toBe('**');
    expect(last.redirectTo).toBe('login');
    expect(routes.findIndex((r) => r.path === '**')).toBe(routes.length - 1);
  });

  it('routes /centros-logisticos lazily and protects it with authGuard', () => {
    const centros = find('centros-logisticos');
    expect(centros).toBeDefined();
    expect(typeof centros?.loadComponent).toBe('function');
    expect(centros?.title).toBe('Centros Logísticos · Nexora');
    expect(centros?.canActivate).toBeDefined();
  });

  it('declares no dev gallery route yet, and the gate is not the reason', () => {
    expect(find('dev/auth')).toBeUndefined();
  });
});
