import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { DepositoService } from './deposito.service';
import type {
  Deposito,
  CrearDepositoRequest,
  ActualizarDepositoRequest,
  CambiarEstadoDepositoRequest,
} from '../models/deposito.models';

describe('DepositoService', () => {
  let service: DepositoService;
  let httpMock: HttpTestingController;

  const mockCentroId = 'centro-100';
  const mockDepositoId = 'dep-200';

  const mockDeposito: Deposito = {
    id: mockDepositoId,
    centroLogisticoId: mockCentroId,
    codigo: 'DEP-FRIO-1',
    nombre: 'Cámara Frigorífica Principal',
    tipo: 'Refrigerado',
    capacidadTotalM3: 5000,
    capacidadDisponibleM3: 3500,
    temperaturaMinima: -4,
    temperaturaMaxima: 4,
    estado: 'Activo',
    fechaAlta: '2026-02-15T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DepositoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DepositoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getDepositos should request GET /api/v1/centros-logisticos/:centroId/depositos', () => {
    service.getDepositos(mockCentroId).subscribe((depositos) => {
      expect(depositos.length).toBe(1);
      expect(depositos[0].id).toBe(mockDepositoId);
      expect(depositos[0].codigo).toBe('DEP-FRIO-1');
    });

    const req = httpMock.expectOne(`/api/v1/centros-logisticos/${mockCentroId}/depositos`);
    expect(req.request.method).toBe('GET');
    req.flush([mockDeposito]);
  });

  it('getById should request GET /api/v1/centros-logisticos/:centroId/depositos/:id', () => {
    service.getById(mockCentroId, mockDepositoId).subscribe((res) => {
      expect(res.id).toBe(mockDepositoId);
      expect(res.tipo).toBe('Refrigerado');
    });

    const req = httpMock.expectOne(
      `/api/v1/centros-logisticos/${mockCentroId}/depositos/${mockDepositoId}`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockDeposito);
  });

  it('create should request POST /api/v1/centros-logisticos/:centroId/depositos', () => {
    const payload: CrearDepositoRequest = {
      codigo: 'DEP-SEC-2',
      nombre: 'Depósito Seco Este',
      tipo: 'Seco',
      capacidadTotalM3: 12000,
    };

    service.create(mockCentroId, payload).subscribe((res) => {
      expect(res.codigo).toBe('DEP-FRIO-1');
    });

    const req = httpMock.expectOne(`/api/v1/centros-logisticos/${mockCentroId}/depositos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockDeposito);
  });

  it('update should request PUT /api/v1/centros-logisticos/:centroId/depositos/:id', () => {
    const payload: ActualizarDepositoRequest = {
      codigo: 'DEP-FRIO-MOD',
      nombre: 'Cámara Modificada',
      tipo: 'Congelado',
      capacidadTotalM3: 6000,
      temperaturaMinima: -25,
      temperaturaMaxima: -18,
    };

    service.update(mockCentroId, mockDepositoId, payload).subscribe((res) => {
      expect(res.id).toBe(mockDepositoId);
    });

    const req = httpMock.expectOne(
      `/api/v1/centros-logisticos/${mockCentroId}/depositos/${mockDepositoId}`,
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(mockDeposito);
  });

  it('cambiarEstado should request PATCH /api/v1/centros-logisticos/:centroId/depositos/:id/estado', () => {
    const payload: CambiarEstadoDepositoRequest = { estado: 'Mantenimiento' };

    service.cambiarEstado(mockCentroId, mockDepositoId, payload).subscribe((res) => {
      expect(res.id).toBe(mockDepositoId);
    });

    const req = httpMock.expectOne(
      `/api/v1/centros-logisticos/${mockCentroId}/depositos/${mockDepositoId}/estado`,
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(mockDeposito);
  });

  it('delete should request DELETE /api/v1/centros-logisticos/:centroId/depositos/:id', () => {
    service.delete(mockCentroId, mockDepositoId).subscribe();

    const req = httpMock.expectOne(
      `/api/v1/centros-logisticos/${mockCentroId}/depositos/${mockDepositoId}`,
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
