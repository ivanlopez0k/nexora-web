import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth-login/auth-login').then((m) => m.AuthLogin),
    title: 'Iniciar sesión · Nexora',
  },
  /*
    THE WILDCARD IS A DISCLOSED PLACEHOLDER, not a decision this change made. A
    404 page is a design this change does not contain, and the honest options
    were a blank screen or a labelled redirect. It is LAST on purpose: an
    earlier `**` would swallow every route appended after it.

    The `register` route and the `isDevMode()`-gated dev gallery land in later
    slices, each in the SAME slice as the component it points at — a route that
    existed before its component would put the demo credentials one slice
    closer to shipping un-gated.
  */
  { path: '**', redirectTo: 'login' },
];
