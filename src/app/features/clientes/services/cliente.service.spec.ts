import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ClienteService } from './cliente.service';
import type {
  Cliente,
  CrearClienteRequest,
  ActualizarClienteRequest,
  PagedResult,
} from '../models/cliente.models';

describe('ClienteService', () => {
  let service: ClienteService;
  let httpMock: HttpTestingController;

  const mockCliente: Cliente = {
    id: 'f1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d',
    razonSocial: 'Distribuidora Pampeana S.A.',
    cuit: '30500010912',
    formattedCuit: '30-50001091-2',
    estado: 'ACTIVO',
    fechaAlta: '2026-10-10T00:00:00Z',
    cantidadContactos: 2,
    cantidadDirecciones: 1,
  };

  const mockPaged: PagedResult<Cliente> = {
    items: [mockCliente],
    totalItems: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClienteService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getClientes', () => {
    it('requests GET without params when empty filter is passed', () => {
      service.getClientes().subscribe((res) => {
        expect(res).toEqual(mockPaged);
      });

      const req = httpMock.expectOne('/api/v1/clientes');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockPaged);
    });

    it('applies query parameters for page, pageSize, search, and estado', () => {
      service
        .getClientes({
          page: 2,
          pageSize: 20,
          search: 'Pampeana',
          estado: 'ACTIVO',
        })
        .subscribe((res) => {
          expect(res.items.length).toBe(1);
        });

      const req = httpMock.expectOne((r) => r.url === '/api/v1/clientes');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('20');
      expect(req.request.params.get('search')).toBe('Pampeana');
      expect(req.request.params.get('estado')).toBe('ACTIVO');
      req.flush(mockPaged);
    });
  });

  describe('getById', () => {
    it('requests GET /api/v1/clientes/:id', () => {
      service.getById(mockCliente.id).subscribe((res) => {
        expect(res).toEqual(mockCliente);
      });

      const req = httpMock.expectOne(`/api/v1/clientes/${mockCliente.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCliente);
    });
  });

  describe('create', () => {
    it('cleans CUIT before sending POST /api/v1/clientes', () => {
      const payload: CrearClienteRequest = {
        razonSocial: ' Nueva Empresa ',
        cuit: '30-50001091-2',
      };

      service.create(payload).subscribe((res) => {
        expect(res).toEqual(mockCliente);
      });

      const req = httpMock.expectOne('/api/v1/clientes');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        razonSocial: 'Nueva Empresa',
        cuit: '30500010912',
      });
      req.flush(mockCliente);
    });
  });

  describe('update', () => {
    it('cleans CUIT before sending PUT /api/v1/clientes/:id', () => {
      const payload: ActualizarClienteRequest = {
        razonSocial: ' Empresa Editada ',
        cuit: '30-50001091-2',
        estado: 'ACTIVO',
      };

      service.update(mockCliente.id, payload).subscribe((res) => {
        expect(res.razonSocial).toBe(mockCliente.razonSocial);
      });

      const req = httpMock.expectOne(`/api/v1/clientes/${mockCliente.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        razonSocial: 'Empresa Editada',
        cuit: '30500010912',
        estado: 'ACTIVO',
      });
      req.flush(mockCliente);
    });
  });

  describe('delete', () => {
    it('sends DELETE /api/v1/clientes/:id', () => {
      service.delete(mockCliente.id).subscribe();

      const req = httpMock.expectOne(`/api/v1/clientes/${mockCliente.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
