export type TipoDocumentoVehiculo =
  | 'CedulaVerde'
  | 'Vtv'
  | 'PolizaSeguro'
  | 'HabilitacionEspecial'
  | 'Ruta'
  | 'Otro';

export interface DocumentoVehiculo {
  id: string;
  vehiculoId: string;
  tipo: TipoDocumentoVehiculo | string;
  numeroDocumento?: string | null;
  fechaEmision?: string | null;
  fechaVencimiento?: string | null;
  nombreArchivoOriginal: string;
  contentType: string;
  tamanoBytes: number;
  estado: string;
  estaVencido: boolean;
  fechaAlta: string;
  urlDescarga: string;
}

export interface SubirDocumentoVehiculoPayload {
  tipo: TipoDocumentoVehiculo;
  numeroDocumento?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  archivo: File;
}

export interface TipoDocumentoOption {
  value: TipoDocumentoVehiculo;
  label: string;
  icon: string;
}

export const TIPOS_DOCUMENTO_VEHICULO: readonly TipoDocumentoOption[] = [
  { value: 'CedulaVerde', label: 'Cédula Verde', icon: '📋' },
  { value: 'Vtv', label: 'VTV / RTO', icon: '🔍' },
  { value: 'PolizaSeguro', label: 'Póliza de Seguro', icon: '🛡️' },
  { value: 'HabilitacionEspecial', label: 'Habilitación Especial', icon: '⭐' },
  { value: 'Ruta', label: 'R.U.T.A.', icon: '🚚' },
  { value: 'Otro', label: 'Otro Documento', icon: '📄' },
] as const;

export function getTipoDocumentoInfo(tipo: string): TipoDocumentoOption {
  const match = TIPOS_DOCUMENTO_VEHICULO.find((t) => t.value.toLowerCase() === tipo.toLowerCase());
  return match ?? { value: 'Otro', label: tipo, icon: '📄' };
}
