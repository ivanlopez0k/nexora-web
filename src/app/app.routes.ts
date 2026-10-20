import { Routes } from '@angular/router';
import { authGuard } from './shared/auth/auth.guard';
import { PERMISSION_MAP } from './shared/auth/permissions';

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
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: 'centros-logisticos',
        canActivate: [authGuard],
        data: { roles: PERMISSION_MAP.centrosLogisticos },
        loadComponent: () =>
          import('./features/centros-logisticos/centros-logisticos').then((m) => m.CentrosLogisticos),
        title: 'Centros Logísticos · Nexora',
      },
      {
        path: 'clientes',
        canActivate: [authGuard],
        data: { roles: PERMISSION_MAP.clientes },
        loadComponent: () => import('./features/clientes/clientes').then((m) => m.Clientes),
        title: 'Clientes · Nexora',
      },
      {
        path: 'vehiculos',
        canActivate: [authGuard],
        data: { roles: PERMISSION_MAP.vehiculos },
        loadComponent: () => import('./features/vehiculos/vehiculos').then((m) => m.Vehiculos),
        title: 'Vehículos · Nexora',
      },
      {
        path: 'empleados',
        canActivate: [authGuard],
        data: { roles: PERMISSION_MAP.empleados },
        loadComponent: () => import('./features/empleados/empleados').then((m) => m.Empleados),
        title: 'Empleados · Nexora',
      },
      {
        path: 'choferes',
        canActivate: [authGuard],
        data: { roles: PERMISSION_MAP.choferes },
        loadComponent: () => import('./features/choferes/choferes').then((m) => m.Choferes),
        title: 'Choferes · Nexora',
      },
      {
        path: 'envios',
        canActivate: [authGuard],
        data: { roles: PERMISSION_MAP.envios },
        loadComponent: () => import('./features/envios/envios').then((m) => m.Envios),
        title: 'Envíos · Nexora',
      },
      {
        path: 'acceso-denegado',
        loadComponent: () =>
          import('./features/acceso-denegado/acceso-denegado').then((m) => m.AccesoDenegado),
        title: 'Acceso Denegado · Nexora',
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
