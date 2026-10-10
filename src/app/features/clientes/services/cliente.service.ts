import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { cleanCuit } from '../utils/cuit-validator';
import type {
  Cliente,
  ClienteFilter,
  CrearClienteRequest,
  ActualizarClienteRequest,
  PagedResult,
} from '../models/cliente.models';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/clientes';

  getClientes(filter: ClienteFilter = {}): Observable<PagedResult<Cliente>> {
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
    if (filter.estado) {
      params = params.set('estado', filter.estado.trim());
    }

    return this.http.get<PagedResult<Cliente>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  create(request: CrearClienteRequest): Observable<Cliente> {
    const payload: CrearClienteRequest = {
      razonSocial: request.razonSocial.trim(),
      cuit: cleanCuit(request.cuit),
    };
    return this.http.post<Cliente>(this.baseUrl, payload);
  }

  update(id: string, request: ActualizarClienteRequest): Observable<Cliente> {
    const payload: ActualizarClienteRequest = {
      razonSocial: request.razonSocial.trim(),
      cuit: cleanCuit(request.cuit),
      estado: request.estado,
    };
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
