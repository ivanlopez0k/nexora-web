import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Cliente } from '../../../clientes/models/cliente.models';
import type { CrearEnvioItemFormModel, CrearEnvioRequest } from '../../models/envio.models';

@Component({
  selector: 'app-crear-envio-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-envio-modal.html',
  styleUrl: './crear-envio-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearEnvioModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly clientes = input<Cliente[]>([]);

  readonly close = output<void>();
  readonly submitEnvio = output<CrearEnvioRequest>();

  readonly clienteId = signal<string>('');
  readonly origen = signal<string>('');
  readonly destino = signal<string>('');
  readonly fechaProgramada = signal<string>('');
  readonly observaciones = signal<string>('');
  readonly touched = signal<boolean>(false);

  readonly items = signal<CrearEnvioItemFormModel[]>([
    { descripcion: '', pesoKg: 10, volumenM3: null, cantidad: 1 },
  ]);

  readonly totalBultos = computed(() =>
    this.items().reduce((acc, it) => acc + (Math.max(0, Math.floor(Number(it.cantidad))) || 0), 0),
  );

  readonly totalPesoKg = computed(() => {
    const sum = this.items().reduce((acc, it) => {
      const p = Number(it.pesoKg);
      const q = Number(it.cantidad);
      return acc + (!isNaN(p) && !isNaN(q) && p > 0 && q > 0 ? p * q : 0);
    }, 0);
    return Math.round(sum * 100) / 100;
  });

  readonly totalVolumenM3 = computed(() => {
    const sum = this.items().reduce((acc, it) => {
      const v =
        it.volumenM3 !== null && it.volumenM3 !== ('' as unknown) ? Number(it.volumenM3) : 0;
      const q = Number(it.cantidad);
      return acc + (!isNaN(v) && !isNaN(q) && v > 0 && q > 0 ? v * q : 0);
    }, 0);
    return Math.round(sum * 1000) / 1000;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.clienteId.set('');
    this.origen.set('');
    this.destino.set('');
    this.fechaProgramada.set('');
    this.observaciones.set('');
    this.items.set([{ descripcion: '', pesoKg: 10, volumenM3: null, cantidad: 1 }]);
    this.touched.set(false);
  }

  addItem(): void {
    this.items.update((current) => [
      ...current,
      { descripcion: '', pesoKg: 10, volumenM3: null, cantidad: 1 },
    ]);
  }

  removeItem(index: number): void {
    if (this.items().length > 1) {
      this.items.update((current) => current.filter((_, i) => i !== index));
    }
  }

  updateItem<K extends keyof CrearEnvioItemFormModel>(
    index: number,
    field: K,
    value: CrearEnvioItemFormModel[K],
  ): void {
    this.items.update((current) => {
      const updated = [...current];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  }

  isClienteInvalid(): boolean {
    return this.touched() && !this.clienteId().trim();
  }

  isOrigenInvalid(): boolean {
    return this.touched() && !this.origen().trim();
  }

  isDestinoInvalid(): boolean {
    return this.touched() && !this.destino().trim();
  }

  isItemDescripcionInvalid(index: number): boolean {
    const item = this.items()[index];
    return this.touched() && (!item || !item.descripcion?.trim());
  }

  isItemPesoInvalid(index: number): boolean {
    const item = this.items()[index];
    if (!item) return false;
    const p = Number(item.pesoKg);
    return (
      this.touched() &&
      (item.pesoKg === null || item.pesoKg === ('' as unknown) || isNaN(p) || p <= 0)
    );
  }

  isItemCantidadInvalid(index: number): boolean {
    const item = this.items()[index];
    if (!item) return false;
    const q = Number(item.cantidad);
    return (
      this.touched() &&
      (item.cantidad === null || item.cantidad === ('' as unknown) || isNaN(q) || q < 1)
    );
  }

  isItemVolumenInvalid(index: number): boolean {
    const item = this.items()[index];
    if (!item) return false;
    if (
      item.volumenM3 === null ||
      item.volumenM3 === ('' as unknown) ||
      item.volumenM3 === undefined
    ) {
      return false;
    }
    const v = Number(item.volumenM3);
    return this.touched() && (isNaN(v) || v < 0);
  }

  isValid(): boolean {
    if (!this.clienteId().trim()) return false;
    if (!this.origen().trim()) return false;
    if (!this.destino().trim()) return false;
    if (this.items().length === 0) return false;

    return this.items().every((it) => {
      const descValid = Boolean(it.descripcion && it.descripcion.trim().length > 0);
      const pesoValid =
        it.pesoKg !== null &&
        it.pesoKg !== ('' as unknown) &&
        !isNaN(Number(it.pesoKg)) &&
        Number(it.pesoKg) > 0;
      const cantValid =
        it.cantidad !== null &&
        it.cantidad !== ('' as unknown) &&
        !isNaN(Number(it.cantidad)) &&
        Number(it.cantidad) >= 1;
      const volValid =
        it.volumenM3 === null ||
        it.volumenM3 === ('' as unknown) ||
        it.volumenM3 === undefined ||
        (!isNaN(Number(it.volumenM3)) && Number(it.volumenM3) >= 0);

      return descValid && pesoValid && cantValid && volValid;
    });
  }

  onSubmit(): void {
    this.touched.set(true);

    if (!this.isValid()) {
      return;
    }

    let formattedFecha: string | null = null;
    if (this.fechaProgramada().trim()) {
      const parsed = new Date(this.fechaProgramada().trim());
      formattedFecha = !isNaN(parsed.getTime())
        ? parsed.toISOString()
        : this.fechaProgramada().trim();
    }

    const payload: CrearEnvioRequest = {
      clienteId: this.clienteId().trim(),
      origen: this.origen().trim(),
      destino: this.destino().trim(),
      fechaProgramada: formattedFecha,
      observaciones: this.observaciones().trim() || null,
      items: this.items().map((it) => ({
        descripcion: it.descripcion.trim(),
        pesoKg: Number(it.pesoKg),
        volumenM3:
          it.volumenM3 !== null && it.volumenM3 !== ('' as unknown) && it.volumenM3 !== undefined
            ? Number(it.volumenM3)
            : null,
        cantidad: Math.floor(Number(it.cantidad)),
      })),
    };

    this.submitEnvio.emit(payload);
  }

  onCancel(): void {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isSubmitting()) {
      this.close.emit();
    }
  }
}
