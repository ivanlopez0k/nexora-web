export interface Cliente {
  id: string;
  razonSocial: string;
  cuit: string;
  formattedCuit: string;
  estado: 'ACTIVO' | 'INACTIVO' | string;
  fechaAlta: string;
  cantidadContactos: number;
  cantidadDirecciones: number;
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

export interface CrearClienteRequest {
  razonSocial: string;
  cuit: string;
}

export interface ActualizarClienteRequest {
  razonSocial: string;
  cuit: string;
  estado?: string;
}

export interface ClienteFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
}
