export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_EMPRESA: 'ADMIN_EMPRESA',
  OPERADOR_LOGISTICO: 'OPERADOR_LOGISTICO',
  JEFE_DEPOSITO: 'JEFE_DEPOSITO',
  CHOFER: 'CHOFER',
  MANTENIMIENTO: 'MANTENIMIENTO',
  ADMINISTRACION: 'ADMINISTRACION',
  SUPERVISOR: 'SUPERVISOR',
  CLIENTE: 'CLIENTE',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/**
 * Centralized permission matrix mapping application navigation sections
 * to authorized roles, matching backend AuthorizationPolicies.
 */
export const PERMISSION_MAP = {
  centrosLogisticos: [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA],
  clientes: [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA, ROLES.ADMINISTRACION],
  vehiculos: [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA, ROLES.OPERADOR_LOGISTICO],
  empleados: [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA, ROLES.SUPERVISOR],
  choferes: [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA, ROLES.OPERADOR_LOGISTICO, ROLES.SUPERVISOR],
} as const;

export const WRITE_PERMISSION_MAP = {
  empleados: [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA],
  choferes: [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA, ROLES.OPERADOR_LOGISTICO],
  vehiculos: [ROLES.SUPER_ADMIN, ROLES.ADMIN_EMPRESA, ROLES.OPERADOR_LOGISTICO],
} as const;

export type SectionKey = keyof typeof PERMISSION_MAP;

/**
 * Checks whether any of the user's roles matches the required roles for a section.
 */
export function hasAnyRole(userRoles: readonly string[], requiredRoles: readonly string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return requiredRoles.some((required) => userRoles.includes(required));
}
