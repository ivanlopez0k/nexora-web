const PATENTE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export function cleanPatente(raw: string): string {
  return (raw || '').replace(/[\s\-]/g, '').toUpperCase();
}

export function isValidPatente(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== 'string') {
    return false;
  }
  const clean = cleanPatente(raw);
  return PATENTE_REGEX.test(clean);
}

export function formatPatente(raw: string): string {
  const clean = cleanPatente(raw);
  if (!isValidPatente(clean)) {
    return raw;
  }

  if (clean.length === 6) {
    return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  }
  return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
}
