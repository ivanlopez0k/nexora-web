const MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const VALID_PREFIXES = new Set(['20', '23', '24', '27', '30', '33', '34']);

export function cleanCuit(cuit: string): string {
  return cuit.replace(/[^\d]/g, '');
}

export function formatCuit(rawCuit: string): string {
  const clean = cleanCuit(rawCuit);
  if (clean.length !== 11) {
    return rawCuit;
  }
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
}

export function isValidCuit(rawCuit: string | null | undefined): boolean {
  if (!rawCuit || typeof rawCuit !== 'string') {
    return false;
  }

  const clean = cleanCuit(rawCuit);
  if (clean.length !== 11) {
    return false;
  }

  const prefix = clean.slice(0, 2);
  if (!VALID_PREFIXES.has(prefix)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(clean[i]) * MULTIPLIERS[i];
  }

  const mod = 11 - (sum % 11);
  const expectedCheckDigit = mod === 11 ? 0 : mod === 10 ? 9 : mod;
  const actualCheckDigit = Number(clean[10]);

  return actualCheckDigit === expectedCheckDigit;
}
