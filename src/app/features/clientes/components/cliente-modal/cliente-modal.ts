import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isValidCuit, formatCuit } from '../../utils/cuit-validator';
import type { Cliente } from '../../models/cliente.models';

@Component({
  selector: 'app-cliente-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-modal.html',
  styleUrl: './cliente-modal.css',
})
export class ClienteModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly clienteToEdit = input<Cliente | null>(null);

  readonly close = output<void>();
  readonly save = output<{ razonSocial: string; cuit: string }>();

  readonly razonSocial = signal<string>('');
  readonly cuit = signal<string>('');
  readonly touched = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const cliente = this.clienteToEdit();
        if (cliente) {
          this.razonSocial.set(cliente.razonSocial);
          this.cuit.set(cliente.formattedCuit || cliente.cuit);
        } else {
          this.razonSocial.set('');
          this.cuit.set('');
        }
        this.touched.set(false);
      }
    });
  }

  isEditMode(): boolean {
    return this.clienteToEdit() !== null;
  }

  isRazonSocialInvalid(): boolean {
    return this.touched() && !this.razonSocial().trim();
  }

  isCuitInvalid(): boolean {
    return this.touched() && (!this.cuit().trim() || !isValidCuit(this.cuit()));
  }

  onCuitBlur(): void {
    const raw = this.cuit().trim();
    if (isValidCuit(raw)) {
      this.cuit.set(formatCuit(raw));
    }
  }

  onSubmit(): void {
    this.touched.set(true);
    const rs = this.razonSocial().trim();
    const c = this.cuit().trim();

    if (!rs || !isValidCuit(c)) {
      return;
    }

    this.save.emit({ razonSocial: rs, cuit: c });
  }

  onCancel(): void {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isSubmitting()) {
      this.close.emit();
    }
  }
}
