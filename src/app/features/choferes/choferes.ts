import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoferService } from './services/chofer.service';
import { CentroLogisticoService } from '../centros-logisticos/services/centro-logistico.service';
import { EmpleadoService } from '../empleados/services/empleado.service';
import { CrearChoferModal } from './components/crear-chofer-modal/crear-chofer-modal';
import { EditarChoferModal } from './components/editar-chofer-modal/editar-chofer-modal';
import { HabilitacionesModal } from './components/habilitaciones-modal/habilitaciones-modal';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import { WRITE_PERMISSION_MAP, hasAnyRole } from '../../shared/auth/permissions';
import type {
  Chofer,
  CrearChoferRequest,
  ActualizarChoferRequest,
  ActualizarHabilitacionesRequest,
  PagedResult,
} from './models/chofer.models';
import type { CentroLogistico } from '../centros-logisticos/models/centro-logistico.models';
import type { Empleado } from '../empleados/models/empleado.models';

@Component({
  selector: 'app-choferes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CrearChoferModal,
    EditarChoferModal,
    HabilitacionesModal,
  ],
  templateUrl: './choferes.html',
  styleUrl: './choferes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Choferes implements OnInit {
  private readonly service = inject(ChoferService);
  private readonly centroService = inject(CentroLogisticoService);
  private readonly empleadoService = inject(EmpleadoService);
  private readonly tokenService = inject(AuthTokenService);

  readonly choferes = signal<Chofer[]>([]);
  readonly centros = signal<CentroLogistico[]>([]);
  readonly empleadosCandidatos = signal<Empleado[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filters & pagination
  readonly centroFilter = signal<string>('');
  readonly estadoFilter = signal<string>('');
  readonly vencerEnDiasFilter = signal<number | null>(null);
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly totalCount = signal<number>(0);

  // Modals state
  readonly createModalOpen = signal<boolean>(false);
  readonly createSubmitting = signal<boolean>(false);
  readonly createError = signal<string | null>(null);

  readonly editModalOpen = signal<boolean>(false);
  readonly editSubmitting = signal<boolean>(false);
  readonly editError = signal<string | null>(null);
  readonly selectedChofer = signal<Chofer | null>(null);

  readonly habModalOpen = signal<boolean>(false);
  readonly habSubmitting = signal<boolean>(false);
  readonly habError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCentros();
    this.loadChoferes();
  }

  canManage(): boolean {
    return hasAnyRole(this.tokenService.getRoles(), WRITE_PERMISSION_MAP.choferes);
  }

  loadCentros(): void {
    this.centroService.getCentros({ soloActivos: true, pageSize: 100 }).subscribe({
      next: (res) => {
        this.centros.set(res.items);
      },
      error: () => {
        // Soft failure: keeps list empty without failing page
      },
    });
  }

  loadEmpleadosCandidatos(): void {
    this.empleadoService.getEmpleados({ estado: 'ACTIVO', pageSize: 100 }).subscribe({
      next: (res) => {
        this.empleadosCandidatos.set(res.items.filter((e) => !e.esChofer));
      },
      error: () => {
        // Soft failure
      },
    });
  }

  loadChoferes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getChoferes({
        page: this.page(),
        pageSize: this.pageSize(),
        centroLogisticoId: this.centroFilter() || undefined,
        estado: this.estadoFilter() || undefined,
        vencerEnDias: this.vencerEnDiasFilter() ?? undefined,
      })
      .subscribe({
        next: (result: PagedResult<Chofer>) => {
          this.choferes.set(result.items);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los choferes. Intenta nuevamente.');
        },
      });
  }

  onCentroFilterChange(value: string): void {
    this.centroFilter.set(value);
    this.page.set(1);
    this.loadChoferes();
  }

  onEstadoFilterChange(value: string): void {
    this.estadoFilter.set(value);
    this.page.set(1);
    this.loadChoferes();
  }

  onVencimientoFilterChange(value: string): void {
    const days = value ? parseInt(value, 10) : null;
    this.vencerEnDiasFilter.set(days);
    this.page.set(1);
    this.loadChoferes();
  }

  onPrevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadChoferes();
    }
  }

  onNextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadChoferes();
    }
  }

  getLicenseStatus(vencimiento: string): { status: 'expired' | 'warning' | 'valid'; label: string } {
    if (!vencimiento) return { status: 'valid', label: 'Vigente' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = vencimiento.split('-');
    if (parts.length < 3) return { status: 'valid', label: 'Vigente' };

    const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: 'Vencida' };
    }
    if (diffDays <= 30) {
      return { status: 'warning', label: `Vence en ${diffDays}d` };
    }
    return { status: 'valid', label: 'Vigente' };
  }

  openCreateModal(): void {
    this.loadEmpleadosCandidatos();
    this.createError.set(null);
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
    this.createError.set(null);
  }

  onCreateSave(payload: CrearChoferRequest): void {
    this.createSubmitting.set(true);
    this.createError.set(null);

    this.service.create(payload).subscribe({
      next: () => {
        this.createSubmitting.set(false);
        this.closeCreateModal();
        this.loadChoferes();
      },
      error: (err: { error?: { detail?: string }; status?: number }) => {
        this.createSubmitting.set(false);
        if (err?.status === 409) {
          this.createError.set(err?.error?.detail || 'Ya existe un chofer con esa licencia o empleado.');
        } else {
          this.createError.set(err?.error?.detail || 'Ocurrió un error al registrar el chofer.');
        }
      },
    });
  }

  openEditModal(chofer: Chofer): void {
    this.selectedChofer.set(chofer);
    this.editError.set(null);
    this.editModalOpen.set(true);
  }

  closeEditModal(): void {
    this.editModalOpen.set(false);
    this.selectedChofer.set(null);
    this.editError.set(null);
  }

  onEditSave(payload: ActualizarChoferRequest): void {
    const chofer = this.selectedChofer();
    if (!chofer) return;

    this.editSubmitting.set(true);
    this.editError.set(null);

    this.service.update(chofer.id, payload).subscribe({
      next: () => {
        this.editSubmitting.set(false);
        this.closeEditModal();
        this.loadChoferes();
      },
      error: (err: { error?: { detail?: string }; status?: number }) => {
        this.editSubmitting.set(false);
        if (err?.status === 409) {
          this.editError.set(err?.error?.detail || 'Ya existe otro chofer registrado con esa licencia.');
        } else {
          this.editError.set(err?.error?.detail || 'Ocurrió un error al actualizar el chofer.');
        }
      },
    });
  }

  openHabilitacionesModal(chofer: Chofer): void {
    this.selectedChofer.set(chofer);
    this.habError.set(null);
    this.habModalOpen.set(true);
  }

  closeHabilitacionesModal(): void {
    this.habModalOpen.set(false);
    this.selectedChofer.set(null);
    this.habError.set(null);
  }

  onHabilitacionesSave(payload: ActualizarHabilitacionesRequest): void {
    const chofer = this.selectedChofer();
    if (!chofer) return;

    this.habSubmitting.set(true);
    this.habError.set(null);

    this.service.updateHabilitaciones(chofer.id, payload).subscribe({
      next: () => {
        this.habSubmitting.set(false);
        this.closeHabilitacionesModal();
        this.loadChoferes();
      },
      error: (err: { error?: { detail?: string } }) => {
        this.habSubmitting.set(false);
        this.habError.set(err?.error?.detail || 'Error al actualizar las habilitaciones del chofer.');
      },
    });
  }

  onDeactivate(chofer: Chofer): void {
    if (confirm(`¿Estás seguro de desactivar al chofer "${chofer.empleadoNombre}"?`)) {
      this.error.set(null);
      this.service.delete(chofer.id).subscribe({
        next: () => {
          this.loadChoferes();
        },
        error: (err: { error?: { detail?: string } }) => {
          this.error.set(err?.error?.detail || 'No se pudo desactivar el chofer.');
        },
      });
    }
  }
}
