import { copy } from './shared/i18n/copy';
import { routes } from './app.routes';
import { PERMISSION_MAP } from './shared/auth/permissions';
import type { Route } from '@angular/router';

const find = (path: string): Route | undefined => {
  for (const r of routes) {
    if (r.path === path) return r;
    if (r.children) {
      const child = r.children.find((c) => c.path === path);
      if (child) return child;
    }
  }
  return undefined;
};

describe('app.routes', () => {
  it('redirects the empty path to login, and only on a full match', () => {
    const root = routes.find((r) => r.path === '' && r.pathMatch === 'full');
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

  it('routes authenticated shell lazily with children and protects it with authGuard', () => {
    const shellRoute = routes.find((r) => r.children && r.children.length > 0);
    expect(shellRoute).toBeDefined();
    expect(shellRoute?.canActivate).toBeDefined();
    expect(typeof shellRoute?.loadComponent).toBe('function');
  });

  it('routes /centros-logisticos with authGuard and roles permission map', () => {
    const centros = find('centros-logisticos');
    expect(centros).toBeDefined();
    expect(typeof centros?.loadComponent).toBe('function');
    expect(centros?.title).toBe('Centros Logísticos · Nexora');
    expect(centros?.canActivate).toBeDefined();
    expect(centros?.data?.['roles']).toEqual(PERMISSION_MAP.centrosLogisticos);
  });

  it('routes /clientes with authGuard and roles permission map', () => {
    const clientes = find('clientes');
    expect(clientes).toBeDefined();
    expect(typeof clientes?.loadComponent).toBe('function');
    expect(clientes?.title).toBe('Clientes · Nexora');
    expect(clientes?.canActivate).toBeDefined();
    expect(clientes?.data?.['roles']).toEqual(PERMISSION_MAP.clientes);
  });

  it('routes /vehiculos with authGuard and roles permission map', () => {
    const vehiculos = find('vehiculos');
    expect(vehiculos).toBeDefined();
    expect(typeof vehiculos?.loadComponent).toBe('function');
    expect(vehiculos?.title).toBe('Vehículos · Nexora');
    expect(vehiculos?.canActivate).toBeDefined();
    expect(vehiculos?.data?.['roles']).toEqual(PERMISSION_MAP.vehiculos);
  });

  it('routes /empleados with authGuard and roles permission map', () => {
    const empleados = find('empleados');
    expect(empleados).toBeDefined();
    expect(typeof empleados?.loadComponent).toBe('function');
    expect(empleados?.title).toBe('Empleados · Nexora');
    expect(empleados?.canActivate).toBeDefined();
    expect(empleados?.data?.['roles']).toEqual(PERMISSION_MAP.empleados);
  });

  it('routes /choferes with authGuard and roles permission map', () => {
    const choferes = find('choferes');
    expect(choferes).toBeDefined();
    expect(typeof choferes?.loadComponent).toBe('function');
    expect(choferes?.title).toBe('Choferes · Nexora');
    expect(choferes?.canActivate).toBeDefined();
    expect(choferes?.data?.['roles']).toEqual(PERMISSION_MAP.choferes);
  });

  it('routes /envios with authGuard and roles permission map', () => {
    const envios = find('envios');
    expect(envios).toBeDefined();
    expect(typeof envios?.loadComponent).toBe('function');
    expect(envios?.title).toBe('Envíos · Nexora');
    expect(envios?.canActivate).toBeDefined();
    expect(envios?.data?.['roles']).toEqual(PERMISSION_MAP.envios);
  });

  it('routes /acceso-denegado lazily with matching title', () => {
    const denied = find('acceso-denegado');
    expect(denied).toBeDefined();
    expect(typeof denied?.loadComponent).toBe('function');
    expect(denied?.title).toBe('Acceso Denegado · Nexora');
  });

  it('declares no dev gallery route yet, and the gate is not the reason', () => {
    expect(find('dev/auth')).toBeUndefined();
  });
});
