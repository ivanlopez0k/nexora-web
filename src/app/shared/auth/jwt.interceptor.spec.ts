import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { jwtInterceptor, resetRefreshState } from './jwt.interceptor';
import { AuthTokenService } from './auth-token.service';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenService: AuthTokenService;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(AuthTokenService);
    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    resetRefreshState();
  });

  afterEach(() => {
    httpMock.verify();
    tokenService.clearToken();
    resetRefreshState();
    vi.restoreAllMocks();
  });

  it('attaches Authorization: Bearer <token> when a token is present in AuthTokenService', () => {
    tokenService.setToken('valid-jwt-token-123');

    http.get('/api/shipments').subscribe();

    const req = httpMock.expectOne('/api/shipments');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-jwt-token-123');
    req.flush({});
  });

  it('does not attach Authorization header when no token is present', () => {
    tokenService.clearToken();

    http.get('/api/public-info').subscribe();

    const req = httpMock.expectOne('/api/public-info');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('preserves an existing Authorization header without overwriting it', () => {
    tokenService.setToken('service-token-abc');

    http
      .get('/api/custom-auth', {
        headers: { Authorization: 'Basic user:pass' },
      })
      .subscribe();

    const req = httpMock.expectOne('/api/custom-auth');
    expect(req.request.headers.get('Authorization')).toBe('Basic user:pass');
    req.flush({});
  });

  it('handles 401 by calling /api/auth/refresh with refresh token and retrying original request with new token', () => {
    tokenService.setTokens('expired-access-token', 'valid-refresh-token');

    let responseData: unknown = null;
    http.get('/api/shipments/101').subscribe((data) => {
      responseData = data;
    });

    // 1. Initial request with expired token fails with 401
    const initialReq = httpMock.expectOne('/api/shipments/101');
    expect(initialReq.request.headers.get('Authorization')).toBe('Bearer expired-access-token');
    initialReq.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    // 2. Interceptor catches 401 and calls /api/auth/refresh
    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    expect(refreshReq.request.body).toEqual({ refreshToken: 'valid-refresh-token' });
    refreshReq.flush({ token: 'new-access-token-999', refreshToken: 'rotated-refresh-token' });

    // 3. Original request is retried with the new access token
    const retryReq = httpMock.expectOne('/api/shipments/101');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-access-token-999');
    retryReq.flush({ id: 101, status: 'In Transit' });

    expect(responseData).toEqual({ id: 101, status: 'In Transit' });
    expect(tokenService.getToken()).toBe('new-access-token-999');
    expect(tokenService.getRefreshToken()).toBe('rotated-refresh-token');
  });

  it('queues concurrent 401 requests while refresh is in-flight and replays all with the new token', () => {
    tokenService.setTokens('expired-access-token', 'valid-refresh-token');

    let data1: unknown = null;
    let data2: unknown = null;

    http.get('/api/resource-alpha').subscribe((res) => (data1 = res));
    http.get('/api/resource-beta').subscribe((res) => (data2 = res));

    // Both initial requests arrive
    const req1 = httpMock.expectOne('/api/resource-alpha');
    const req2 = httpMock.expectOne('/api/resource-beta');

    // First request fails with 401 and starts refresh
    req1.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    // Second request also fails with 401 and is queued behind the ongoing refresh
    req2.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    // Only ONE refresh request should be issued
    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    refreshReq.flush({ token: 'refreshed-token-xyz' });

    // Both original requests are retried with the refreshed token
    const retry1 = httpMock.expectOne('/api/resource-alpha');
    const retry2 = httpMock.expectOne('/api/resource-beta');

    expect(retry1.request.headers.get('Authorization')).toBe('Bearer refreshed-token-xyz');
    expect(retry2.request.headers.get('Authorization')).toBe('Bearer refreshed-token-xyz');

    retry1.flush({ alpha: true });
    retry2.flush({ beta: true });

    expect(data1).toEqual({ alpha: true });
    expect(data2).toEqual({ beta: true });
  });

  it('redirects to /login and clears tokens when 401 occurs and no refresh token exists', () => {
    tokenService.setToken('expired-access-token'); // No refresh token set

    let errorReceived: unknown = null;
    http.get('/api/dashboard').subscribe({
      error: (err) => {
        errorReceived = err;
      },
    });

    const req = httpMock.expectOne('/api/dashboard');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Should not try to refresh
    httpMock.expectNone('/api/auth/refresh');

    expect(tokenService.getToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: router.url },
    });
    expect(errorReceived).toBeDefined();
  });

  it('clears session and redirects to /login when token refresh request itself fails with 401', () => {
    tokenService.setTokens('expired-access-token', 'invalid-refresh-token');

    let errorReceived: unknown = null;
    http.get('/api/protected-data').subscribe({
      error: (err) => {
        errorReceived = err;
      },
    });

    const req = httpMock.expectOne('/api/protected-data');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    refreshReq.flush({ message: 'Refresh token expired' }, { status: 401, statusText: 'Unauthorized' });

    // Does not loop or trigger a second refresh
    httpMock.expectNone('/api/auth/refresh');

    expect(tokenService.getToken()).toBeNull();
    expect(tokenService.getRefreshToken()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: router.url },
    });
    expect(errorReceived).toBeDefined();
  });

  it('does not attempt refresh when 401 occurs on login endpoint', () => {
    let errorReceived: unknown = null;
    http.post('/api/auth/login', { email: 'user@test.com', password: 'wrong' }).subscribe({
      error: (err) => {
        errorReceived = err;
      },
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Bad credentials' }, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone('/api/auth/refresh');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(errorReceived).toBeDefined();
  });
});

