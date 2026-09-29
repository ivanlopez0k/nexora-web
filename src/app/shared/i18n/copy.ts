import { copyEs } from './copy.es';

export type Copy = typeof copyEs;

/** The single swap point. No component is locale-aware, so English is a file
 * addition (`copy.en.ts` written `const copyEn: Copy = {...}`) and this one
 * import — not a refactor. `$localize` is deliberately not used. */
export const copy: Copy = copyEs;
