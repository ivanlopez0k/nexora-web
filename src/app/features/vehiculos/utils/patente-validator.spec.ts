import { describe, expect, it } from 'vitest';
import { cleanPatente, formatPatente, isValidPatente } from './patente-validator';

describe('patente-validator', () => {
  describe('cleanPatente', () => {
    it('normalizes spaces, dashes, and casing', () => {
      expect(cleanPatente('aa 123 bb')).toBe('AA123BB');
      expect(cleanPatente('  abc-123  ')).toBe('ABC123');
    });
  });

  describe('formatPatente', () => {
    it('formats 6-character traditional plates', () => {
      expect(formatPatente('abc123')).toBe('ABC 123');
      expect(formatPatente('ABC 123')).toBe('ABC 123');
    });

    it('formats 7-character Mercosur plates', () => {
      expect(formatPatente('ae123cd')).toBe('AE 123 CD');
      expect(formatPatente('AE-123-CD')).toBe('AE 123 CD');
    });

    it('returns raw string when invalid', () => {
      expect(formatPatente('XYZ')).toBe('XYZ');
    });
  });

  describe('isValidPatente', () => {
    it('accepts valid traditional plates', () => {
      expect(isValidPatente('ABC123')).toBe(true);
      expect(isValidPatente('abc 123')).toBe(true);
      expect(isValidPatente('XYZ-999')).toBe(true);
    });

    it('accepts valid Mercosur plates', () => {
      expect(isValidPatente('AE123CD')).toBe(true);
      expect(isValidPatente('ab 987 cd')).toBe(true);
      expect(isValidPatente('AF-555-GH')).toBe(true);
    });

    it('rejects null, undefined, or empty strings', () => {
      expect(isValidPatente(null)).toBe(false);
      expect(isValidPatente(undefined)).toBe(false);
      expect(isValidPatente('')).toBe(false);
    });

    it('rejects invalid lengths or patterns', () => {
      expect(isValidPatente('123ABC')).toBe(false);
      expect(isValidPatente('A123BCD')).toBe(false);
      expect(isValidPatente('ABC1234')).toBe(false);
    });
  });
});
