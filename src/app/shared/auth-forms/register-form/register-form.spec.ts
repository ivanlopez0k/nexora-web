import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { RegisterForm } from './register-form';
import { registerFormGroup } from '../../auth/auth-validation';
import { REGISTER_PRESETS, presetFor } from '../../auth/auth-presets';
import type { RegisterPreset, RegisterPresetId } from '../../auth/auth-presets';
import type { AuthErrors, AuthStatus, RegisterField } from '../../auth/auth-types';
import { copy } from '../../i18n/copy';

const registerPreset = (id: RegisterPresetId): RegisterPreset =>
  presetFor(`register:${id}`) as RegisterPreset;

@Component({
  imports: [RegisterForm, ReactiveFormsModule],
  template: `
    <app-register-form
      [form]="form"
      [(status)]="status"
      [(errors)]="errors"
      [(focused)]="focused"
      [(caps)]="caps"
      [showHint]="showHint()"
      (submitted)="submittedCount = submittedCount + 1"
      (reset)="resetCount = resetCount + 1"
    />
  `,
})
class Host {
  readonly form = registerFormGroup();
  readonly status = signal<AuthStatus>('idle');
  readonly errors = signal<AuthErrors<RegisterField>>({});
  readonly focused = signal<RegisterField | null>(null);
  readonly caps = signal(false);
  readonly showHint = signal(false);
  submittedCount = 0;
  resetCount = 0;
}

