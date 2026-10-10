import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CrearVehiculoModal } from './crear-vehiculo-modal';
import type { CentroLogistico } from '../../../centros-logisticos/models/centro-logistico.models';

describe('CrearVehiculoModal Component', () => {
  let component: CrearVehiculoModal;
  let fixture: ComponentFixture<CrearVehiculoModal>;

  const mockCentros: CentroLogistico[] = [
    {
      id: 'centro-1',
      nombre: 'Centro Logístico Retiro',
      provincia: 'Buenos Aires',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-01T00:00:00Z',
    },
    {
      id: 'centro-2',
      nombre: 'Centro Logístico Córdoba',
      provincia: 'Córdoba',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-02T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearVehiculoModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearVehiculoModal);
    component = fixture.componentInstance;
  });

  it('initializes with default values', () => {
    expect(component).toBeTruthy();
    expect(component.tipo()).toBe('Camion');
    expect(component.capacidad()).toBe(5000);
    expect(component.kilometraje()).toBe(0);
    expect(component.touched()).toBe(false);
  });

  it('resets fields and defaults to first centro when opened', () => {
    fixture.componentRef.setInput('centros', mockCentros);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(component.centroLogisticoId()).toBe('centro-1');
    expect(component.patente()).toBe('');
    expect(component.marca()).toBe('');
    expect(component.modelo()).toBe('');
    expect(component.touched()).toBe(false);
  });

  it('validates fields and prevents submission when invalid', () => {
    const submitSpy = vi.fn();
    component.submitVehiculo.subscribe(submitSpy);

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.onSubmit();

    expect(component.touched()).toBe(true);
    expect(component.isPatenteInvalid()).toBe(true);
    expect(component.isMarcaInvalid()).toBe(true);
    expect(component.isModeloInvalid()).toBe(true);
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('formats patente on blur when valid', () => {
    component.patente.set('ab123cd');
    component.onPatenteBlur();

    expect(component.patente()).toBe('AB 123 CD');
  });

  it('emits submitVehiculo with trimmed payload on valid submission', () => {
    const submitSpy = vi.fn();
    component.submitVehiculo.subscribe(submitSpy);

    fixture.componentRef.setInput('centros', mockCentros);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.patente.set('AB 123 CD');
    component.marca.set(' Scania ');
    component.modelo.set(' R450 ');
    component.anio.set(2022);
    component.tipo.set('Camion');
    component.capacidad.set(28000);
    component.kilometraje.set(85000);
    component.centroLogisticoId.set('centro-1');

    component.onSubmit();

    expect(submitSpy).toHaveBeenCalledWith({
      patente: 'AB 123 CD',
      marca: 'Scania',
      modelo: 'R450',
      anio: 2022,
      tipo: 'Camion',
      capacidad: 28000,
      kilometraje: 85000,
      centroLogisticoId: 'centro-1',
    });
  });

  it('emits close on cancel when not submitting', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    component.onCancel();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('does not emit close on cancel when submitting', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    fixture.componentRef.setInput('isSubmitting', true);
    fixture.detectChanges();

    component.onCancel();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('emits close on backdrop click when clicking overlay background', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    const target = document.createElement('div');
    const mockEvent = {
      target,
      currentTarget: target,
    } as unknown as MouseEvent;

    component.onBackdropClick(mockEvent);
    expect(closeSpy).toHaveBeenCalled();
  });
});
