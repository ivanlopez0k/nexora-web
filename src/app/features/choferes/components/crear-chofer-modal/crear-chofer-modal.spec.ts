import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { CrearChoferModal } from './crear-chofer-modal';
import type { Empleado } from '../../../empleados/models/empleado.models';
import type { CentroLogistico } from '../../../centros-logisticos/models/centro-logistico.models';
import type { CrearChoferRequest } from '../../models/chofer.models';

describe('CrearChoferModal Component', () => {
  let component: CrearChoferModal;
  let fixture: ComponentFixture<CrearChoferModal>;

  const mockEmpleados: Empleado[] = [
    {
      id: 'emp-1',
      nombre: 'Carlos Monzón',
      legajo: 'LEG-010',
      usuarioId: null,
      usuarioEmail: null,
      estado: 'ACTIVO',
      esChofer: false,
      fechaAlta: '2026-10-14T00:00:00Z',
    },
  ];

  const mockCentros: CentroLogistico[] = [
    {
      id: 'centro-1',
      nombre: 'Depósito Norte',
      provincia: 'Córdoba',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-10T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearChoferModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearChoferModal);
    component = fixture.componentInstance;
  });

  it('does not render modal when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  it('renders modal and populates dropdowns when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('empleados', mockEmpleados);
    fixture.componentRef.setInput('centros', mockCentros);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).not.toBeNull();

    const empOptions = fixture.nativeElement.querySelectorAll('#empleado-select option');
    expect(empOptions.length).toBe(2); // placeholder + 1 employee

    const centroOptions = fixture.nativeElement.querySelectorAll('#centro-select option');
    expect(centroOptions.length).toBe(2); // placeholder + 1 centro
  });

  it('validates required fields on touched', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.touched.set(true);

    component.empleadoId.set('');
    expect(component.isEmpleadoInvalid()).toBe(true);

    component.centroLogisticoId.set('');
    expect(component.isCentroInvalid()).toBe(true);

    component.numeroLicencia.set('');
    expect(component.isNumeroLicenciaInvalid()).toBe(true);

    component.vencimientoLicencia.set('');
    expect(component.isVencimientoInvalid()).toBe(true);
  });

  it('toggles vehicle habilitaciones properly', () => {
    expect(component.selectedHabilitaciones()).toEqual([]);

    component.toggleHabilitacion('Camion');
    expect(component.isHabilitacionSelected('Camion')).toBe(true);
    expect(component.selectedHabilitaciones()).toEqual(['Camion']);

    component.toggleHabilitacion('Furgon');
    expect(component.selectedHabilitaciones()).toEqual(['Camion', 'Furgon']);

    component.toggleHabilitacion('Camion');
    expect(component.isHabilitacionSelected('Camion')).toBe(false);
    expect(component.selectedHabilitaciones()).toEqual(['Furgon']);
  });

  it('does not emit save if form is invalid', () => {
    let saved = false;
    component.save.subscribe(() => {
      saved = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.onSubmit();

    expect(saved).toBe(false);
    expect(component.touched()).toBe(true);
  });

  it('emits save with full payload when valid', () => {
    let payload: CrearChoferRequest | null = null;
    component.save.subscribe((val) => {
      payload = val;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.empleadoId.set('emp-1');
    component.centroLogisticoId.set('centro-1');
    component.numeroLicencia.set('  B2-123456  ');
    component.vencimientoLicencia.set('2028-05-20');
    component.toggleHabilitacion('Camion');
    component.toggleHabilitacion('Acoplado');

    component.onSubmit();

    expect(payload).toEqual({
      empleadoId: 'emp-1',
      centroLogisticoId: 'centro-1',
      numeroLicencia: 'B2-123456',
      vencimientoLicencia: '2028-05-20',
      habilitaciones: ['Camion', 'Acoplado'],
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
