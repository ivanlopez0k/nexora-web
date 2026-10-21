import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { DetalleEnvioModal } from './detalle-envio-modal';
import { EnvioService } from '../../services/envio.service';
import type { EnvioHistorialEstadoResponse, EnvioResponse } from '../../models/envio.models';

describe('DetalleEnvioModal', () => {
  let component: DetalleEnvioModal;
  let fixture: ComponentFixture<DetalleEnvioModal>;

  const mockEnvio: EnvioResponse = {
    id: 'env-1',
    numeroSeguimiento: 'ENV-20261020-A1B2C3',
    clienteId: 'cli-1',
    clienteRazonSocial: 'Logística Sur S.A.',
    origen: 'Centro Distribución Norte',
    destino: 'Almacén Central',
    estado: 'EnTransito',
    fechaProgramada: '2026-10-25T10:00:00Z',
    observaciones: 'Carga frágil, manipular con cuidado',
    pesoTotalKg: 1250,
    volumenTotalM3: 8.5,
    cantidadItems: 12,
    fechaCreacion: '2026-10-20T08:00:00Z',
    fechaDespacho: '2026-10-21T09:00:00Z',
    fechaEntrega: null,
    items: [
      {
        id: 'item-1',
        descripcion: 'Cajas de componentes electrónicos',
        pesoKg: 25,
        volumenM3: 0.1,
        cantidad: 10,
        pesoTotalKg: 250,
        volumenTotalM3: 1,
      },
      {
        id: 'item-2',
        descripcion: 'Pallets de baterías',
        pesoKg: 500,
        volumenM3: 3.75,
        cantidad: 2,
        pesoTotalKg: 1000,
        volumenTotalM3: 7.5,
      },
    ],
    vehiculoId: 'veh-1',
    vehiculoPatente: 'AF 123 CD',
    vehiculoModelo: 'Mercedes-Benz Actros',
    choferId: 'cho-1',
    choferNombreCompleto: 'Carlos Gómez',
    incidencias: [
      {
        id: 'inc-1',
        envioId: 'env-1',
        tipo: 'Tránsito congestionado',
        severidad: 'Media',
        estado: 'Abierta',
        descripcion: 'Demora en peaje autopista',
        resolucion: null,
        usuarioReporta: 'Carlos Gómez',
        usuarioResuelve: null,
        fechaReporte: '2026-10-21T10:30:00Z',
        fechaResolucion: null,
      },
    ],
  };

  const mockHistorial: EnvioHistorialEstadoResponse[] = [
    {
      id: 'h-1',
      envioId: 'env-1',
      estadoAnterior: 'Solicitado',
      estadoNuevo: 'Preparando',
      motivo: 'Iniciando preparación en bodega',
      usuario: 'operador_juan',
      fechaHora: '2026-10-20T09:00:00Z',
    },
    {
      id: 'h-2',
      envioId: 'env-1',
      estadoAnterior: 'Preparando',
      estadoNuevo: 'Asignado',
      motivo: 'Recursos asignados',
      usuario: 'coordinador_ana',
      fechaHora: '2026-10-20T11:00:00Z',
    },
    {
      id: 'h-3',
      envioId: 'env-1',
      estadoAnterior: 'Asignado',
      estadoNuevo: 'EnTransito',
      motivo: 'Salida de terminal hacia destino',
      usuario: 'chofer_carlos',
      fechaHora: '2026-10-21T09:00:00Z',
    },
  ];

  const mockEnvioService = {
    getEnvioById: vi.fn(),
    getHistorial: vi.fn(),
    getIncidencias: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockEnvioService.getEnvioById.mockReturnValue(of(mockEnvio));
    mockEnvioService.getHistorial.mockReturnValue(of(mockHistorial));

    await TestBed.configureTestingModule({
      imports: [DetalleEnvioModal],
      providers: [{ provide: EnvioService, useValue: mockEnvioService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleEnvioModal);
    component = fixture.componentInstance;
  });

  it('does not render when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const backdrop = (fixture.nativeElement as HTMLElement).querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
    expect(mockEnvioService.getEnvioById).not.toHaveBeenCalled();
  });

  it('loads shipment details and history on open', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    expect(mockEnvioService.getEnvioById).toHaveBeenCalledWith('env-1');
    expect(mockEnvioService.getHistorial).toHaveBeenCalledWith('env-1');
    expect(component.envio()).toEqual(mockEnvio);
    expect(component.historial()).toEqual(mockHistorial);
  });

  it('renders header with tracking number badge and status badge', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const trackingBadge = compiled.querySelector('.tracking-badge');
    const statusBadge = compiled.querySelector('.status-badge');

    expect(trackingBadge?.textContent).toContain('ENV-20261020-A1B2C3');
    expect(statusBadge?.textContent).toContain('En Tránsito');
  });

  it('renders Section 1: Overview Grid with client, route, dates, and observations', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.info-value-highlight')?.textContent).toContain(
      'Logística Sur S.A.',
    );
    expect(compiled.querySelector('.route-display')?.textContent).toContain(
      'Centro Distribución Norte',
    );
    expect(compiled.querySelector('.route-display')?.textContent).toContain('Almacén Central');
    expect(compiled.querySelector('.observaciones-text')?.textContent).toContain(
      'Carga frágil, manipular con cuidado',
    );
  });

  it('renders Section 2: Recursos Asignados with vehicle and driver details', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.vehicle-tag')?.textContent).toContain('AF 123 CD');
    expect(compiled.querySelector('.resource-card')?.textContent).toContain('Mercedes-Benz Actros');
    expect(compiled.textContent).toContain('Carlos Gómez');
  });

  it('renders unassigned badges when vehicle and driver are missing', () => {
    const unassignedEnvio: EnvioResponse = {
      ...mockEnvio,
      vehiculoPatente: null,
      vehiculoModelo: null,
      choferNombreCompleto: null,
    };
    mockEnvioService.getEnvioById.mockReturnValue(of(unassignedEnvio));

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const unassigned = compiled.querySelectorAll('.unassigned-badge');
    expect(unassigned.length).toBe(2);
    expect(unassigned[0].textContent).toContain('Sin vehículo asignado');
    expect(unassigned[1].textContent).toContain('Sin chofer asignado');
  });

  it('renders Section 3: Bultos e Ítems de Carga table and summary bar', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const summaryPills = compiled.querySelectorAll('.summary-pill');
    expect(summaryPills[0]?.textContent).toContain('12 bultos');
    expect(summaryPills[1]?.textContent).toContain('1,250');
    expect(summaryPills[2]?.textContent).toContain('8.5');

    const itemRows = compiled.querySelectorAll('.items-table tbody tr');
    expect(itemRows.length).toBe(2);
    expect(itemRows[0].textContent).toContain('Cajas de componentes electrónicos');
    expect(itemRows[1].textContent).toContain('Pallets de baterías');
  });

  it('renders Section 4: Timeline Visual de Trazabilidad events in chronological order', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const timelineItems = compiled.querySelectorAll('.timeline-item');
    expect(timelineItems.length).toBe(3);

    expect(timelineItems[0].textContent).toContain('Solicitado');
    expect(timelineItems[0].textContent).toContain('Preparando');
    expect(timelineItems[0].textContent).toContain('operador_juan');
    expect(timelineItems[0].textContent).toContain('Iniciando preparación en bodega');

    expect(timelineItems[1].textContent).toContain('Preparando');
    expect(timelineItems[1].textContent).toContain('Asignado');
    expect(timelineItems[1].textContent).toContain('coordinador_ana');

    expect(timelineItems[2].textContent).toContain('Asignado');
    expect(timelineItems[2].textContent).toContain('En Tránsito');
    expect(timelineItems[2].textContent).toContain('chofer_carlos');
  });

  it('renders Section 5: Incidencias en Ruta when present', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const incidentCard = compiled.querySelector('.incidencia-card');
    expect(incidentCard).not.toBeNull();
    expect(incidentCard?.textContent).toContain('Tránsito congestionado');
    expect(incidentCard?.textContent).toContain('Demora en peaje autopista');
    expect(incidentCard?.textContent).toContain('Media');
  });

  it('emits close on clicking close button', () => {
    const emitSpy = vi.spyOn(component.close, 'emit');

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.modal-close-btn',
    ) as HTMLButtonElement;
    closeBtn.click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('emits close on clicking footer Cerrar button', () => {
    const emitSpy = vi.spyOn(component.close, 'emit');

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const footerCloseBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.modal-footer .btn-secondary',
    ) as HTMLButtonElement;
    footerCloseBtn.click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('emits close on clicking modal backdrop', () => {
    const emitSpy = vi.spyOn(component.close, 'emit');

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const backdrop = (fixture.nativeElement as HTMLElement).querySelector(
      '.modal-backdrop',
    ) as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('emits close on pressing Escape key', () => {
    const emitSpy = vi.spyOn(component.close, 'emit');

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    window.dispatchEvent(event);

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('renders error state and retries on clicking retry button', () => {
    mockEnvioService.getEnvioById.mockReturnValueOnce(
      throwError(() => new Error('Error al conectar con el servidor')),
    );

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envioId', 'env-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.alert-error')).not.toBeNull();
    expect(compiled.querySelector('.nx-alert-text')?.textContent).toContain(
      'Error al conectar con el servidor',
    );

    mockEnvioService.getEnvioById.mockReturnValue(of(mockEnvio));
    const retryBtn = compiled.querySelector('.btn-retry') as HTMLButtonElement;
    retryBtn.click();
    fixture.detectChanges();

    expect(mockEnvioService.getEnvioById).toHaveBeenCalledTimes(2);
    expect(component.envio()).toEqual(mockEnvio);
  });
});
