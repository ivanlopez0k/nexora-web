import { inject } from '@angular/core';
import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthTokenService } from './auth-token.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/** Resets in-flight refresh state between tests. */
export function resetRefreshState(): void {
  isRefreshing = false;
  refreshTokenSubject.next(null);
}

const AUTH_URL_PATTERNS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

function isAuthUrl(url: string): boolean {
  return AUTH_URL_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * Functional HTTP Interceptor (Angular 21) that:
 * 1. Attaches `Authorization: Bearer <token>` to requests when authenticated.
 * 2. Catches 401 Unauthorized responses to transparently refresh the token
 *    via `POST /api/auth/refresh` without infinite loops.
 * 3. Queues concurrent requests while token refresh is in-flight.
 * 4. Clears active session and redirects to `/login` if refresh fails.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AuthTokenService);
  const router = inject(Router);
  const httpBackend = inject(HttpBackend);

  const token = tokenService.getToken();

  let outgoingReq = req;
  if (token && !req.headers.has('Authorization')) {
    outgoingReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(outgoingReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Prevent refresh loops if 401 occurs on auth endpoints
        if (isAuthUrl(req.url)) {
          if (req.url.includes('/api/auth/refresh')) {
            tokenService.clearToken();
            router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
          return throwError(() => error);
        }

        const refreshToken = tokenService.getRefreshToken();
        if (!refreshToken) {
          // No refresh token available, session is expired
          tokenService.clearToken();
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          // Use raw HttpBackend to avoid cyclic interceptor invocation and loops
          const rawHttp = new HttpClient(httpBackend);
          return rawHttp
            .post<{ token: string; refreshToken?: string }>('/api/auth/refresh', { refreshToken })
            .pipe(
              switchMap((res) => {
                isRefreshing = false;
                tokenService.setTokens(res.token, res.refreshToken ?? refreshToken);
                refreshTokenSubject.next(res.token);

                const retriedReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${res.token}`,
                  },
                });
                return next(retriedReq);
              }),
              catchError((refreshErr: unknown) => {
                isRefreshing = false;
                refreshTokenSubject.next(null);
                tokenService.clearToken();
                router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
                return throwError(() => refreshErr);
              }),
            );
        } else {
          // Concurrency: queue request until current refresh finishes
          return refreshTokenSubject.pipe(
            filter((newToken) => newToken !== null),
            take(1),
            switchMap((newToken) => {
              const retriedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next(retriedReq);
            }),
          );
        }
      }

      return throwError(() => error);
    }),
  );
};
