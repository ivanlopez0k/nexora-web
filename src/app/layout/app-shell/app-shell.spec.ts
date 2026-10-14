import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppShell } from './app-shell';
import { AuthTokenService } from '../../shared/auth/auth-token.service';

describe('AppShell Layout Component', () => {
  let component: AppShell;
  let fixture: ComponentFixture<AppShell>;
  let mockTokenService: {
    getRoles: ReturnType<typeof vi.fn>;
    getClaims: ReturnType<typeof vi.fn>;
    clearToken: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    mockTokenService = {
      getRoles: vi.fn().mockReturnValue(['SUPER_ADMIN']),
      getClaims: vi.fn().mockReturnValue({ email: 'admin@nexora.com' }),
      clearToken: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideRouter([]),
        { provide: AuthTokenService, useValue: mockTokenService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(AppShell);
    component = fixture.componentInstance;
  });

  it('renders all four navigation links for SUPER_ADMIN', () => {
    mockTokenService.getRoles.mockReturnValue(['SUPER_ADMIN']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    expect(links.length).toBe(4);
    expect(component.canAccessCentros()).toBe(true);
    expect(component.canAccessClientes()).toBe(true);
    expect(component.canAccessVehiculos()).toBe(true);
    expect(component.canAccessEmpleados()).toBe(true);
  });

  it('renders only Vehiculos for OPERADOR_LOGISTICO', () => {
    mockTokenService.getRoles.mockReturnValue(['OPERADOR_LOGISTICO']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    expect(links.length).toBe(1);
    expect(links[0].textContent).toContain('Vehículos');
    expect(component.canAccessCentros()).toBe(false);
    expect(component.canAccessClientes()).toBe(false);
    expect(component.canAccessVehiculos()).toBe(true);
    expect(component.canAccessEmpleados()).toBe(false);
  });

  it('renders only Clientes for ADMINISTRACION', () => {
    mockTokenService.getRoles.mockReturnValue(['ADMINISTRACION']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    expect(links.length).toBe(1);
    expect(links[0].textContent).toContain('Clientes');
    expect(component.canAccessCentros()).toBe(false);
    expect(component.canAccessClientes()).toBe(true);
    expect(component.canAccessVehiculos()).toBe(false);
    expect(component.canAccessEmpleados()).toBe(false);
  });

  it('renders only Empleados for SUPERVISOR', () => {
    mockTokenService.getRoles.mockReturnValue(['SUPERVISOR']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    expect(links.length).toBe(1);
    expect(links[0].textContent).toContain('Empleados');
    expect(component.canAccessCentros()).toBe(false);
    expect(component.canAccessClientes()).toBe(false);
    expect(component.canAccessVehiculos()).toBe(false);
    expect(component.canAccessEmpleados()).toBe(true);
  });

  it('renders zero links for CHOFER', () => {
    mockTokenService.getRoles.mockReturnValue(['CHOFER']);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    expect(links.length).toBe(0);
  });

  it('displays user email and primary role badge', () => {
    mockTokenService.getRoles.mockReturnValue(['ADMIN_EMPRESA']);
    mockTokenService.getClaims.mockReturnValue({ email: 'gerencia@nexora.com' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.badge-role')?.textContent).toContain('ADMIN_EMPRESA');
    expect(compiled.querySelector('.user-email')?.textContent).toContain('gerencia@nexora.com');
  });

  it('clears token and redirects to login on logout', () => {
    component.onLogout();

    expect(mockTokenService.clearToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
