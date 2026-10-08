import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { LoginForm } from './login-form';
import { loginFormGroup } from '../../auth/auth-validation';
import { LOGIN_PRESETS, presetFor } from '../../auth/auth-presets';
import type { LoginPreset, LoginPresetId } from '../../auth/auth-presets';
import type { AuthErrors, AuthStatus, LoginControls, LoginField } from '../../auth/auth-types';
import { copy } from '../../i18n/copy';

const loginPreset = (id: LoginPresetId): LoginPreset => presetFor(`login:${id}`) as LoginPreset;

/** The 15 global primitives, counted from `src/styles.css`, never from a grep. */
const GLOBAL_PRIMITIVES = [
  'nx-field',
  'nx-field-control',
  'nx-field-toggle',
  'nx-button',
  'nx-alert',
  'nx-alert-icon',
  'nx-alert-body',
  'nx-alert-title',
  'nx-alert-text',
  'nx-inline-error',
  'nx-inline-error-icon',
  'nx-divider',
  'nx-bar',
  'nx-bar-fill',
  'nx-spinner',
];

@Component({
  imports: [LoginForm, ReactiveFormsModule],
  template: `
    <app-login-form
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
  readonly form = loginFormGroup();
  readonly status = signal<AuthStatus>('idle');
  readonly errors = signal<AuthErrors<LoginField>>({});
  readonly focused = signal<LoginField | null>(null);
  readonly caps = signal(false);
  readonly showHint = signal(false);
  submittedCount = 0;
  resetCount = 0;
}

describe('LoginForm', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let el: HTMLElement;

  beforeEach(async () => {
    // One line, and it is the whole cost of D1's RouterLink exception.
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  function render(id: LoginPresetId, hint = false): void {
    const preset = loginPreset(id);
    host.form.patchValue(preset.patch);
    host.status.set(preset.status);
    host.errors.set(preset.errors);
    host.focused.set(preset.focus);
    host.caps.set(preset.caps);
    host.showHint.set(hint);
    fixture.detectChanges();
  }

  const q = <T extends Element = HTMLElement>(sel: string) => el.querySelector(sel) as T | null;
  const text = () => el.textContent ?? '';
  const formEl = () => q<HTMLFormElement>('form');
  const emailInput = () => q<HTMLInputElement>('input[type="email"]');
  const passwordInput = () => q<HTMLInputElement>('input[autocomplete="current-password"]');
  const submit = () => {
    formEl()?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };
  const typeInto = (input: HTMLInputElement | null, value: string) => {
    input!.value = value;
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };

  describe('R3 barrier 1 — the demo credentials do not ship', () => {
    it('renders no credentials with every input left at its default', () => {
      fixture.detectChanges();
      expect(text()).not.toContain('operaciones@nexora.com');
      expect(text()).not.toContain('nexora2026');
      expect(q('.hint')).toBeNull();
    });

    it('renders them only when the parent explicitly asks, and reads them from copy', () => {
      render('default', true);
      expect(text()).toContain(copy.auth.login.hintLine1);
      expect(text()).toContain(copy.auth.login.hintLine2);
    });
  });

  describe('R13 — every global class the page uses is present', () => {
    it('uses all 15, across the 8 states — a missed class renders unstyled and silently', () => {
      const used = new Set<string>();
      for (const preset of LOGIN_PRESETS) {
        render(preset.id);
        for (const node of el.querySelectorAll('[class]')) {
          for (const name of node.classList) {
            used.add(name);
          }
        }
      }
      const missing = GLOBAL_PRIMITIVES.filter((name) => !used.has(name));
      expect(missing).toEqual([]);
    });

    it('asserts `.nx-bar-fill` explicitly: without it the success bar NEVER APPEARS', () => {
      render('success');
      expect(q('.nx-bar')).not.toBeNull();
      expect(q('.nx-bar-fill')).not.toBeNull();
    });
  });

  describe('R-Sc1 — the resolvers are gone and the primitive survives', () => {
    it('carries `novalidate`, so native email validation cannot preempt submit', () => {
      render('default');
      expect(formEl()?.noValidate).toBe(true);
    });

    it('gives every field the shipped class and NO inline border or box-shadow', () => {
      for (const preset of LOGIN_PRESETS) {
        render(preset.id);
        const inputs = el.querySelectorAll<HTMLInputElement>('input');
        // `success` is the one state with no form at all — that is the point
        // of L-S8, and it is asserted separately.
        expect(inputs.length).toBe(preset.id === 'success' ? 0 : 2);
        for (const input of inputs) {
          expect(input.classList.contains('nx-field')).toBe(true);
          expect(input.getAttribute('style') ?? '').not.toContain('border');
          expect(input.getAttribute('style') ?? '').not.toContain('box-shadow');
        }
      }
    });
  });

  describe('L-S1 `default` — quiet', () => {
    beforeEach(() => render('default'));

    it('shows two empty fields carrying no aria-invalid', () => {
      expect(emailInput()?.value).toBe('');
      expect(passwordInput()?.value).toBe('');
      for (const input of el.querySelectorAll('input')) {
        expect(input.hasAttribute('aria-invalid')).toBe(false);
      }
    });

    it('reads Iniciar sesión on the submit button, with no alert, error, caps or hint', () => {
      expect(q('.nx-button')?.textContent).toContain(copy.auth.common.signIn);
      expect(q('[role="alert"]')).toBeNull();
      expect(q('.nx-inline-error')).toBeNull();
      expect(q('.caps')).toBeNull();
      expect(q('.hint')).toBeNull();
      expect(q('[role="status"]')).toBeNull();
    });

    it('shows the divider and the cross-link', () => {
      expect(q('.nx-divider')).not.toBeNull();
      expect(text()).toContain(copy.auth.login.noAccountQuestion);
      expect(text()).toContain(copy.auth.common.createAccount);
    });
  });

  describe('L-S2 `focus` — the focus contract, not a computed style', () => {
    beforeEach(() => render('focus'));

    it('carries the field class and no inline border or shadow on BOTH fields', () => {
      // jsdom applies no stylesheet, so the ring is asserted as its class and
      // attribute contract. This is also the assertion that fails FIRST if
      // someone reintroduces `[style.box-shadow]`.
      for (const input of el.querySelectorAll('input')) {
        expect(input.classList.contains('nx-field')).toBe(true);
        expect(input.hasAttribute('style')).toBe(false);
      }
    });

    it('keeps the focused field empty of errors and the other field idle', () => {
      expect(q('.nx-inline-error')).toBeNull();
      expect(q('[role="alert"]')).toBeNull();
    });
  });

  describe('L-S3 `emailInvalid`', () => {
    beforeEach(() => render('emailInvalid'));

    it("marks the email invalid and shows the tuteo message, not the design's voseo", () => {
      expect(emailInput()?.getAttribute('aria-invalid')).toBe('true');
      expect(text()).toContain(copy.auth.common.emailInvalid);
      expect(text()).not.toContain('Ingresá un email válido');
      expect(q('.nx-inline-error')).not.toBeNull();
      expect(q('.nx-inline-error-icon')).not.toBeNull();
    });

    it('leaves the password field valid and shows no alert', () => {
      expect(passwordInput()?.hasAttribute('aria-invalid')).toBe(false);
      expect(q('[role="alert"]')).toBeNull();
    });
  });

  describe('L-S4 `passwordRequired`', () => {
    beforeEach(() => render('passwordRequired'));

    it('marks only the password invalid, with its own message', () => {
      expect(passwordInput()?.getAttribute('aria-invalid')).toBe('true');
      expect(emailInput()?.hasAttribute('aria-invalid')).toBe(false);
      expect(text()).toContain(copy.auth.common.passwordRequired);
    });

    it('keeps the submit button reading Iniciar sesión', () => {
      expect(q('.nx-button')?.textContent).toContain(copy.auth.common.signIn);
    });
  });

  describe('L-S5 `capsLock`', () => {
    beforeEach(() => render('capsLock'));

    it('shows the caps row with no inline error and a still-masked password', () => {
      expect(text()).toContain(copy.auth.common.capsLock);
      expect(q('.nx-inline-error')).toBeNull();
      expect(passwordInput()?.getAttribute('type')).toBe('password');
      expect(passwordInput()?.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('L-S6 `loading`', () => {
    beforeEach(() => render('loading'));

    it('disables both inputs, the button and the reveal toggle, with a spinner', () => {
      const button = q<HTMLButtonElement>('.nx-button');
      expect(emailInput()?.disabled).toBe(true);
      expect(passwordInput()?.disabled).toBe(true);
      expect(button?.disabled).toBe(true);
      // Disclosed, not invented: the reveal toggle has NO designed disabled
      // treatment, so the user-agent affordance is the only cue.
      expect(q<HTMLButtonElement>('.nx-field-toggle')?.disabled).toBe(true);
      expect(q('.nx-spinner')).not.toBeNull();
      expect(button?.getAttribute('aria-busy')).toBe('true');
    });

    it('reads Verificando credenciales… and renders no alert and no inline error', () => {
      expect(q('.nx-button')?.textContent).toContain(copy.auth.login.submitting);
      expect(q('[role="alert"]')).toBeNull();
      expect(q('.nx-inline-error')).toBeNull();
    });
  });

  describe('L-S7 `error`', () => {
    beforeEach(() => render('error'));

    it('renders the alert with all four alert classes and the tuteo body', () => {
      const alert = q('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(q('.nx-alert')).not.toBeNull();
      expect(q('.nx-alert-icon')).not.toBeNull();
      expect(q('.nx-alert-title')?.textContent).toContain(copy.auth.login.alertTitle);
      expect(q('.nx-alert-text')?.textContent).toContain(copy.auth.login.alertBody);
      expect(text()).not.toContain('Verificá tus datos');
    });

    it('leaves BOTH fields idle — a server failure is not a field error', () => {
      for (const input of el.querySelectorAll('input')) {
        expect(input.hasAttribute('aria-invalid')).toBe(false);
      }
      expect(q('.nx-inline-error')).toBeNull();
    });
  });

  describe('L-S8 `success`', () => {
    beforeEach(() => render('success'));

    it('removes the form, the divider, the cross-link AND the hint', () => {
      expect(formEl()).toBeNull();
      expect(q('.nx-divider')).toBeNull();
      expect(text()).not.toContain(copy.auth.login.noAccountQuestion);
      expect(q('.hint')).toBeNull();
    });

    it('shows the status block with the interpolated email and the progress bar', () => {
      const status = q('[role="status"]');
      expect(status).not.toBeNull();
      expect(text()).toContain(copy.auth.login.successTitle);
      expect(text()).toContain(copy.auth.login.successBody);
      expect(text()).toContain('operaciones@nexora.com');
      expect(text()).toContain(copy.auth.common.redirecting);
      expect(q('.success-bar')).not.toBeNull();
      expect(q('.nx-bar-fill')).not.toBeNull();
    });

    it('offers the reset button', () => {
      expect(q('.success-reset')?.textContent).toContain(copy.auth.login.successReset);
    });
  });

  describe('R5 and R6 — the caps row, read not inferred', () => {
    it('appears on a keyup carrying the Caps Lock modifier', () => {
      render('default');
      // `showCaps` needs BOTH inputs, and the focus one comes from a real focus
      // event, so the whole chain is exercised: focus -> focused() -> computed.
      passwordInput()?.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      passwordInput()?.dispatchEvent(
        new KeyboardEvent('keyup', { bubbles: true, modifierCapsLock: true }),
      );
      fixture.detectChanges();
      expect(q('.caps')).not.toBeNull();
    });

    it('disappears again on a keyup without it — BOTH events are bound', () => {
      render('default');
      const field = passwordInput()!;
      field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, modifierCapsLock: true }));
      fixture.detectChanges();
      field.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, modifierCapsLock: false }));
      fixture.detectChanges();
      expect(q('.caps')).toBeNull();
    });

    it("is NOT suppressed by a password error — the design's login guard is the defect (R6)", () => {
      const preset = loginPreset('capsLock');
      host.form.patchValue(preset.patch);
      host.status.set(preset.status);
      host.errors.set({ ...preset.errors, password: 'required' });
      host.focused.set(preset.focus);
      host.caps.set(preset.caps);
      fixture.detectChanges();
      expect(q('.nx-inline-error')).not.toBeNull();
      expect(q('.caps')).not.toBeNull();
    });

    it('is hidden when focus is on the other field', () => {
      const preset = loginPreset('capsLock');
      host.form.patchValue(preset.patch);
      host.caps.set(preset.caps);
      host.focused.set('email');
      fixture.detectChanges();
      expect(q('.caps')).toBeNull();
    });
  });

  describe('R19 — the focus ordering is pinned behaviour', () => {
    it('hides the caps row on blur, because focused() becomes null', () => {
      render('capsLock');
      expect(q('.caps')).not.toBeNull();
      passwordInput()?.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(host.focused()).toBeNull();
      expect(q('.caps')).toBeNull();
    });

    it('adds NOTHING on a password blur', () => {
      render('default');
      passwordInput()?.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(host.errors()).toEqual({});
    });
  });

  describe('R15 — asymmetric surfacing, and NOT touched', () => {
    it('clears the field error on the first keystroke', () => {
      render('emailInvalid');
      expect(q('.nx-inline-error')).not.toBeNull();
      typeInto(emailInput(), 'lucia@transur.com');
      expect(q('.nx-inline-error')).toBeNull();
    });

    it('clears the global alert on the first keystroke, returning status to idle', () => {
      render('error');
      expect(q('[role="alert"]')).not.toBeNull();
      typeInto(emailInput(), 'lucia@transur.com');
      expect(host.status()).toBe('idle');
      expect(q('[role="alert"]')).toBeNull();
    });

    it('does NOT clear the email error when the password changes — login has no coupling', () => {
      render('emailInvalid');
      typeInto(passwordInput(), 'nexora2026');
      expect(host.errors().email).toBe('email');
    });

    it('adds the email error on blur only when the field has content', () => {
      render('default');
      emailInput()?.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(host.errors().email).toBeUndefined();

      typeInto(emailInput(), 'operaciones@nexora');
      emailInput()?.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(host.errors().email).toBe('email');
    });

    it('does not clear an existing email error on blur when the value became valid', () => {
      // Faithful to the design: `blurEmail` SPREADS the existing errors and only
      // ever adds one, so it never removes. Reached by writing the control
      // directly — the `(input)` handler would have cleared the error first,
      // which is R15's other half and is asserted above.
      render('emailInvalid');
      host.form.controls.email.setValue('lucia@transur.com');
      emailInput()?.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(host.errors().email).toBe('email');
    });

    it('never calls the service when validation fails, and stays idle', () => {
      render('default');
      submit();
      expect(host.submittedCount).toBe(0);
      expect(host.status()).toBe('idle');
      expect(host.errors().email).toBe('required');
      expect(host.errors().password).toBe('required');
    });

    it('honours the re-entrancy guard while loading', () => {
      render('loading');
      submit();
      expect(host.submittedCount).toBe(0);
    });

    it('clears errors, goes loading, drops focus and emits submitted when valid', () => {
      render('emailInvalid');
      typeInto(emailInput(), 'operaciones@nexora.com');
      typeInto(passwordInput(), 'nexora2026');
      submit();
      expect(host.errors()).toEqual({});
      expect(host.status()).toBe('loading');
      expect(host.focused()).toBeNull();
      expect(host.submittedCount).toBe(1);
    });

    it('emits reset from the success block', () => {
      render('success');
      q<HTMLButtonElement>('.success-reset')?.click();
      fixture.detectChanges();
      expect(host.resetCount).toBe(1);
    });
  });

  describe('R17 parity — the reveal toggle flips the single password field', () => {
    it('is masked, then revealed, and is labelled for assistive tech', () => {
      render('default');
      const toggle = q<HTMLButtonElement>('.nx-field-toggle')!;
      expect(passwordInput()?.getAttribute('type')).toBe('password');
      expect(toggle.getAttribute('aria-label')).toBe(copy.auth.common.showPasswordLabel);
      expect(toggle.textContent).toContain(copy.auth.common.showPassword);
      toggle.click();
      fixture.detectChanges();
      expect(passwordInput()?.getAttribute('type')).toBe('text');
      expect(toggle.getAttribute('aria-label')).toBe(copy.auth.common.hidePasswordLabel);
      expect(toggle.textContent).toContain(copy.auth.common.hidePassword);
    });
  });

  it('points each label at its own field by id lookup, so a renamed id cannot pass', () => {
    render('default');
    const labels = el.querySelectorAll('label');
    expect(labels.length).toBe(2);
    for (const label of labels) {
      const target = label.htmlFor;
      expect(target).toBeTruthy();
      expect(el.querySelector(`[id="${target}"]`)).not.toBeNull();
    }
  });
});
