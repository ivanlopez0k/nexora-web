import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { EnvioService } from './envio.service';
import type {
  AsignarRecursosEnvioRequest,
  CrearEnvioRequest,
  DespacharEnvioRequest,
  EnvioHistorialEstadoResponse,
  EnvioIncidenciaResponse,
  EnvioListItem,
  EnvioResponse,
  EnviosMetricas,
  PagedResult,
} from '../models/envio.models';

describe('EnvioService', () => {
  let service: EnvioService;
  let httpMock: HttpTestingController;

  const mockEnvio: EnvioListItem = {
    id: 'env-001',
    numeroSeguimiento: 'NEX-2026-0001',
    clienteId: 'cli-001',
    clienteRazonSocial: 'Logística Sur S.A.',
    origen: 'Centro Distribución Norte',
    destino: 'Almacén Central',
    estado: 'EnTransito',
    fechaProgramada: '2026-10-25T10:00:00Z',
    pesoTotalKg: 1250.5,
    volumenTotalM3: 8.2,
    cantidadItems: 42,
    fechaCreacion: '2026-10-20T08:00:00Z',
    vehiculoId: 'veh-001',
    vehiculoPatente: 'AF 123 CD',
    choferId: 'cho-001',
    choferNombreCompleto: 'Carlos Gómez',
  };

  const mockPaged: PagedResult<EnvioListItem> = {
    items: [mockEnvio],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const mockMetricas: EnviosMetricas = {
    totalEnvios: 150,
    enviosActivos: 45,
    enTransito: 18,
    entregadosHoy: 22,
    incidenciasAbiertas: 3,
    porcentajeCumplimiento: 96.5,
    enviosPorEstado: {
      Solicitado: 5,
      Preparando: 10,
      EnTransito: 18,
      Entregado: 110,
      ConIncidencia: 3,
      Cancelado: 4,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EnvioService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EnvioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEnvios', () => {
    it('requests GET /api/v1/envios without query params when empty', () => {
      service.getEnvios().subscribe((res) => {
        expect(res).toEqual(mockPaged);
      });

      const req = httpMock.expectOne('/api/v1/envios');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockPaged);
    });

    it('encodes all query parameters accurately', () => {
      service
        .getEnvios({
          page: 2,
          pageSize: 25,
          search: 'NEX-2026',
          estado: 'EnTransito',
          clienteId: 'cli-001',
          fechaDesde: '2026-10-01',
          fechaHasta: '2026-10-31',
        })
        .subscribe((res) => {
          expect(res.items.length).toBe(1);
        });

      const req = httpMock.expectOne((r) => r.url === '/api/v1/envios');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('25');
      expect(req.request.params.get('search')).toBe('NEX-2026');
      expect(req.request.params.get('estado')).toBe('EnTransito');
      expect(req.request.params.get('clienteId')).toBe('cli-001');
      expect(req.request.params.get('fechaDesde')).toBe('2026-10-01');
      expect(req.request.params.get('fechaHasta')).toBe('2026-10-31');
      req.flush(mockPaged);
    });
  });

  describe('getMetricas', () => {
    it('requests GET /api/v1/envios/metricas without params', () => {
      service.getMetricas().subscribe((res) => {
        expect(res).toEqual(mockMetricas);
      });

      const req = httpMock.expectOne('/api/v1/envios/metricas');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockMetricas);
    });

    it('passes clienteId and fechaReferencia params when supplied', () => {
      service.getMetricas('cli-999', '2026-10-20').subscribe((res) => {
        expect(res.totalEnvios).toBe(150);
      });

      const req = httpMock.expectOne((r) => r.url === '/api/v1/envios/metricas');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('clienteId')).toBe('cli-999');
      expect(req.request.params.get('fechaReferencia')).toBe('2026-10-20');
      req.flush(mockMetricas);
    });
  });

  describe('getEnvioById', () => {
    it('requests GET /api/v1/envios/:id', () => {
      const mockDetalle: EnvioResponse = {
        id: 'env-001',
        numeroSeguimiento: 'NEX-2026-0001',
        clienteId: 'cli-001',
        clienteRazonSocial: 'Logística Sur S.A.',
        origen: 'Centro Distribución Norte',
        destino: 'Almacén Central',
        estado: 'EnTransito',
        fechaProgramada: '2026-10-25T10:00:00Z',
        observaciones: 'Manejar con cuidado',
        pesoTotalKg: 1250.5,
        volumenTotalM3: 8.2,
        cantidadItems: 42,
        fechaCreacion: '2026-10-20T08:00:00Z',
        items: [
          {
            id: 'item-1',
            descripcion: 'Cajas de repuestos',
            pesoKg: 10,
            volumenM3: 0.2,
            cantidad: 5,
            pesoTotalKg: 50,
            volumenTotalM3: 1,
          },
        ],
        vehiculoId: 'veh-001',
        vehiculoPatente: 'AF 123 CD',
        vehiculoModelo: 'Mercedes-Benz Actros',
        choferId: 'cho-001',
        choferNombreCompleto: 'Carlos Gómez',
      };

      service.getEnvioById('env-001').subscribe((res) => {
        expect(res).toEqual(mockDetalle);
      });

      const req = httpMock.expectOne('/api/v1/envios/env-001');
      expect(req.request.method).toBe('GET');
      req.flush(mockDetalle);
    });
  });

  describe('getHistorial', () => {
    it('requests GET /api/v1/envios/:id/historial and returns status change history', () => {
      const mockHistorial: EnvioHistorialEstadoResponse[] = [
        {
          id: 'hist-1',
          envioId: 'env-001',
          estadoAnterior: 'Solicitado',
          estadoNuevo: 'Preparando',
          motivo: 'Iniciando preparación',
          usuario: 'operador1',
          fechaHora: '2026-10-20T09:00:00Z',
        },
        {
          id: 'hist-2',
          envioId: 'env-001',
          estadoAnterior: 'Preparando',
          estadoNuevo: 'Asignado',
          motivo: 'Recursos asignados',
          usuario: 'coordinador',
          fechaHora: '2026-10-20T10:30:00Z',
        },
      ];

      service.getHistorial('env-001').subscribe((res) => {
        expect(res).toEqual(mockHistorial);
        expect(res.length).toBe(2);
      });

      const req = httpMock.expectOne('/api/v1/envios/env-001/historial');
      expect(req.request.method).toBe('GET');
      req.flush(mockHistorial);
    });
  });

  describe('getIncidencias', () => {
    it('requests GET /api/v1/envios/:id/incidencias and returns reported incidents', () => {
      const mockIncidencias: EnvioIncidenciaResponse[] = [
        {
          id: 'inc-1',
          envioId: 'env-001',
          tipo: 'Demora',
          severidad: 'Media',
          estado: 'Abierta',
          descripcion: 'Demora por congestionamiento en ruta nacional 9',
          resolucion: null,
          usuarioReporta: 'chofer_cgomez',
          usuarioResuelve: null,
          fechaReporte: '2026-10-20T11:15:00Z',
          fechaResolucion: null,
        },
      ];

      service.getIncidencias('env-001').subscribe((res) => {
        expect(res).toEqual(mockIncidencias);
        expect(res.length).toBe(1);
      });

      const req = httpMock.expectOne('/api/v1/envios/env-001/incidencias');
      expect(req.request.method).toBe('GET');
      req.flush(mockIncidencias);
    });
  });

  describe('createEnvio', () => {
    it('sends POST request to /api/v1/envios with payload and returns created envio', () => {
      const payload: CrearEnvioRequest = {
        clienteId: 'cli-001',
        origen: 'Centro Distribución Norte',
        destino: 'Almacén Central',
        fechaProgramada: '2026-10-25T14:00:00Z',
        observaciones: 'Frágil',
        items: [
          {
            descripcion: 'Cajas de componentes',
            pesoKg: 10.5,
            volumenM3: 0.5,
            cantidad: 2,
          },
        ],
      };

      const mockResponse: EnvioResponse = {
        id: 'env-999',
        numeroSeguimiento: 'NEX-2026-9999',
        clienteId: 'cli-001',
        clienteRazonSocial: 'Logística Sur S.A.',
        origen: 'Centro Distribución Norte',
        destino: 'Almacén Central',
        estado: 'Solicitado',
        fechaProgramada: '2026-10-25T14:00:00Z',
        observaciones: 'Frágil',
        pesoTotalKg: 21,
        volumenTotalM3: 1,
        cantidadItems: 2,
        fechaCreacion: '2026-10-20T20:00:00Z',
      };

      service.createEnvio(payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/v1/envios');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('asignarRecursos', () => {
    it('sends POST request to /api/v1/envios/:id/asignar with payload and returns updated envio', () => {
      const envioId = 'env-001';
      const payload: AsignarRecursosEnvioRequest = {
        vehiculoId: 'veh-001',
        choferId: 'cho-001',
        motivo: 'Asignación programada de turno mañana',
      };

      const mockResponse: EnvioResponse = {
        id: 'env-001',
        numeroSeguimiento: 'NEX-2026-0001',
        clienteId: 'cli-001',
        clienteRazonSocial: 'Logística Sur S.A.',
        origen: 'Centro Distribución Norte',
        destino: 'Almacén Central',
        estado: 'Asignado',
        fechaProgramada: '2026-10-25T10:00:00Z',
        observaciones: null,
        pesoTotalKg: 1250.5,
        volumenTotalM3: 8.2,
        cantidadItems: 42,
        fechaCreacion: '2026-10-20T08:00:00Z',
        vehiculoId: 'veh-001',
        vehiculoPatente: 'AF 123 CD',
        choferId: 'cho-001',
        choferNombreCompleto: 'Carlos Gómez',
      };

      service.asignarRecursos(envioId, payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`/api/v1/envios/${envioId}/asignar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('despacharEnvio', () => {
    it('sends POST request to /api/v1/envios/:id/despachar with payload and returns updated envio', () => {
      const envioId = 'env-001';
      const payload: DespacharEnvioRequest = {
        motivo: 'Despacho iniciado en horario',
      };

      const mockResponse: EnvioResponse = {
        id: 'env-001',
        numeroSeguimiento: 'NEX-2026-0001',
        clienteId: 'cli-001',
        clienteRazonSocial: 'Logística Sur S.A.',
        origen: 'Centro Distribución Norte',
        destino: 'Almacén Central',
        estado: 'EnTransito',
        fechaProgramada: '2026-10-25T10:00:00Z',
        observaciones: null,
        pesoTotalKg: 1250.5,
        volumenTotalM3: 8.2,
        cantidadItems: 42,
        fechaCreacion: '2026-10-20T08:00:00Z',
        vehiculoId: 'veh-001',
        vehiculoPatente: 'AF 123 CD',
        choferId: 'cho-001',
        choferNombreCompleto: 'Carlos Gómez',
      };

      service.despacharEnvio(envioId, payload).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`/api/v1/envios/${envioId}/despachar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('defaults payload to empty object when request is omitted', () => {
      const envioId = 'env-002';
      const mockResponse: EnvioResponse = {
        id: 'env-002',
        numeroSeguimiento: 'NEX-2026-0002',
        clienteId: 'cli-001',
        clienteRazonSocial: 'Logística Sur S.A.',
        origen: 'CD Norte',
        destino: 'Destino',
        estado: 'EnTransito',
        fechaProgramada: null,
        observaciones: null,
        pesoTotalKg: 100,
        volumenTotalM3: 1,
        cantidadItems: 1,
        fechaCreacion: '2026-10-20T08:00:00Z',
      };

      service.despacharEnvio(envioId).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`/api/v1/envios/${envioId}/despachar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });
});
