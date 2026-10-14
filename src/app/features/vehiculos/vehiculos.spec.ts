import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Vehiculos } from './vehiculos';
import { VehiculoService } from './services/vehiculo.service';
import { CentroLogisticoService } from '../centros-logisticos/services/centro-logistico.service';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import { VehiculoDocumentoService } from './services/vehiculo-documento.service';
import type {
  Vehiculo,
  PagedResult,
  CrearVehiculoRequest,
} from './models/vehiculo.models';
import type { CentroLogistico } from '../centros-logisticos/models/centro-logistico.models';

describe('Vehiculos Component', () => {
  let component: Vehiculos;
  let fixture: ComponentFixture<Vehiculos>;

  let mockVehiculoService: {
    getVehiculos: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    cambiarEstado: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  let mockCentroService: {
    getCentros: ReturnType<typeof vi.fn>;
  };

  let mockTokenService: {
    getRoles: ReturnType<typeof vi.fn>;
  };

  let mockDocumentoService: {
    getDocumentos: ReturnType<typeof vi.fn>;
    subirDocumento: ReturnType<typeof vi.fn>;
    descargarArchivo: ReturnType<typeof vi.fn>;
    darDeBaja: ReturnType<typeof vi.fn>;
  };

  const mockVehiculos: Vehiculo[] = [
    {
      id: 'veh-1',
      patente: 'AA123BB',
      formattedPatente: 'AA 123 BB',
      marca: 'Scania',
      modelo: 'R450',
      anio: 2022,
      tipo: 'Camion',
      capacidad: 28000,
      kilometraje: 85000,
      estado: 'Disponible',
      centroLogisticoId: 'centro-1',
      centroLogisticoNombre: 'Centro Logístico Retiro',
      fechaAlta: '2026-10-10T00:00:00Z',
    },
    {
      id: 'veh-2',
      patente: 'AB456CD',
      formattedPatente: 'AB 456 CD',
      marca: 'Mercedes-Benz',
      modelo: 'Sprinter',
      anio: 2023,
      tipo: 'Furgon',
      capacidad: 3500,
      kilometraje: 42000,
      estado: 'EnViaje',
      centroLogisticoId: 'centro-1',
      centroLogisticoNombre: 'Centro Logístico Retiro',
      fechaAlta: '2026-10-09T00:00:00Z',
    },
  ];

  const mockPagedVehiculos: PagedResult<Vehiculo> = {
    items: mockVehiculos,
    totalItems: 2,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  };

  const mockCentros: CentroLogistico[] = [
    {
      id: 'centro-1',
      nombre: 'Centro Logístico Retiro',
      provincia: 'Buenos Aires',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-01T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    mockVehiculoService = {
      getVehiculos: vi.fn().mockReturnValue(of(mockPagedVehiculos)),
      create: vi.fn(),
      cambiarEstado: vi.fn(),
      delete: vi.fn(),
    };

    mockCentroService = {
      getCentros: vi.fn().mockReturnValue(of({ items: mockCentros, totalItems: 1, totalPages: 1 })),
    };

    mockTokenService = {
      getRoles: vi.fn().mockReturnValue(['SUPER_ADMIN']),
    };

    mockDocumentoService = {
      getDocumentos: vi.fn().mockReturnValue(of([])),
      subirDocumento: vi.fn(),
      descargarArchivo: vi.fn(),
      darDeBaja: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Vehiculos],
      providers: [
        { provide: VehiculoService, useValue: mockVehiculoService },
        { provide: CentroLogisticoService, useValue: mockCentroService },
        { provide: AuthTokenService, useValue: mockTokenService },
        { provide: VehiculoDocumentoService, useValue: mockDocumentoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Vehiculos);
    component = fixture.componentInstance;
  });

  it('creates the component and fetches centros and vehiculos on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockCentroService.getCentros).toHaveBeenCalledWith({ soloActivos: true, pageSize: 100 });
    expect(mockVehiculoService.getVehiculos).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      tipo: undefined,
      estado: undefined,
      centroLogisticoId: undefined,
    });
    expect(component.vehiculos().length).toBe(2);
    expect(component.centros().length).toBe(1);
    expect(component.totalPages()).toBe(2);
    expect(component.totalItems()).toBe(2);
  });

  it('updates search and reloads from page 1', () => {
    fixture.detectChanges();

    component.onSearchChange('Scania');

    expect(component.search()).toBe('Scania');
    expect(component.page()).toBe(1);
    expect(mockVehiculoService.getVehiculos).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Scania', page: 1 })
    );
  });

  it('filters by tipo and reloads from page 1', () => {
    fixture.detectChanges();

    component.onTipoFilterChange('Camion');

    expect(component.tipoFilter()).toBe('Camion');
    expect(mockVehiculoService.getVehiculos).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'Camion', page: 1 })
    );
  });

  it('filters by estado and reloads from page 1', () => {
    fixture.detectChanges();

    component.onEstadoFilterChange('Disponible');

    expect(component.estadoFilter()).toBe('Disponible');
    expect(mockVehiculoService.getVehiculos).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'Disponible', page: 1 })
    );
  });

  it('filters by centro logistico and reloads from page 1', () => {
    fixture.detectChanges();

    component.onCentroFilterChange('centro-1');

    expect(component.centroFilter()).toBe('centro-1');
    expect(mockVehiculoService.getVehiculos).toHaveBeenCalledWith(
      expect.objectContaining({ centroLogisticoId: 'centro-1', page: 1 })
    );
  });

  it('handles page navigation next and previous', () => {
    fixture.detectChanges();

    component.onNextPage();
    expect(component.page()).toBe(2);

    component.onPrevPage();
    expect(component.page()).toBe(1);
  });

  it('opens and closes create modal', () => {
    expect(component.modalOpen()).toBe(false);

    component.openCreateModal();
    expect(component.modalOpen()).toBe(true);

    component.closeModal();
    expect(component.modalOpen()).toBe(false);
  });

  it('submits create modal payload, closes modal and refreshes list', () => {
    const payload: CrearVehiculoRequest = {
      patente: 'AA 123 BB',
      marca: 'Scania',
      modelo: 'R450',
      anio: 2022,
      tipo: 'Camion',
      capacidad: 28000,
      kilometraje: 85000,
      centroLogisticoId: 'centro-1',
    };

    mockVehiculoService.create.mockReturnValue(of(mockVehiculos[0]));
    fixture.detectChanges();

    component.openCreateModal();
    component.onModalSubmit(payload);

    expect(mockVehiculoService.create).toHaveBeenCalledWith(payload);
    expect(component.modalOpen()).toBe(false);
    expect(component.modalSubmitting()).toBe(false);
  });

  it('handles 409 conflict error when creating vehicle', () => {
    const payload: CrearVehiculoRequest = {
      patente: 'AA 123 BB',
      marca: 'Scania',
      modelo: 'R450',
      anio: 2022,
      tipo: 'Camion',
      capacidad: 28000,
      kilometraje: 85000,
      centroLogisticoId: 'centro-1',
    };

    mockVehiculoService.create.mockReturnValue(throwError(() => ({ status: 409 })));
    fixture.detectChanges();

    component.openCreateModal();
    component.onModalSubmit(payload);

    expect(component.modalSubmitting()).toBe(false);
    expect(component.modalError()).toBe('Ya existe un vehículo registrado con esa patente.');
    expect(component.modalOpen()).toBe(true);
  });

  it('handles generic error with detail message on create', () => {
    const payload: CrearVehiculoRequest = {
      patente: 'AA 123 BB',
      marca: 'Scania',
      modelo: 'R450',
      anio: 2022,
      tipo: 'Camion',
      capacidad: 28000,
      kilometraje: 85000,
      centroLogisticoId: 'centro-1',
    };

    mockVehiculoService.create.mockReturnValue(
      throwError(() => ({ status: 400, error: { detail: 'Capacidad inválida.' } }))
    );
    fixture.detectChanges();

    component.openCreateModal();
    component.onModalSubmit(payload);

    expect(component.modalSubmitting()).toBe(false);
    expect(component.modalError()).toBe('Capacidad inválida.');
  });

  it('changes estado of vehicle and refreshes list', () => {
    mockVehiculoService.cambiarEstado.mockReturnValue(of(mockVehiculos[0]));
    fixture.detectChanges();

    component.onChangeEstado(mockVehiculos[0], 'EnMantenimiento');

    expect(mockVehiculoService.cambiarEstado).toHaveBeenCalledWith('veh-1', {
      estado: 'EnMantenimiento',
    });
  });

  it('handles error when changing estado', () => {
    mockVehiculoService.cambiarEstado.mockReturnValue(
      throwError(() => new Error('Error al actualizar'))
    );
    fixture.detectChanges();

    component.onChangeEstado(mockVehiculos[0], 'EnMantenimiento');

    expect(component.error()).toBe('No se pudo actualizar el estado del vehículo.');
  });

  it('deletes vehicle upon confirmation and refreshes list', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockVehiculoService.delete.mockReturnValue(of(undefined));
    fixture.detectChanges();

    component.onDelete(mockVehiculos[0]);

    expect(mockVehiculoService.delete).toHaveBeenCalledWith('veh-1');
  });

  it('handles error when loading vehiculos', () => {
    mockVehiculoService.getVehiculos.mockReturnValue(
      throwError(() => new Error('Server error'))
    );

    component.loadVehiculos();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('No se pudieron cargar los vehículos. Intenta nuevamente.');
  });

  it('opens and closes documents modal for a vehicle', () => {
    fixture.detectChanges();

    component.openDocsModal(mockVehiculos[0]);
    expect(component.docsModalOpen()).toBe(true);
    expect(component.selectedVehiculoForDocs()).toEqual(mockVehiculos[0]);

    component.closeDocsModal();
    expect(component.docsModalOpen()).toBe(false);
    expect(component.selectedVehiculoForDocs()).toBeNull();
  });

  it('renders Documentos action button and opens modal on click', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const docsBtns = compiled.querySelectorAll('.btn-action-docs');
    expect(docsBtns.length).toBe(2);

    (docsBtns[0] as HTMLButtonElement).click();
    expect(component.docsModalOpen()).toBe(true);
    expect(component.selectedVehiculoForDocs()?.id).toBe('veh-1');
  });

  it('evaluates canManage correctly based on user roles', () => {
    mockTokenService.getRoles.mockReturnValue(['OPERADOR_LOGISTICO']);
    expect(component.canManage()).toBe(true);

    mockTokenService.getRoles.mockReturnValue(['ADMIN_EMPRESA']);
    expect(component.canManage()).toBe(true);

    mockTokenService.getRoles.mockReturnValue(['SUPERVISOR']);
    expect(component.canManage()).toBe(false);

    mockTokenService.getRoles.mockReturnValue(['CHOFER']);
    expect(component.canManage()).toBe(false);
  });
});

