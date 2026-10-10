import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoService } from './services/vehiculo.service';
import { CentroLogisticoService } from '../centros-logisticos/services/centro-logistico.service';
import { CrearVehiculoModal } from './components/crear-vehiculo-modal/crear-vehiculo-modal';
import type {
  Vehiculo,
  CrearVehiculoRequest,
  PagedResult,
} from './models/vehiculo.models';
import type { CentroLogistico } from '../centros-logisticos/models/centro-logistico.models';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearVehiculoModal],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.css',
})
export class Vehiculos implements OnInit {
  private readonly vehiculoService = inject(VehiculoService);
  private readonly centroService = inject(CentroLogisticoService);

  readonly vehiculos = signal<Vehiculo[]>([]);
  readonly centros = signal<CentroLogistico[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filters & pagination
  readonly search = signal<string>('');
  readonly tipoFilter = signal<string>('');
  readonly estadoFilter = signal<string>('');
  readonly centroFilter = signal<string>('');
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly totalItems = signal<number>(0);

  // Modal state
  readonly modalOpen = signal<boolean>(false);
  readonly modalSubmitting = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCentros();
    this.loadVehiculos();
  }

  loadCentros(): void {
    this.centroService.getCentros({ soloActivos: true, pageSize: 100 }).subscribe({
      next: (res) => {
        this.centros.set(res.items);
      },
      error: () => {
        // Soft failure: dropdown will stay empty without blocking list view
      },
    });
  }

  loadVehiculos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.vehiculoService
      .getVehiculos({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search(),
        tipo: this.tipoFilter() || undefined,
        estado: this.estadoFilter() || undefined,
        centroLogisticoId: this.centroFilter() || undefined,
      })
      .subscribe({
        next: (result: PagedResult<Vehiculo>) => {
          this.vehiculos.set(result.items);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los vehículos. Intenta nuevamente.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.loadVehiculos();
  }

  onTipoFilterChange(tipo: string): void {
    this.tipoFilter.set(tipo);
    this.page.set(1);
    this.loadVehiculos();
  }

  onEstadoFilterChange(estado: string): void {
    this.estadoFilter.set(estado);
    this.page.set(1);
    this.loadVehiculos();
  }

  onCentroFilterChange(centroId: string): void {
    this.centroFilter.set(centroId);
    this.page.set(1);
    this.loadVehiculos();
  }

  onPrevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadVehiculos();
    }
  }

  onNextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadVehiculos();
    }
  }

  openCreateModal(): void {
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.modalError.set(null);
  }

  onModalSubmit(payload: CrearVehiculoRequest): void {
    this.modalSubmitting.set(true);
    this.modalError.set(null);

    this.vehiculoService.create(payload).subscribe({
      next: () => {
        this.modalSubmitting.set(false);
        this.closeModal();
        this.loadVehiculos();
      },
      error: (err: { error?: { detail?: string }; status?: number }) => {
        this.modalSubmitting.set(false);
        if (err?.status === 409) {
          this.modalError.set('Ya existe un vehículo registrado con esa patente.');
        } else {
          this.modalError.set(err?.error?.detail || 'Ocurrió un error al registrar el vehículo.');
        }
      },
    });
  }

  onChangeEstado(vehiculo: Vehiculo, nuevoEstado: string): void {
    this.vehiculoService.cambiarEstado(vehiculo.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.loadVehiculos();
      },
      error: () => {
        this.error.set('No se pudo actualizar el estado del vehículo.');
      },
    });
  }

  onDelete(vehiculo: Vehiculo): void {
    if (confirm(`¿Estás seguro de eliminar el vehículo ${vehiculo.formattedPatente || vehiculo.patente}?`)) {
      this.vehiculoService.delete(vehiculo.id).subscribe({
        next: () => {
          this.loadVehiculos();
        },
        error: () => {
          this.error.set('No se pudo eliminar el vehículo.');
        },
      });
    }
  }
}
