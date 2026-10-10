import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { CentroLogisticoService } from './centro-logistico.service';
import type {
  CentroLogistico,
  CrearCentroLogisticoRequest,
  ActualizarCentroLogisticoRequest,
  PagedResult,
} from '../models/centro-logistico.models';

describe('CentroLogisticoService', () => {
  let service: CentroLogisticoService;
  let httpMock: HttpTestingController;

  const mockCentro: CentroLogistico = {
    id: 'e1d2c3b4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
    nombre: 'Centro Logístico Norte',
    provincia: 'Buenos Aires',
    estado: 'Activo',
    fechaCreacionUtc: '2026-10-10T00:00:00Z',
  };

  const mockPaged: PagedResult<CentroLogistico> = {
    items: [mockCentro],
    totalItems: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CentroLogisticoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CentroLogisticoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCentros', () => {
    it('requests GET without query params when empty filter is passed', () => {
      service.getCentros().subscribe((res) => {
        expect(res).toEqual(mockPaged);
      });

      const req = httpMock.expectOne('/api/v1/centros-logisticos');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockPaged);
    });

    it('applies query parameters for page, pageSize, search, and soloActivos', () => {
      service
        .getCentros({
          page: 2,
          pageSize: 20,
          search: 'Norte',
          soloActivos: true,
        })
        .subscribe((res) => {
          expect(res.items.length).toBe(1);
        });

      const req = httpMock.expectOne((r) => r.url === '/api/v1/centros-logisticos');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('20');
      expect(req.request.params.get('search')).toBe('Norte');
      expect(req.request.params.get('soloActivos')).toBe('true');
      req.flush(mockPaged);
    });
  });

  describe('getById', () => {
    it('requests GET /api/v1/centros-logisticos/:id', () => {
      service.getById(mockCentro.id).subscribe((res) => {
        expect(res).toEqual(mockCentro);
      });

      const req = httpMock.expectOne(`/api/v1/centros-logisticos/${mockCentro.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCentro);
    });
  });

  describe('create', () => {
    it('sends POST /api/v1/centros-logisticos with payload', () => {
      const payload: CrearCentroLogisticoRequest = {
        nombre: 'Nuevo Centro',
        provincia: 'Córdoba',
      };

      service.create(payload).subscribe((res) => {
        expect(res).toEqual(mockCentro);
      });

      const req = httpMock.expectOne('/api/v1/centros-logisticos');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockCentro);
    });
  });

  describe('update', () => {
    it('sends PUT /api/v1/centros-logisticos/:id with payload', () => {
      const payload: ActualizarCentroLogisticoRequest = {
        nombre: 'Centro Actualizado',
        provincia: 'Santa Fe',
      };

      service.update(mockCentro.id, payload).subscribe((res) => {
        expect(res.nombre).toBe(mockCentro.nombre);
      });

      const req = httpMock.expectOne(`/api/v1/centros-logisticos/${mockCentro.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockCentro);
    });
  });

  describe('delete', () => {
    it('sends DELETE /api/v1/centros-logisticos/:id', () => {
      service.delete(mockCentro.id).subscribe();

      const req = httpMock.expectOne(`/api/v1/centros-logisticos/${mockCentro.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
