export interface Empleado {
  id: string;
  nombre: string;
  legajo: string;
  usuarioId: string | null;
  usuarioEmail?: string | null;
  estado: 'ACTIVO' | 'INACTIVO' | string;
  esChofer: boolean;
  fechaAlta: string;
}

export interface EmpleadoFilter {
  page?: number;
  pageSize?: number;
  nombre?: string;
  legajo?: string;
  estado?: string;
}

export interface CrearEmpleadoRequest {
  nombre: string;
  legajo: string;
  usuarioId?: string | null;
}

export interface ActualizarEmpleadoRequest {
  nombre: string;
  legajo: string;
}

export interface AsociarUsuarioRequest {
  usuarioId: string;
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
