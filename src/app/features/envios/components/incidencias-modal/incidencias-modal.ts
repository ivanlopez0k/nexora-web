import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnvioService } from '../../services/envio.service';
import {
  ESTADOS_ENVIO_CONFIG,
  ESTADOS_INCIDENCIA_CONFIG,
  EstadoConfig,
  EstadoEnvio,
  EstadoIncidenciaConfig,
  EnvioIncidenciaResponse,
  EnvioListItem,
  EnvioResponse,
  ReportarIncidenciaRequest,
  ResolverIncidenciaRequest,
  SEVERIDADES_INCIDENCIA,
  TIPOS_INCIDENCIA,
  SeveridadIncidencia,
  TipoIncidencia,
} from '../../models/envio.models';

@Component({
  selector: 'app-incidencias-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidencias-modal.html',
  styleUrl: './incidencias-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenciasModal {
  private readonly envioService = inject(EnvioService);

  // Inputs & Outputs
  readonly isOpen = input<boolean>(false);
  readonly envio = input<EnvioListItem | EnvioResponse | null>(null);
  readonly close = output<void>();
  readonly incidenciaUpdated = output<void>();

  // State Signals
  readonly loading = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly incidencias = signal<EnvioIncidenciaResponse[]>([]);
  readonly activeTab = signal<'lista' | 'reportar'>('lista');

  // Form Fields - Reportar
  readonly tipo = signal<TipoIncidencia>('Mecanica');
  readonly severidad = signal<SeveridadIncidencia>('Media');
  readonly descripcion = signal<string>('');

  // Form Fields - Resolver
  readonly selectedIncidenciaIdForResolve = signal<string | null>(null);
  readonly resolucion = signal<string>('');
  readonly nuevoEstadoEnvio = signal<EstadoEnvio>('EnTransito');

  // Static options
  readonly tiposIncidencia = TIPOS_INCIDENCIA;
  readonly severidadesIncidencia = SEVERIDADES_INCIDENCIA;

  // Computed
  readonly incidenciasAbiertas = computed<EnvioIncidenciaResponse[]>(() =>
    this.incidencias().filter((i) => i.estado === 'Abierta' || i.estado === 'EnProceso'),
  );

  readonly incidenciasResueltas = computed<EnvioIncidenciaResponse[]>(() =>
    this.incidencias().filter((i) => i.estado === 'Resuelta' || i.estado === 'Desestimada'),
  );

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const currentEnvio = this.envio();

      if (open && currentEnvio) {
        this.loadIncidencias(currentEnvio.id);
      } else if (!open) {
        this.resetModal();
      }
    });
  }

  loadIncidencias(envioId: string, forceTabList?: boolean): void {
    this.loading.set(true);
    this.error.set(null);

    this.envioService.getIncidencias(envioId).subscribe({
      next: (items) => {
        this.incidencias.set(items);
        this.loading.set(false);
        if (forceTabList) {
          this.activeTab.set('lista');
        } else if (items.length === 0) {
          this.activeTab.set('reportar');
        } else {
          this.activeTab.set('lista');
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err?.error?.message ||
          err?.message ||
          'No se pudieron cargar las incidencias del envío.';
        this.error.set(msg);
      },
    });
  }

  setTab(tab: 'lista' | 'reportar'): void {
    this.activeTab.set(tab);
    this.error.set(null);
  }

  onSubmitReportar(): void {
    const currentEnvio = this.envio();
    const desc = this.descripcion().trim();
    if (!currentEnvio || !desc || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const request: ReportarIncidenciaRequest = {
      tipo: this.tipo(),
      severidad: this.severidad(),
      descripcion: desc,
    };

    this.envioService.reportarIncidencia(currentEnvio.id, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.descripcion.set('');
        this.tipo.set('Mecanica');
        this.severidad.set('Media');
        this.loadIncidencias(currentEnvio.id, true);
        this.incidenciaUpdated.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg =
          err?.error?.message ||
          err?.message ||
          'No se pudo registrar la incidencia. Intente nuevamente.';
        this.error.set(msg);
      },
    });
  }

  openResolverForm(incidenciaId: string): void {
    this.selectedIncidenciaIdForResolve.set(incidenciaId);
    this.resolucion.set('');
    this.nuevoEstadoEnvio.set('EnTransito');
    this.error.set(null);
  }

  cancelResolverForm(): void {
    this.selectedIncidenciaIdForResolve.set(null);
    this.resolucion.set('');
  }

  onSubmitResolver(incidenciaId: string): void {
    const currentEnvio = this.envio();
    const resText = this.resolucion().trim();
    if (!currentEnvio || !resText || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const request: ResolverIncidenciaRequest = {
      resolucion: resText,
      nuevoEstadoEnvio: this.nuevoEstadoEnvio(),
    };

    this.envioService.resolverIncidencia(currentEnvio.id, incidenciaId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.selectedIncidenciaIdForResolve.set(null);
        this.resolucion.set('');
        this.loadIncidencias(currentEnvio.id, true);
        this.incidenciaUpdated.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg =
          err?.error?.message ||
          err?.message ||
          'No se pudo registrar la resolución de la incidencia.';
        this.error.set(msg);
      },
    });
  }

  getTipoLabel(tipo: string): string {
    const match = this.tiposIncidencia.find((t) => t.value === tipo);
    return match ? match.label : tipo;
  }

  getSeveridadBadgeClass(severidad: string): string {
    const match = this.severidadesIncidencia.find((s) => s.value === severidad);
    return match ? match.badgeClass : 'badge-sev-media';
  }

  getEstadoIncidenciaConfig(estado: string): EstadoIncidenciaConfig {
    if (estado in ESTADOS_INCIDENCIA_CONFIG) {
      return ESTADOS_INCIDENCIA_CONFIG[estado];
    }
    return {
      label: estado,
      badgeClass: 'badge-inc-abierta',
    };
  }

  getEstadoEnvioConfig(estado: EstadoEnvio | string | undefined): EstadoConfig {
    if (estado && estado in ESTADOS_ENVIO_CONFIG) {
      return ESTADOS_ENVIO_CONFIG[estado as EstadoEnvio];
    }
    return {
      label: estado || 'Desconocido',
      badgeClass: 'badge-desconocido',
      color: '#94a3b8',
    };
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
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
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

  private resetModal(): void {
    this.loading.set(false);
    this.submitting.set(false);
    this.error.set(null);
    this.incidencias.set([]);
    this.activeTab.set('lista');
    this.tipo.set('Mecanica');
    this.severidad.set('Media');
    this.descripcion.set('');
    this.selectedIncidenciaIdForResolve.set(null);
    this.resolucion.set('');
    this.nuevoEstadoEnvio.set('EnTransito');
  }
}
