import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroLogisticoService } from './services/centro-logistico.service';
import { CrearCentroModal } from './components/crear-centro-modal/crear-centro-modal';
import type {
  CentroLogistico,
  PagedResult,
} from './models/centro-logistico.models';

@Component({
  selector: 'app-centros-logisticos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrearCentroModal],
  templateUrl: './centros-logisticos.html',
  styleUrl: './centros-logisticos.css',
})
export class CentrosLogisticos implements OnInit {
  private readonly service = inject(CentroLogisticoService);

  readonly centros = signal<CentroLogistico[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filters & pagination
  readonly search = signal<string>('');
  readonly soloActivos = signal<boolean>(false);
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
  }

  loadCentros(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getCentros({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search(),
        soloActivos: this.soloActivos() ? true : undefined,
      })
      .subscribe({
        next: (result: PagedResult<CentroLogistico>) => {
          this.centros.set(result.items);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los centros logísticos. Intenta nuevamente.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.loadCentros();
  }

  onSoloActivosChange(checked: boolean): void {
    this.soloActivos.set(checked);
    this.page.set(1);
    this.loadCentros();
  }

  onPrevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadCentros();
    }
  }

  onNextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadCentros();
    }
  }

  openCreateModal(): void {
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  closeCreateModal(): void {
    this.modalOpen.set(false);
    this.modalError.set(null);
  }

  onCreateSubmit(payload: { nombre: string; provincia: string }): void {
    this.modalSubmitting.set(true);
    this.modalError.set(null);

    this.service.create(payload).subscribe({
      next: () => {
        this.modalSubmitting.set(false);
        this.modalOpen.set(false);
        this.loadCentros();
      },
      error: (err: { error?: { detail?: string; title?: string }; status?: number }) => {
        this.modalSubmitting.set(false);
        if (err?.status === 409) {
          this.modalError.set('Ya existe un centro logístico con ese nombre.');
        } else {
          this.modalError.set(err?.error?.detail || 'Ocurrió un error al registrar el centro.');
        }
      },
    });
  }

  onDeactivate(centro: CentroLogistico): void {
    if (confirm(`¿Estás seguro de desactivar el centro "${centro.nombre}"?`)) {
      this.service.delete(centro.id).subscribe({
        next: () => {
          this.loadCentros();
        },
        error: () => {
          this.error.set('No se pudo desactivar el centro logístico.');
        },
      });
    }
  }
}
