import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ChoferService } from './chofer.service';
import type {
  Chofer,
  CrearChoferRequest,
  ActualizarChoferRequest,
  ActualizarHabilitacionesRequest,
  PagedResult,
} from '../models/chofer.models';

describe('ChoferService', () => {
  let service: ChoferService;
  let httpMock: HttpTestingController;

  const mockChofer: Chofer = {
    id: 'ch-1',
    empleadoId: 'emp-1',
    empleadoNombre: 'Juan Fangio',
    empleadoLegajo: 'LEG-001',
    centroLogisticoId: 'centro-1',
    centroLogisticoNombre: 'Centro Central',
    numeroLicencia: 'B2-998877',
    vencimientoLicencia: '2027-12-31',
    estado: 'ACTIVO',
    habilitaciones: ['Camion', 'Furgon'],
    esElegibleHoy: true,
    motivoNoElegible: null,
    fechaAlta: '2026-10-14T00:00:00Z',
  };

  const mockPaged: PagedResult<Chofer> = {
    items: [mockChofer],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChoferService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ChoferService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getChoferes', () => {
    it('requests GET without params when empty filter is passed', () => {
      service.getChoferes().subscribe((res) => {
        expect(res).toEqual(mockPaged);
      });

      const req = httpMock.expectOne('/api/v1/choferes');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockPaged);
    });

    it('attaches pagination and filter params when provided', () => {
      service
        .getChoferes({
          page: 2,
          pageSize: 20,
          centroLogisticoId: 'centro-1',
          estado: 'ACTIVO',
          vencerEnDias: 30,
        })
        .subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === '/api/v1/choferes' &&
          r.params.get('page') === '2' &&
          r.params.get('pageSize') === '20' &&
          r.params.get('centroLogisticoId') === 'centro-1' &&
          r.params.get('estado') === 'ACTIVO' &&
          r.params.get('vencerEnDias') === '30',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaged);
    });
  });

  describe('getById', () => {
    it('requests GET with driver id in path', () => {
      service.getById(mockChofer.id).subscribe((res) => {
        expect(res).toEqual(mockChofer);
      });

      const req = httpMock.expectOne(`/api/v1/choferes/${mockChofer.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockChofer);
    });
  });

  describe('create', () => {
    it('sends POST with trimmed payload', () => {
      const payload: CrearChoferRequest = {
        empleadoId: '  emp-1  ',
        centroLogisticoId: '  centro-1  ',
        numeroLicencia: '  B2-998877  ',
        vencimientoLicencia: '  2027-12-31  ',
        habilitaciones: ['Camion'],
      };

      service.create(payload).subscribe((res) => {
        expect(res).toEqual(mockChofer);
      });

      const req = httpMock.expectOne('/api/v1/choferes');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        empleadoId: 'emp-1',
        centroLogisticoId: 'centro-1',
        numeroLicencia: 'B2-998877',
        vencimientoLicencia: '2027-12-31',
        habilitaciones: ['Camion'],
      });
      req.flush(mockChofer);
    });
  });

  describe('update', () => {
    it('sends PUT with trimmed payload', () => {
      const payload: ActualizarChoferRequest = {
        centroLogisticoId: '  centro-2  ',
        numeroLicencia: '  B2-112233  ',
        vencimientoLicencia: '  2028-01-01  ',
      };

      service.update(mockChofer.id, payload).subscribe((res) => {
        expect(res).toEqual(mockChofer);
      });

      const req = httpMock.expectOne(`/api/v1/choferes/${mockChofer.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        centroLogisticoId: 'centro-2',
        numeroLicencia: 'B2-112233',
        vencimientoLicencia: '2028-01-01',
      });
      req.flush(mockChofer);
    });
  });

  describe('updateHabilitaciones', () => {
    it('sends PUT to /api/v1/choferes/:id/habilitaciones', () => {
      const payload: ActualizarHabilitacionesRequest = {
        tiposVehiculo: ['Camion', 'Acoplado'],
      };

      service.updateHabilitaciones(mockChofer.id, payload).subscribe((res) => {
        expect(res).toEqual(mockChofer);
      });

      const req = httpMock.expectOne(`/api/v1/choferes/${mockChofer.id}/habilitaciones`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        tiposVehiculo: ['Camion', 'Acoplado'],
      });
      req.flush(mockChofer);
    });
  });

  describe('delete', () => {
    it('sends DELETE to /api/v1/choferes/:id', () => {
      service.delete(mockChofer.id).subscribe();

      const req = httpMock.expectOne(`/api/v1/choferes/${mockChofer.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
