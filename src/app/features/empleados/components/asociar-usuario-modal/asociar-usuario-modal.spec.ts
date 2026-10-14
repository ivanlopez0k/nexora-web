import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { AsociarUsuarioModal, isValidUuid } from './asociar-usuario-modal';
import type { Empleado } from '../../models/empleado.models';

describe('AsociarUsuarioModal Component', () => {
  let component: AsociarUsuarioModal;
  let fixture: ComponentFixture<AsociarUsuarioModal>;

  const mockEmpleado: Empleado = {
    id: 'emp-101',
    nombre: 'Roberto Gómez',
    legajo: 'LEG-101',
    usuarioId: null,
    usuarioEmail: null,
    estado: 'ACTIVO',
    esChofer: false,
    fechaAlta: '2026-10-14T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsociarUsuarioModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AsociarUsuarioModal);
    component = fixture.componentInstance;
  });

  describe('isValidUuid helper', () => {
    it('returns true for valid UUID formats', () => {
      expect(isValidUuid('e7b53fa9-8392-4d22-ba3f-912df0f65d64')).toBe(true);
      expect(isValidUuid('E7B53FA9-8392-4D22-BA3F-912DF0F65D64')).toBe(true);
      expect(isValidUuid('  e7b53fa9-8392-4d22-ba3f-912df0f65d64  ')).toBe(true);
    });

    it('returns false for invalid UUIDs', () => {
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid('invalid-uuid')).toBe(false);
      expect(isValidUuid('12345678-1234-1234-1234-123456789abg')).toBe(false);
    });
  });

  it('does not render modal when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  it('renders employee details when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('empleado', mockEmpleado);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('#asociar-modal-title');
    expect(title?.textContent).toContain('Asociar cuenta de usuario');
    expect(fixture.nativeElement.textContent).toContain('Roberto Gómez');
    expect(fixture.nativeElement.textContent).toContain('LEG-101');
  });

  it('validates usuarioId: marks invalid when touched and invalid format', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.touched.set(true);
    component.usuarioId.set('invalid-id');
    expect(component.isUsuarioIdInvalid()).toBe(true);

    component.usuarioId.set('e7b53fa9-8392-4d22-ba3f-912df0f65d64');
    expect(component.isUsuarioIdInvalid()).toBe(false);
  });

  it('does not emit save if invalid on submit', () => {
    let saved = false;
    component.save.subscribe(() => {
      saved = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.usuarioId.set('bad');
    component.onSubmit();

    expect(saved).toBe(false);
    expect(component.touched()).toBe(true);
  });

  it('emits save with trimmed usuarioId when valid', () => {
    let emitted: { usuarioId: string } | null = null;
    component.save.subscribe((val) => {
      emitted = val;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.usuarioId.set('  e7b53fa9-8392-4d22-ba3f-912df0f65d64  ');
    component.onSubmit();

    expect(emitted).toEqual({
      usuarioId: 'e7b53fa9-8392-4d22-ba3f-912df0f65d64',
    });
  });

  it('emits close on cancel button click', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    component.onCancel();
    expect(closed).toBe(true);
  });

  it('does not emit close when isSubmitting is true', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    fixture.componentRef.setInput('isSubmitting', true);
    component.onCancel();
    expect(closed).toBe(false);
  });
});
