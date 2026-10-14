import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Empleados } from './empleados';
import { EmpleadoService } from './services/empleado.service';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import type {
  Empleado,
  PagedResult,
} from './models/empleado.models';

describe('Empleados Component', () => {
  let component: Empleados;
  let fixture: ComponentFixture<Empleados>;
  let mockService: {
    getEmpleados: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    asociarUsuario: ReturnType<typeof vi.fn>;
  };
  let mockTokenService: {
    getRoles: ReturnType<typeof vi.fn>;
  };

  const mockEmpleados: Empleado[] = [
    {
      id: 'emp-1',
      nombre: 'Carlos Gardel',
      legajo: 'LEG-001',
      usuarioId: '92c42c26-5b35-43be-b928-bd5e1b209d84',
      usuarioEmail: 'carlos@nexora.com',
      estado: 'ACTIVO',
      esChofer: false,
      fechaAlta: '2026-10-14T00:00:00Z',
    },
    {
      id: 'emp-2',
      nombre: 'Juan Manuel Fangio',
      legajo: 'LEG-002',
      usuarioId: null,
      usuarioEmail: null,
      estado: 'ACTIVO',
      esChofer: true,
      fechaAlta: '2026-10-14T00:00:00Z',
    },
    {
      id: 'emp-3',
      nombre: 'Lucía Méndez',
      legajo: 'LEG-003',
      usuarioId: null,
      usuarioEmail: null,
      estado: 'INACTIVO',
      esChofer: false,
      fechaAlta: '2026-10-14T00:00:00Z',
    },
  ];

  const mockPaged: PagedResult<Empleado> = {
    items: mockEmpleados,
    totalCount: 3,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  };

  beforeEach(async () => {
    mockService = {
      getEmpleados: vi.fn().mockReturnValue(of(mockPaged)),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      asociarUsuario: vi.fn(),
    };

    mockTokenService = {
      getRoles: vi.fn().mockReturnValue(['SUPER_ADMIN']),
    };

    await TestBed.configureTestingModule({
      imports: [Empleados],
      providers: [
        { provide: EmpleadoService, useValue: mockService },
        { provide: AuthTokenService, useValue: mockTokenService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Empleados);
    component = fixture.componentInstance;
  });

  it('creates the component and fetches empleados on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockService.getEmpleados).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      nombre: undefined,
      legajo: undefined,
      estado: undefined,
    });
    expect(component.empleados().length).toBe(3);
    expect(component.totalPages()).toBe(2);
    expect(component.totalCount()).toBe(3);
  });

  describe('filtering and pagination', () => {
    it('updates searchNombre and resets page to 1', () => {
      fixture.detectChanges();

      component.onSearchNombreChange('Carlos');
      expect(component.searchNombre()).toBe('Carlos');
      expect(component.page()).toBe(1);
      expect(mockService.getEmpleados).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Carlos', page: 1 }),
      );
    });

    it('updates searchLegajo and resets page to 1', () => {
      fixture.detectChanges();

      component.onSearchLegajoChange('LEG-001');
      expect(component.searchLegajo()).toBe('LEG-001');
      expect(component.page()).toBe(1);
      expect(mockService.getEmpleados).toHaveBeenCalledWith(
        expect.objectContaining({ legajo: 'LEG-001', page: 1 }),
      );
    });

    it('updates estadoFilter and resets page to 1', () => {
      fixture.detectChanges();

      component.onEstadoChange('ACTIVO');
      expect(component.estadoFilter()).toBe('ACTIVO');
      expect(component.page()).toBe(1);
      expect(mockService.getEmpleados).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'ACTIVO', page: 1 }),
      );
    });

    it('handles next and previous page changes', () => {
      fixture.detectChanges();

      component.onNextPage();
      expect(component.page()).toBe(2);
      expect(mockService.getEmpleados).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );

      component.onPrevPage();
      expect(component.page()).toBe(1);
      expect(mockService.getEmpleados).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
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

    it('allows write actions for ADMIN_EMPRESA', () => {
      mockTokenService.getRoles.mockReturnValue(['ADMIN_EMPRESA']);
      fixture.detectChanges();

      expect(component.canManage()).toBe(true);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-create')).not.toBeNull();
    });

    it('disables or hides write actions for SUPERVISOR', () => {
      mockTokenService.getRoles.mockReturnValue(['SUPERVISOR']);
      fixture.detectChanges();

      expect(component.canManage()).toBe(false);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-create')).toBeNull();
      expect(compiled.querySelector('.cell-actions')).toBeNull();
    });
  });

  describe('create and edit modal flow', () => {
    it('opens create modal with clean state', () => {
      component.openCreateModal();
      expect(component.modalOpen()).toBe(true);
      expect(component.selectedEmpleado()).toBeNull();
      expect(component.modalError()).toBeNull();
    });

    it('opens edit modal with selected employee', () => {
      component.openEditModal(mockEmpleados[0]);
      expect(component.modalOpen()).toBe(true);
      expect(component.selectedEmpleado()).toEqual(mockEmpleados[0]);
    });

    it('calls service.create when selectedEmpleado is null', () => {
      mockService.create.mockReturnValue(of(mockEmpleados[0]));
      component.openCreateModal();

      component.onModalSave({ nombre: 'Nuevo Empleado', legajo: 'LEG-100' });

      expect(mockService.create).toHaveBeenCalledWith({
        nombre: 'Nuevo Empleado',
        legajo: 'LEG-100',
      });
      expect(component.modalOpen()).toBe(false);
    });

    it('calls service.update when selectedEmpleado is set', () => {
      mockService.update.mockReturnValue(of(mockEmpleados[0]));
      component.openEditModal(mockEmpleados[0]);

      component.onModalSave({ nombre: 'Carlos Gardel Modif', legajo: 'LEG-001' });

      expect(mockService.update).toHaveBeenCalledWith('emp-1', {
        nombre: 'Carlos Gardel Modif',
        legajo: 'LEG-001',
      });
      expect(component.modalOpen()).toBe(false);
    });

    it('handles 409 conflict error when saving employee', () => {
      mockService.create.mockReturnValue(
        throwError(() => ({
          status: 409,
          error: { detail: 'Ya existe un empleado con ese legajo.' },
        })),
      );
      component.openCreateModal();

      component.onModalSave({ nombre: 'Duplicado', legajo: 'LEG-001' });

      expect(component.modalError()).toBe('Ya existe un empleado con ese legajo.');
      expect(component.modalOpen()).toBe(true);
    });
  });

  describe('asociar usuario modal flow', () => {
    it('opens asociar modal with selected employee', () => {
      component.openAsociarModal(mockEmpleados[1]);
      expect(component.asociarModalOpen()).toBe(true);
      expect(component.selectedEmpleado()).toEqual(mockEmpleados[1]);
      expect(component.asociarError()).toBeNull();
    });

    it('calls service.asociarUsuario on save', () => {
      mockService.asociarUsuario.mockReturnValue(of(mockEmpleados[1]));
      component.openAsociarModal(mockEmpleados[1]);

      component.onAsociarSave({ usuarioId: 'e7b53fa9-8392-4d22-ba3f-912df0f65d64' });

      expect(mockService.asociarUsuario).toHaveBeenCalledWith('emp-2', {
        usuarioId: 'e7b53fa9-8392-4d22-ba3f-912df0f65d64',
      });
      expect(component.asociarModalOpen()).toBe(false);
    });

    it('handles 409 conflict when associating already linked user', () => {
      mockService.asociarUsuario.mockReturnValue(
        throwError(() => ({
          status: 409,
          error: { detail: 'El usuario ya se encuentra vinculado a otro empleado.' },
        })),
      );
      component.openAsociarModal(mockEmpleados[1]);

      component.onAsociarSave({ usuarioId: 'e7b53fa9-8392-4d22-ba3f-912df0f65d64' });

      expect(component.asociarError()).toBe(
        'El usuario ya se encuentra vinculado a otro empleado.',
      );
      expect(component.asociarModalOpen()).toBe(true);
    });
  });

  describe('deactivation flow', () => {
    it('calls delete when confirmed and reloads list', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockService.delete.mockReturnValue(of(undefined));
      fixture.detectChanges();

      component.onDeactivate(mockEmpleados[0]);

      expect(mockService.delete).toHaveBeenCalledWith('emp-1');
      expect(mockService.getEmpleados).toHaveBeenCalledTimes(2); // Initial + reload
    });

    it('does not call delete when cancelled by user', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.onDeactivate(mockEmpleados[0]);

      expect(mockService.delete).not.toHaveBeenCalled();
    });

    it('displays 409 conflict detail if employee is active driver', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      mockService.delete.mockReturnValue(
        throwError(() => ({
          status: 409,
          error: {
            detail: 'No se puede desactivar el empleado porque está asignado como chofer activo en una flota.',
          },
        })),
      );

      component.onDeactivate(mockEmpleados[1]);

      expect(component.error()).toBe(
        'No se puede desactivar el empleado porque está asignado como chofer activo en una flota.',
      );
    });
  });
});
