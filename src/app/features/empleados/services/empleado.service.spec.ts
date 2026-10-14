import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { EmpleadoService } from './empleado.service';
import type {
  Empleado,
  CrearEmpleadoRequest,
  ActualizarEmpleadoRequest,
  AsociarUsuarioRequest,
  PagedResult,
} from '../models/empleado.models';

describe('EmpleadoService', () => {
  let service: EmpleadoService;
  let httpMock: HttpTestingController;

  const mockEmpleado: Empleado = {
    id: 'b6c8f654-e054-47f9-8134-2e652bf195e0',
    nombre: 'Carlos Gardel',
    legajo: 'LEG-100',
    usuarioId: null,
    usuarioEmail: null,
    estado: 'ACTIVO',
    esChofer: false,
    fechaAlta: '2026-10-14T00:00:00Z',
  };

  const mockPaged: PagedResult<Empleado> = {
    items: [mockEmpleado],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmpleadoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EmpleadoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEmpleados', () => {
    it('requests GET without params when empty filter is passed', () => {
      service.getEmpleados().subscribe((res) => {
        expect(res).toEqual(mockPaged);
      });

      const req = httpMock.expectOne('/api/v1/empleados');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockPaged);
    });

    it('attaches pagination and filter params when provided', () => {
      service
        .getEmpleados({
          page: 2,
          pageSize: 25,
          nombre: ' Carlos ',
          legajo: ' LEG-1 ',
          estado: ' ACTIVO ',
        })
        .subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === '/api/v1/empleados' &&
          r.params.get('page') === '2' &&
          r.params.get('pageSize') === '25' &&
          r.params.get('nombre') === 'Carlos' &&
          r.params.get('legajo') === 'LEG-1' &&
          r.params.get('estado') === 'ACTIVO',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaged);
    });
  });

  describe('getById', () => {
    it('requests GET with employee id in path', () => {
      service.getById(mockEmpleado.id).subscribe((res) => {
        expect(res).toEqual(mockEmpleado);
      });

      const req = httpMock.expectOne(`/api/v1/empleados/${mockEmpleado.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEmpleado);
    });
  });

  describe('create', () => {
    it('sends POST with trimmed payload', () => {
      const payload: CrearEmpleadoRequest = {
        nombre: '  Juan Pérez  ',
        legajo: '  EMP-001  ',
      };

      service.create(payload).subscribe((res) => {
        expect(res).toEqual(mockEmpleado);
      });

      const req = httpMock.expectOne('/api/v1/empleados');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        nombre: 'Juan Pérez',
        legajo: 'EMP-001',
      });
      req.flush(mockEmpleado);
    });
  });

  describe('update', () => {
    it('sends PUT with trimmed payload', () => {
      const payload: ActualizarEmpleadoRequest = {
        nombre: '  Juan Carlos  ',
        legajo: '  EMP-002  ',
      };

      service.update(mockEmpleado.id, payload).subscribe((res) => {
        expect(res).toEqual(mockEmpleado);
      });

      const req = httpMock.expectOne(`/api/v1/empleados/${mockEmpleado.id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        nombre: 'Juan Carlos',
        legajo: 'EMP-002',
      });
      req.flush(mockEmpleado);
    });
  });

  describe('delete', () => {
    it('sends DELETE to /api/v1/empleados/:id', () => {
      service.delete(mockEmpleado.id).subscribe();

      const req = httpMock.expectOne(`/api/v1/empleados/${mockEmpleado.id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('asociarUsuario', () => {
    it('sends PUT to /api/v1/empleados/:id/usuario with trimmed usuarioId', () => {
      const payload: AsociarUsuarioRequest = {
        usuarioId: '  92c42c26-5b35-43be-b928-bd5e1b209d84  ',
      };

      service.asociarUsuario(mockEmpleado.id, payload).subscribe((res) => {
        expect(res).toEqual(mockEmpleado);
      });

      const req = httpMock.expectOne(`/api/v1/empleados/${mockEmpleado.id}/usuario`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        usuarioId: '92c42c26-5b35-43be-b928-bd5e1b209d84',
      });
      req.flush(mockEmpleado);
    });
  });
});
