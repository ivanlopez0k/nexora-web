import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crear-centro-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-centro-modal.html',
  styleUrl: './crear-centro-modal.css',
})
export class CrearCentroModal {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly close = output<void>();
  readonly submitCentro = output<{ nombre: string; provincia: string }>();

  readonly nombre = signal<string>('');
  readonly provincia = signal<string>('');
  readonly touched = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.nombre.set('');
        this.provincia.set('');
        this.touched.set(false);
      }
    });
  }

  isNombreInvalid(): boolean {
    return this.touched() && !this.nombre().trim();
  }

  isProvinciaInvalid(): boolean {
    return this.touched() && !this.provincia().trim();
  }

  onSubmit(): void {
    this.touched.set(true);
    const nom = this.nombre().trim();
    const prov = this.provincia().trim();

    if (!nom || !prov) {
      return;
    }

    this.submitCentro.emit({ nombre: nom, provincia: prov });
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
