import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthTokenService } from './auth-token.service';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenService: AuthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(AuthTokenService);
  });

  afterEach(() => {
    httpMock.verify();
    tokenService.clearToken();
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
});
