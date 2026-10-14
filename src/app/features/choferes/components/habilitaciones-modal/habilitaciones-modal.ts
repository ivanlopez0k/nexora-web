import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TIPOS_VEHICULO, type Chofer, type ActualizarHabilitacionesRequest } from '../../models/chofer.models';

@Component({
  selector: 'app-habilitaciones-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './habilitaciones-modal.html',
  styleUrl: './habilitaciones-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabilitacionesModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly chofer = input<Chofer | null>(null);

  readonly close = output<void>();
  readonly save = output<ActualizarHabilitacionesRequest>();

  readonly tiposVehiculo = TIPOS_VEHICULO;
  readonly selectedHabilitaciones = signal<string[]>([]);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const c = this.chofer();
        this.selectedHabilitaciones.set(c ? [...c.habilitaciones] : []);
      }
    });
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
    this.save.emit({
      tiposVehiculo: this.selectedHabilitaciones(),
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
