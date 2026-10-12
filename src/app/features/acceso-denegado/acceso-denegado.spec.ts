import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AccesoDenegado } from './acceso-denegado';
import { AuthTokenService } from '../../shared/auth/auth-token.service';

describe('AccesoDenegado Component', () => {
  let component: AccesoDenegado;
  let fixture: ComponentFixture<AccesoDenegado>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockLocation: { back: ReturnType<typeof vi.fn> };
  let mockTokenService: { getRoles: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockRouter = { navigate: vi.fn() };
    mockLocation = { back: vi.fn() };
    mockTokenService = { getRoles: vi.fn().mockReturnValue(['CHOFER']) };

    await TestBed.configureTestingModule({
      imports: [AccesoDenegado],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: AuthTokenService, useValue: mockTokenService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccesoDenegado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the access denied card and message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.denied-title')?.textContent).toContain('Permisos Insuficientes');
    expect(compiled.querySelector('.denied-badge')?.textContent).toContain('Acceso Restringido');
  });

  it('calls location.back on back button click', () => {
    const button = fixture.nativeElement.querySelector('.btn-back') as HTMLButtonElement;
    button.click();

    expect(mockLocation.back).toHaveBeenCalled();
  });

  it('calls router.navigate to login on onGoHome', () => {
    component.onGoHome();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
