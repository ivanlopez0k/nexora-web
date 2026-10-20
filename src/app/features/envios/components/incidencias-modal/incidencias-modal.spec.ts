import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { IncidenciasModal } from './incidencias-modal';
import { EnvioService } from '../../services/envio.service';
import type {
  EnvioIncidenciaResponse,
  EnvioListItem,
  ReportarIncidenciaRequest,
  ResolverIncidenciaRequest,
} from '../../models/envio.models';

describe('IncidenciasModal', () => {
  let component: IncidenciasModal;
  let fixture: ComponentFixture<IncidenciasModal>;

  const mockEnvio: EnvioListItem = {
    id: 'env-1',
    numeroSeguimiento: 'NEX-2026-0001',
    clienteId: 'cli-1',
    clienteRazonSocial: 'Logística Sur S.A.',
    origen: 'Centro Distribución Norte',
    destino: 'Almacén Central',
    estado: 'EnTransito',
    fechaProgramada: '2026-10-25T10:00:00Z',
    pesoTotalKg: 1250,
    volumenTotalM3: 8.5,
    cantidadItems: 12,
    fechaCreacion: '2026-10-20T08:00:00Z',
    vehiculoId: 'veh-1',
    vehiculoPatente: 'AF 123 CD',
    choferId: 'cho-1',
    choferNombreCompleto: 'Carlos Gómez',
  };

  const mockOpenIncident: EnvioIncidenciaResponse = {
    id: 'inc-1',
    envioId: 'env-1',
    tipo: 'Mecanica',
    severidad: 'Alta',
    estado: 'Abierta',
    descripcion: 'Avería mecánica en transmisión sobre Ruta 9 km 85.',
    resolucion: null,
    usuarioReporta: 'Carlos Gómez',
    usuarioResuelve: null,
    fechaReporte: '2026-10-20T11:00:00Z',
    fechaResolucion: null,
  };

  const mockResolvedIncident: EnvioIncidenciaResponse = {
    id: 'inc-2',
    envioId: 'env-1',
    tipo: 'Clima',
    severidad: 'Media',
    estado: 'Resuelta',
    descripcion: 'Detención preventiva por tormenta eléctrica severa.',
    resolucion: 'Cese de alerta meteorológica. Continuación de marcha con precaución.',
    usuarioReporta: 'Carlos Gómez',
    usuarioResuelve: 'Marta Pérez (Tráfico)',
    fechaReporte: '2026-10-20T09:00:00Z',
    fechaResolucion: '2026-10-20T10:15:00Z',
  };

  const mockEnvioService = {
    getIncidencias: vi.fn(),
    reportarIncidencia: vi.fn(),
    resolverIncidencia: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockEnvioService.getIncidencias.mockReturnValue(of([mockOpenIncident, mockResolvedIncident]));
    mockEnvioService.reportarIncidencia.mockReturnValue(of(mockOpenIncident));
    mockEnvioService.resolverIncidencia.mockReturnValue(of(mockResolvedIncident));

    await TestBed.configureTestingModule({
      imports: [IncidenciasModal],
      providers: [{ provide: EnvioService, useValue: mockEnvioService }],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidenciasModal);
    component = fixture.componentInstance;
  });

  it('does not render modal dialog when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.detectChanges();

    const backdrop = (fixture.nativeElement as HTMLElement).querySelector('.modal-backdrop');
    expect(backdrop).toBeNull();
    expect(mockEnvioService.getIncidencias).not.toHaveBeenCalled();
  });

  it('renders modal dialog and loads incidents when opened with a shipment', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.detectChanges();

    const backdrop = (fixture.nativeElement as HTMLElement).querySelector('.modal-backdrop');
    expect(backdrop).not.toBeNull();
    expect(mockEnvioService.getIncidencias).toHaveBeenCalledWith('env-1');
    expect(component.incidencias().length).toBe(2);
    expect(component.activeTab()).toBe('lista');

    const trackingBadge = (fixture.nativeElement as HTMLElement).querySelector('.tracking-badge');
    expect(trackingBadge?.textContent?.trim()).toBe('NEX-2026-0001');
  });

  it('defaults to "reportar" tab if shipment has no incidents recorded', () => {
    mockEnvioService.getIncidencias.mockReturnValue(of([]));

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.detectChanges();

    expect(component.incidencias().length).toBe(0);
    expect(component.activeTab()).toBe('reportar');
  });

  it('allows switching between "lista" and "reportar" tabs', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.detectChanges();

    expect(component.activeTab()).toBe('lista');

    component.setTab('reportar');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('reportar');

    component.setTab('lista');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('lista');
  });

  it('computes open and resolved incidents separately', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.detectChanges();

    expect(component.incidenciasAbiertas().length).toBe(1);
    expect(component.incidenciasAbiertas()[0].id).toBe('inc-1');

    expect(component.incidenciasResueltas().length).toBe(1);
    expect(component.incidenciasResueltas()[0].id).toBe('inc-2');
  });

  it('handles error when loading incidents fails', () => {
    mockEnvioService.getIncidencias.mockReturnValue(
      throwError(() => ({ message: 'Error de conexión' })),
    );

    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('envio', mockEnvio);
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Error de conexión');
  });

  describe('Reporting incidents', () => {
    it('does not submit when description is empty or whitespace', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();

      component.setTab('reportar');
      component.descripcion.set('   ');
      component.onSubmitReportar();

      expect(mockEnvioService.reportarIncidencia).not.toHaveBeenCalled();
    });

    it('submits valid incident, reloads list, switches to "lista" tab and emits incidenciaUpdated', () => {
      const updatedList: EnvioIncidenciaResponse[] = [
        mockOpenIncident,
        mockResolvedIncident,
        {
          id: 'inc-3',
          envioId: 'env-1',
          tipo: 'Desvio',
          severidad: 'Media',
          estado: 'Abierta',
          descripcion: 'Corte por obras',
          resolucion: null,
          usuarioReporta: 'Carlos Gómez',
          usuarioResuelve: null,
          fechaReporte: '2026-10-20T12:00:00Z',
          fechaResolucion: null,
        },
      ];

      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();

      component.setTab('reportar');
      component.tipo.set('Desvio');
      component.severidad.set('Media');
      component.descripcion.set('Corte por obras en acceso');

      const emitSpy = vi.spyOn(component.incidenciaUpdated, 'emit');
      mockEnvioService.getIncidencias.mockReturnValue(of(updatedList));

      component.onSubmitReportar();

      expect(mockEnvioService.reportarIncidencia).toHaveBeenCalledWith('env-1', {
        tipo: 'Desvio',
        severidad: 'Media',
        descripcion: 'Corte por obras en acceso',
      } as ReportarIncidenciaRequest);

      expect(component.submitting()).toBe(false);
      expect(component.descripcion()).toBe('');
      expect(component.activeTab()).toBe('lista');
      expect(emitSpy).toHaveBeenCalled();
    });

    it('sets error state when reporting fails', () => {
      mockEnvioService.reportarIncidencia.mockReturnValue(
        throwError(() => ({ error: { message: 'Fallo al registrar incidencia en base de datos' } })),
      );

      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();

      component.setTab('reportar');
      component.descripcion.set('Falla en refrigeración');
      component.onSubmitReportar();

      expect(component.submitting()).toBe(false);
      expect(component.error()).toBe('Fallo al registrar incidencia en base de datos');
    });
  });

  describe('Resolving incidents', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();
    });

    it('opens and cancels resolution form for an incident', () => {
      expect(component.selectedIncidenciaIdForResolve()).toBeNull();

      component.openResolverForm('inc-1');
      expect(component.selectedIncidenciaIdForResolve()).toBe('inc-1');
      expect(component.resolucion()).toBe('');
      expect(component.nuevoEstadoEnvio()).toBe('EnTransito');

      component.cancelResolverForm();
      expect(component.selectedIncidenciaIdForResolve()).toBeNull();
      expect(component.resolucion()).toBe('');
    });

    it('does not submit resolution when resolution text is empty', () => {
      component.openResolverForm('inc-1');
      component.resolucion.set('   ');
      component.onSubmitResolver('inc-1');

      expect(mockEnvioService.resolverIncidencia).not.toHaveBeenCalled();
    });

    it('submits valid resolution, clears form, refreshes incidents and emits incidenciaUpdated', () => {
      const emitSpy = vi.spyOn(component.incidenciaUpdated, 'emit');

      component.openResolverForm('inc-1');
      component.resolucion.set('Se reparó la transmisión en taller oficial. Prueba exitosa.');
      component.nuevoEstadoEnvio.set('EnTransito');

      component.onSubmitResolver('inc-1');

      expect(mockEnvioService.resolverIncidencia).toHaveBeenCalledWith('env-1', 'inc-1', {
        resolucion: 'Se reparó la transmisión en taller oficial. Prueba exitosa.',
        nuevoEstadoEnvio: 'EnTransito',
      } as ResolverIncidenciaRequest);

      expect(component.selectedIncidenciaIdForResolve()).toBeNull();
      expect(component.resolucion()).toBe('');
      expect(emitSpy).toHaveBeenCalled();
    });

    it('sets error state when resolving fails', () => {
      mockEnvioService.resolverIncidencia.mockReturnValue(
        throwError(() => ({ message: 'Error de servidor al resolver' })),
      );

      component.openResolverForm('inc-1');
      component.resolucion.set('Resolución aplicada');
      component.onSubmitResolver('inc-1');

      expect(component.submitting()).toBe(false);
      expect(component.error()).toBe('Error de servidor al resolver');
    });
  });

  describe('Modal dismissal and keyboard controls', () => {
    it('emits close event on close button click', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
        '.modal-close-btn',
      ) as HTMLButtonElement;
      closeBtn.click();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('emits close event on footer close button click', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      const footerBtn = (fixture.nativeElement as HTMLElement).querySelector(
        '.btn-close-footer',
      ) as HTMLButtonElement;
      footerBtn.click();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('emits close event when backdrop is clicked', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      const backdrop = (fixture.nativeElement as HTMLElement).querySelector(
        '.modal-backdrop',
      ) as HTMLElement;

      backdrop.click();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('emits close event on Escape key press when open', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(emitSpy).toHaveBeenCalled();
    });

    it('does not emit close event on Escape key press when closed', () => {
      fixture.componentRef.setInput('isOpen', false);
      fixture.componentRef.setInput('envio', mockEnvio);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.close, 'emit');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Helper formatting methods', () => {
    it('returns human-friendly label for known incident types', () => {
      expect(component.getTipoLabel('Mecanica')).toBe('Falla Mecánica');
      expect(component.getTipoLabel('Clima')).toBe('Condiciones Climáticas');
      expect(component.getTipoLabel('Desconocido')).toBe('Desconocido');
    });

    it('returns badge class for severities', () => {
      expect(component.getSeveridadBadgeClass('Baja')).toBe('badge-sev-baja');
      expect(component.getSeveridadBadgeClass('Critica')).toBe('badge-sev-critica');
      expect(component.getSeveridadBadgeClass('Otra')).toBe('badge-sev-media');
    });

    it('returns config for incident states', () => {
      expect(component.getEstadoIncidenciaConfig('Abierta').label).toBe('Abierta');
      expect(component.getEstadoIncidenciaConfig('Resuelta').badgeClass).toBe('badge-inc-resuelta');
      expect(component.getEstadoIncidenciaConfig('Inexistente').label).toBe('Inexistente');
    });

    it('formats dates accurately or returns dash when empty', () => {
      expect(component.formatDate(null)).toBe('—');
      expect(component.formatDate('2026-10-20T12:00:00Z')).toContain('2026');
    });
  });
});
