import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnvioService } from './services/envio.service';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import { WRITE_PERMISSION_MAP, hasAnyRole } from '../../shared/auth/permissions';
import {
  ESTADOS_ENVIO_CONFIG,
  EstadoConfig,
  EstadoEnvio,
  EnvioListItem,
  EnviosMetricas,
  PagedResult,
} from './models/envio.models';

@Component({
  selector: 'app-envios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './envios.html',
  styleUrl: './envios.css',
})
export class Envios implements OnInit {
  private readonly envioService = inject(EnvioService);
  private readonly tokenService = inject(AuthTokenService);

  readonly envios = signal<EnvioListItem[]>([]);
  readonly metricas = signal<EnviosMetricas | null>(null);
  readonly loading = signal<boolean>(false);
  readonly loadingMetricas = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filters & Pagination
  readonly search = signal<string>('');
  readonly estadoFilter = signal<string>('');
  readonly fechaDesde = signal<string>('');
  readonly fechaHasta = signal<string>('');

  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly totalCount = signal<number>(0);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  readonly estadosOptions: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'Solicitado', label: 'Solicitado' },
    { value: 'PendienteAprobacion', label: 'Pendiente Aprobación' },
    { value: 'Preparando', label: 'Preparando' },
    { value: 'ListoParaDespacho', label: 'Listo para Despacho' },
    { value: 'Asignado', label: 'Asignado' },
    { value: 'EnTransito', label: 'En Tránsito' },
    { value: 'Entregado', label: 'Entregado' },
    { value: 'ConIncidencia', label: 'Con Incidencia' },
    { value: 'Cancelado', label: 'Cancelado' },
  ];

  canManage(): boolean {
    return hasAnyRole(this.tokenService.getRoles(), WRITE_PERMISSION_MAP.envios);
  }

  ngOnInit(): void {
    this.loadMetricas();
    this.loadEnvios();
  }

  loadMetricas(): void {
    this.loadingMetricas.set(true);
    this.envioService.getMetricas().subscribe({
      next: (res) => {
        this.metricas.set(res);
        this.loadingMetricas.set(false);
      },
      error: () => {
        this.loadingMetricas.set(false);
      },
    });
  }

  loadEnvios(): void {
    this.loading.set(true);
    this.error.set(null);

    this.envioService
      .getEnvios({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search().trim() || undefined,
        estado: this.estadoFilter() || undefined,
        fechaDesde: this.fechaDesde() || undefined,
        fechaHasta: this.fechaHasta() || undefined,
      })
      .subscribe({
        next: (result: PagedResult<EnvioListItem>) => {
          this.envios.set(result.items);
          this.totalCount.set(result.totalCount);
          this.totalPages.set(result.totalPages);
          this.hasPreviousPage.set(result.hasPreviousPage);
          this.hasNextPage.set(result.hasNextPage);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los envíos. Intenta nuevamente.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.loadEnvios();
  }

  onEstadoFilterChange(estado: string): void {
    this.estadoFilter.set(estado);
    this.page.set(1);
    this.loadEnvios();
  }

  onFechaDesdeChange(fecha: string): void {
    this.fechaDesde.set(fecha);
    this.page.set(1);
    this.loadEnvios();
  }

  onFechaHastaChange(fecha: string): void {
    this.fechaHasta.set(fecha);
    this.page.set(1);
    this.loadEnvios();
  }

  clearFilters(): void {
    this.search.set('');
    this.estadoFilter.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.page.set(1);
    this.loadEnvios();
  }

  onPrevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadEnvios();
    }
  }

  onNextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadEnvios();
    }
  }

  getEstadoConfig(estado: EstadoEnvio | string): EstadoConfig {
    if (estado in ESTADOS_ENVIO_CONFIG) {
      return ESTADOS_ENVIO_CONFIG[estado as EstadoEnvio];
    }
    return {
      label: estado,
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
      });
    } catch {
      return dateString;
    }
  }
}
