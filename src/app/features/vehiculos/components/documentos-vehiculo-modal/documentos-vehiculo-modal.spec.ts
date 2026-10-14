import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DocumentosVehiculoModal } from './documentos-vehiculo-modal';
import { VehiculoDocumentoService } from '../../services/vehiculo-documento.service';
import type { DocumentoVehiculo } from '../../models/vehiculo-documento.models';
import type { Vehiculo } from '../../models/vehiculo.models';

describe('DocumentosVehiculoModal Component', () => {
  let component: DocumentosVehiculoModal;
  let fixture: ComponentFixture<DocumentosVehiculoModal>;
  let mockDocumentoService: {
    getDocumentos: ReturnType<typeof vi.fn>;
    subirDocumento: ReturnType<typeof vi.fn>;
    descargarArchivo: ReturnType<typeof vi.fn>;
    darDeBaja: ReturnType<typeof vi.fn>;
  };

  const mockVehiculo: Vehiculo = {
    id: 'veh-001',
    patente: 'AF123JK',
    formattedPatente: 'AF 123 JK',
    marca: 'Mercedes-Benz',
    modelo: 'Accelo 815',
    anio: 2023,
    tipo: 'Camion',
    capacidad: 5000,
    kilometraje: 45000,
    estado: 'Disponible',
    centroLogisticoId: 'centro-1',
    fechaAlta: '2026-01-01',
  };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  const futureDateIso = futureDate.toISOString().split('T')[0];

  const soonDate = new Date();
  soonDate.setDate(soonDate.getDate() + 15);
  const soonDateIso = soonDate.toISOString().split('T')[0];

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);
  const pastDateIso = pastDate.toISOString().split('T')[0];

  const mockDocs: DocumentoVehiculo[] = [
    {
      id: 'doc-1',
      vehiculoId: 'veh-001',
      tipo: 'Vtv',
      numeroDocumento: 'VTV-2026',
      fechaEmision: '2026-01-01',
      fechaVencimiento: futureDateIso,
      nombreArchivoOriginal: 'vtv.pdf',
      contentType: 'application/pdf',
      tamanoBytes: 1024 * 500, // 500 KB
      estado: 'Activo',
      estaVencido: false,
      fechaAlta: '2026-01-01',
      urlDescarga: '/api/v1/vehiculos/veh-001/documentos/doc-1/archivo',
    },
    {
      id: 'doc-2',
      vehiculoId: 'veh-001',
      tipo: 'PolizaSeguro',
      numeroDocumento: 'POL-999',
      fechaEmision: '2025-01-01',
      fechaVencimiento: soonDateIso,
      nombreArchivoOriginal: 'poliza.png',
      contentType: 'image/png',
      tamanoBytes: 1024 * 1024, // 1 MB
      estado: 'Activo',
      estaVencido: false,
      fechaAlta: '2025-01-01',
      urlDescarga: '/api/v1/vehiculos/veh-001/documentos/doc-2/archivo',
    },
    {
      id: 'doc-3',
      vehiculoId: 'veh-001',
      tipo: 'Ruta',
      numeroDocumento: 'RUTA-888',
      fechaEmision: '2024-01-01',
      fechaVencimiento: pastDateIso,
      nombreArchivoOriginal: 'ruta.jpg',
      contentType: 'image/jpeg',
      tamanoBytes: 2048,
      estado: 'Activo',
      estaVencido: true,
      fechaAlta: '2024-01-01',
      urlDescarga: '/api/v1/vehiculos/veh-001/documentos/doc-3/archivo',
    },
  ];

  beforeEach(async () => {
    mockDocumentoService = {
      getDocumentos: vi.fn().mockReturnValue(of(mockDocs)),
      subirDocumento: vi.fn(),
      descargarArchivo: vi.fn().mockReturnValue(of(new Blob(['test-data']))),
      darDeBaja: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [DocumentosVehiculoModal],
      providers: [
        { provide: VehiculoDocumentoService, useValue: mockDocumentoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentosVehiculoModal);
    component = fixture.componentInstance;
    component.vehiculo = mockVehiculo;
    component.canManage = true;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('loads documents when modal opens (ngOnChanges with isOpen=true)', () => {
    component.isOpen = true;
    component.ngOnChanges({
      isOpen: new SimpleChange(false, true, true),
    });

    expect(mockDocumentoService.getDocumentos).toHaveBeenCalledWith('veh-001');
    expect(component.documentos().length).toBe(3);
  });

  it('renders document items and appropriate expiration badges', () => {
    component.isOpen = true;
    component.documentos.set(mockDocs);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.doc-card');
    expect(cards.length).toBe(3);

    const badges = compiled.querySelectorAll('.expiration-badge');
    expect(badges[0].textContent?.trim()).toBe('Vigente');
    expect(badges[1].textContent?.trim()).toContain('Vence en');
    expect(badges[2].textContent?.trim()).toBe('Vencido');
  });

  it('shows empty state when no documents exist', () => {
    component.isOpen = true;
    component.documentos.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-docs-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Sin documentación registrada');
  });

  it('hides upload section and delete buttons when canManage is false', () => {
    component.isOpen = true;
    component.canManage = false;
    component.documentos.set(mockDocs);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.upload-section')).toBeFalsy();
    expect(compiled.querySelectorAll('.btn-doc-delete').length).toBe(0);
    expect(compiled.querySelectorAll('.btn-doc-download').length).toBe(3);
  });

  it('validates file format and file size correctly', () => {
    // 1. Invalid extension
    const invalidFile = new File(['text'], 'malware.exe', { type: 'application/x-msdownload' });
    expect(component.validateAndSetFile(invalidFile)).toBe(false);
    expect(component.selectedFileError()).toContain('Formato no permitido');

    // 2. File too large (> 5 MB)
    const largeFile = new File(['x'.repeat(100)], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    expect(component.validateAndSetFile(largeFile)).toBe(false);
    expect(component.selectedFileError()).toContain('supera el tamaño máximo');

    // 3. Valid file
    const validFile = new File(['valid'], 'vtv.pdf', { type: 'application/pdf' });
    expect(component.validateAndSetFile(validFile)).toBe(true);
    expect(component.selectedFile()).toBe(validFile);
    expect(component.selectedFileError()).toBeNull();
  });

  it('rejects upload submission if fechaVencimiento < fechaEmision', () => {
    component.isOpen = true;
    const file = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
    component.selectedFile.set(file);
    component.tipo.set('Vtv');
    component.fechaEmision.set('2026-05-10');
    component.fechaVencimiento.set('2026-05-01');

    component.onSubmitUpload();

    expect(component.uploadError()).toContain('no puede ser anterior');
    expect(mockDocumentoService.subirDocumento).not.toHaveBeenCalled();
  });

  it('submits valid document and tracks upload progress', () => {
    component.isOpen = true;
    const file = new File(['pdf-data'], 'doc.pdf', { type: 'application/pdf' });
    component.selectedFile.set(file);
    component.tipo.set('PolizaSeguro');
    component.numeroDocumento.set('POL-1234');
    component.fechaEmision.set('2026-01-01');
    component.fechaVencimiento.set('2027-01-01');

    const progressEvent = { type: HttpEventType.UploadProgress, loaded: 50, total: 100 };
    const responseEvent = new HttpResponse({ status: 201, body: mockDocs[0] });

    mockDocumentoService.subirDocumento.mockReturnValue(of(progressEvent, responseEvent));
    const docChangeSpy = vi.spyOn(component.documentChange, 'emit');

    component.onSubmitUpload();

    expect(mockDocumentoService.subirDocumento).toHaveBeenCalledWith('veh-001', {
      tipo: 'PolizaSeguro',
      numeroDocumento: 'POL-1234',
      fechaEmision: '2026-01-01',
      fechaVencimiento: '2027-01-01',
      archivo: file,
    });
    expect(component.successMessage()).toContain('Documento subido y registrado exitosamente');
    expect(docChangeSpy).toHaveBeenCalled();
  });

  it('downloads file when clicking download action', () => {
    component.isOpen = true;
    const createUrlSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test-url');
    const revokeUrlSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

    component.onDownload(mockDocs[0]);

    expect(mockDocumentoService.descargarArchivo).toHaveBeenCalledWith('veh-001', 'doc-1');
    expect(createUrlSpy).toHaveBeenCalled();
    expect(revokeUrlSpy).toHaveBeenCalledWith('blob:test-url');

    createUrlSpy.mockRestore();
    revokeUrlSpy.mockRestore();
  });

  it('calls darDeBaja on confirmed deletion and reloads documents', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.onDelete(mockDocs[0]);

    expect(mockDocumentoService.darDeBaja).toHaveBeenCalledWith('veh-001', 'doc-1');
    expect(mockDocumentoService.getDocumentos).toHaveBeenCalledWith('veh-001');
    expect(component.successMessage()).toContain('fue dado de baja correctamente');
  });

  it('does not call darDeBaja if deletion was cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.onDelete(mockDocs[0]);

    expect(mockDocumentoService.darDeBaja).not.toHaveBeenCalled();
  });

  it('emits close event and resets form on onClose', () => {
    const closeSpy = vi.spyOn(component.close, 'emit');
    component.selectedFile.set(new File([''], 'test.pdf'));

    component.onClose();

    expect(closeSpy).toHaveBeenCalled();
    expect(component.selectedFile()).toBeNull();
  });
});
