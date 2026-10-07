import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthRegister } from './auth-register';
import { copy } from '../../shared/i18n/copy';
import { MOCK_LOGIN_EMAIL, MockAuthService } from '../../shared/auth/mock-auth.service';

describe('AuthRegister', () => {
  let fixture: ComponentFixture<AuthRegister>;
  let component: AuthRegister;
  let authService: MockAuthService;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthRegister],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AuthRegister);
    component = fixture.componentInstance;
    authService = TestBed.inject(MockAuthService);
    authService.reset();
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  const render = () => fixture.detectChanges();
  const q = <T extends Element = HTMLElement>(sel: string) => el.querySelector(sel) as T | null;

  function type(selector: string, value: string): void {
    const input = q<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    render();
  }

  function submit(): void {
    q<HTMLFormElement>('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    render();
  }

  it('composes the shell around the register form', () => {
    expect(q('app-auth-shell')).not.toBeNull();
    expect(q('app-register-form')).not.toBeNull();
  });

  it('successfully registers with a fresh valid payload and transitions to success', async () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    type('input[autocomplete="name"]', 'Martín Fierro');
    type('input[autocomplete="email"]', uniqueEmail);
    type('input[id^="nx-reg-password"]', 'Password123');
    type('input[id^="nx-reg-confirm"]', 'Password123');

    const checkbox = q<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    render();

    submit();
    expect(component.status()).toBe('loading');

    // Wait for the mock register latency promise
    await new Promise((resolve) => setTimeout(resolve, 1700));
    render();

    expect(component.status()).toBe('success');
    expect(el.textContent).toContain(copy.auth.register.successTitle);
    expect(el.textContent).toContain('Martín');
    expect(el.textContent).toContain(uniqueEmail);
  });

  it('sets error status when email is already registered', async () => {
    type('input[autocomplete="name"]', 'Usuario Existente');
    type('input[autocomplete="email"]', MOCK_LOGIN_EMAIL);
    type('input[id^="nx-reg-password"]', 'Password123');
    type('input[id^="nx-reg-confirm"]', 'Password123');

    const checkbox = q<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    render();

    submit();
    expect(component.status()).toBe('loading');

    await new Promise((resolve) => setTimeout(resolve, 1700));
    render();

    expect(component.status()).toBe('error');
    expect(el.textContent).toContain(copy.auth.register.alertTitle);
  });

  it('resets the form, status, and fields on onReset()', () => {
    component.status.set('success');
    component.form.controls.name.setValue('Test');
    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('Pass1234');
    component.form.controls.confirm.setValue('Pass1234');
    component.form.controls.terms.setValue(true);

    component.onReset();
    render();

    expect(component.status()).toBe('idle');
    expect(component.form.controls.name.value).toBe('');
    expect(component.form.controls.email.value).toBe('');
    expect(component.form.controls.password.value).toBe('');
    expect(component.form.controls.confirm.value).toBe('');
    expect(component.form.controls.terms.value).toBe(false);
  });
});
