import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CentrosLogisticos } from './centros-logisticos';
import { CentroLogisticoService } from './services/centro-logistico.service';
import type {
  CentroLogistico,
  PagedResult,
} from './models/centro-logistico.models';

describe('CentrosLogisticos Component', () => {
  let component: CentrosLogisticos;
  let fixture: ComponentFixture<CentrosLogisticos>;
  let mockService: {
    getCentros: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockCentros: CentroLogistico[] = [
    {
      id: 'c1-guid',
      nombre: 'Centro Logístico Norte',
      provincia: 'Buenos Aires',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-10T00:00:00Z',
    },
    {
      id: 'c2-guid',
      nombre: 'Centro Logístico Sur',
      provincia: 'Santa Fe',
      estado: 'Inactivo',
      fechaCreacionUtc: '2026-10-09T00:00:00Z',
    },
  ];

  const mockPaged: PagedResult<CentroLogistico> = {
    items: mockCentros,
    totalItems: 2,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 2,
    hasNextPage: true,
    hasPreviousPage: false,
  };

  beforeEach(async () => {
    mockService = {
      getCentros: vi.fn().mockReturnValue(of(mockPaged)),
      create: vi.fn(),
      delete: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CentrosLogisticos],
      providers: [{ provide: CentroLogisticoService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CentrosLogisticos);
    component = fixture.componentInstance;
  });

  it('creates the component and fetches centros on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockService.getCentros).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      soloActivos: undefined,
    });
    expect(component.centros().length).toBe(2);
    expect(component.totalPages()).toBe(2);
  });

  it('updates search and resets to page 1 when search changes', () => {
    fixture.detectChanges();

    component.onSearchChange('Norte');

    expect(component.search()).toBe('Norte');
    expect(component.page()).toBe(1);
    expect(mockService.getCentros).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Norte', page: 1 })
    );
  });

  it('filters by active status when checkbox changes', () => {
    fixture.detectChanges();

    component.onSoloActivosChange(true);

    expect(component.soloActivos()).toBe(true);
    expect(mockService.getCentros).toHaveBeenCalledWith(
      expect.objectContaining({ soloActivos: true, page: 1 })
    );
  });

  it('handles pagination next and previous', () => {
    fixture.detectChanges();

    component.onNextPage();
    expect(component.page()).toBe(2);

    component.onPrevPage();
    expect(component.page()).toBe(1);
  });

  it('opens and closes the create modal', () => {
    expect(component.modalOpen()).toBe(false);

    component.openCreateModal();
    expect(component.modalOpen()).toBe(true);

    component.closeCreateModal();
    expect(component.modalOpen()).toBe(false);
  });

  it('submits create modal and reloads centros on success', () => {
    const newCentro: CentroLogistico = {
      id: 'c3-guid',
      nombre: 'Nuevo Centro',
      provincia: 'Córdoba',
      estado: 'Activo',
      fechaCreacionUtc: '2026-10-10T12:00:00Z',
    };
    mockService.create.mockReturnValue(of(newCentro));
    fixture.detectChanges();

    component.openCreateModal();
    component.onCreateSubmit({ nombre: 'Nuevo Centro', provincia: 'Córdoba' });

    expect(mockService.create).toHaveBeenCalledWith({
      nombre: 'Nuevo Centro',
      provincia: 'Córdoba',
    });
    expect(component.modalOpen()).toBe(false);
    expect(component.modalSubmitting()).toBe(false);
  });

  it('handles 409 conflict error in create modal', () => {
    mockService.create.mockReturnValue(throwError(() => ({ status: 409 })));
    fixture.detectChanges();

    component.openCreateModal();
    component.onCreateSubmit({ nombre: 'Duplicado', provincia: 'Buenos Aires' });

    expect(component.modalSubmitting()).toBe(false);
    expect(component.modalError()).toContain('Ya existe un centro logístico con ese nombre');
    expect(component.modalOpen()).toBe(true);
  });

  it('deactivates a center after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockService.delete.mockReturnValue(of(undefined));
    fixture.detectChanges();

    component.onDeactivate(mockCentros[0]);

    expect(mockService.delete).toHaveBeenCalledWith(mockCentros[0].id);
  });
});
