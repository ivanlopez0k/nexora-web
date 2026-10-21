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

export interface CrearEnvioItemRequest {
  descripcion: string;
  pesoKg: number;
  volumenM3?: number | null;
  cantidad: number;
}

export interface CrearEnvioRequest {
  clienteId: string;
  origen: string;
  destino: string;
  fechaProgramada?: string | null;
  observaciones?: string | null;
  items: CrearEnvioItemRequest[];
}

export interface AsignarRecursosEnvioRequest {
  vehiculoId: string;
  choferId: string;
  motivo?: string | null;
}

export interface DespacharEnvioRequest {
  motivo?: string | null;
}

export interface EnvioItemResponse {
  id: string;
  descripcion: string;
  pesoKg: number;
  volumenM3?: number | null;
  cantidad: number;
  pesoTotalKg: number;
  volumenTotalM3: number;
}

export interface EnvioHistorialEstadoResponse {
  id: string;
  envioId: string;
  estadoAnterior: string;
  estadoNuevo: string;
  motivo?: string | null;
  usuario: string;
  fechaHora: string;
}

export type TipoIncidencia = 'Mecanica' | 'Clima' | 'Desvio' | 'RechazoEntrega' | 'Accidente' | 'Otro';
export type SeveridadIncidencia = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type EstadoIncidencia = 'Abierta' | 'EnProceso' | 'Resuelta' | 'Desestimada';

export interface ReportarIncidenciaRequest {
  tipo: TipoIncidencia;
  severidad: SeveridadIncidencia;
  descripcion: string;
}

export interface ResolverIncidenciaRequest {
  resolucion: string;
  nuevoEstadoEnvio?: EstadoEnvio | null;
}

export interface TipoIncidenciaOption {
  value: TipoIncidencia;
  label: string;
}

export interface SeveridadIncidenciaOption {
  value: SeveridadIncidencia;
  label: string;
  badgeClass: string;
}

export interface EstadoIncidenciaConfig {
  label: string;
  badgeClass: string;
}

export const TIPOS_INCIDENCIA: TipoIncidenciaOption[] = [
  { value: 'Mecanica', label: 'Falla Mecánica' },
  { value: 'Clima', label: 'Condiciones Climáticas' },
  { value: 'Desvio', label: 'Desvío / Corte de Ruta' },
  { value: 'RechazoEntrega', label: 'Rechazo de Entrega' },
  { value: 'Accidente', label: 'Accidente de Tránsito' },
  { value: 'Otro', label: 'Otro' },
];

export const SEVERIDADES_INCIDENCIA: SeveridadIncidenciaOption[] = [
  { value: 'Baja', label: 'Baja', badgeClass: 'badge-sev-baja' },
  { value: 'Media', label: 'Media', badgeClass: 'badge-sev-media' },
  { value: 'Alta', label: 'Alta', badgeClass: 'badge-sev-alta' },
  { value: 'Critica', label: 'Crítica', badgeClass: 'badge-sev-critica' },
];

export const ESTADOS_INCIDENCIA_CONFIG: Record<string, EstadoIncidenciaConfig> = {
  Abierta: { label: 'Abierta', badgeClass: 'badge-inc-abierta' },
  EnProceso: { label: 'En Proceso', badgeClass: 'badge-inc-en-proceso' },
  Resuelta: { label: 'Resuelta', badgeClass: 'badge-inc-resuelta' },
  Desestimada: { label: 'Desestimada', badgeClass: 'badge-inc-desestimada' },
};

export interface EnvioIncidenciaResponse {
  id: string;
  envioId: string;
  tipo: string;
  severidad: string;
  estado: string;
  descripcion: string;
  resolucion?: string | null;
  usuarioReporta: string;
  usuarioResuelve?: string | null;
  fechaReporte: string;
  fechaResolucion?: string | null;
}

export interface EnvioResponse {
  id: string;
  numeroSeguimiento: string;
  clienteId: string;
  clienteRazonSocial: string;
  origen: string;
  destino: string;
  estado: EstadoEnvio;
  fechaProgramada: string | null;
  observaciones: string | null;
  pesoTotalKg: number;
  volumenTotalM3: number;
  cantidadItems: number;
  fechaCreacion: string;
  items?: EnvioItemResponse[];
  historial?: EnvioHistorialEstadoResponse[] | null;
  incidencias?: EnvioIncidenciaResponse[] | null;
  vehiculoId?: string | null;
  vehiculoPatente?: string | null;
  vehiculoModelo?: string | null;
  choferId?: string | null;
  choferNombreCompleto?: string | null;
  fechaDespacho?: string | null;
  fechaEntrega?: string | null;
}

export interface CrearEnvioItemFormModel {
  descripcion: string;
  pesoKg: number | null;
  volumenM3: number | null;
  cantidad: number;
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
