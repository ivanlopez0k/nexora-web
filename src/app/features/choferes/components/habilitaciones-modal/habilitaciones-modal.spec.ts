import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { HabilitacionesModal } from './habilitaciones-modal';
import type { Chofer, ActualizarHabilitacionesRequest } from '../../models/chofer.models';

describe('HabilitacionesModal Component', () => {
  let component: HabilitacionesModal;
  let fixture: ComponentFixture<HabilitacionesModal>;

  const mockChofer: Chofer = {
    id: 'ch-1',
    empleadoId: 'emp-1',
    empleadoNombre: 'Juan Fangio',
    empleadoLegajo: 'LEG-001',
    centroLogisticoId: 'centro-1',
    centroLogisticoNombre: 'Centro Central',
    numeroLicencia: 'B2-998877',
    vencimientoLicencia: '2027-12-31',
    estado: 'ACTIVO',
    habilitaciones: ['Camion', 'Utilitario'],
    esElegibleHoy: true,
    motivoNoElegible: null,
    fechaAlta: '2026-10-14T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabilitacionesModal],
    }).compileComponents();

    fixture = TestBed.createComponent(HabilitacionesModal);
    component = fixture.componentInstance;
  });

  it('does not render modal when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  it('loads current driver habilitaciones when opened', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('chofer', mockChofer);
    fixture.detectChanges();

    expect(component.selectedHabilitaciones()).toEqual(['Camion', 'Utilitario']);
    expect(component.isHabilitacionSelected('Camion')).toBe(true);
    expect(component.isHabilitacionSelected('Utilitario')).toBe(true);
    expect(component.isHabilitacionSelected('Furgon')).toBe(false);
  });

  it('toggles selection and emits save with updated list', () => {
    let payload: ActualizarHabilitacionesRequest | null = null;
    component.save.subscribe((val) => {
      payload = val;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('chofer', mockChofer);
    fixture.detectChanges();

    component.toggleHabilitacion('Furgon');
    component.toggleHabilitacion('Camion');

    component.onSubmit();

    expect(payload).toEqual({
      tiposVehiculo: ['Utilitario', 'Furgon'],
    });
  });

  it('emits close on cancel', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    component.onCancel();
    expect(closed).toBe(true);
  });
});
