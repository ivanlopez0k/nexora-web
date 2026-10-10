export interface CentroLogistico {
  id: string;
  nombre: string;
  provincia: string;
  estado: 'Activo' | 'Inactivo' | string;
  fechaCreacionUtc: string;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CrearCentroLogisticoRequest {
  nombre: string;
  provincia: string;
}

export interface ActualizarCentroLogisticoRequest {
  nombre: string;
  provincia: string;
  estado?: string;
}

export interface CentroLogisticoFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  soloActivos?: boolean;
}
