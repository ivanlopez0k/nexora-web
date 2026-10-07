import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { AuthTokenService } from './auth-token.service';

/**
 * Functional HTTP Interceptor (Angular 21) that automatically attaches
 * the Authorization: Bearer <token> header to outgoing HTTP requests
 * when a token exists in AuthTokenService.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AuthTokenService);
  const token = tokenService.getToken();

  if (token && !req.headers.has('Authorization')) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
