import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { VehiculoService } from './vehiculo.service';
import type {
  Vehiculo,
  CrearVehiculoRequest,
  PagedResult,
} from '../models/vehiculo.models';

describe('VehiculoService', () => {
  let service: VehiculoService;
  let httpMock: HttpTestingController;

  const mockVehiculo: Vehiculo = {
    id: 'veh-guid-1',
    patente: 'AE123CD',
    formattedPatente: 'AE 123 CD',
    marca: 'Mercedes-Benz',
    modelo: 'Actros',
    anio: 2023,
    tipo: 'Camion',
    capacidad: 15000,
    kilometraje: 45000,
    estado: 'Disponible',
    centroLogisticoId: 'centro-guid-1',
    centroLogisticoNombre: 'Centro Logístico Norte',
    fechaAlta: '2026-10-10T00:00:00Z',
  };

  const mockPaged: PagedResult<Vehiculo> = {
    items: [mockVehiculo],
    totalItems: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VehiculoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(VehiculoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getVehiculos', () => {
    it('requests GET /api/v1/vehiculos without params when empty filter', () => {
      service.getVehiculos().subscribe((res) => {
        expect(res).toEqual(mockPaged);
      });

      const req = httpMock.expectOne('/api/v1/vehiculos');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockPaged);
    });

    it('sets query parameters properly', () => {
      service
        .getVehiculos({
          page: 2,
          pageSize: 20,
          search: 'Actros',
          centroLogisticoId: 'centro-guid-1',
          tipo: 'Camion',
          estado: 'Disponible',
        })
        .subscribe((res) => {
          expect(res.items.length).toBe(1);
        });

      const req = httpMock.expectOne((r) => r.url === '/api/v1/vehiculos');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('20');
      expect(req.request.params.get('search')).toBe('Actros');
      expect(req.request.params.get('centroLogisticoId')).toBe('centro-guid-1');
      expect(req.request.params.get('tipo')).toBe('Camion');
      expect(req.request.params.get('estado')).toBe('Disponible');
      req.flush(mockPaged);
    });
  });

  describe('getById', () => {
    it('requests GET /api/v1/vehiculos/:id', () => {
      service.getById(mockVehiculo.id).subscribe((res) => {
        expect(res).toEqual(mockVehiculo);
      });

      const req = httpMock.expectOne(`/api/v1/vehiculos/${mockVehiculo.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockVehiculo);
    });
  });

  describe('create', () => {
    it('normalizes patente and sends POST /api/v1/vehiculos', () => {
      const payload: CrearVehiculoRequest = {
        patente: 'ae 123 cd',
        marca: 'Mercedes-Benz',
        modelo: 'Actros',
        anio: 2023,
        tipo: 'Camion',
        capacidad: 15000,
        kilometraje: 0,
        centroLogisticoId: 'centro-guid-1',
      };

      service.create(payload).subscribe((res) => {
        expect(res).toEqual(mockVehiculo);
      });

      const req = httpMock.expectOne('/api/v1/vehiculos');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.patente).toBe('AE123CD');
      req.flush(mockVehiculo);
    });
  });

  describe('cambiarEstado', () => {
    it('sends PATCH /api/v1/vehiculos/:id/estado', () => {
      service
        .cambiarEstado(mockVehiculo.id, { estado: 'EnMantenimiento' })
        .subscribe((res) => {
          expect(res).toEqual(mockVehiculo);
        });

      const req = httpMock.expectOne(`/api/v1/vehiculos/${mockVehiculo.id}/estado`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ estado: 'EnMantenimiento' });
      req.flush(mockVehiculo);
    });
  });

  describe('delete', () => {
    it('sends DELETE /api/v1/vehiculos/:id', () => {
      service.delete(mockVehiculo.id).subscribe();

      const req = httpMock.expectOne(`/api/v1/vehiculos/${mockVehiculo.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
