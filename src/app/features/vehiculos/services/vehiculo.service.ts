import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { cleanPatente } from '../utils/patente-validator';
import type {
  Vehiculo,
  VehiculoFilter,
  CrearVehiculoRequest,
  CambiarEstadoVehiculoRequest,
  PagedResult,
} from '../models/vehiculo.models';

@Injectable({
  providedIn: 'root',
})
export class VehiculoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/vehiculos';

  getVehiculos(filter: VehiculoFilter = {}): Observable<PagedResult<Vehiculo>> {
    let params = new HttpParams();

    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.pageSize !== undefined) {
      params = params.set('pageSize', filter.pageSize.toString());
    }
    if (filter.search) {
      params = params.set('search', filter.search.trim());
    }
    if (filter.centroLogisticoId) {
      params = params.set('centroLogisticoId', filter.centroLogisticoId);
    }
    if (filter.tipo) {
      params = params.set('tipo', filter.tipo);
    }
    if (filter.estado) {
      params = params.set('estado', filter.estado);
    }

    return this.http.get<PagedResult<Vehiculo>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.baseUrl}/${id}`);
  }

  create(request: CrearVehiculoRequest): Observable<Vehiculo> {
    const payload: CrearVehiculoRequest = {
      ...request,
      patente: cleanPatente(request.patente),
    };
    return this.http.post<Vehiculo>(this.baseUrl, payload);
  }

  cambiarEstado(id: string, request: CambiarEstadoVehiculoRequest): Observable<Vehiculo> {
    return this.http.patch<Vehiculo>(`${this.baseUrl}/${id}/estado`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
