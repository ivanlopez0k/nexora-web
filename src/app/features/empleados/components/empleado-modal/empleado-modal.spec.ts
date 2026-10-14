import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { EmpleadoModal } from './empleado-modal';
import type { Empleado } from '../../models/empleado.models';

describe('EmpleadoModal Component', () => {
  let component: EmpleadoModal;
  let fixture: ComponentFixture<EmpleadoModal>;

  const mockEmpleado: Empleado = {
    id: 'e1-uuid',
    nombre: 'Ana Gómez',
    legajo: 'LEG-050',
    usuarioId: null,
    usuarioEmail: null,
    estado: 'ACTIVO',
    esChofer: false,
    fechaAlta: '2026-10-14T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpleadoModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EmpleadoModal);
    component = fixture.componentInstance;
  });

  it('does not render modal dialog when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  it('renders create title and inputs when isOpen is true and empleadoToEdit is null', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('empleadoToEdit', null);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('#empleado-modal-title');
    expect(title?.textContent?.trim()).toBe('Nuevo empleado');
    expect(component.nombre()).toBe('');
    expect(component.legajo()).toBe('');
    expect(component.isEditMode()).toBe(false);
  });

  it('pre-populates inputs when in edit mode', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('empleadoToEdit', mockEmpleado);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('#empleado-modal-title');
    expect(title?.textContent?.trim()).toBe('Editar empleado');
    expect(component.nombre()).toBe('Ana Gómez');
    expect(component.legajo()).toBe('LEG-050');
    expect(component.isEditMode()).toBe(true);
  });

  it('validates nombre: marks invalid when touched and empty or too short', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.touched.set(true);
    component.nombre.set('');
    expect(component.isNombreInvalid()).toBe(true);

    component.nombre.set('A');
    expect(component.isNombreInvalid()).toBe(true);

    component.nombre.set('Ana');
    expect(component.isNombreInvalid()).toBe(false);
  });

  it('validates legajo: marks invalid when touched and empty or too long', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.touched.set(true);
    component.legajo.set('');
    expect(component.isLegajoInvalid()).toBe(true);

    component.legajo.set('A'.repeat(51));
    expect(component.isLegajoInvalid()).toBe(true);

    component.legajo.set('LEG-001');
    expect(component.isLegajoInvalid()).toBe(false);
  });

  it('does not emit save if form is invalid on submit', () => {
    let saved = false;
    component.save.subscribe(() => {
      saved = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.nombre.set('');
    component.legajo.set('');
    component.onSubmit();

    expect(saved).toBe(false);
    expect(component.touched()).toBe(true);
  });

  it('emits save with trimmed values when inputs are valid', () => {
    let emittedPayload: { nombre: string; legajo: string } | null = null;
    component.save.subscribe((p) => {
      emittedPayload = p;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.nombre.set('  Esteban Quito  ');
    component.legajo.set('  LEG-999  ');
    component.onSubmit();

    expect(emittedPayload).toEqual({
      nombre: 'Esteban Quito',
      legajo: 'LEG-999',
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
