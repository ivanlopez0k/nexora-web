import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthTokenService } from '../../shared/auth/auth-token.service';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  templateUrl: './acceso-denegado.html',
  styleUrl: './acceso-denegado.css',
})
export class AccesoDenegado {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  readonly tokenService = inject(AuthTokenService);

  onGoBack(): void {
    this.location.back();
  }

  onGoHome(): void {
    this.router.navigate(['/login']);
  }
}
