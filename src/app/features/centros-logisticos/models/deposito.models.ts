export type TipoDeposito = 'General' | 'Refrigerado' | 'Congelado' | 'Peligroso' | 'Seco';

export type EstadoDeposito = 'Activo' | 'Inactivo' | 'Mantenimiento';

export interface Deposito {
  id: string;
  centroLogisticoId: string;
  codigo: string;
  nombre: string;
  tipo: TipoDeposito | string;
  capacidadTotalM3: number;
  capacidadDisponibleM3?: number;
  temperaturaMinima?: number | null;
  temperaturaMaxima?: number | null;
  estado: EstadoDeposito | string;
  fechaAlta: string;
}

export interface CrearDepositoRequest {
  codigo: string;
  nombre: string;
  tipo: TipoDeposito | string;
  capacidadTotalM3: number;
  temperaturaMinima?: number | null;
  temperaturaMaxima?: number | null;
}

export interface ActualizarDepositoRequest {
  codigo: string;
  nombre: string;
  tipo: TipoDeposito | string;
  capacidadTotalM3: number;
  temperaturaMinima?: number | null;
  temperaturaMaxima?: number | null;
}

export interface CambiarEstadoDepositoRequest {
  estado: EstadoDeposito | string;
}

export interface TipoDepositoOption {
  value: TipoDeposito;
  label: string;
  icon: string;
}

export const TIPOS_DEPOSITO: readonly TipoDepositoOption[] = [
  { value: 'General', label: 'Carga General', icon: '📦' },
  { value: 'Refrigerado', label: 'Refrigerado (Frío)', icon: '❄️' },
  { value: 'Congelado', label: 'Congelado', icon: '🧊' },
  { value: 'Peligroso', label: 'Carga Peligrosa / Químico', icon: '⚠️' },
  { value: 'Seco', label: 'Seco / No Perecedero', icon: '🌾' },
] as const;

export function getTipoDepositoInfo(tipo: string): TipoDepositoOption {
  const match = TIPOS_DEPOSITO.find((t) => t.value.toLowerCase() === tipo.toLowerCase());
  return match ?? { value: 'General', label: tipo, icon: '📦' };
}
