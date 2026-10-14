import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { DepositosModal } from './depositos-modal';
import { DepositoService } from '../../services/deposito.service';
import type { Deposito } from '../../models/deposito.models';
import type { CentroLogistico } from '../../models/centro-logistico.models';

describe('DepositosModal Component', () => {
  let component: DepositosModal;
  let fixture: ComponentFixture<DepositosModal>;
  let mockService: {
    getDepositos: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    cambiarEstado: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockCentro: CentroLogistico = {
    id: 'centro-10',
    nombre: 'Centro Logístico Rosario',
    provincia: 'Santa Fe',
    estado: 'Activo',
    fechaCreacionUtc: '2026-01-01T00:00:00Z',
  };

  const mockDepositos: Deposito[] = [
    {
      id: 'dep-1',
      centroLogisticoId: 'centro-10',
      codigo: 'DEP-GEN-1',
      nombre: 'Depósito General 1',
      tipo: 'General',
      capacidadTotalM3: 8000,
      estado: 'Activo',
      fechaAlta: '2026-02-01',
    },
    {
      id: 'dep-2',
      centroLogisticoId: 'centro-10',
      codigo: 'DEP-FRIO-2',
      nombre: 'Cámara Frigorífica 2',
      tipo: 'Refrigerado',
      capacidadTotalM3: 3500,
      temperaturaMinima: -2,
      temperaturaMaxima: 6,
      estado: 'Inactivo',
      fechaAlta: '2026-02-05',
    },
  ];

  beforeEach(async () => {
    mockService = {
      getDepositos: vi.fn().mockReturnValue(of(mockDepositos)),
      create: vi.fn().mockReturnValue(of(mockDepositos[0])),
      update: vi.fn().mockReturnValue(of(mockDepositos[0])),
      cambiarEstado: vi.fn().mockReturnValue(of(mockDepositos[0])),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [DepositosModal],
      providers: [{ provide: DepositoService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DepositosModal);
    component = fixture.componentInstance;
    component.centro = mockCentro;
    component.canManage = true;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('loads depositos on open (ngOnChanges with isOpen=true)', () => {
    component.isOpen = true;
    component.ngOnChanges({
      isOpen: new SimpleChange(false, true, true),
    });

    expect(mockService.getDepositos).toHaveBeenCalledWith('centro-10');
    expect(component.depositos().length).toBe(2);
  });

  it('renders deposit cards with names, codes and status badges', () => {
    component.isOpen = true;
    component.depositos.set(mockDepositos);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.deposito-card');
    expect(cards.length).toBe(2);
    expect(compiled.textContent).toContain('DEP-GEN-1');
    expect(compiled.textContent).toContain('Cámara Frigorífica 2');
  });

  it('shows empty state when no depositos exist', () => {
    component.isOpen = true;
    component.depositos.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-depositos-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Sin depósitos registrados');
  });

  it('hides form section and action buttons when canManage is false', () => {
    component.isOpen = true;
    component.canManage = false;
    component.depositos.set(mockDepositos);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.form-section')).toBeFalsy();
    expect(compiled.querySelectorAll('.btn-edit').length).toBe(0);
    expect(compiled.querySelectorAll('.btn-toggle').length).toBe(0);
  });

  it('validates form inputs: codigo, nombre, capacidad and temperaturas', () => {
    component.isOpen = true;

    // 1. Missing codigo
    component.codigo.set('');
    component.nombre.set('Valido');
    component.capacidadTotalM3.set(100);
    component.onSave();
    expect(component.formError()).toContain('código');

    // 2. Missing nombre
    component.codigo.set('DEP-01');
    component.nombre.set('');
    component.onSave();
    expect(component.formError()).toContain('nombre');

    // 3. Invalid capacity
    component.nombre.set('Nombre valido');
    component.capacidadTotalM3.set(0);
    component.onSave();
    expect(component.formError()).toContain('capacidad');

    // 4. Invalid temperatures (min > max)
    component.capacidadTotalM3.set(500);
    component.temperaturaMinima.set(10);
    component.temperaturaMaxima.set(2);
    component.onSave();
    expect(component.formError()).toContain('temperatura mínima');
  });

  it('creates new deposito when valid and emits depositosChange', () => {
    component.isOpen = true;
    component.codigo.set('DEP-SEC-1');
    component.nombre.set('Seco Principal');
    component.tipo.set('Seco');
    component.capacidadTotalM3.set(10000);

    const changeSpy = vi.spyOn(component.depositosChange, 'emit');

    component.onSave();

    expect(mockService.create).toHaveBeenCalledWith('centro-10', {
      codigo: 'DEP-SEC-1',
      nombre: 'Seco Principal',
      tipo: 'Seco',
      capacidadTotalM3: 10000,
      temperaturaMinima: undefined,
      temperaturaMaxima: undefined,
    });
    expect(component.successMessage()).toContain('registrado correctamente');
    expect(changeSpy).toHaveBeenCalled();
  });

  it('populates form for editing on startEdit and updates on onSave', () => {
    component.isOpen = true;
    component.startEdit(mockDepositos[1]);

    expect(component.editingId()).toBe('dep-2');
    expect(component.codigo()).toBe('DEP-FRIO-2');
    expect(component.temperaturaMinima()).toBe(-2);
    expect(component.temperaturaMaxima()).toBe(6);

    component.nombre.set('Cámara Actualizada');
    component.onSave();

    expect(mockService.update).toHaveBeenCalledWith(
      'centro-10',
      'dep-2',
      expect.objectContaining({
        nombre: 'Cámara Actualizada',
      }),
    );
  });

  it('cancels edit and resets form on cancelEdit', () => {
    component.startEdit(mockDepositos[0]);
    expect(component.editingId()).toBe('dep-1');

    component.cancelEdit();
    expect(component.editingId()).toBeNull();
    expect(component.codigo()).toBe('');
  });

  it('toggles estado between Activo and Inactivo', () => {
    component.isOpen = true;
    component.onToggleEstado(mockDepositos[0]); // Estado era Activo

    expect(mockService.cambiarEstado).toHaveBeenCalledWith('centro-10', 'dep-1', {
      estado: 'Inactivo',
    });
  });

  it('deletes deposito when confirmed by user', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.isOpen = true;

    component.onDelete(mockDepositos[0]);

    expect(mockService.delete).toHaveBeenCalledWith('centro-10', 'dep-1');
    expect(mockService.getDepositos).toHaveBeenCalledWith('centro-10');
  });

  it('does not delete deposito when cancelled by user', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.onDelete(mockDepositos[0]);

    expect(mockService.delete).not.toHaveBeenCalled();
  });

  it('resets form and emits close on onClose', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.codigo.set('DEP-TMP');

    component.onClose();

    expect(closeSpy).toHaveBeenCalled();
    expect(component.codigo()).toBe('');
  });
});
