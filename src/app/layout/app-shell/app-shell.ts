import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthTokenService } from '../../shared/auth/auth-token.service';
import { PERMISSION_MAP, hasAnyRole } from '../../shared/auth/permissions';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  private readonly router = inject(Router);
  readonly tokenService = inject(AuthTokenService);

  canAccessCentros(): boolean {
    return hasAnyRole(this.tokenService.getRoles(), PERMISSION_MAP.centrosLogisticos);
  }

  canAccessClientes(): boolean {
    return hasAnyRole(this.tokenService.getRoles(), PERMISSION_MAP.clientes);
  }

  canAccessVehiculos(): boolean {
    return hasAnyRole(this.tokenService.getRoles(), PERMISSION_MAP.vehiculos);
  }

  userEmail(): string {
    const claims = this.tokenService.getClaims();
    return claims?.email ?? 'usuario@nexora.com';
  }

  primaryRole(): string {
    const roles = this.tokenService.getRoles();
    return roles.length > 0 ? roles[0] : 'USUARIO';
  }

  onLogout(): void {
    this.tokenService.clearToken();
    this.router.navigate(['/login']);
  }
}
