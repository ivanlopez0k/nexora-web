import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Empleado } from '../../models/empleado.models';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

@Component({
  selector: 'app-asociar-usuario-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asociar-usuario-modal.html',
  styleUrl: './asociar-usuario-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsociarUsuarioModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly empleado = input<Empleado | null>(null);

  readonly close = output<void>();
  readonly save = output<{ usuarioId: string }>();

  readonly usuarioId = signal<string>('');
  readonly touched = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const emp = this.empleado();
        this.usuarioId.set(emp?.usuarioId ?? '');
        this.touched.set(false);
      }
    });
  }

  isUsuarioIdInvalid(): boolean {
    const raw = this.usuarioId().trim();
    return this.touched() && (!raw || !isValidUuid(raw));
  }

  onSubmit(): void {
    this.touched.set(true);
    const id = this.usuarioId().trim();

    if (!id || !isValidUuid(id)) {
      return;
    }

    this.save.emit({ usuarioId: id });
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
