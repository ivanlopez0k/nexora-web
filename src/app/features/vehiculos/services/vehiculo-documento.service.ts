import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  DocumentoVehiculo,
  SubirDocumentoVehiculoPayload,
} from '../models/vehiculo-documento.models';

@Injectable({
  providedIn: 'root',
})
export class VehiculoDocumentoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/vehiculos';

  getDocumentos(vehiculoId: string): Observable<DocumentoVehiculo[]> {
    return this.http.get<DocumentoVehiculo[]>(`${this.baseUrl}/${vehiculoId}/documentos`);
  }

  subirDocumento(
    vehiculoId: string,
    payload: SubirDocumentoVehiculoPayload
  ): Observable<HttpEvent<DocumentoVehiculo>> {
    const formData = new FormData();
    formData.append('Archivo', payload.archivo, payload.archivo.name);
    formData.append('Tipo', payload.tipo);

    if (payload.numeroDocumento && payload.numeroDocumento.trim()) {
      formData.append('NumeroDocumento', payload.numeroDocumento.trim());
    }

    if (payload.fechaEmision) {
      formData.append('FechaEmision', payload.fechaEmision);
    }

    if (payload.fechaVencimiento) {
      formData.append('FechaVencimiento', payload.fechaVencimiento);
    }

    return this.http.post<DocumentoVehiculo>(
      `${this.baseUrl}/${vehiculoId}/documentos`,
      formData,
      {
        reportProgress: true,
        observe: 'events',
      }
    );
  }

  descargarArchivo(vehiculoId: string, documentoId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${vehiculoId}/documentos/${documentoId}/archivo`, {
      responseType: 'blob',
    });
  }

  darDeBaja(vehiculoId: string, documentoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${vehiculoId}/documentos/${documentoId}`);
  }
}
