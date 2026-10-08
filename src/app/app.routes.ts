import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: 'login' },
];
