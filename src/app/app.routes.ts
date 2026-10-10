import { Routes } from '@angular/router';
import { authGuard } from './shared/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth-login/auth-login').then((m) => m.AuthLogin),
    title: 'Iniciar sesión · Nexora',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth-register/auth-register').then((m) => m.AuthRegister),
    title: 'Crear cuenta · Nexora',
  },
  {
    path: 'centros-logisticos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/centros-logisticos/centros-logisticos').then((m) => m.CentrosLogisticos),
    title: 'Centros Logísticos · Nexora',
  },
  {
    path: 'clientes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/clientes/clientes').then((m) => m.Clientes),
    title: 'Clientes · Nexora',
  },
  { path: '**', redirectTo: 'login' },
];
