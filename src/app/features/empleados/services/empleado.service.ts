import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Empleado,
  EmpleadoFilter,
  CrearEmpleadoRequest,
  ActualizarEmpleadoRequest,
  AsociarUsuarioRequest,
  PagedResult,
} from '../models/empleado.models';

@Injectable({
  providedIn: 'root',
})
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/empleados';

  getEmpleados(filter: EmpleadoFilter = {}): Observable<PagedResult<Empleado>> {
    let params = new HttpParams();

    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.pageSize !== undefined) {
      params = params.set('pageSize', filter.pageSize.toString());
    }
    if (filter.nombre) {
      params = params.set('nombre', filter.nombre.trim());
    }
    if (filter.legajo) {
      params = params.set('legajo', filter.legajo.trim());
    }
    if (filter.estado) {
      params = params.set('estado', filter.estado.trim());
    }

    return this.http.get<PagedResult<Empleado>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.baseUrl}/${id}`);
  }

  create(request: CrearEmpleadoRequest): Observable<Empleado> {
    const payload: CrearEmpleadoRequest = {
      nombre: request.nombre.trim(),
      legajo: request.legajo.trim(),
    };
    return this.http.post<Empleado>(this.baseUrl, payload);
  }

  update(id: string, request: ActualizarEmpleadoRequest): Observable<Empleado> {
    const payload: ActualizarEmpleadoRequest = {
      nombre: request.nombre.trim(),
      legajo: request.legajo.trim(),
    };
    return this.http.put<Empleado>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  asociarUsuario(id: string, request: AsociarUsuarioRequest): Observable<Empleado> {
    const payload: AsociarUsuarioRequest = {
      usuarioId: request.usuarioId.trim(),
    };
    return this.http.put<Empleado>(`${this.baseUrl}/${id}/usuario`, payload);
  }
}
