import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { VehiculoDocumentoService } from './vehiculo-documento.service';
import type {
  DocumentoVehiculo,
  SubirDocumentoVehiculoPayload,
} from '../models/vehiculo-documento.models';

describe('VehiculoDocumentoService', () => {
  let service: VehiculoDocumentoService;
  let httpMock: HttpTestingController;

  const mockVehiculoId = 'veh-123';
  const mockDocumentoId = 'doc-456';

  const mockDocumento: DocumentoVehiculo = {
    id: mockDocumentoId,
    vehiculoId: mockVehiculoId,
    tipo: 'Vtv',
    numeroDocumento: 'VTV-2026-99',
    fechaEmision: '2026-01-10',
    fechaVencimiento: '2027-01-10',
    nombreArchivoOriginal: 'vtv.pdf',
    contentType: 'application/pdf',
    tamanoBytes: 1048576,
    estado: 'Activo',
    estaVencido: false,
    fechaAlta: '2026-01-10T12:00:00Z',
    urlDescarga: `/api/v1/vehiculos/${mockVehiculoId}/documentos/${mockDocumentoId}/archivo`,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VehiculoDocumentoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(VehiculoDocumentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getDocumentos should request GET /api/v1/vehiculos/:id/documentos', () => {
    service.getDocumentos(mockVehiculoId).subscribe((docs) => {
      expect(docs.length).toBe(1);
      expect(docs[0].id).toBe(mockDocumentoId);
      expect(docs[0].tipo).toBe('Vtv');
    });

    const req = httpMock.expectOne(`/api/v1/vehiculos/${mockVehiculoId}/documentos`);
    expect(req.request.method).toBe('GET');
    req.flush([mockDocumento]);
  });

  it('subirDocumento should send POST multipart/form-data with progress reporting', () => {
    const file = new File(['dummy-content'], 'test-poliza.pdf', { type: 'application/pdf' });
    const payload: SubirDocumentoVehiculoPayload = {
      tipo: 'PolizaSeguro',
      numeroDocumento: 'POL-7788',
      fechaEmision: '2026-02-01',
      fechaVencimiento: '2027-02-01',
      archivo: file,
    };

    let responseReceived: DocumentoVehiculo | undefined;

    service.subirDocumento(mockVehiculoId, payload).subscribe((event) => {
      if (event instanceof HttpResponse) {
        responseReceived = event.body as DocumentoVehiculo;
      }
    });

    const req = httpMock.expectOne(`/api/v1/vehiculos/${mockVehiculoId}/documentos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.reportProgress).toBe(true);

    const formData = req.request.body as FormData;
    expect(formData.get('Tipo')).toBe('PolizaSeguro');
    expect(formData.get('NumeroDocumento')).toBe('POL-7788');
    expect(formData.get('FechaEmision')).toBe('2026-02-01');
    expect(formData.get('FechaVencimiento')).toBe('2027-02-01');
    expect(formData.get('Archivo')).toBeTruthy();

    req.event(new HttpResponse({ status: 201, body: mockDocumento }));
    expect(responseReceived?.id).toBe(mockDocumentoId);
  });

  it('subirDocumento should omit optional fields when not provided', () => {
    const file = new File(['image-bytes'], 'cedula.png', { type: 'image/png' });
    const payload: SubirDocumentoVehiculoPayload = {
      tipo: 'CedulaVerde',
      archivo: file,
    };

    service.subirDocumento(mockVehiculoId, payload).subscribe();

    const req = httpMock.expectOne(`/api/v1/vehiculos/${mockVehiculoId}/documentos`);
    const formData = req.request.body as FormData;
    expect(formData.get('Tipo')).toBe('CedulaVerde');
    expect(formData.get('NumeroDocumento')).toBeNull();
    expect(formData.get('FechaEmision')).toBeNull();
    expect(formData.get('FechaVencimiento')).toBeNull();

    req.flush(mockDocumento, { status: 201, statusText: 'Created' });
  });

  it('descargarArchivo should request GET with responseType blob', () => {
    const mockBlob = new Blob(['pdf-data'], { type: 'application/pdf' });

    service.descargarArchivo(mockVehiculoId, mockDocumentoId).subscribe((blob) => {
      expect(blob).toBeTruthy();
      expect(blob.size).toBe(mockBlob.size);
    });

    const req = httpMock.expectOne(
      `/api/v1/vehiculos/${mockVehiculoId}/documentos/${mockDocumentoId}/archivo`
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(mockBlob);
  });

  it('darDeBaja should request DELETE /api/v1/vehiculos/:id/documentos/:docId', () => {
    service.darDeBaja(mockVehiculoId, mockDocumentoId).subscribe();

    const req = httpMock.expectOne(
      `/api/v1/vehiculos/${mockVehiculoId}/documentos/${mockDocumentoId}`
    );
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
