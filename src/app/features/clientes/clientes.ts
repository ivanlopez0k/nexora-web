import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from './services/cliente.service';
import { ClienteModal } from './components/cliente-modal/cliente-modal';
import type {
  Cliente,
  PagedResult,
} from './models/cliente.models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ClienteModal],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  private readonly service = inject(ClienteService);

  readonly clientes = signal<Cliente[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Filters & pagination
  readonly search = signal<string>('');
  readonly estadoFilter = signal<string>('');
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly totalItems = signal<number>(0);

  // Modal state
  readonly modalOpen = signal<boolean>(false);
  readonly modalSubmitting = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);
  readonly selectedCliente = signal<Cliente | null>(null);

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service
      .getClientes({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search(),
        estado: this.estadoFilter() || undefined,
      })
      .subscribe({
        next: (result: PagedResult<Cliente>) => {
          this.clientes.set(result.items);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los clientes. Intenta nuevamente.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.loadClientes();
  }

  onEstadoChange(estado: string): void {
    this.estadoFilter.set(estado);
    this.page.set(1);
    this.loadClientes();
  }

  onPrevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadClientes();
    }
  }

  onNextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadClientes();
    }
  }

  openCreateModal(): void {
    this.selectedCliente.set(null);
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  openEditModal(cliente: Cliente): void {
    this.selectedCliente.set(cliente);
    this.modalError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.selectedCliente.set(null);
    this.modalError.set(null);
  }

  onModalSave(payload: { razonSocial: string; cuit: string }): void {
    this.modalSubmitting.set(true);
    this.modalError.set(null);

    const client = this.selectedCliente();
    const request$ = client
      ? this.service.update(client.id, {
          razonSocial: payload.razonSocial,
          cuit: payload.cuit,
          estado: client.estado,
        })
      : this.service.create(payload);

    request$.subscribe({
      next: () => {
        this.modalSubmitting.set(false);
        this.closeModal();
        this.loadClientes();
      },
      error: (err: { error?: { detail?: string }; status?: number }) => {
        this.modalSubmitting.set(false);
        if (err?.status === 409) {
          this.modalError.set('Ya existe un cliente con ese CUIT o razón social.');
        } else {
          this.modalError.set(err?.error?.detail || 'Ocurrió un error al procesar el cliente.');
        }
      },
    });
  }

  onDeactivate(cliente: Cliente): void {
    if (confirm(`¿Estás seguro de desactivar al cliente "${cliente.razonSocial}"?`)) {
      this.service.delete(cliente.id).subscribe({
        next: () => {
          this.loadClientes();
        },
        error: () => {
          this.error.set('No se pudo desactivar el cliente.');
        },
      });
    }
  }
}
