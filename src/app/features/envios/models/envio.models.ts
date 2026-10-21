export type EstadoEnvio =
  | 'Solicitado'
  | 'PendienteAprobacion'
  | 'Preparando'
  | 'ListoParaDespacho'
  | 'Asignado'
  | 'EnTransito'
  | 'Entregado'
  | 'ConIncidencia'
  | 'Cancelado';

export interface EnvioListItem {
  id: string;
  numeroSeguimiento: string;
  clienteId: string;
  clienteRazonSocial: string;
  origen: string;
  destino: string;
  estado: EstadoEnvio;
  fechaProgramada: string | null;
  pesoTotalKg: number;
  volumenTotalM3: number;
  cantidadItems: number;
  fechaCreacion: string;
  vehiculoId?: string | null;
  vehiculoPatente?: string | null;
  choferId?: string | null;
  choferNombreCompleto?: string | null;
}

export interface EnvioQueryParams {
  page?: number;
  pageSize?: number;
  estado?: string;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface EnviosMetricas {
  totalEnvios: number;
  enviosActivos: number;
  enTransito: number;
  entregadosHoy: number;
  incidenciasAbiertas: number;
  porcentajeCumplimiento: number;
  enviosPorEstado: Record<string, number>;
}

export interface EstadoConfig {
  label: string;
  badgeClass: string;
  color: string;
}

export const ESTADOS_ENVIO_CONFIG: Record<EstadoEnvio, EstadoConfig> = {
  Solicitado: {
    label: 'Solicitado',
    badgeClass: 'badge-solicitado',
    color: '#a78bfa',
  },
  PendienteAprobacion: {
    label: 'Pendiente Aprobación',
    badgeClass: 'badge-pendiente',
    color: '#facc15',
  },
  Preparando: {
    label: 'Preparando',
    badgeClass: 'badge-preparando',
    color: '#38bdf8',
  },
  ListoParaDespacho: {
    label: 'Listo para Despacho',
    badgeClass: 'badge-listo',
    color: '#818cf8',
  },
  Asignado: {
    label: 'Asignado',
    badgeClass: 'badge-asignado',
    color: '#60a5fa',
  },
  EnTransito: {
    label: 'En Tránsito',
    badgeClass: 'badge-entransito',
    color: '#38bdf8',
  },
  Entregado: {
    label: 'Entregado',
    badgeClass: 'badge-entregado',
    color: '#3dd68c',
  },
  ConIncidencia: {
    label: 'Con Incidencia',
    badgeClass: 'badge-incidencia',
    color: '#fb7185',
  },
  Cancelado: {
    label: 'Cancelado',
    badgeClass: 'badge-cancelado',
    color: '#94a3b8',
  },
};
