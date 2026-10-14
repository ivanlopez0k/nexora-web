import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Empleado } from '../../models/empleado.models';

@Component({
  selector: 'app-empleado-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empleado-modal.html',
  styleUrl: './empleado-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadoModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);
  readonly empleadoToEdit = input<Empleado | null>(null);

  readonly close = output<void>();
  readonly save = output<{ nombre: string; legajo: string }>();

  readonly nombre = signal<string>('');
  readonly legajo = signal<string>('');
  readonly touched = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const emp = this.empleadoToEdit();
        if (emp) {
          this.nombre.set(emp.nombre);
          this.legajo.set(emp.legajo);
        } else {
          this.nombre.set('');
          this.legajo.set('');
        }
        this.touched.set(false);
      }
    });
  }

  isEditMode(): boolean {
    return this.empleadoToEdit() !== null;
  }

  isNombreInvalid(): boolean {
    const trimmed = this.nombre().trim();
    return this.touched() && (!trimmed || trimmed.length < 2 || trimmed.length > 150);
  }

  isLegajoInvalid(): boolean {
    const trimmed = this.legajo().trim();
    return this.touched() && (!trimmed || trimmed.length > 50);
  }

  onSubmit(): void {
    this.touched.set(true);
    const n = this.nombre().trim();
    const l = this.legajo().trim();

    if (!n || n.length < 2 || n.length > 150 || !l || l.length > 50) {
      return;
    }

    this.save.emit({ nombre: n, legajo: l });
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
