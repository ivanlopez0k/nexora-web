import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TIPOS_VEHICULO, type CrearChoferRequest } from '../../models/chofer.models';
import type { Empleado } from '../../../empleados/models/empleado.models';
import type { CentroLogistico } from '../../../centros-logisticos/models/centro-logistico.models';

@Component({
  selector: 'app-crear-chofer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-chofer-modal.html',
  styleUrl: './crear-chofer-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearChoferModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly empleados = input<Empleado[]>([]);
  readonly centros = input<CentroLogistico[]>([]);

  readonly close = output<void>();
  readonly save = output<CrearChoferRequest>();

  readonly tiposVehiculo = TIPOS_VEHICULO;

  readonly empleadoId = signal<string>('');
  readonly centroLogisticoId = signal<string>('');
  readonly numeroLicencia = signal<string>('');
  readonly vencimientoLicencia = signal<string>('');
  readonly selectedHabilitaciones = signal<string[]>([]);
  readonly touched = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.empleadoId.set('');
        this.centroLogisticoId.set(this.centros().length > 0 ? this.centros()[0].id : '');
        this.numeroLicencia.set('');
        this.vencimientoLicencia.set('');
        this.selectedHabilitaciones.set([]);
        this.touched.set(false);
      }
    });
  }

  isEmpleadoInvalid(): boolean {
    return this.touched() && !this.empleadoId();
  }

  isCentroInvalid(): boolean {
    return this.touched() && !this.centroLogisticoId();
  }

  isNumeroLicenciaInvalid(): boolean {
    const raw = this.numeroLicencia().trim();
    return this.touched() && (!raw || raw.length > 50);
  }

  isVencimientoInvalid(): boolean {
    return this.touched() && !this.vencimientoLicencia();
  }

  isHabilitacionSelected(tipo: string): boolean {
    return this.selectedHabilitaciones().includes(tipo);
  }

  toggleHabilitacion(tipo: string): void {
    const current = this.selectedHabilitaciones();
    if (current.includes(tipo)) {
      this.selectedHabilitaciones.set(current.filter((t) => t !== tipo));
    } else {
      this.selectedHabilitaciones.set([...current, tipo]);
    }
  }

  onSubmit(): void {
    this.touched.set(true);

    if (
      this.isEmpleadoInvalid() ||
      this.isCentroInvalid() ||
      this.isNumeroLicenciaInvalid() ||
      this.isVencimientoInvalid()
    ) {
      return;
    }

    this.save.emit({
      empleadoId: this.empleadoId(),
      centroLogisticoId: this.centroLogisticoId(),
      numeroLicencia: this.numeroLicencia().trim(),
      vencimientoLicencia: this.vencimientoLicencia(),
      habilitaciones: this.selectedHabilitaciones(),
    });
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
