import { describe, expect, it } from 'vitest';
import { cleanCuit, formatCuit, isValidCuit } from './cuit-validator';

describe('cuit-validator', () => {
  describe('cleanCuit', () => {
    it('removes dashes, dots, and spaces', () => {
      expect(cleanCuit('30-50001091-2')).toBe('30500010912');
      expect(cleanCuit(' 30.50001091.2 ')).toBe('30500010912');
    });
  });

  describe('formatCuit', () => {
    it('formats 11-digit clean CUIT to standard XX-XXXXXXXX-X', () => {
      expect(formatCuit('30500010912')).toBe('30-50001091-2');
    });

    it('returns raw string if not 11 digits', () => {
      expect(formatCuit('123')).toBe('123');
    });
  });

  describe('isValidCuit', () => {
    it('validates correct Argentine CUITs', () => {
      expect(isValidCuit('30-50001091-2')).toBe(true);
      expect(isValidCuit('30500010912')).toBe(true);
      expect(isValidCuit('20-30405060-9')).toBe(true);
    });

    it('rejects null, undefined, and empty string', () => {
      expect(isValidCuit(null)).toBe(false);
      expect(isValidCuit(undefined)).toBe(false);
      expect(isValidCuit('')).toBe(false);
    });

    it('rejects invalid lengths', () => {
      expect(isValidCuit('3050001091')).toBe(false);
      expect(isValidCuit('305000109123')).toBe(false);
    });

    it('rejects invalid prefixes', () => {
      expect(isValidCuit('10-50001091-2')).toBe(false);
      expect(isValidCuit('99-50001091-2')).toBe(false);
    });

    it('rejects invalid check digits', () => {
      expect(isValidCuit('30-50001091-3')).toBe(false);
      expect(isValidCuit('20-30405060-1')).toBe(false);
    });
  });
});
