import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Chofer,
  ChoferFilter,
  CrearChoferRequest,
  ActualizarChoferRequest,
  ActualizarHabilitacionesRequest,
  PagedResult,
} from '../models/chofer.models';

@Injectable({
  providedIn: 'root',
})
export class ChoferService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/choferes';

  getChoferes(filter: ChoferFilter = {}): Observable<PagedResult<Chofer>> {
    let params = new HttpParams();

    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.pageSize !== undefined) {
      params = params.set('pageSize', filter.pageSize.toString());
    }
    if (filter.centroLogisticoId) {
      params = params.set('centroLogisticoId', filter.centroLogisticoId.trim());
    }
    if (filter.estado) {
      params = params.set('estado', filter.estado.trim());
    }
    if (filter.vencerEnDias !== undefined && filter.vencerEnDias !== null) {
      params = params.set('vencerEnDias', filter.vencerEnDias.toString());
    }

    return this.http.get<PagedResult<Chofer>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Chofer> {
    return this.http.get<Chofer>(`${this.baseUrl}/${id}`);
  }

  create(request: CrearChoferRequest): Observable<Chofer> {
    const payload: CrearChoferRequest = {
      empleadoId: request.empleadoId.trim(),
      centroLogisticoId: request.centroLogisticoId.trim(),
      numeroLicencia: request.numeroLicencia.trim(),
      vencimientoLicencia: request.vencimientoLicencia.trim(),
      habilitaciones: request.habilitaciones ?? [],
    };
    return this.http.post<Chofer>(this.baseUrl, payload);
  }

  update(id: string, request: ActualizarChoferRequest): Observable<Chofer> {
    const payload: ActualizarChoferRequest = {
      centroLogisticoId: request.centroLogisticoId.trim(),
      numeroLicencia: request.numeroLicencia.trim(),
      vencimientoLicencia: request.vencimientoLicencia.trim(),
    };
    return this.http.put<Chofer>(`${this.baseUrl}/${id}`, payload);
  }

  updateHabilitaciones(id: string, request: ActualizarHabilitacionesRequest): Observable<Chofer> {
    const payload: ActualizarHabilitacionesRequest = {
      tiposVehiculo: request.tiposVehiculo ?? [],
    };
    return this.http.put<Chofer>(`${this.baseUrl}/${id}/habilitaciones`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
