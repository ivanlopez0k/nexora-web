import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { AsignarRecursosModal } from './asignar-recursos-modal';
import type { Vehiculo } from '../../../vehiculos/models/vehiculo.models';
import type { Chofer } from '../../../choferes/models/chofer.models';
import type { EnvioListItem } from '../../models/envio.models';

describe('AsignarRecursosModal', () => {
  let component: AsignarRecursosModal;
  let fixture: ComponentFixture<AsignarRecursosModal>;

  const mockEnvio: EnvioListItem = {
    id: 'env-1',
    numeroSeguimiento: 'NEX-2026-0001',
    clienteId: 'cli-1',
    clienteRazonSocial: 'Distribuidora Pampeana S.A.',
    origen: 'CD Norte',
    destino: 'Almacén Central',
    estado: 'Solicitado',
    fechaProgramada: '2026-10-25T10:00:00Z',
    pesoTotalKg: 1200,
    volumenTotalM3: 4.5,
    cantidadItems: 25,
    fechaCreacion: '2026-10-20T08:00:00Z',
    vehiculoId: null,
    vehiculoPatente: null,
    choferId: null,
    choferNombreCompleto: null,
  };

  const mockVehiculos: Vehiculo[] = [
    {
      id: 'veh-1',
      patente: 'AF123CD',
      formattedPatente: 'AF 123 CD',
      marca: 'Mercedes-Benz',
      modelo: 'Sprinter',
      anio: 2023,
      tipo: 'Furgon',
      capacidad: 2000,
      kilometraje: 45000,
      estado: 'Disponible',
      centroLogisticoId: 'cl-1',
      centroLogisticoNombre: 'CD Norte',
      fechaAlta: '2023-01-01',
    },
    {
      id: 'veh-small',
      patente: 'AE987ZY',
      formattedPatente: 'AE 987 ZY',
      marca: 'Renault',
      modelo: 'Kangoo',
      anio: 2022,
      tipo: 'Utilitario',
      capacidad: 800,
      kilometraje: 60000,
      estado: 'Disponible',
      centroLogisticoId: 'cl-1',
      centroLogisticoNombre: 'CD Norte',
      fechaAlta: '2022-05-10',
    },
  ];

  const mockChoferes: Chofer[] = [
    {
      id: 'cho-1',
      empleadoId: 'emp-1',
      empleadoNombre: 'Carlos Gómez',
      empleadoLegajo: 'LEG-101',
      centroLogisticoId: 'cl-1',
      centroLogisticoNombre: 'CD Norte',
      numeroLicencia: 'B12345678',
      vencimientoLicencia: '2027-12-31',
      estado: 'ACTIVO',
      habilitaciones: ['Furgon', 'Camion'],
      esElegibleHoy: true,
      motivoNoElegible: null,
      fechaAlta: '2024-01-01',
    },
    {
      id: 'cho-2',
      empleadoId: 'emp-2',
      empleadoNombre: 'Martín Pérez',
      empleadoLegajo: 'LEG-102',
      centroLogisticoId: 'cl-1',
      centroLogisticoNombre: 'CD Norte',
      numeroLicencia: 'C98765432',
      vencimientoLicencia: '2028-06-30',
      estado: 'ACTIVO',
      habilitaciones: ['Utilitario'],
      esElegibleHoy: true,
      motivoNoElegible: null,
      fechaAlta: '2024-02-15',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarRecursosModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarRecursosModal);
    component = fixture.componentInstance;
  });

  it('does not render dialog when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('.modal-backdrop');
    expect(dialog).toBeNull();
  });

  it('renders shipment tracking and client when opened', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.componentRef.setInput('vehiculos', mockVehiculos);
    fixture.componentRef.setInput('choferes', mockChoferes);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tracking-badge')?.textContent).toContain('NEX-2026-0001');
    expect(compiled.querySelector('.client-name')?.textContent).toContain('Distribuidora Pampeana S.A.');
    expect(compiled.querySelector('.cargo-weight-display')?.textContent).toContain('1,200 kg');
  });

  it('calculates capacity occupation percentage and color accurately for suitable vehicle', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio); // peso 1200 kg
    fixture.componentRef.setInput('vehiculos', mockVehiculos); // veh-1 cap: 2000 kg => 60%
    fixture.componentRef.setInput('choferes', mockChoferes);
    fixture.detectChanges();

    component.vehiculoId.set('veh-1');
    fixture.detectChanges();

    expect(component.vehiculoCapacidad()).toBe(2000);
    expect(component.porcentajeOcupacion()).toBe(60);
    expect(component.superaCapacidad()).toBe(false);
    expect(component.progressColorClass()).toBe('progress-green');

    const compiled = fixture.nativeElement as HTMLElement;
    const progressFill = compiled.querySelector('.progress-bar-fill') as HTMLElement;
    expect(progressFill).toBeTruthy();
    expect(progressFill.classList.contains('progress-green')).toBe(true);
    expect(compiled.querySelector('.capacity-stat')?.textContent).toContain('60%');
    expect(compiled.querySelector('.capacity-warning-alert')).toBeNull();
  });

  it('displays amber color when vehicle capacity is between 76% and 100%', () => {
    const heavyEnvio: EnvioListItem = {
      ...mockEnvio,
      pesoTotalKg: 1800, // 1800 / 2000 = 90%
    };

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', heavyEnvio);
    fixture.componentRef.setInput('vehiculos', mockVehiculos);
    fixture.detectChanges();

    component.vehiculoId.set('veh-1');
    fixture.detectChanges();

    expect(component.porcentajeOcupacion()).toBe(90);
    expect(component.superaCapacidad()).toBe(false);
    expect(component.progressColorClass()).toBe('progress-amber');
  });

  it('displays red warning and disables submission when shipment exceeds vehicle capacity', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio); // peso 1200 kg
    fixture.componentRef.setInput('vehiculos', mockVehiculos); // veh-small cap: 800 kg => 150%
    fixture.componentRef.setInput('choferes', mockChoferes);
    fixture.detectChanges();

    component.vehiculoId.set('veh-small');
    component.choferId.set('cho-2');
    fixture.detectChanges();

    expect(component.vehiculoCapacidad()).toBe(800);
    expect(component.porcentajeOcupacion()).toBe(150);
    expect(component.superaCapacidad()).toBe(true);
    expect(component.progressColorClass()).toBe('progress-red');
    expect(component.canSubmit()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.capacity-warning-alert')).toBeTruthy();
    expect(compiled.querySelector('.capacity-warning-alert')?.textContent).toContain(
      'El peso del envío supera la capacidad máxima de carga del vehículo seleccionado.',
    );

    const submitBtn = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('warns when selected driver is not habilitated for the vehicle type', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.componentRef.setInput('vehiculos', mockVehiculos); // veh-1 is Furgon
    fixture.componentRef.setInput('choferes', mockChoferes); // cho-2 only has Utilitario
    fixture.detectChanges();

    component.vehiculoId.set('veh-1');
    component.choferId.set('cho-2');
    fixture.detectChanges();

    expect(component.choferHabilitado()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    const warning = compiled.querySelector('.habilitation-warning-alert');
    expect(warning).toBeTruthy();
    expect(warning?.textContent).toContain('El chofer seleccionado no posee habilitación para el tipo de vehículo (Furgon)');
  });

  it('shows driver habilitations badges and license expiration', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.componentRef.setInput('vehiculos', mockVehiculos);
    fixture.componentRef.setInput('choferes', mockChoferes);
    fixture.detectChanges();

    component.choferId.set('cho-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badges = compiled.querySelectorAll('.hab-badge');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toContain('Furgon');
    expect(badges[1].textContent).toContain('Camion');
    expect(compiled.querySelector('.license-value')?.textContent).toContain('B12345678');
  });

  it('emits submitAsignacion when form is valid and submitted', () => {
    let emittedPayload: any = null;
    component.submitAsignacion.subscribe((payload) => {
      emittedPayload = payload;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.componentRef.setInput('vehiculos', mockVehiculos);
    fixture.componentRef.setInput('choferes', mockChoferes);
    fixture.detectChanges();

    component.vehiculoId.set('veh-1');
    component.choferId.set('cho-1');
    component.motivo.set('Despacho prioritario');
    fixture.detectChanges();

    expect(component.canSubmit()).toBe(true);

    component.onSubmit();

    expect(emittedPayload).toEqual({
      vehiculoId: 'veh-1',
      choferId: 'cho-1',
      motivo: 'Despacho prioritario',
    });
  });

  it('does not emit submitAsignacion when vehicle or driver is missing', () => {
    let emitted = false;
    component.submitAsignacion.subscribe(() => {
      emitted = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.componentRef.setInput('vehiculos', mockVehiculos);
    fixture.componentRef.setInput('choferes', mockChoferes);
    fixture.detectChanges();

    component.onSubmit();
    expect(component.touched()).toBe(true);
    expect(component.isVehiculoInvalid()).toBe(true);
    expect(component.isChoferInvalid()).toBe(true);
    expect(emitted).toBe(false);
  });

  it('emits close on cancel or backdrop click', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.onCancel();
    expect(closed).toBe(true);

    closed = false;
    const fakeBackdropEvent = {
      target: {} as any,
      currentTarget: {} as any,
    };
    fakeBackdropEvent.target = fakeBackdropEvent.currentTarget;
    component.onBackdropClick(fakeBackdropEvent as any);
    expect(closed).toBe(true);
  });

  it('displays errorMessage banner when provided', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('errorMessage', 'El chofer seleccionado ya tiene un viaje asignado');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.alert-error')).toBeTruthy();
    expect(compiled.querySelector('.nx-alert-text')?.textContent).toContain(
      'El chofer seleccionado ya tiene un viaje asignado',
    );
  });

  it('pre-selects existing vehicle and driver if shipment already has them assigned', () => {
    const assignedEnvio: EnvioListItem = {
      ...mockEnvio,
      vehiculoId: 'veh-1',
      choferId: 'cho-1',
    };

    fixture.componentRef.setInput('envio', assignedEnvio);
    fixture.componentRef.setInput('vehiculos', mockVehiculos);
    fixture.componentRef.setInput('choferes', mockChoferes);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(component.vehiculoId()).toBe('veh-1');
    expect(component.choferId()).toBe('cho-1');
    expect(component.selectedVehiculo()?.id).toBe('veh-1');
    expect(component.selectedChofer()?.id).toBe('cho-1');
  });
});
