import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  CentroLogistico,
  CentroLogisticoFilter,
  CrearCentroLogisticoRequest,
  ActualizarCentroLogisticoRequest,
  PagedResult,
} from '../models/centro-logistico.models';

@Injectable({
  providedIn: 'root',
})
export class CentroLogisticoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/centros-logisticos';

  getCentros(filter: CentroLogisticoFilter = {}): Observable<PagedResult<CentroLogistico>> {
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
    if (filter.soloActivos !== undefined) {
      params = params.set('soloActivos', filter.soloActivos.toString());
    }

    return this.http.get<PagedResult<CentroLogistico>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<CentroLogistico> {
    return this.http.get<CentroLogistico>(`${this.baseUrl}/${id}`);
  }

  create(request: CrearCentroLogisticoRequest): Observable<CentroLogistico> {
    return this.http.post<CentroLogistico>(this.baseUrl, request);
  }

  update(id: string, request: ActualizarCentroLogisticoRequest): Observable<CentroLogistico> {
    return this.http.put<CentroLogistico>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