describe('RegisterForm', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  function render(id: RegisterPresetId, hint = false): void {
    const preset = registerPreset(id);
    host.form.patchValue(preset.patch);
    host.status.set(preset.status);
    host.errors.set(preset.errors);
    host.focused.set(preset.focus);
    host.caps.set(preset.caps);
    host.showHint.set(hint);
    fixture.detectChanges();
  }

  const q = <T extends Element = HTMLElement>(sel: string) => el.querySelector(sel) as T | null;
  const qAll = <T extends Element = HTMLElement>(sel: string) =>
    Array.from(el.querySelectorAll(sel)) as T[];
  const text = () => el.textContent ?? '';
  const formEl = () => q<HTMLFormElement>('form');
  const nameInput = () => q<HTMLInputElement>('input[autocomplete="name"]');
  const emailInput = () => q<HTMLInputElement>('input[type="email"]');
  const passwordInput = () => q<HTMLInputElement>('input[id^="nx-reg-password"]');
  const confirmInput = () => q<HTMLInputElement>('input[id^="nx-reg-confirm"]');
  const termsCheckbox = () => q<HTMLInputElement>('input[type="checkbox"]');
  const submitButton = () => q<HTMLButtonElement>('button[type="submit"]');

  const submit = () => {
    formEl()?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  const typeInto = (input: HTMLInputElement | null, value: string) => {
    input!.value = value;
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  describe('Form structure and attributes', () => {
    it('sets novalidate on the form element', () => {
      render('default');
      expect(formEl()?.hasAttribute('novalidate')).toBe(true);
    });

    it('renders the header title and subtitle', () => {
      render('default');
      expect(q('.header__title')?.textContent?.trim()).toBe(copy.auth.common.createAccount);
      expect(q('.header__subtitle')?.textContent?.trim()).toBe(copy.auth.register.subtitle);
    });

    it('renders all inputs with appropriate autocomplete values', () => {
      render('default');
      expect(nameInput()?.getAttribute('autocomplete')).toBe('name');
      expect(emailInput()?.getAttribute('autocomplete')).toBe('email');
      expect(passwordInput()?.getAttribute('autocomplete')).toBe('new-password');
      expect(confirmInput()?.getAttribute('autocomplete')).toBe('new-password');
    });

    it('renders crosslink pointing to /login', () => {
      render('default');
      const link = q('.crosslink a');
      expect(link?.getAttribute('routerlink') || link?.getAttribute('href')).toBeTruthy();
      expect(link?.textContent?.trim()).toBe(copy.auth.common.signIn);
    });
  });

  describe('The 9 Presets from REGISTER_PRESETS', () => {
    it('renders preset: default (clean idle form)', () => {
      render('default');
      expect(nameInput()?.value).toBe('');
      expect(emailInput()?.value).toBe('');
      expect(passwordInput()?.value).toBe('');
      expect(confirmInput()?.value).toBe('');
      expect(termsCheckbox()?.checked).toBe(false);
      expect(q('.nx-alert')).toBeNull();
      expect(q('.rules')).toBeNull();
      expect(q('.confirm-match')).toBeNull();
    });

    it('renders preset: focus (focused email)', () => {
      render('focus');
      expect(nameInput()?.value).toBe('Lucía Fernández');
      expect(emailInput()?.value).toBe('lucia.fer');
      expect(host.focused()).toBe('email');
    });

    it('renders preset: validation (all validation errors active)', () => {
      render('validation');
      expect(q('.nx-alert')).toBeNull();
      const inlineErrors = qAll('.nx-inline-error');
      expect(inlineErrors.length).toBeGreaterThanOrEqual(4);
      expect(text()).toContain(copy.auth.common.emailInvalid);
      expect(text()).toContain(copy.auth.common.passwordRequired);
      expect(text()).toContain(copy.auth.register.confirmRequired);
      expect(text()).toContain(copy.auth.register.termsRequired);
    });

    it('renders preset: weak (password rules meter visible with partial check)', () => {
      render('weak');
      expect(q('.rules')).not.toBeNull();
      const bars = qAll('.rules-bar');
      expect(bars).toHaveLength(3);
      expect(text()).toContain(copy.auth.register.ruleLength);
      expect(text()).toContain(copy.auth.register.ruleUpper);
      expect(text()).toContain(copy.auth.register.ruleDigit);
    });

    it('renders preset: mismatch (password confirmation mismatch error)', () => {
      render('mismatch');
      expect(text()).toContain(copy.auth.register.confirmMismatch);
      expect(q('.confirm-match')).toBeNull();
    });

    it('renders preset: capsLock (warning badge visible)', () => {
      render('capsLock');
      expect(q('.caps')).not.toBeNull();
      expect(text()).toContain(copy.auth.common.capsLock);
    });

    it('renders preset: loading (spinner active and controls disabled)', () => {
      render('loading');
      expect(q('.nx-spinner')).not.toBeNull();
      expect(text()).toContain(copy.auth.register.submitting);
      expect(submitButton()?.disabled).toBe(true);
      expect(nameInput()?.disabled).toBe(true);
      expect(emailInput()?.disabled).toBe(true);
      expect(passwordInput()?.disabled).toBe(true);
      expect(confirmInput()?.disabled).toBe(true);
      expect(termsCheckbox()?.disabled).toBe(true);
    });

    it('renders preset: error (email-taken alert visible)', () => {
      render('error');
      expect(q('.nx-alert')).not.toBeNull();
      expect(text()).toContain(copy.auth.register.alertTitle);
      expect(text()).toContain(copy.auth.register.alertBodyPrefix);
    });

    it('renders preset: success (success card with greeting and progress bar)', () => {
      render('success');
      expect(q('form')).toBeNull();
      expect(q('.success')).not.toBeNull();
      expect(q('.success-disc')?.textContent?.trim()).toBe('✓');
      expect(text()).toContain(copy.auth.register.successTitle);
      expect(text()).toContain('Lucía');
      expect(text()).toContain('lucia.fernandez@transur.com');
      expect(q('.success-bar')).not.toBeNull();
    });
  });

  describe('Interactivity and behaviors', () => {
    it('reveals/masks password when toggle is clicked', () => {
      render('default');
      const toggle = q<HTMLButtonElement>('.nx-field-toggle');
      expect(passwordInput()?.type).toBe('password');
      expect(confirmInput()?.type).toBe('password');

      toggle?.click();
      fixture.detectChanges();
      expect(passwordInput()?.type).toBe('text');
      expect(confirmInput()?.type).toBe('text');

      toggle?.click();
      fixture.detectChanges();
      expect(passwordInput()?.type).toBe('password');
      expect(confirmInput()?.type).toBe('password');
    });

    it('shows matching indicator when password and confirm match without errors', () => {
      render('default');
      host.form.controls.password.setValue('Password123');
      host.form.controls.confirm.setValue('Password123');
      fixture.detectChanges();

      expect(q('.confirm-match')).not.toBeNull();
      expect(text()).toContain(copy.auth.register.passwordsMatch);
    });

    it('clears specific field error when input changes', () => {
      render('validation');
      expect(host.errors().email).toBe('email');

      typeInto(emailInput(), 'carlos@empresa.com');
      expect(host.errors().email).toBeUndefined();
    });

    it('submits valid form and transitions to loading status', () => {
      render('default');
      host.form.controls.name.setValue('Ana Pérez');
      host.form.controls.email.setValue('ana@example.com');
      host.form.controls.password.setValue('Testing123!');
      host.form.controls.confirm.setValue('Testing123!');
      host.form.controls.terms.setValue(true);
      fixture.detectChanges();

      submit();
      expect(host.submittedCount).toBe(1);
      expect(host.status()).toBe('loading');
    });

    it('blocks submission on invalid form and sets errors', () => {
      render('default');
      submit();
      expect(host.submittedCount).toBe(0);
      expect(host.errors().name).toBe('required');
      expect(host.errors().email).toBe('required');
      expect(host.errors().password).toBe('required');
      expect(host.errors().confirm).toBe('required');
      expect(host.errors().terms).toBe('required');
    });

    it('emits reset when success reset button is clicked', () => {
      render('success');
      const resetBtn = q<HTMLButtonElement>('.success-reset');
      resetBtn?.click();
      expect(host.resetCount).toBe(1);
    });

    it('shows dev hint when showHint is true', () => {
      render('default', true);
      expect(q('.hint')).not.toBeNull();
      expect(text()).toContain(copy.auth.register.hintLine1);
    });
  });
});
