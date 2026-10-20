import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CrearEnvioModal } from './crear-envio-modal';
import type { Cliente } from '../../../clientes/models/cliente.models';
import type { CrearEnvioRequest } from '../../models/envio.models';

describe('CrearEnvioModal', () => {
  let component: CrearEnvioModal;
  let componentRef: ComponentRef<CrearEnvioModal>;
  let fixture: ComponentFixture<CrearEnvioModal>;

  const mockClientes: Cliente[] = [
    {
      id: 'cli-001',
      razonSocial: 'Distribuidora Pampeana S.A.',
      cuit: '30500010912',
      formattedCuit: '30-50001091-2',
      estado: 'ACTIVO',
      fechaAlta: '2026-01-01',
      cantidadContactos: 2,
      cantidadDirecciones: 1,
    },
    {
      id: 'cli-002',
      razonSocial: 'Logística Andina',
      cuit: '30600020913',
      formattedCuit: '30-60002091-3',
      estado: 'ACTIVO',
      fechaAlta: '2026-02-01',
      cantidadContactos: 1,
      cantidadDirecciones: 3,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearEnvioModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearEnvioModal);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should be created with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
    expect(component.items().length).toBe(1);
    expect(component.totalBultos()).toBe(1);
    expect(component.totalPesoKg()).toBe(10);
    expect(component.totalVolumenM3()).toBe(0);
  });

  it('resets form when modal opens', () => {
    component.clienteId.set('cli-001');
    component.origen.set('CD Norte');
    component.destino.set('Almacén 5');
    component.fechaProgramada.set('2026-10-25T14:00');
    component.observaciones.set('Nota');
    component.touched.set(true);

    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(component.clienteId()).toBe('');
    expect(component.origen()).toBe('');
    expect(component.destino()).toBe('');
    expect(component.fechaProgramada()).toBe('');
    expect(component.observaciones()).toBe('');
    expect(component.touched()).toBe(false);
    expect(component.items().length).toBe(1);
  });

  it('adds and removes items dynamically with minimum 1 item constraint', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(component.items().length).toBe(1);

    component.addItem();
    expect(component.items().length).toBe(2);

    component.addItem();
    expect(component.items().length).toBe(3);

    component.removeItem(1);
    expect(component.items().length).toBe(2);

    component.removeItem(0);
    expect(component.items().length).toBe(1);

    // Should not remove the last remaining item
    component.removeItem(0);
    expect(component.items().length).toBe(1);
  });

  it('updates item fields immutably', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.updateItem(0, 'descripcion', 'Pallet de repuestos');
    component.updateItem(0, 'pesoKg', 25.5);
    component.updateItem(0, 'volumenM3', 1.25);
    component.updateItem(0, 'cantidad', 4);

    const first = component.items()[0];
    expect(first.descripcion).toBe('Pallet de repuestos');
    expect(first.pesoKg).toBe(25.5);
    expect(first.volumenM3).toBe(1.25);
    expect(first.cantidad).toBe(4);
  });

  it('calculates computed totals in real time', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    // Item 1: 4 bultos, 25 kg c/u, 1.2 m3 c/u => 100 kg, 4.8 m3
    component.updateItem(0, 'descripcion', 'Item 1');
    component.updateItem(0, 'pesoKg', 25);
    component.updateItem(0, 'volumenM3', 1.2);
    component.updateItem(0, 'cantidad', 4);

    // Item 2: 2 bultos, 50.5 kg c/u, 0.5 m3 c/u => 101 kg, 1 m3
    component.addItem();
    component.updateItem(1, 'descripcion', 'Item 2');
    component.updateItem(1, 'pesoKg', 50.5);
    component.updateItem(1, 'volumenM3', 0.5);
    component.updateItem(1, 'cantidad', 2);

    expect(component.totalBultos()).toBe(6);
    expect(component.totalPesoKg()).toBe(201);
    expect(component.totalVolumenM3()).toBe(5.8);
  });

  it('handles null and optional volume in computed totals safely', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.updateItem(0, 'descripcion', 'Sin volumen');
    component.updateItem(0, 'pesoKg', 15);
    component.updateItem(0, 'volumenM3', null);
    component.updateItem(0, 'cantidad', 3);

    expect(component.totalBultos()).toBe(3);
    expect(component.totalPesoKg()).toBe(45);
    expect(component.totalVolumenM3()).toBe(0);
  });

  it('validates required fields before allowing submission', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(component.isValid()).toBe(false);

    // Submit invalid form
    const submitSpy = vi.fn();
    component.submitEnvio.subscribe(submitSpy);
    component.onSubmit();

    expect(component.touched()).toBe(true);
    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.isClienteInvalid()).toBe(true);
    expect(component.isOrigenInvalid()).toBe(true);
    expect(component.isDestinoInvalid()).toBe(true);
    expect(component.isItemDescripcionInvalid(0)).toBe(true);

    // Fill valid values
    component.clienteId.set('cli-001');
    component.origen.set('CD Norte');
    component.destino.set('Almacén Central');
    component.updateItem(0, 'descripcion', 'Carga general');
    component.updateItem(0, 'pesoKg', 12);
    component.updateItem(0, 'cantidad', 1);

    expect(component.isValid()).toBe(true);
    expect(component.isClienteInvalid()).toBe(false);
    expect(component.isOrigenInvalid()).toBe(false);
    expect(component.isDestinoInvalid()).toBe(false);
    expect(component.isItemDescripcionInvalid(0)).toBe(false);
    expect(component.isItemPesoInvalid(0)).toBe(false);
    expect(component.isItemCantidadInvalid(0)).toBe(false);
  });

  it('emits submitEnvio with properly formatted payload on valid submit', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.clienteId.set('cli-001');
    component.origen.set(' CD Norte ');
    component.destino.set(' Almacén Central ');
    component.fechaProgramada.set('2026-10-25T14:00');
    component.observaciones.set(' Manipular con cuidado ');

    component.updateItem(0, 'descripcion', ' Cajas de cristal ');
    component.updateItem(0, 'pesoKg', 15.5);
    component.updateItem(0, 'volumenM3', 0.8);
    component.updateItem(0, 'cantidad', 2);

    let emitted: CrearEnvioRequest | null = null;
    component.submitEnvio.subscribe((val) => {
      emitted = val;
    });

    component.onSubmit();

    expect(emitted).not.toBeNull();
    expect(emitted!.clienteId).toBe('cli-001');
    expect(emitted!.origen).toBe('CD Norte');
    expect(emitted!.destino).toBe('Almacén Central');
    expect(emitted!.observaciones).toBe('Manipular con cuidado');
    expect(new Date(emitted!.fechaProgramada!).toISOString()).toBe(
      new Date('2026-10-25T14:00').toISOString(),
    );
    expect(emitted!.items).toEqual([
      {
        descripcion: 'Cajas de cristal',
        pesoKg: 15.5,
        volumenM3: 0.8,
        cantidad: 2,
      },
    ]);
  });

  it('handles null optional fields properly on valid submit', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    component.clienteId.set('cli-002');
    component.origen.set('Puerto Bs As');
    component.destino.set('Rosario');
    component.fechaProgramada.set('');
    component.observaciones.set('');

    component.updateItem(0, 'descripcion', 'Bobinas');
    component.updateItem(0, 'pesoKg', 80);
    component.updateItem(0, 'volumenM3', null);
    component.updateItem(0, 'cantidad', 1);

    let emitted: CrearEnvioRequest | null = null;
    component.submitEnvio.subscribe((val) => {
      emitted = val;
    });

    component.onSubmit();

    expect(emitted).not.toBeNull();
    expect(emitted!.fechaProgramada).toBeNull();
    expect(emitted!.observaciones).toBeNull();
    expect(emitted!.items[0].volumenM3).toBeNull();
  });

  it('emits close on cancel or backdrop click unless isSubmitting is true', () => {
    componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    component.onCancel();
    expect(closeSpy).toHaveBeenCalledTimes(1);

    const backdropTarget = {
      target: 'backdrop',
      currentTarget: 'backdrop',
    } as unknown as MouseEvent;
    component.onBackdropClick(backdropTarget);
    expect(closeSpy).toHaveBeenCalledTimes(2);

    // Clicking inside modal dialog
    const innerTarget = { target: 'inner', currentTarget: 'backdrop' } as unknown as MouseEvent;
    component.onBackdropClick(innerTarget);
    expect(closeSpy).toHaveBeenCalledTimes(2);

    // When isSubmitting is true, should not close
    componentRef.setInput('isSubmitting', true);
    fixture.detectChanges();

    component.onCancel();
    component.onBackdropClick(backdropTarget);
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it('renders client select options and error banner in the DOM', () => {
    componentRef.setInput('isOpen', true);
    componentRef.setInput('clientes', mockClientes);
    componentRef.setInput('errorMessage', 'No se pudo crear el envío en el servidor.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('.alert-error');
    expect(alert?.textContent).toContain('No se pudo crear el envío en el servidor.');

    const select = compiled.querySelector('#envio-cliente') as HTMLSelectElement;
    expect(select).toBeTruthy();
    const options = select.querySelectorAll('option');
    // 1 default disabled option + 2 client options
    expect(options.length).toBe(3);
    expect(options[1].textContent).toContain('Distribuidora Pampeana S.A.');
    expect(options[2].textContent).toContain('Logística Andina');
  });
});
