export const TIPOS_VEHICULO = ['Camion', 'Furgon', 'Utilitario', 'Acoplado'] as const;
export type TipoVehiculoHabilitado = (typeof TIPOS_VEHICULO)[number];

export interface Chofer {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  empleadoLegajo: string;
  centroLogisticoId: string;
  centroLogisticoNombre: string;
  numeroLicencia: string;
  vencimientoLicencia: string;
  estado: 'ACTIVO' | 'INACTIVO' | string;
  habilitaciones: string[];
  esElegibleHoy: boolean;
  motivoNoElegible: string | null;
  fechaAlta: string;
}

export interface ChoferFilter {
  page?: number;
  pageSize?: number;
  centroLogisticoId?: string;
  estado?: string;
  vencerEnDias?: number;
}

export interface CrearChoferRequest {
  empleadoId: string;
  centroLogisticoId: string;
  numeroLicencia: string;
  vencimientoLicencia: string;
  habilitaciones?: string[];
}

export interface ActualizarChoferRequest {
  centroLogisticoId: string;
  numeroLicencia: string;
  vencimientoLicencia: string;
}

export interface ActualizarHabilitacionesRequest {
  tiposVehiculo: string[];
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
