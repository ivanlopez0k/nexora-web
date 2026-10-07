import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  let service: AuthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthTokenService);
    service.clearToken();
  });

  it('starts with a null token', () => {
    expect(service.getToken()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.hasToken()).toBe(false);
  });

  it('updates token and signal when setToken is called', () => {
    service.setToken('jwt-sample-token');
    expect(service.getToken()).toBe('jwt-sample-token');
    expect(service.token()).toBe('jwt-sample-token');
    expect(service.hasToken()).toBe(true);
  });

  it('clears token when clearToken is called', () => {
    service.setToken('jwt-sample-token');
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.hasToken()).toBe(false);
  });
});
