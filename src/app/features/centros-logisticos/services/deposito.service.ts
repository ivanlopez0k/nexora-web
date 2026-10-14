import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Deposito,
  CrearDepositoRequest,
  ActualizarDepositoRequest,
  CambiarEstadoDepositoRequest,
} from '../models/deposito.models';

@Injectable({
  providedIn: 'root',
})
export class DepositoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/centros-logisticos';

  getDepositos(centroId: string): Observable<Deposito[]> {
    return this.http.get<Deposito[]>(`${this.baseUrl}/${centroId}/depositos`);
  }

  getById(centroId: string, depositoId: string): Observable<Deposito> {
    return this.http.get<Deposito>(`${this.baseUrl}/${centroId}/depositos/${depositoId}`);
  }

  create(centroId: string, request: CrearDepositoRequest): Observable<Deposito> {
    return this.http.post<Deposito>(`${this.baseUrl}/${centroId}/depositos`, request);
  }

  update(
    centroId: string,
    depositoId: string,
    request: ActualizarDepositoRequest,
  ): Observable<Deposito> {
    return this.http.put<Deposito>(`${this.baseUrl}/${centroId}/depositos/${depositoId}`, request);
  }

  cambiarEstado(
    centroId: string,
    depositoId: string,
    request: CambiarEstadoDepositoRequest,
  ): Observable<Deposito> {
    return this.http.patch<Deposito>(
      `${this.baseUrl}/${centroId}/depositos/${depositoId}/estado`,
      request,
    );
  }

  delete(centroId: string, depositoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${centroId}/depositos/${depositoId}`);
  }
}
