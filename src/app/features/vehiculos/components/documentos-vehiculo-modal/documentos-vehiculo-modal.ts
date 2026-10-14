import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { VehiculoDocumentoService } from '../../services/vehiculo-documento.service';
import {
  TIPOS_DOCUMENTO_VEHICULO,
  getTipoDocumentoInfo,
} from '../../models/vehiculo-documento.models';
import type {
  DocumentoVehiculo,
  SubirDocumentoVehiculoPayload,
  TipoDocumentoOption,
  TipoDocumentoVehiculo,
} from '../../models/vehiculo-documento.models';
import type { Vehiculo } from '../../models/vehiculo.models';

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/pjpeg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Component({
  selector: 'app-documentos-vehiculo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documentos-vehiculo-modal.html',
  styleUrl: './documentos-vehiculo-modal.css',
})
export class DocumentosVehiculoModal implements OnChanges {
  private readonly documentoService = inject(VehiculoDocumentoService);

  @Input() isOpen = false;
  @Input() vehiculo: Vehiculo | null = null;
  @Input() canManage = false;

  @Output() close = new EventEmitter<void>();
  @Output() documentChange = new EventEmitter<void>();

  readonly tiposDocumento = TIPOS_DOCUMENTO_VEHICULO;

  readonly documentos = signal<DocumentoVehiculo[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Upload state
  readonly uploading = signal<boolean>(false);
  readonly uploadProgress = signal<number>(0);
  readonly uploadError = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileError = signal<string | null>(null);
  readonly isDragging = signal<boolean>(false);

  // Upload Form fields
  readonly tipo = signal<TipoDocumentoVehiculo>('Vtv');
  readonly numeroDocumento = signal<string>('');
  readonly fechaEmision = signal<string>('');
  readonly fechaVencimiento = signal<string>('');

  // Per-item actions
  readonly downloadingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.vehiculo) {
      this.resetUploadForm();
      this.error.set(null);
      this.successMessage.set(null);
      this.loadDocumentos();
    }
  }

  loadDocumentos(): void {
    if (!this.vehiculo) return;
    this.loading.set(true);
    this.error.set(null);

    this.documentoService.getDocumentos(this.vehiculo.id).subscribe({
      next: (docs) => {
        this.documentos.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar los documentos del vehículo.');
      },
    });
  }

  getTipoInfo(tipo: string): TipoDocumentoOption {
    return getTipoDocumentoInfo(tipo);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getExpirationBadge(doc: DocumentoVehiculo): { label: string; cssClass: string } {
    if (doc.estaVencido) {
      return { label: 'Vencido', cssClass: 'badge-vencido' };
    }
    if (!doc.fechaVencimiento) {
      return { label: 'Permanente', cssClass: 'badge-permanente' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(doc.fechaVencimiento);
    expDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { label: 'Vencido', cssClass: 'badge-vencido' };
    }
    if (diffDays <= 30) {
      return { label: `Vence en ${diffDays}d`, cssClass: 'badge-alerta' };
    }
    return { label: 'Vigente', cssClass: 'badge-vigente' };
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  validateAndSetFile(file: File): boolean {
    this.selectedFileError.set(null);
    this.uploadError.set(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);

    if (!isAllowedExt && !isAllowedMime) {
      this.selectedFileError.set(
        'Formato no permitido. Solo se aceptan archivos PDF, PNG o JPG/JPEG.'
      );
      this.selectedFile.set(null);
      return false;
    }

    if (file.size <= 0) {
      this.selectedFileError.set('El archivo no puede estar vacío.');
      this.selectedFile.set(null);
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.selectedFileError.set(
        `El archivo supera el tamaño máximo permitido de 5 MB (${this.formatFileSize(file.size)}).`
      );
      this.selectedFile.set(null);
      return false;
    }

    this.selectedFile.set(file);
    return true;
  }

  removeSelectedFile(): void {
    this.selectedFile.set(null);
    this.selectedFileError.set(null);
  }

  onSubmitUpload(): void {
    if (!this.vehiculo) return;

    const file = this.selectedFile();
    if (!file) {
      this.uploadError.set('Debes seleccionar un archivo para adjuntar.');
      return;
    }

    if (!this.tipo()) {
      this.uploadError.set('El tipo de documento es obligatorio.');
      return;
    }

    const emision = this.fechaEmision();
    const vencimiento = this.fechaVencimiento();
    if (emision && vencimiento && vencimiento < emision) {
      this.uploadError.set('La fecha de vencimiento no puede ser anterior a la fecha de emisión.');
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set(null);
    this.successMessage.set(null);

    const payload: SubirDocumentoVehiculoPayload = {
      tipo: this.tipo(),
      numeroDocumento: this.numeroDocumento().trim() || undefined,
      fechaEmision: emision || undefined,
      fechaVencimiento: vencimiento || undefined,
      archivo: file,
    };

    this.documentoService.subirDocumento(this.vehiculo.id, payload).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total || event.loaded;
          const progress = Math.min(99, Math.round((100 * event.loaded) / total));
          this.uploadProgress.set(progress);
        } else if (event instanceof HttpResponse) {
          this.uploading.set(false);
          this.uploadProgress.set(100);
          this.successMessage.set('Documento subido y registrado exitosamente.');
          this.resetUploadForm();
          this.loadDocumentos();
          this.documentChange.emit();
        }
      },
      error: (err: { error?: { detail?: string; title?: string }; status?: number }) => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.uploadError.set(
          err?.error?.detail || err?.error?.title || 'Ocurrió un error al subir el documento.'
        );
      },
    });
  }

  onDownload(doc: DocumentoVehiculo): void {
    if (!this.vehiculo) return;
    this.downloadingId.set(doc.id);
    this.error.set(null);

    this.documentoService.descargarArchivo(this.vehiculo.id, doc.id).subscribe({
      next: (blob) => {
        this.downloadingId.set(null);
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = doc.nombreArchivoOriginal || `documento-${doc.tipo}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        this.downloadingId.set(null);
        this.error.set('No se pudo descargar el archivo.');
      },
    });
  }

  onDelete(doc: DocumentoVehiculo): void {
    if (!this.vehiculo) return;
    const tipoLabel = this.getTipoInfo(doc.tipo).label;
    if (
      !confirm(
        `¿Estás seguro de dar de baja el documento "${tipoLabel}" (${doc.nombreArchivoOriginal})?`
      )
    ) {
      return;
    }

    this.deletingId.set(doc.id);
    this.error.set(null);
    this.successMessage.set(null);

    this.documentoService.darDeBaja(this.vehiculo.id, doc.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.successMessage.set(`El documento "${tipoLabel}" fue dado de baja correctamente.`);
        this.loadDocumentos();
        this.documentChange.emit();
      },
      error: () => {
        this.deletingId.set(null);
        this.error.set('No se pudo dar de baja el documento.');
      },
    });
  }

  resetUploadForm(): void {
    this.selectedFile.set(null);
    this.selectedFileError.set(null);
    this.uploadError.set(null);
    this.uploading.set(false);
    this.uploadProgress.set(0);
    this.tipo.set('Vtv');
    this.numeroDocumento.set('');
    this.fechaEmision.set('');
    this.fechaVencimiento.set('');
  }

  onClose(): void {
    this.resetUploadForm();
    this.error.set(null);
    this.successMessage.set(null);
    this.close.emit();
  }
}
