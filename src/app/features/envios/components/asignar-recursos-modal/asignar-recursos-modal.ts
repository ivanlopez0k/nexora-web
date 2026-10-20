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
import type { Vehiculo } from '../../../vehiculos/models/vehiculo.models';
import type { Chofer } from '../../../choferes/models/chofer.models';
import type { AsignarRecursosEnvioRequest, EnvioListItem } from '../../models/envio.models';

@Component({
  selector: 'app-asignar-recursos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asignar-recursos-modal.html',
  styleUrl: './asignar-recursos-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignarRecursosModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly envio = input<EnvioListItem | null>(null);
  readonly vehiculos = input<Vehiculo[]>([]);
  readonly choferes = input<Chofer[]>([]);

  readonly close = output<void>();
  readonly submitAsignacion = output<AsignarRecursosEnvioRequest>();

  readonly vehiculoId = signal<string>('');
  readonly choferId = signal<string>('');
  readonly motivo = signal<string>('');
  readonly touched = signal<boolean>(false);

  readonly selectedVehiculo = computed(
    () => this.vehiculos().find((v) => v.id === this.vehiculoId()) ?? null,
  );

  readonly selectedChofer = computed(
    () => this.choferes().find((c) => c.id === this.choferId()) ?? null,
  );

  readonly envioPeso = computed(() => this.envio()?.pesoTotalKg ?? 0);

  readonly vehiculoCapacidad = computed(() => this.selectedVehiculo()?.capacidad ?? 0);

  readonly porcentajeOcupacion = computed(() => {
    const cap = this.vehiculoCapacidad();
    if (!cap || cap <= 0) return 0;
    return Math.round((this.envioPeso() / cap) * 100);
  });

  readonly superaCapacidad = computed(
    () => this.vehiculoCapacidad() > 0 && this.envioPeso() > this.vehiculoCapacidad(),
  );

  readonly choferHabilitado = computed(() => {
    const v = this.selectedVehiculo();
    const c = this.selectedChofer();
    if (!v || !c) return true;
    if (!c.habilitaciones || c.habilitaciones.length === 0) return false;
    return c.habilitaciones.some((h) => h.toLowerCase() === v.tipo.toLowerCase());
  });

  readonly isVehiculoInvalid = computed(() => this.touched() && !this.vehiculoId());

  readonly isChoferInvalid = computed(() => this.touched() && !this.choferId());

  readonly canSubmit = computed(() => {
    return (
      !!this.vehiculoId() &&
      !!this.choferId() &&
      !this.superaCapacidad() &&
      !this.isSubmitting()
    );
  });

  readonly progressWidth = computed(() => Math.min(this.porcentajeOcupacion(), 100));

  readonly progressColorClass = computed(() => {
    const pct = this.porcentajeOcupacion();
    if (pct <= 75) return 'progress-green';
    if (pct <= 100) return 'progress-amber';
    return 'progress-red';
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    const current = this.envio();
    this.vehiculoId.set(current?.vehiculoId ?? '');
    this.choferId.set(current?.choferId ?? '');
    this.motivo.set('');
    this.touched.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isSubmitting()) {
      this.close.emit();
    }
  }

  onCancel(): void {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  }

  onSubmit(): void {
    this.touched.set(true);
    if (!this.canSubmit()) return;

    this.submitAsignacion.emit({
      vehiculoId: this.vehiculoId(),
      choferId: this.choferId(),
      motivo: this.motivo().trim() || null,
    });
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }
}
