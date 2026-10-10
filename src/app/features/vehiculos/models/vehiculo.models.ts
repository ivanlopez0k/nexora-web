export type TipoVehiculo = 'Utilitario' | 'Furgon' | 'Camion' | 'Acoplado';

export type EstadoVehiculo = 'Disponible' | 'EnViaje' | 'EnMantenimiento' | 'Baja';

export interface Vehiculo {
  id: string;
  patente: string;
  formattedPatente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: TipoVehiculo | string;
  capacidad: number;
  kilometraje: number;
  estado: EstadoVehiculo | string;
  centroLogisticoId: string;
  centroLogisticoNombre?: string | null;
  fechaAlta: string;
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

export interface CrearVehiculoRequest {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  capacidad: number;
  kilometraje: number;
  centroLogisticoId: string;
}

export interface ActualizarVehiculoRequest {
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  capacidad: number;
  centroLogisticoId: string;
}

export interface CambiarEstadoVehiculoRequest {
  estado: string;
}

export interface VehiculoFilter {
  page?: number;
  pageSize?: number;
  centroLogisticoId?: string;
  tipo?: string;
  estado?: string;
  search?: string;
}
