import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepositoService } from '../../services/deposito.service';
import { TIPOS_DEPOSITO, getTipoDepositoInfo } from '../../models/deposito.models';
import type {
  Deposito,
  CrearDepositoRequest,
  ActualizarDepositoRequest,
  TipoDeposito,
  TipoDepositoOption,
  EstadoDeposito,
} from '../../models/deposito.models';
import type { CentroLogistico } from '../../models/centro-logistico.models';

@Component({
  selector: 'app-depositos-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './depositos-modal.html',
  styleUrl: './depositos-modal.css',
})
export class DepositosModal implements OnChanges {
  private readonly service = inject(DepositoService);

  @Input() isOpen = false;
  @Input() centro: CentroLogistico | null = null;
  @Input() canManage = false;

  @Output() close = new EventEmitter<void>();
  @Output() depositosChange = new EventEmitter<void>();

  readonly tiposDeposito = TIPOS_DEPOSITO;

  readonly depositos = signal<Deposito[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Form state
  readonly editingId = signal<string | null>(null);
  readonly codigo = signal<string>('');
  readonly nombre = signal<string>('');
  readonly tipo = signal<TipoDeposito>('General');
  readonly capacidadTotalM3 = signal<number | null>(null);
  readonly temperaturaMinima = signal<number | null>(null);
  readonly temperaturaMaxima = signal<number | null>(null);
  readonly formSubmitting = signal<boolean>(false);
  readonly formError = signal<string | null>(null);

  // Action loading states
  readonly deletingId = signal<string | null>(null);
  readonly changingEstadoId = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.centro) {
      this.resetForm();
      this.error.set(null);
      this.successMessage.set(null);
      this.loadDepositos();
    }
  }

  loadDepositos(): void {
    if (!this.centro) return;
    this.loading.set(true);
    this.error.set(null);

    this.service.getDepositos(this.centro.id).subscribe({
      next: (items) => {
        this.depositos.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los depósitos del centro logístico.');
      },
    });
  }

  getTipoInfo(tipo: string): TipoDepositoOption {
    return getTipoDepositoInfo(tipo);
  }

  startEdit(deposito: Deposito): void {
    this.editingId.set(deposito.id);
    this.codigo.set(deposito.codigo);
    this.nombre.set(deposito.nombre);
    this.tipo.set(deposito.tipo as TipoDeposito);
    this.capacidadTotalM3.set(deposito.capacidadTotalM3);
    this.temperaturaMinima.set(
      deposito.temperaturaMinima !== undefined ? deposito.temperaturaMinima : null,
    );
    this.temperaturaMaxima.set(
      deposito.temperaturaMaxima !== undefined ? deposito.temperaturaMaxima : null,
    );
    this.formError.set(null);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.editingId.set(null);
    this.codigo.set('');
    this.nombre.set('');
    this.tipo.set('General');
    this.capacidadTotalM3.set(null);
    this.temperaturaMinima.set(null);
    this.temperaturaMaxima.set(null);
    this.formError.set(null);
    this.formSubmitting.set(false);
  }

  onSave(): void {
    if (!this.centro) return;

    const cod = this.codigo().trim();
    if (!cod || cod.length < 2) {
      this.formError.set('El código de depósito es obligatorio (mínimo 2 caracteres).');
      return;
    }

    const nom = this.nombre().trim();
    if (!nom || nom.length < 3) {
      this.formError.set('El nombre del depósito es obligatorio (mínimo 3 caracteres).');
      return;
    }

    const cap = this.capacidadTotalM3();
    if (cap === null || cap <= 0) {
      this.formError.set('La capacidad total en m³ debe ser mayor a 0.');
      return;
    }

    const minTemp = this.temperaturaMinima();
    const maxTemp = this.temperaturaMaxima();
    if (minTemp !== null && maxTemp !== null && minTemp > maxTemp) {
      this.formError.set('La temperatura mínima no puede ser mayor que la temperatura máxima.');
      return;
    }

    this.formSubmitting.set(true);
    this.formError.set(null);
    this.successMessage.set(null);

    const payload: CrearDepositoRequest = {
      codigo: cod,
      nombre: nom,
      tipo: this.tipo(),
      capacidadTotalM3: cap,
      temperaturaMinima: minTemp !== null ? minTemp : undefined,
      temperaturaMaxima: maxTemp !== null ? maxTemp : undefined,
    };

    if (this.editingId()) {
      const editId = this.editingId()!;
      this.service.update(this.centro.id, editId, payload).subscribe({
        next: () => {
          this.formSubmitting.set(false);
          this.successMessage.set(`Depósito "${nom}" actualizado correctamente.`);
          this.resetForm();
          this.loadDepositos();
          this.depositosChange.emit();
        },
        error: (err: { error?: { detail?: string }; status?: number }) => {
          this.formSubmitting.set(false);
          if (err?.status === 409) {
            this.formError.set('Ya existe un depósito con ese código en este centro logístico.');
          } else {
            this.formError.set(err?.error?.detail || 'No se pudo actualizar el depósito.');
          }
        },
      });
    } else {
      this.service.create(this.centro.id, payload).subscribe({
        next: () => {
          this.formSubmitting.set(false);
          this.successMessage.set(`Depósito "${nom}" registrado correctamente.`);
          this.resetForm();
          this.loadDepositos();
          this.depositosChange.emit();
        },
        error: (err: { error?: { detail?: string }; status?: number }) => {
          this.formSubmitting.set(false);
          if (err?.status === 409) {
            this.formError.set('Ya existe un depósito con ese código en este centro logístico.');
          } else {
            this.formError.set(err?.error?.detail || 'No se pudo registrar el depósito.');
          }
        },
      });
    }
  }

  onToggleEstado(deposito: Deposito): void {
    if (!this.centro) return;
    const nuevoEstado: EstadoDeposito = deposito.estado === 'Activo' ? 'Inactivo' : 'Activo';

    this.changingEstadoId.set(deposito.id);
    this.error.set(null);

    this.service.cambiarEstado(this.centro.id, deposito.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.changingEstadoId.set(null);
        this.successMessage.set(`El depósito "${deposito.nombre}" ahora está ${nuevoEstado}.`);
        this.loadDepositos();
        this.depositosChange.emit();
      },
      error: () => {
        this.changingEstadoId.set(null);
        this.error.set('No se pudo cambiar el estado del depósito.');
      },
    });
  }

  onDelete(deposito: Deposito): void {
    if (!this.centro) return;
    if (
      !confirm(
        `¿Estás seguro de dar de baja el depósito "${deposito.codigo} - ${deposito.nombre}"?`,
      )
    ) {
      return;
    }

    this.deletingId.set(deposito.id);
    this.error.set(null);

    this.service.delete(this.centro.id, deposito.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.successMessage.set(`El depósito "${deposito.nombre}" fue dado de baja correctamente.`);
        this.loadDepositos();
        this.depositosChange.emit();
      },
      error: () => {
        this.deletingId.set(null);
        this.error.set('No se pudo eliminar el depósito.');
      },
    });
  }

  onClose(): void {
    this.resetForm();
    this.error.set(null);
    this.successMessage.set(null);
    this.close.emit();
  }
}
