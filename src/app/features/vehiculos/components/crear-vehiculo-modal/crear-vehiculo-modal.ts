import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isValidPatente, formatPatente } from '../../utils/patente-validator';
import type { CrearVehiculoRequest } from '../../models/vehiculo.models';
import type { CentroLogistico } from '../../../centros-logisticos/models/centro-logistico.models';

@Component({
  selector: 'app-crear-vehiculo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-vehiculo-modal.html',
  styleUrl: './crear-vehiculo-modal.css',
})
export class CrearVehiculoModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly centros = input<CentroLogistico[]>([]);

  readonly close = output<void>();
  readonly submitVehiculo = output<CrearVehiculoRequest>();

  readonly patente = signal<string>('');
  readonly marca = signal<string>('');
  readonly modelo = signal<string>('');
  readonly anio = signal<number>(new Date().getFullYear());
  readonly tipo = signal<string>('Camion');
  readonly capacidad = signal<number>(5000);
  readonly kilometraje = signal<number>(0);
  readonly centroLogisticoId = signal<string>('');
  readonly touched = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.patente.set('');
        this.marca.set('');
        this.modelo.set('');
        this.anio.set(new Date().getFullYear());
        this.tipo.set('Camion');
        this.capacidad.set(5000);
        this.kilometraje.set(0);

        const list = this.centros();
        this.centroLogisticoId.set(list.length > 0 ? list[0].id : '');
        this.touched.set(false);
      }
    });
  }

  isPatenteInvalid(): boolean {
    return this.touched() && (!this.patente().trim() || !isValidPatente(this.patente()));
  }

  isMarcaInvalid(): boolean {
    return this.touched() && !this.marca().trim();
  }

  isModeloInvalid(): boolean {
    return this.touched() && !this.modelo().trim();
  }

  isCentroInvalid(): boolean {
    return this.touched() && !this.centroLogisticoId();
  }

  onPatenteBlur(): void {
    const raw = this.patente().trim();
    if (isValidPatente(raw)) {
      this.patente.set(formatPatente(raw));
    }
  }

  onSubmit(): void {
    this.touched.set(true);

    if (
      this.isPatenteInvalid() ||
      this.isMarcaInvalid() ||
      this.isModeloInvalid() ||
      this.isCentroInvalid()
    ) {
      return;
    }

    const payload: CrearVehiculoRequest = {
      patente: this.patente().trim(),
      marca: this.marca().trim(),
      modelo: this.modelo().trim(),
      anio: Number(this.anio()),
      tipo: this.tipo(),
      capacidad: Number(this.capacidad()),
      kilometraje: Number(this.kilometraje()),
      centroLogisticoId: this.centroLogisticoId(),
    };

    this.submitVehiculo.emit(payload);
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
