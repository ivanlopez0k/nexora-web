import { describe, expect, it } from 'vitest';
import { ROLES, PERMISSION_MAP, hasAnyRole } from './permissions';

describe('permissions matrix', () => {
  it('defines canonical system roles', () => {
    expect(ROLES.SUPER_ADMIN).toBe('SUPER_ADMIN');
    expect(ROLES.ADMIN_EMPRESA).toBe('ADMIN_EMPRESA');
    expect(ROLES.OPERADOR_LOGISTICO).toBe('OPERADOR_LOGISTICO');
    expect(ROLES.ADMINISTRACION).toBe('ADMINISTRACION');
    expect(ROLES.CHOFER).toBe('CHOFER');
  });

  it('maps sections to corresponding authorized roles', () => {
    expect(PERMISSION_MAP.centrosLogisticos).toContain(ROLES.SUPER_ADMIN);
    expect(PERMISSION_MAP.centrosLogisticos).toContain(ROLES.ADMIN_EMPRESA);
    expect(PERMISSION_MAP.centrosLogisticos).not.toContain(ROLES.OPERADOR_LOGISTICO);

    expect(PERMISSION_MAP.clientes).toContain(ROLES.ADMINISTRACION);
    expect(PERMISSION_MAP.clientes).not.toContain(ROLES.OPERADOR_LOGISTICO);

    expect(PERMISSION_MAP.vehiculos).toContain(ROLES.OPERADOR_LOGISTICO);
    expect(PERMISSION_MAP.vehiculos).not.toContain(ROLES.ADMINISTRACION);
  });

  describe('hasAnyRole', () => {
    it('returns false when user has no roles', () => {
      expect(hasAnyRole([], [ROLES.SUPER_ADMIN])).toBe(false);
    });

    it('returns true when user has at least one matching role', () => {
      expect(hasAnyRole([ROLES.ADMINISTRACION], PERMISSION_MAP.clientes)).toBe(true);
      expect(hasAnyRole([ROLES.SUPER_ADMIN], PERMISSION_MAP.centrosLogisticos)).toBe(true);
      expect(hasAnyRole([ROLES.OPERADOR_LOGISTICO], PERMISSION_MAP.vehiculos)).toBe(true);
    });

    it('returns false when user does not have any of the required roles', () => {
      expect(hasAnyRole([ROLES.CHOFER], PERMISSION_MAP.vehiculos)).toBe(false);
      expect(hasAnyRole([ROLES.OPERADOR_LOGISTICO], PERMISSION_MAP.centrosLogisticos)).toBe(false);
      expect(hasAnyRole([ROLES.CLIENTE], PERMISSION_MAP.clientes)).toBe(false);
    });
  });
});
