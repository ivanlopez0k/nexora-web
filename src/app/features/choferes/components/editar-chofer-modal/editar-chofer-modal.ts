import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Chofer, ActualizarChoferRequest } from '../../models/chofer.models';
import type { CentroLogistico } from '../../../centros-logisticos/models/centro-logistico.models';

@Component({
  selector: 'app-editar-chofer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-chofer-modal.html',
  styleUrl: './editar-chofer-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarChoferModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly chofer = input<Chofer | null>(null);
  readonly centros = input<CentroLogistico[]>([]);

  readonly close = output<void>();
  readonly save = output<ActualizarChoferRequest>();

  readonly centroLogisticoId = signal<string>('');
  readonly numeroLicencia = signal<string>('');
  readonly vencimientoLicencia = signal<string>('');
  readonly touched = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const c = this.chofer();
        if (c) {
          this.centroLogisticoId.set(c.centroLogisticoId);
          this.numeroLicencia.set(c.numeroLicencia);
          this.vencimientoLicencia.set(c.vencimientoLicencia);
        } else {
          this.centroLogisticoId.set('');
          this.numeroLicencia.set('');
          this.vencimientoLicencia.set('');
        }
        this.touched.set(false);
      }
    });
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

  onSubmit(): void {
    this.touched.set(true);

    if (
      this.isCentroInvalid() ||
      this.isNumeroLicenciaInvalid() ||
      this.isVencimientoInvalid()
    ) {
      return;
    }

    this.save.emit({
      centroLogisticoId: this.centroLogisticoId(),
      numeroLicencia: this.numeroLicencia().trim(),
      vencimientoLicencia: this.vencimientoLicencia(),
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
