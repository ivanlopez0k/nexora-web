import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Envios } from './envios';
import { EnvioService } from './services/envio.service';
import { ClienteService } from '../clientes/services/cliente.service';
import { VehiculoService } from '../vehiculos/services/vehiculo.service';
import { ChoferService } from '../choferes/services/chofer.service';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import { ROLES } from '../../shared/auth/permissions';
import type { Cliente } from '../clientes/models/cliente.models';
import type { Vehiculo } from '../vehiculos/models/vehiculo.models';
import type { Chofer } from '../choferes/models/chofer.models';
import type {
  AsignarRecursosEnvioRequest,
  CrearEnvioRequest,
  EnvioListItem,
  EnvioResponse,
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
    getHistorial: ReturnType<typeof vi.fn>;
    getIncidencias: ReturnType<typeof vi.fn>;
    createEnvio: ReturnType<typeof vi.fn>;
    asignarRecursos: ReturnType<typeof vi.fn>;
    despacharEnvio: ReturnType<typeof vi.fn>;
  };
  let mockClienteService: {
    getClientes: ReturnType<typeof vi.fn>;
  };
  let mockVehiculoService: {
    getVehiculos: ReturnType<typeof vi.fn>;
  };
  let mockChoferService: {
    getChoferes: ReturnType<typeof vi.fn>;
  };
  let mockTokenService: {
    getRoles: ReturnType<typeof vi.fn>;
    getClaims: ReturnType<typeof vi.fn>;
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
      capacidad: 2500,
      kilometraje: 30000,
      estado: 'Disponible',
      centroLogisticoId: 'cl-1',
      fechaAlta: '2023-01-01',
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
      habilitaciones: ['Furgon'],
      esElegibleHoy: true,
      motivoNoElegible: null,
      fechaAlta: '2024-01-01',
    },
  ];

  const mockClientes: Cliente[] = [
    {
      id: 'cli-1',
      razonSocial: 'Distribuidora Pampeana S.A.',
      cuit: '30500010912',
      formattedCuit: '30-50001091-2',
      estado: 'ACTIVO',
      fechaAlta: '2026-01-01',
      cantidadContactos: 2,
      cantidadDirecciones: 1,
    },
    {
      id: 'cli-2',
      razonSocial: 'Logística Andina',
      cuit: '30600020913',
      formattedCuit: '30-60002091-3',
      estado: 'ACTIVO',
      fechaAlta: '2026-02-01',
      cantidadContactos: 1,
      cantidadDirecciones: 3,
    },
  ];

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
      getEnvioById: vi.fn().mockReturnValue(of({ ...mockEnvios[0], items: [], historial: [] })),
      getHistorial: vi.fn().mockReturnValue(of([])),
      getIncidencias: vi.fn().mockReturnValue(of([])),
      createEnvio: vi.fn(),
      asignarRecursos: vi.fn(),
      despacharEnvio: vi.fn(),
    };

    mockClienteService = {
      getClientes: vi.fn().mockReturnValue(of({ items: mockClientes, totalItems: 2 })),
    };

    mockVehiculoService = {
      getVehiculos: vi.fn().mockReturnValue(of({ items: mockVehiculos, totalItems: 1 })),
    };

    mockChoferService = {
      getChoferes: vi.fn().mockReturnValue(of({ items: mockChoferes, totalCount: 1 })),
    };

    mockTokenService = {
      getRoles: vi.fn().mockReturnValue([ROLES.SUPER_ADMIN]),
      getClaims: vi.fn().mockReturnValue({ email: 'admin@nexora.com' }),
    };

    await TestBed.configureTestingModule({
      imports: [Envios],
      providers: [
        { provide: EnvioService, useValue: mockEnvioService },
        { provide: ClienteService, useValue: mockClienteService },
        { provide: VehiculoService, useValue: mockVehiculoService },
        { provide: ChoferService, useValue: mockChoferService },
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
    expect(values[3].textContent).toContain('3'); // Incidencias
    expect(values[4].textContent).toContain('96.5%'); // Cumplimiento
  });

  it('updates search and reloads list from page 1', () => {
    fixture.detectChanges();

    component.onSearchChange('NEX-2026-0001');

    expect(component.search()).toBe('NEX-2026-0001');
    expect(component.page()).toBe(1);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'NEX-2026-0001', page: 1 }),
    );
  });

  it('updates estado filter and reloads list', () => {
    fixture.detectChanges();

    component.onEstadoFilterChange('EnTransito');

    expect(component.estadoFilter()).toBe('EnTransito');
    expect(component.page()).toBe(1);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'EnTransito', page: 1 }),
    );
  });

  it('updates date filters and reloads list', () => {
    fixture.detectChanges();

    component.onFechaDesdeChange('2026-10-01');
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ fechaDesde: '2026-10-01', page: 1 }),
    );

    component.onFechaHastaChange('2026-10-31');
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(
      expect.objectContaining({ fechaHasta: '2026-10-31', page: 1 }),
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
      expect.objectContaining({ page: 1, search: undefined, estado: undefined }),
    );
  });

  it('handles pagination navigation next and previous', () => {
    fixture.detectChanges();

    component.onNextPage();
    expect(component.page()).toBe(2);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));

    component.onPrevPage();
    expect(component.page()).toBe(1);
    expect(mockEnvioService.getEnvios).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
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
      }),
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
    expect(compiled.querySelector('.empty-state h3')?.textContent).toContain(
      'No se encontraron envíos',
    );
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

  describe('Create Envio Modal Integration', () => {
    it('loads active clients on init', () => {
      fixture.detectChanges();

      expect(mockClienteService.getClientes).toHaveBeenCalledWith({ pageSize: 100 });
      expect(component.clientes().length).toBe(2);
      expect(component.clientes()[0].razonSocial).toBe('Distribuidora Pampeana S.A.');
    });

    it('opens and closes create modal correctly', () => {
      fixture.detectChanges();

      expect(component.createModalOpen()).toBe(false);

      component.openCreateModal();
      expect(component.createModalOpen()).toBe(true);
      expect(component.createModalError()).toBeNull();

      component.closeCreateModal();
      expect(component.createModalOpen()).toBe(false);
    });

    it('triggers openCreateModal when clicking "+ Nuevo Envío" button', () => {
      fixture.detectChanges();

      const button = (fixture.nativeElement as HTMLElement).querySelector(
        '.btn-create',
      ) as HTMLButtonElement;
      expect(button).toBeTruthy();

      button.click();
      fixture.detectChanges();

      expect(component.createModalOpen()).toBe(true);
    });

    it('submits new shipment, closes modal and reloads envios and metricas on success', () => {
      const mockRequest: CrearEnvioRequest = {
        clienteId: 'cli-1',
        origen: 'CD Norte',
        destino: 'Almacén Central',
        fechaProgramada: '2026-10-25T14:00:00.000Z',
        observaciones: 'Frágil',
        items: [
          {
            descripcion: 'Cajas de componentes',
            pesoKg: 10,
            volumenM3: 0.5,
            cantidad: 2,
          },
        ],
      };

      const mockResponse: EnvioResponse = {
        id: 'env-created-1',
        numeroSeguimiento: 'NEX-2026-0003',
        clienteId: 'cli-1',
        clienteRazonSocial: 'Distribuidora Pampeana S.A.',
        origen: 'CD Norte',
        destino: 'Almacén Central',
        estado: 'Solicitado',
        fechaProgramada: '2026-10-25T14:00:00.000Z',
        observaciones: 'Frágil',
        pesoTotalKg: 20,
        volumenTotalM3: 1,
        cantidadItems: 2,
        fechaCreacion: '2026-10-20T20:00:00Z',
      };

      mockEnvioService.createEnvio.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      component.openCreateModal();
      expect(component.createModalOpen()).toBe(true);

      component.onSubmitCreateEnvio(mockRequest);

      expect(mockEnvioService.createEnvio).toHaveBeenCalledWith(mockRequest);
      expect(component.createModalSubmitting()).toBe(false);
      expect(component.createModalOpen()).toBe(false);
      expect(component.createModalError()).toBeNull();
      // Reloaded envios and metricas
      expect(mockEnvioService.getEnvios).toHaveBeenCalledTimes(2); // init + reload
      expect(mockEnvioService.getMetricas).toHaveBeenCalledTimes(2); // init + reload
    });

    it('handles submission error gracefully and sets modal error message', () => {
      const mockRequest: CrearEnvioRequest = {
        clienteId: 'cli-1',
        origen: 'CD Norte',
        destino: 'Almacén Central',
        fechaProgramada: null,
        observaciones: null,
        items: [
          {
            descripcion: 'Cajas',
            pesoKg: 5,
            volumenM3: null,
            cantidad: 1,
          },
        ],
      };

      mockEnvioService.createEnvio.mockReturnValue(
        throwError(() => ({
          error: { message: 'El cliente no se encuentra activo.' },
        })),
      );
      fixture.detectChanges();

      component.openCreateModal();
      component.onSubmitCreateEnvio(mockRequest);

      expect(mockEnvioService.createEnvio).toHaveBeenCalledWith(mockRequest);
      expect(component.createModalSubmitting()).toBe(false);
      expect(component.createModalOpen()).toBe(true);
      expect(component.createModalError()).toBe('El cliente no se encuentra activo.');
    });

    it('falls back to default message if server error has no message field', () => {
      const mockRequest: CrearEnvioRequest = {
        clienteId: 'cli-1',
        origen: 'CD Norte',
        destino: 'Almacén Central',
        items: [{ descripcion: 'Cajas', pesoKg: 5, cantidad: 1 }],
      };

      mockEnvioService.createEnvio.mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();

      component.openCreateModal();
      component.onSubmitCreateEnvio(mockRequest);

      expect(component.createModalSubmitting()).toBe(false);
      expect(component.createModalError()).toBe(
        'No se pudo registrar el envío. Intente nuevamente.',
      );
    });
  });

  describe('Resource Assignment and Dispatch Integration', () => {
    it('opens assign modal and loads available vehicles and drivers', () => {
      fixture.detectChanges();

      const envioToAssign = mockEnvios[1]; // Solicitado
      component.openAssignModal(envioToAssign);

      expect(component.assignModalOpen()).toBe(true);
      expect(component.selectedEnvioForAssign()).toEqual(envioToAssign);
      expect(component.assignModalError()).toBeNull();
      expect(mockVehiculoService.getVehiculos).toHaveBeenCalledWith({
        estado: 'Disponible',
        pageSize: 100,
      });
      expect(mockChoferService.getChoferes).toHaveBeenCalledWith({
        soloActivos: true,
        pageSize: 100,
      });
      expect(component.vehiculosDisponibles().length).toBe(1);
      expect(component.choferesDisponibles().length).toBe(1);
    });

    it('closes assign modal and resets state', () => {
      fixture.detectChanges();

      component.openAssignModal(mockEnvios[1]);
      expect(component.assignModalOpen()).toBe(true);

      component.closeAssignModal();
      expect(component.assignModalOpen()).toBe(false);
      expect(component.selectedEnvioForAssign()).toBeNull();
      expect(component.assignModalError()).toBeNull();
    });

    it('submits assignment successfully, closes modal and refreshes data', () => {
      const mockPayload: AsignarRecursosEnvioRequest = {
        vehiculoId: 'veh-1',
        choferId: 'cho-1',
        motivo: 'Asignación programada',
      };

      const mockResponse: EnvioResponse = {
        id: 'env-2',
        numeroSeguimiento: 'NEX-2026-0002',
        clienteId: 'cli-2',
        clienteRazonSocial: 'Logística Andina',
        origen: 'Puerto Buenos Aires',
        destino: 'Centro Logístico Sur',
        estado: 'Asignado',
        fechaProgramada: null,
        observaciones: null,
        pesoTotalKg: 500,
        volumenTotalM3: 2.1,
        cantidadItems: 12,
        fechaCreacion: '2026-10-20T09:30:00Z',
        vehiculoId: 'veh-1',
        vehiculoPatente: 'AF 123 CD',
        choferId: 'cho-1',
        choferNombreCompleto: 'Carlos Gómez',
      };

      mockEnvioService.asignarRecursos.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      component.openAssignModal(mockEnvios[1]);
      component.onSubmitAssign(mockPayload);

      expect(mockEnvioService.asignarRecursos).toHaveBeenCalledWith('env-2', mockPayload);
      expect(component.assignModalSubmitting()).toBe(false);
      expect(component.assignModalOpen()).toBe(false);
      expect(component.selectedEnvioForAssign()).toBeNull();
      expect(mockEnvioService.getEnvios).toHaveBeenCalledTimes(2);
      expect(mockEnvioService.getMetricas).toHaveBeenCalledTimes(2);
    });

    it('handles assignment error and populates assignModalError', () => {
      const mockPayload: AsignarRecursosEnvioRequest = {
        vehiculoId: 'veh-1',
        choferId: 'cho-1',
      };

      mockEnvioService.asignarRecursos.mockReturnValue(
        throwError(() => ({
          error: { message: 'El vehículo seleccionado no se encuentra disponible.' },
        })),
      );
      fixture.detectChanges();

      component.openAssignModal(mockEnvios[1]);
      component.onSubmitAssign(mockPayload);

      expect(mockEnvioService.asignarRecursos).toHaveBeenCalledWith('env-2', mockPayload);
      expect(component.assignModalSubmitting()).toBe(false);
      expect(component.assignModalOpen()).toBe(true);
      expect(component.assignModalError()).toBe(
        'El vehículo seleccionado no se encuentra disponible.',
      );
    });

    it('handles assignment error fallback message when response lacks message', () => {
      const mockPayload: AsignarRecursosEnvioRequest = {
        vehiculoId: 'veh-1',
        choferId: 'cho-1',
      };

      mockEnvioService.asignarRecursos.mockReturnValue(throwError(() => ({})));
      fixture.detectChanges();

      component.openAssignModal(mockEnvios[1]);
      component.onSubmitAssign(mockPayload);

      expect(component.assignModalSubmitting()).toBe(false);
      expect(component.assignModalError()).toBe(
        'No se pudieron asignar los recursos al envío. Intente nuevamente.',
      );
    });

    it('dispatches shipment when confirmed by user', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const mockResponse: EnvioResponse = {
        id: 'env-1',
        numeroSeguimiento: 'NEX-2026-0001',
        clienteId: 'cli-1',
        clienteRazonSocial: 'Distribuidora Pampeana S.A.',
        origen: 'CD Norte',
        destino: 'Almacén Central',
        estado: 'EnTransito',
        fechaProgramada: '2026-10-25T10:00:00Z',
        observaciones: null,
        pesoTotalKg: 1500,
        volumenTotalM3: 6.5,
        cantidadItems: 30,
        fechaCreacion: '2026-10-20T08:00:00Z',
      };

      mockEnvioService.despacharEnvio.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      component.onDespachar(mockEnvios[0]);

      expect(confirmSpy).toHaveBeenCalledWith('¿Está seguro de despachar el envío NEX-2026-0001?');
      expect(mockEnvioService.despacharEnvio).toHaveBeenCalledWith('env-1');
      expect(mockEnvioService.getEnvios).toHaveBeenCalledTimes(2);
      expect(mockEnvioService.getMetricas).toHaveBeenCalledTimes(2);

      confirmSpy.mockRestore();
    });

    it('aborts dispatch when user cancels the confirmation dialog', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      fixture.detectChanges();

      component.onDespachar(mockEnvios[0]);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockEnvioService.despacharEnvio).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('sets error state when dispatch request fails', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockEnvioService.despacharEnvio.mockReturnValue(
        throwError(() => ({
          error: { message: 'El envío aún no cuenta con recursos asignados.' },
        })),
      );
      fixture.detectChanges();

      component.onDespachar(mockEnvios[0]);

      expect(component.error()).toBe('El envío aún no cuenta con recursos asignados.');
      confirmSpy.mockRestore();
    });

    it('verifies canAssign allows relevant states and disallows others', () => {
      expect(component.canAssign({ ...mockEnvios[0], estado: 'Solicitado' })).toBe(true);
      expect(component.canAssign({ ...mockEnvios[0], estado: 'Preparando' })).toBe(true);
      expect(component.canAssign({ ...mockEnvios[0], estado: 'ListoParaDespacho' })).toBe(true);
      expect(component.canAssign({ ...mockEnvios[0], estado: 'Asignado' })).toBe(true);
      expect(component.canAssign({ ...mockEnvios[0], estado: 'EnTransito' })).toBe(false);
      expect(component.canAssign({ ...mockEnvios[0], estado: 'Entregado' })).toBe(false);
      expect(component.canAssign({ ...mockEnvios[0], estado: 'Cancelado' })).toBe(false);
    });

    it('verifies canDespachar is only true when estado is Asignado', () => {
      expect(component.canDespachar({ ...mockEnvios[0], estado: 'Asignado' })).toBe(true);
      expect(component.canDespachar({ ...mockEnvios[0], estado: 'Solicitado' })).toBe(false);
      expect(component.canDespachar({ ...mockEnvios[0], estado: 'ListoParaDespacho' })).toBe(false);
      expect(component.canDespachar({ ...mockEnvios[0], estado: 'EnTransito' })).toBe(false);
    });

    it('renders "Asignar" and "Despachar" buttons according to permissions and state', () => {
      const testEnvios: EnvioListItem[] = [
        { ...mockEnvios[0], id: 'env-solicitado', estado: 'Solicitado' },
        { ...mockEnvios[1], id: 'env-asignado', estado: 'Asignado' },
      ];

      mockEnvioService.getEnvios.mockReturnValue(
        of({
          items: testEnvios,
          totalCount: 2,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }),
      );

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const assignButtons = compiled.querySelectorAll('.btn-table-assign');
      const dispatchButtons = compiled.querySelectorAll('.btn-table-dispatch');

      // Both Solicitado and Asignado can be assigned
      expect(assignButtons.length).toBe(2);
      // Only Asignado can be dispatched
      expect(dispatchButtons.length).toBe(1);
    });

    it('opens DetalleEnvioModal when tracking number is clicked', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const trackingButtons = compiled.querySelectorAll('.tracking-badge-btn');
      expect(trackingButtons.length).toBeGreaterThan(0);

      (trackingButtons[0] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.detailModalOpen()).toBe(true);
      expect(component.selectedEnvioIdForDetail()).toBe('env-1');
    });

    it('opens DetalleEnvioModal when "Ver detalle" action button is clicked', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const detailButtons = compiled.querySelectorAll('.btn-table-detail');
      expect(detailButtons.length).toBeGreaterThan(0);

      (detailButtons[0] as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(component.detailModalOpen()).toBe(true);
      expect(component.selectedEnvioIdForDetail()).toBe('env-1');
    });

    it('closes DetalleEnvioModal and clears selected shipment when closeDetailModal is called', () => {
      component.openDetailModal('env-1');
      expect(component.detailModalOpen()).toBe(true);
      expect(component.selectedEnvioIdForDetail()).toBe('env-1');

      component.closeDetailModal();
      expect(component.detailModalOpen()).toBe(false);
      expect(component.selectedEnvioIdForDetail()).toBeNull();
    });
  });
});
