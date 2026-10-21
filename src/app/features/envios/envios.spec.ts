import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Envios } from './envios';
import { EnvioService } from './services/envio.service';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import { ROLES } from '../../shared/auth/permissions';
import type {
  EnvioListItem,
  EnviosMetricas,
  PagedResult,
} from './models/envio.models';

describe('Envios Component', () => {
  let component: Envios;
  let fixture: ComponentFixture<Envios>;
  let mockEnvioService: {
    getEnvios: ReturnType<typeof vi.fn>;
    getMetricas: ReturnType<typeof vi.fn>;
    getEnvioById: ReturnType<typeof vi.fn>;
  };
  let mockTokenService: {
    getRoles: ReturnType<typeof vi.fn>;
    getClaims: ReturnType<typeof vi.fn>;
  };

  const mockEnvios: EnvioListItem[] = [
    {
      id: 'env-1',
      numeroSeguimiento: 'NEX-2026-0001',
      clienteId: 'cli-1',
      clienteRazonSocial: 'Distribuidora Pampeana S.A.',
      origen: 'CD Norte',
      destino: 'Almacén Central',
      estado: 'EnTransito',
      fechaProgramada: '2026-10-25T10:00:00Z',
      pesoTotalKg: 1500,
      volumenTotalM3: 6.5,
      cantidadItems: 30,
      fechaCreacion: '2026-10-20T08:00:00Z',
      vehiculoId: 'veh-1',
      vehiculoPatente: 'AF 123 CD',
      choferId: 'cho-1',
      choferNombreCompleto: 'Carlos Gómez',
    },
    {
      id: 'env-2',
      numeroSeguimiento: 'NEX-2026-0002',
      clienteId: 'cli-2',
      clienteRazonSocial: 'Logística Andina',
      origen: 'Puerto Buenos Aires',
      destino: 'Centro Logístico Sur',
      estado: 'Solicitado',
      fechaProgramada: null,
      pesoTotalKg: 500,
      volumenTotalM3: 2.1,
      cantidadItems: 12,
      fechaCreacion: '2026-10-20T09:30:00Z',
      vehiculoId: null,
      vehiculoPatente: null,
      choferId: null,
      choferNombreCompleto: null,
    },
  ];

  const mockPaged: PagedResult<EnvioListItem> = {
    items: mockEnvios,
    totalCount: 2,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  };

  const mockMetricas: EnviosMetricas = {
    totalEnvios: 150,
    enviosActivos: 45,
    enTransito: 18,
    entregadosHoy: 22,
    incidenciasAbiertas: 3,
    porcentajeCumplimiento: 96.5,
    enviosPorEstado: {
      Solicitado: 5,
      EnTransito: 18,
      Entregado: 110,
    },
  };

  beforeEach(async () => {
    mockEnvioService = {
      getEnvios: vi.fn().mockReturnValue(of(mockPaged)),
      getMetricas: vi.fn().mockReturnValue(of(mockMetricas)),
      getEnvioById: vi.fn(),
    };

    mockTokenService = {
      getRoles: vi.fn().mockReturnValue([ROLES.SUPER_ADMIN]),
      getClaims: vi.fn().mockReturnValue({ email: 'admin@nexora.com' }),
    };

    await TestBed.configureTestingModule({
      imports: [Envios],
      providers: [
        { provide: EnvioService, useValue: mockEnvioService },
        { provide: AuthTokenService, useValue: mockTokenService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Envios);
    component = fixture.componentInstance;
  });

  it('creates the component and fetches metricas and envios on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockEnvioService.getMetricas).toHaveBeenCalled();
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: undefined,
      estado: undefined,
      fechaDesde: undefined,
      fechaHasta: undefined,
    });
    expect(component.envios().length).toBe(2);
    expect(component.metricas()?.enviosActivos).toBe(45);
    expect(component.totalPages()).toBe(2);
    expect(component.totalCount()).toBe(2);
  });

  it('renders metric cards with formatted values in the DOM', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const values = compiled.querySelectorAll('.metric-value');
    expect(values.length).toBe(5);
    expect(values[0].textContent).toContain('45'); // Activos
    expect(values[1].textContent).toContain('18'); // En Tránsito
    expect(values[2].textContent).toContain('22'); // Entregados Hoy
    expect(values[3].textContent).toContain('3');  // Incidencias
    expect(values[4].textContent).toContain('96.5%'); // Cumplimiento
  });

  it('updates search and reloads list from page 1', () => {
    fixture.detectChanges();

    component.onSearchChange('NEX-2026-0001');

    expect(component.search()).toBe('NEX-2026-0001');
    expect(component.page()).toBe(1);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'NEX-2026-0001', page: 1 })
    );
  });

  it('updates estado filter and reloads list', () => {
    fixture.detectChanges();

    component.onEstadoFilterChange('EnTransito');

    expect(component.estadoFilter()).toBe('EnTransito');
    expect(component.page()).toBe(1);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'EnTransito', page: 1 })
    );
  });

  it('updates date filters and reloads list', () => {
    fixture.detectChanges();

    component.onFechaDesdeChange('2026-10-01');
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ fechaDesde: '2026-10-01', page: 1 })
    );

    component.onFechaHastaChange('2026-10-31');
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ fechaHasta: '2026-10-31', page: 1 })
    );
  });

  it('clears all filters and resets pagination', () => {
    fixture.detectChanges();

    component.search.set('Test');
    component.estadoFilter.set('EnTransito');
    component.fechaDesde.set('2026-10-01');
    component.fechaHasta.set('2026-10-31');
    component.page.set(2);

    component.clearFilters();

    expect(component.search()).toBe('');
    expect(component.estadoFilter()).toBe('');
    expect(component.fechaDesde()).toBe('');
    expect(component.fechaHasta()).toBe('');
    expect(component.page()).toBe(1);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, search: undefined, estado: undefined })
    );
  });

  it('handles pagination navigation next and previous', () => {
    fixture.detectChanges();

    component.onNextPage();
    expect(component.page()).toBe(2);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );

    component.onPrevPage();
    expect(component.page()).toBe(1);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('does not paginate beyond bounds', () => {
    fixture.detectChanges();

    // Already on page 1, onPrevPage should not decrement
    component.onPrevPage();
    expect(component.page()).toBe(1);

    component.page.set(2); // totalPages is 2
    component.onNextPage();
    expect(component.page()).toBe(2);
  });

  it('sets error state when getEnvios fails', () => {
    mockEnvioService.getEnvios.mockReturnValue(throwError(() => new Error('Server error')));
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('No se pudieron cargar los envíos. Intenta nuevamente.');
  });

  it('handles metricas failure gracefully without breaking envios loading', () => {
    mockEnvioService.getMetricas.mockReturnValue(throwError(() => new Error('Metrics error')));
    fixture.detectChanges();

    expect(component.loadingMetricas()).toBe(false);
    expect(component.metricas()).toBeNull();
    expect(component.envios().length).toBe(2);
  });

  it('displays empty state when no shipments are found', () => {
    mockEnvioService.getEnvios.mockReturnValue(
      of({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
    expect(compiled.querySelector('.empty-state h3')?.textContent).toContain('No se encontraron envíos');
  });

  it('resolves semantic badge config for each state', () => {
    expect(component.getEstadoConfig('Solicitado').badgeClass).toBe('badge-solicitado');
    expect(component.getEstadoConfig('PendienteAprobacion').badgeClass).toBe('badge-pendiente');
    expect(component.getEstadoConfig('Preparando').badgeClass).toBe('badge-preparando');
    expect(component.getEstadoConfig('ListoParaDespacho').badgeClass).toBe('badge-listo');
    expect(component.getEstadoConfig('Asignado').badgeClass).toBe('badge-asignado');
    expect(component.getEstadoConfig('EnTransito').badgeClass).toBe('badge-entransito');
    expect(component.getEstadoConfig('Entregado').badgeClass).toBe('badge-entregado');
    expect(component.getEstadoConfig('ConIncidencia').badgeClass).toBe('badge-incidencia');
    expect(component.getEstadoConfig('Cancelado').badgeClass).toBe('badge-cancelado');
    expect(component.getEstadoConfig('OtroEstado').badgeClass).toBe('badge-desconocido');
  });

  it('checks user management permissions', () => {
    mockTokenService.getRoles.mockReturnValue([ROLES.OPERADOR_LOGISTICO]);
    expect(component.canManage()).toBe(true);

    mockTokenService.getRoles.mockReturnValue([ROLES.SUPERVISOR]);
    expect(component.canManage()).toBe(false);

    mockTokenService.getRoles.mockReturnValue([ROLES.CHOFER]);
    expect(component.canManage()).toBe(false);
  });

  it('formats dates cleanly', () => {
    expect(component.formatDate(null)).toBe('—');
    expect(component.formatDate(undefined)).toBe('—');
    expect(component.formatDate('2026-10-25T10:00:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
