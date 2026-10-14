import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { EditarChoferModal } from './editar-chofer-modal';
import type { Chofer, ActualizarChoferRequest } from '../../models/chofer.models';
import type { CentroLogistico } from '../../../centros-logisticos/models/centro-logistico.models';

describe('EditarChoferModal Component', () => {
  let component: EditarChoferModal;
  let fixture: ComponentFixture<EditarChoferModal>;

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
    habilitaciones: ['Camion'],
    esElegibleHoy: true,
    motivoNoElegible: null,
    fechaAlta: '2026-10-14T00:00:00Z',
  };

  const mockCentros: CentroLogistico[] = [
    {
      id: 'centro-1',
      nombre: 'Centro Central',
      provincia: 'Buenos Aires',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-10T00:00:00Z',
    },
    {
      id: 'centro-2',
      nombre: 'Depósito Sur',
      provincia: 'Santa Fe',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-10T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarChoferModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarChoferModal);
    component = fixture.componentInstance;
  });

  it('does not render modal when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
  });

  it('pre-populates driver data when isOpen is true and chofer is passed', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('chofer', mockChofer);
    fixture.componentRef.setInput('centros', mockCentros);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Juan Fangio');
    expect(fixture.nativeElement.textContent).toContain('LEG-001');
    expect(component.centroLogisticoId()).toBe('centro-1');
    expect(component.numeroLicencia()).toBe('B2-998877');
    expect(component.vencimientoLicencia()).toBe('2027-12-31');
  });

  it('validates fields on touch', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.touched.set(true);

    component.centroLogisticoId.set('');
    expect(component.isCentroInvalid()).toBe(true);

    component.numeroLicencia.set('');
    expect(component.isNumeroLicenciaInvalid()).toBe(true);

    component.vencimientoLicencia.set('');
    expect(component.isVencimientoInvalid()).toBe(true);
  });

  it('emits save when valid data is submitted', () => {
    let payload: ActualizarChoferRequest | null = null;
    component.save.subscribe((val) => {
      payload = val;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('chofer', mockChofer);
    fixture.detectChanges();

    component.centroLogisticoId.set('centro-2');
    component.numeroLicencia.set('  B2-998877-MOD  ');
    component.vencimientoLicencia.set('2028-10-10');

    component.onSubmit();

    expect(payload).toEqual({
      centroLogisticoId: 'centro-2',
      numeroLicencia: 'B2-998877-MOD',
      vencimientoLicencia: '2028-10-10',
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
});
