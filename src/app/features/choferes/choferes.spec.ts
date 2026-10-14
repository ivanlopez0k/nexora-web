import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Choferes } from './choferes';
import { ChoferService } from './services/chofer.service';
import { CentroLogisticoService } from '../centros-logisticos/services/centro-logistico.service';
import { EmpleadoService } from '../empleados/services/empleado.service';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import type { Chofer, PagedResult } from './models/chofer.models';
import type { CentroLogistico } from '../centros-logisticos/models/centro-logistico.models';
import type { Empleado } from '../empleados/models/empleado.models';

describe('Choferes Component', () => {
  let component: Choferes;
  let fixture: ComponentFixture<Choferes>;

  let mockChoferService: {
    getChoferes: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateHabilitaciones: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  let mockCentroService: {
    getCentros: ReturnType<typeof vi.fn>;
  };

  let mockEmpleadoService: {
    getEmpleados: ReturnType<typeof vi.fn>;
  };

  let mockTokenService: {
    getRoles: ReturnType<typeof vi.fn>;
  };

  const mockCentros: CentroLogistico[] = [
    {
      id: 'centro-1',
      nombre: 'Depósito Central',
      provincia: 'Buenos Aires',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-10T00:00:00Z',
    },
  ];

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
    {
      id: 'emp-2',
      nombre: 'Ya Chofer',
      legajo: 'LEG-020',
      usuarioId: null,
      usuarioEmail: null,
      estado: 'ACTIVO',
      esChofer: true,
      fechaAlta: '2026-10-14T00:00:00Z',
    },
  ];

  const mockChoferes: Chofer[] = [
    {
      id: 'ch-1',
      empleadoId: 'emp-10',
      empleadoNombre: 'Juan Fangio',
      empleadoLegajo: 'LEG-001',
      centroLogisticoId: 'centro-1',
      centroLogisticoNombre: 'Depósito Central',
      numeroLicencia: 'B2-998877',
      vencimientoLicencia: '2028-12-31',
      estado: 'ACTIVO',
      habilitaciones: ['Camion', 'Furgon'],
      esElegibleHoy: true,
      motivoNoElegible: null,
      fechaAlta: '2026-10-14T00:00:00Z',
    },
    {
      id: 'ch-2',
      empleadoId: 'emp-20',
      empleadoNombre: 'Ayrton Senna',
      empleadoLegajo: 'LEG-002',
      centroLogisticoId: 'centro-1',
      centroLogisticoNombre: 'Depósito Central',
      numeroLicencia: 'B2-112233',
      vencimientoLicencia: '2020-01-01',
      estado: 'ACTIVO',
      habilitaciones: [],
      esElegibleHoy: false,
      motivoNoElegible: 'Licencia vencida',
      fechaAlta: '2026-10-14T00:00:00Z',
    },
  ];

  const mockPaged: PagedResult<Chofer> = {
    items: mockChoferes,
    totalCount: 2,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  };

  beforeEach(async () => {
    mockChoferService = {
      getChoferes: vi.fn().mockReturnValue(of(mockPaged)),
      create: vi.fn(),
      update: vi.fn(),
      updateHabilitaciones: vi.fn(),
      delete: vi.fn(),
    };

    mockCentroService = {
      getCentros: vi.fn().mockReturnValue(of({ items: mockCentros, totalItems: 1 })),
    };

    mockEmpleadoService = {
      getEmpleados: vi.fn().mockReturnValue(of({ items: mockEmpleados, totalCount: 2 })),
    };

    mockTokenService = {
      getRoles: vi.fn().mockReturnValue(['SUPER_ADMIN']),
    };

    await TestBed.configureTestingModule({
      imports: [Choferes],
      providers: [
        { provide: ChoferService, useValue: mockChoferService },
        { provide: CentroLogisticoService, useValue: mockCentroService },
        { provide: EmpleadoService, useValue: mockEmpleadoService },
        { provide: AuthTokenService, useValue: mockTokenService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Choferes);
    component = fixture.componentInstance;
  });

  it('creates the component, loads centros and choferes on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockCentroService.getCentros).toHaveBeenCalledWith({ soloActivos: true, pageSize: 100 });
    expect(mockChoferService.getChoferes).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      centroLogisticoId: undefined,
      estado: undefined,
      vencerEnDias: undefined,
    });
    expect(component.choferes().length).toBe(2);
    expect(component.centros().length).toBe(1);
    expect(component.totalPages()).toBe(2);
  });

  describe('filtering and pagination', () => {
    it('filters by centro and resets page to 1', () => {
      fixture.detectChanges();

      component.onCentroFilterChange('centro-1');
      expect(component.centroFilter()).toBe('centro-1');
      expect(component.page()).toBe(1);
      expect(mockChoferService.getChoferes).toHaveBeenCalledWith(
        expect.objectContaining({ centroLogisticoId: 'centro-1', page: 1 }),
      );
    });

    it('filters by estado and resets page to 1', () => {
      fixture.detectChanges();

      component.onEstadoFilterChange('ACTIVO');
      expect(component.estadoFilter()).toBe('ACTIVO');
      expect(component.page()).toBe(1);
      expect(mockChoferService.getChoferes).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'ACTIVO', page: 1 }),
      );
    });

    it('filters by vencimiento and resets page to 1', () => {
      fixture.detectChanges();

      component.onVencimientoFilterChange('30');
      expect(component.vencerEnDiasFilter()).toBe(30);
      expect(component.page()).toBe(1);
      expect(mockChoferService.getChoferes).toHaveBeenCalledWith(
        expect.objectContaining({ vencerEnDias: 30, page: 1 }),
      );
    });

    it('handles next and previous page changes', () => {
      fixture.detectChanges();

      component.onNextPage();
      expect(component.page()).toBe(2);
      expect(mockChoferService.getChoferes).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );

      component.onPrevPage();
      expect(component.page()).toBe(1);
      expect(mockChoferService.getChoferes).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  describe('license status calculation', () => {
    it('returns expired for dates in the past', () => {
      const res = component.getLicenseStatus('2020-01-01');
      expect(res.status).toBe('expired');
      expect(res.label).toBe('Vencida');
    });

    it('returns warning for dates within next 30 days', () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 10);
      const iso = soon.toISOString().split('T')[0];

      const res = component.getLicenseStatus(iso);
      expect(res.status).toBe('warning');
      expect(res.label).toContain('Vence en');
    });

    it('returns valid for dates further than 30 days', () => {
      const future = new Date();
      future.setDate(future.getDate() + 90);
      const iso = future.toISOString().split('T')[0];

      const res = component.getLicenseStatus(iso);
      expect(res.status).toBe('valid');
      expect(res.label).toBe('Vigente');
    });
  });

  describe('role-based access control', () => {
    it('allows write actions for SUPER_ADMIN', () => {
      mockTokenService.getRoles.mockReturnValue(['SUPER_ADMIN']);
      fixture.detectChanges();

      expect(component.canManage()).toBe(true);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-create')).not.toBeNull();
      expect(compiled.querySelectorAll('.cell-actions').length).toBeGreaterThan(0);
    });

    it('allows write actions for OPERADOR_LOGISTICO', () => {
      mockTokenService.getRoles.mockReturnValue(['OPERADOR_LOGISTICO']);
      fixture.detectChanges();

      expect(component.canManage()).toBe(true);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-create')).not.toBeNull();
    });

    it('hides write actions for SUPERVISOR', () => {
      mockTokenService.getRoles.mockReturnValue(['SUPERVISOR']);
      fixture.detectChanges();

      expect(component.canManage()).toBe(false);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-create')).toBeNull();
      expect(compiled.querySelector('.cell-actions')).toBeNull();
    });
  });

  describe('create modal flow', () => {
    it('opens create modal and loads candidate non-driver employees', () => {
      component.openCreateModal();

      expect(component.createModalOpen()).toBe(true);
      expect(mockEmpleadoService.getEmpleados).toHaveBeenCalledWith({ estado: 'ACTIVO', pageSize: 100 });
      expect(component.empleadosCandidatos().length).toBe(1);
      expect(component.empleadosCandidatos()[0].id).toBe('emp-1');
    });

    it('calls service.create on save and reloads list', () => {
      mockChoferService.create.mockReturnValue(of(mockChoferes[0]));
      fixture.detectChanges();

      component.onCreateSave({
        empleadoId: 'emp-1',
        centroLogisticoId: 'centro-1',
        numeroLicencia: 'B2-12345',
        vencimientoLicencia: '2028-10-10',
      });

      expect(mockChoferService.create).toHaveBeenCalled();
      expect(component.createModalOpen()).toBe(false);
      expect(mockChoferService.getChoferes).toHaveBeenCalledTimes(2);
    });

    it('handles 409 conflict error on create', () => {
      mockChoferService.create.mockReturnValue(
        throwError(() => ({
          status: 409,
          error: { detail: 'Ese empleado ya está registrado como chofer.' },
        })),
      );

      component.onCreateSave({
        empleadoId: 'emp-1',
        centroLogisticoId: 'centro-1',
        numeroLicencia: 'B2-12345',
        vencimientoLicencia: '2028-10-10',
      });

      expect(component.createError()).toBe('Ese empleado ya está registrado como chofer.');
    });
  });

  describe('edit modal flow', () => {
    it('opens edit modal with selected driver', () => {
      component.openEditModal(mockChoferes[0]);
      expect(component.editModalOpen()).toBe(true);
      expect(component.selectedChofer()).toEqual(mockChoferes[0]);
    });

    it('calls service.update and reloads list on save', () => {
      mockChoferService.update.mockReturnValue(of(mockChoferes[0]));
      fixture.detectChanges();

      component.openEditModal(mockChoferes[0]);
      component.onEditSave({
        centroLogisticoId: 'centro-1',
        numeroLicencia: 'B2-MOD',
        vencimientoLicencia: '2028-10-10',
      });

      expect(mockChoferService.update).toHaveBeenCalledWith('ch-1', {
        centroLogisticoId: 'centro-1',
        numeroLicencia: 'B2-MOD',
        vencimientoLicencia: '2028-10-10',
      });
      expect(component.editModalOpen()).toBe(false);
    });
  });

  describe('habilitaciones modal flow', () => {
    it('opens habilitaciones modal with selected driver', () => {
      component.openHabilitacionesModal(mockChoferes[0]);
      expect(component.habModalOpen()).toBe(true);
      expect(component.selectedChofer()).toEqual(mockChoferes[0]);
    });

    it('calls service.updateHabilitaciones and reloads list on save', () => {
      mockChoferService.updateHabilitaciones.mockReturnValue(of(mockChoferes[0]));
      fixture.detectChanges();

      component.openHabilitacionesModal(mockChoferes[0]);
      component.onHabilitacionesSave({ tiposVehiculo: ['Camion', 'Acoplado'] });

      expect(mockChoferService.updateHabilitaciones).toHaveBeenCalledWith('ch-1', {
        tiposVehiculo: ['Camion', 'Acoplado'],
      });
      expect(component.habModalOpen()).toBe(false);
    });
  });

  describe('deactivation flow', () => {
    it('calls delete when confirmed and reloads list', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockChoferService.delete.mockReturnValue(of(undefined));
      fixture.detectChanges();

      component.onDeactivate(mockChoferes[0]);

      expect(mockChoferService.delete).toHaveBeenCalledWith('ch-1');
      expect(mockChoferService.getChoferes).toHaveBeenCalledTimes(2);
    });

    it('does not call delete when cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.onDeactivate(mockChoferes[0]);

      expect(mockChoferService.delete).not.toHaveBeenCalled();
    });
  });
});
