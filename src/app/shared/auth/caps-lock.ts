/**
 * Caps Lock, read — never inferred.
 *
 * One export, no class, no `@Injectable`, no signal, no state: a DI token for
 * a one-line pure function is ceremony that also makes the function untestable
 * without a TestBed.
 *
 * NOT used, and why: polling `document`, diffing `keydown`/`keyup` pairs, and
 * inferring from `event.key` case. All three INFER the modifier instead of
 * reading it, and all three break on IME input, dead keys and mobile keyboards.
 *
 * The `??` fallback is the design's own `e.getModifierState &&` guard, and it
 * is an unreachable line in this suite: jsdom always has the method. It is real
 * insurance for environments that do not, so it is kept and stubbed rather than
 * deleted.
 */
export function capsLockOn(event: KeyboardEvent): boolean {
  return event.getModifierState?.('CapsLock') ?? false;
}
