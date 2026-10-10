import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Clientes } from './clientes';
import { ClienteService } from './services/cliente.service';
import type {
  Cliente,
  PagedResult,
} from './models/cliente.models';

describe('Clientes Component', () => {
  let component: Clientes;
  let fixture: ComponentFixture<Clientes>;
  let mockService: {
    getClientes: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockClientes: Cliente[] = [
    {
      id: 'cli-1',
      razonSocial: 'Distribuidora Pampeana S.A.',
      cuit: '30500010912',
      formattedCuit: '30-50001091-2',
      estado: 'ACTIVO',
      fechaAlta: '2026-10-10T00:00:00Z',
      cantidadContactos: 2,
      cantidadDirecciones: 1,
    },
    {
      id: 'cli-2',
      razonSocial: 'Logística Andina S.R.L.',
      cuit: '30600020923',
      formattedCuit: '30-60002092-3',
      estado: 'INACTIVO',
      fechaAlta: '2026-10-09T00:00:00Z',
      cantidadContactos: 0,
      cantidadDirecciones: 0,
    },
  ];

  const mockPaged: PagedResult<Cliente> = {
    items: mockClientes,
    totalItems: 2,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  };

  beforeEach(async () => {
    mockService = {
      getClientes: vi.fn().mockReturnValue(of(mockPaged)),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Clientes],
      providers: [{ provide: ClienteService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Clientes);
    component = fixture.componentInstance;
  });

  it('creates the component and fetches clientes on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockService.getClientes).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      estado: undefined,
    });
    expect(component.clientes().length).toBe(2);
    expect(component.totalPages()).toBe(2);
  });

  it('updates search and reloads from page 1', () => {
    fixture.detectChanges();

    component.onSearchChange('Pampeana');

    expect(component.search()).toBe('Pampeana');
    expect(component.page()).toBe(1);
    expect(mockService.getClientes).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Pampeana', page: 1 })
    );
  });

  it('filters by estado when dropdown changes', () => {
    fixture.detectChanges();

    component.onEstadoChange('ACTIVO');

    expect(component.estadoFilter()).toBe('ACTIVO');
    expect(mockService.getClientes).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'ACTIVO', page: 1 })
    );
  });

  it('handles page navigation next and previous', () => {
    fixture.detectChanges();

    component.onNextPage();
    expect(component.page()).toBe(2);

    component.onPrevPage();
    expect(component.page()).toBe(1);
  });

  it('opens and closes modal in create mode', () => {
    expect(component.modalOpen()).toBe(false);

    component.openCreateModal();
    expect(component.modalOpen()).toBe(true);
    expect(component.selectedCliente()).toBeNull();

    component.closeModal();
    expect(component.modalOpen()).toBe(false);
  });

  it('opens modal in edit mode with selected cliente', () => {
    component.openEditModal(mockClientes[0]);

    expect(component.modalOpen()).toBe(true);
    expect(component.selectedCliente()).toBe(mockClientes[0]);
  });

  it('submits create when in create mode and refreshes list', () => {
    mockService.create.mockReturnValue(of(mockClientes[0]));
    fixture.detectChanges();

    component.openCreateModal();
    component.onModalSave({ razonSocial: 'Nueva Empresa', cuit: '30-50001091-2' });

    expect(mockService.create).toHaveBeenCalledWith({
      razonSocial: 'Nueva Empresa',
      cuit: '30-50001091-2',
    });
    expect(component.modalOpen()).toBe(false);
  });

  it('submits update when in edit mode and refreshes list', () => {
    mockService.update.mockReturnValue(of(mockClientes[0]));
    fixture.detectChanges();

    component.openEditModal(mockClientes[0]);
    component.onModalSave({ razonSocial: 'Pampeana Modificada', cuit: '30-50001091-2' });

    expect(mockService.update).toHaveBeenCalledWith(mockClientes[0].id, {
      razonSocial: 'Pampeana Modificada',
      cuit: '30-50001091-2',
      estado: 'ACTIVO',
    });
    expect(component.modalOpen()).toBe(false);
  });

  it('handles 409 conflict error on save', () => {
    mockService.create.mockReturnValue(throwError(() => ({ status: 409 })));
    fixture.detectChanges();

    component.openCreateModal();
    component.onModalSave({ razonSocial: 'Duplicado', cuit: '30-50001091-2' });

    expect(component.modalSubmitting()).toBe(false);
    expect(component.modalError()).toContain('Ya existe un cliente con ese CUIT o razón social');
    expect(component.modalOpen()).toBe(true);
  });

  it('deactivates cliente upon confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockService.delete.mockReturnValue(of(undefined));
    fixture.detectChanges();

    component.onDeactivate(mockClientes[0]);

    expect(mockService.delete).toHaveBeenCalledWith(mockClientes[0].id);
  });
});
