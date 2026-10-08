import { capsLockOn } from './caps-lock';

describe('capsLockOn', () => {
  it('reports Caps Lock ON when the modifier is set', () => {
    expect(capsLockOn(new KeyboardEvent('keyup', { modifierCapsLock: true }))).toBe(true);
  });

  it('reports Caps Lock OFF when the modifier is unset', () => {
    expect(capsLockOn(new KeyboardEvent('keyup', { modifierCapsLock: false }))).toBe(false);
  });

  it('reads the modifier, not the key case — a shifted key is not Caps Lock', () => {
    const event = new KeyboardEvent('keyup', { shiftKey: true, key: 'N' });
    expect(event.getModifierState('Shift')).toBe(true);
    expect(capsLockOn(event)).toBe(false);
  });

  it('falls back to false where the environment has no getModifierState', () => {
    // The branch is unreachable in jsdom and acknowledged as such. `delete` on
    // the instance would NOT reach it — the method lives on the prototype — so
    // the stub shadows it with `undefined` instead.
    const event = new KeyboardEvent('keyup');
    Object.defineProperty(event, 'getModifierState', { value: undefined, configurable: true });
    expect(capsLockOn(event)).toBe(false);
  });
});
