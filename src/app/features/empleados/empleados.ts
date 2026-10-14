import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from './services/empleado.service';
import { EmpleadoModal } from './components/empleado-modal/empleado-modal';
import { AsociarUsuarioModal } from './components/asociar-usuario-modal/asociar-usuario-modal';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import { WRITE_PERMISSION_MAP, hasAnyRole } from '../../shared/auth/permissions';
import type {
  Empleado,
  PagedResult,
} from './models/empleado.models';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule, EmpleadoModal, AsociarUsuarioModal],
  templateUrl: './empleados.html',
  styleUrl: './empleados.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Empleados implements OnInit {
  private readonly service = inject(EmpleadoService);
  private readonly tokenService = inject(AuthTokenService);

  readonly empleados = signal<Empleado[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filters & pagination
  readonly searchNombre = signal<string>('');
  readonly searchLegajo = signal<string>('');
  readonly estadoFilter = signal<string>('');
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly totalCount = signal<number>(0);

  // Create / Edit modal state
  readonly modalOpen = signal<boolean>(false);
  readonly modalSubmitting = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);
  readonly selectedEmpleado = signal<Empleado | null>(null);

  // Link user modal state
  readonly asociarModalOpen = signal<boolean>(false);
  readonly asociarSubmitting = signal<boolean>(false);
  readonly asociarError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadEmpleados();
  }

  canManage(): boolean {
    return hasAnyRole(this.tokenService.getRoles(), WRITE_PERMISSION_MAP.empleados);
  }

  loadEmpleados(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getEmpleados({
        page: this.page(),
        pageSize: this.pageSize(),
        nombre: this.searchNombre() || undefined,
        legajo: this.searchLegajo() || undefined,
        estado: this.estadoFilter() || undefined,
      })
      .subscribe({
        next: (result: PagedResult<Empleado>) => {
          this.empleados.set(result.items);
          this.totalPages.set(result.totalPages);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los empleados. Intenta nuevamente.');
        },
      });
  }

  onSearchNombreChange(value: string): void {
    this.searchNombre.set(value);
    this.page.set(1);
    this.loadEmpleados();
  }

  onSearchLegajoChange(value: string): void {
    this.searchLegajo.set(value);
    this.page.set(1);
    this.loadEmpleados();
  }

  onEstadoChange(estado: string): void {
    this.estadoFilter.set(estado);
    this.page.set(1);
    this.loadEmpleados();
  }

  onPrevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadEmpleados();
    }
  }

  onNextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadEmpleados();
    }
  }

  openCreateModal(): void {
    this.selectedEmpleado.set(null);
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  openEditModal(empleado: Empleado): void {
    this.selectedEmpleado.set(empleado);
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedEmpleado.set(null);
    this.modalError.set(null);
  }

  onModalSave(payload: { nombre: string; legajo: string }): void {
    this.modalSubmitting.set(true);
    this.modalError.set(null);

    const emp = this.selectedEmpleado();
    const request$ = emp
      ? this.service.update(emp.id, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => {
        this.modalSubmitting.set(false);
        this.closeModal();
        this.loadEmpleados();
      },
      error: (err: { error?: { detail?: string }; status?: number }) => {
        this.modalSubmitting.set(false);
        if (err?.status === 409) {
          this.modalError.set(err?.error?.detail || 'Ya existe un empleado registrado con ese legajo.');
        } else {
          this.modalError.set(err?.error?.detail || 'Ocurrió un error al procesar el empleado.');
        }
      },
    });
  }

  openAsociarModal(empleado: Empleado): void {
    this.selectedEmpleado.set(empleado);
    this.asociarError.set(null);
    this.asociarModalOpen.set(true);
  }

  closeAsociarModal(): void {
    this.asociarModalOpen.set(false);
    this.selectedEmpleado.set(null);
    this.asociarError.set(null);
  }

  onAsociarSave(payload: { usuarioId: string }): void {
    const emp = this.selectedEmpleado();
    if (!emp) return;

    this.asociarSubmitting.set(true);
    this.asociarError.set(null);

    this.service.asociarUsuario(emp.id, payload).subscribe({
      next: () => {
        this.asociarSubmitting.set(false);
        this.closeAsociarModal();
        this.loadEmpleados();
      },
      error: (err: { error?: { detail?: string }; status?: number }) => {
        this.asociarSubmitting.set(false);
        if (err?.status === 409) {
          this.asociarError.set(err?.error?.detail || 'El usuario ya se encuentra vinculado a otro empleado.');
        } else {
          this.asociarError.set(err?.error?.detail || 'Ocurrió un error al vincular el usuario.');
        }
      },
    });
  }

  onDeactivate(empleado: Empleado): void {
    if (confirm(`¿Estás seguro de desactivar al empleado "${empleado.nombre}"?`)) {
      this.error.set(null);
      this.service.delete(empleado.id).subscribe({
        next: () => {
          this.loadEmpleados();
        },
        error: (err: { error?: { detail?: string }; status?: number }) => {
          if (err?.status === 409) {
            this.error.set(
              err?.error?.detail || 'No se puede desactivar el empleado porque está asignado como chofer activo.',
            );
          } else {
            this.error.set(err?.error?.detail || 'No se pudo desactivar el empleado.');
          }
        },
      });
    }
  }
}
