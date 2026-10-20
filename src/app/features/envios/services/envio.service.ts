import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  AsignarRecursosEnvioRequest,
  CrearEnvioRequest,
  DespacharEnvioRequest,
  EnvioListItem,
  EnvioQueryParams,
  EnvioResponse,
  EnviosMetricas,
  PagedResult,
} from '../models/envio.models';

@Injectable({
  providedIn: 'root',
})
export class EnvioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl || ''}/api/v1/envios`;

  getEnvios(params: EnvioQueryParams = {}): Observable<PagedResult<EnvioListItem>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search.trim());
    }
    if (params.estado) {
      httpParams = httpParams.set('estado', params.estado.trim());
    }
    if (params.clienteId) {
      httpParams = httpParams.set('clienteId', params.clienteId.trim());
    }
    if (params.fechaDesde) {
      httpParams = httpParams.set('fechaDesde', params.fechaDesde.trim());
    }
    if (params.fechaHasta) {
      httpParams = httpParams.set('fechaHasta', params.fechaHasta.trim());
    }

    return this.http.get<PagedResult<EnvioListItem>>(this.baseUrl, { params: httpParams });
  }

  getMetricas(clienteId?: string, fechaReferencia?: string): Observable<EnviosMetricas> {
    let httpParams = new HttpParams();

    if (clienteId) {
      httpParams = httpParams.set('clienteId', clienteId.trim());
    }
    if (fechaReferencia) {
      httpParams = httpParams.set('fechaReferencia', fechaReferencia.trim());
    }

    return this.http.get<EnviosMetricas>(`${this.baseUrl}/metricas`, { params: httpParams });
  }

  getEnvioById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  createEnvio(request: CrearEnvioRequest): Observable<EnvioResponse> {
    return this.http.post<EnvioResponse>(this.baseUrl, request);
  }

  asignarRecursos(
    envioId: string,
    request: AsignarRecursosEnvioRequest,
  ): Observable<EnvioResponse> {
    return this.http.post<EnvioResponse>(`${this.baseUrl}/${envioId}/asignar`, request);
  }

  despacharEnvio(
    envioId: string,
    request: DespacharEnvioRequest = {},
  ): Observable<EnvioResponse> {
    return this.http.post<EnvioResponse>(`${this.baseUrl}/${envioId}/despachar`, request);
  }
}
