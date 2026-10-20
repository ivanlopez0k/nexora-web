import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { EnvioService } from '../../services/envio.service';
import {
  ESTADOS_ENVIO_CONFIG,
  EstadoConfig,
  EstadoEnvio,
  EnvioHistorialEstadoResponse,
  EnvioIncidenciaResponse,
  EnvioItemResponse,
  EnvioResponse,
} from '../../models/envio.models';

@Component({
  selector: 'app-detalle-envio-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-envio-modal.html',
  styleUrl: './detalle-envio-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleEnvioModal {
  private readonly envioService = inject(EnvioService);

  readonly isOpen = input<boolean>(false);
  readonly envioId = input<string | null>(null);
  readonly close = output<void>();

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly envio = signal<EnvioResponse | null>(null);
  readonly historial = signal<EnvioHistorialEstadoResponse[]>([]);

  readonly items = computed<EnvioItemResponse[]>(() => this.envio()?.items ?? []);

  readonly incidencias = computed<EnvioIncidenciaResponse[]>(() => this.envio()?.incidencias ?? []);

  readonly totalBultos = computed<number>(() => {
    const list = this.items();
    if (list.length > 0) {
      return list.reduce((acc, it) => acc + (it.cantidad || 0), 0);
    }
    return this.envio()?.cantidadItems ?? 0;
  });

  readonly totalPesoKg = computed<number>(() => {
    const list = this.items();
    if (list.length > 0) {
      const sum = list.reduce((acc, it) => acc + (it.pesoTotalKg ?? it.pesoKg * it.cantidad), 0);
      return Math.round(sum * 100) / 100;
    }
    return this.envio()?.pesoTotalKg ?? 0;
  });

  readonly totalVolumenM3 = computed<number>(() => {
    const list = this.items();
    if (list.length > 0) {
      const sum = list.reduce(
        (acc, it) => acc + (it.volumenTotalM3 ?? (it.volumenM3 || 0) * it.cantidad),
        0,
      );
      return Math.round(sum * 1000) / 1000;
    }
    return this.envio()?.volumenTotalM3 ?? 0;
  });

  readonly sortedHistorial = computed<EnvioHistorialEstadoResponse[]>(() => {
    const list = [...this.historial()];
    return list.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const id = this.envioId();
      if (open && id) {
        this.loadData(id);
      } else if (!open) {
        this.envio.set(null);
        this.historial.set([]);
        this.error.set(null);
        this.loading.set(false);
      }
    });
  }

  loadData(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      envio: this.envioService.getEnvioById(id),
      historial: this.envioService.getHistorial(id),
    }).subscribe({
      next: ({ envio, historial }) => {
        this.envio.set(envio);
        const resolvedHistorial =
          historial && historial.length > 0 ? historial : (envio.historial ?? []);
        this.historial.set(resolvedHistorial);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err?.error?.message ||
          err?.message ||
          'No se pudo cargar la información del envío. Intente nuevamente.';
        this.error.set(msg);
      },
    });
  }

  retry(): void {
    const id = this.envioId();
    if (id) {
      this.loadData(id);
    }
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEscape(event?: Event): void {
    if (this.isOpen()) {
      event?.preventDefault();
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  getEstadoConfig(estado?: string | null): EstadoConfig {
    if (estado && estado in ESTADOS_ENVIO_CONFIG) {
      return ESTADOS_ENVIO_CONFIG[estado as EstadoEnvio];
    }
    return {
      label: estado || 'Desconocido',
      badgeClass: 'badge-desconocido',
      color: '#94a3b8',
    };
  }

  getEstadoLabel(estado?: string | null): string {
    return this.getEstadoConfig(estado).label;
  }

  getEstadoColor(estado?: string | null): string {
    return this.getEstadoConfig(estado).color;
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

  formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  getSeveridadBadgeClass(severidad?: string | null): string {
    const s = (severidad || '').toLowerCase();
    if (s.includes('critica') || s.includes('crítica')) return 'badge-severidad-critica';
    if (s.includes('alta')) return 'badge-severidad-alta';
    if (s.includes('media')) return 'badge-severidad-media';
    return 'badge-severidad-baja';
  }
}
