import { describe, it, expect } from 'vitest';
import { isIpad, isStandalone, shouldOffer, REOFFER_DAYS } from '../src/game/install';

const DAY = 86400000;
describe('instalar como app en el iPad', () => {
  it('detecta iPad clásico y iPadOS 13+ (que se presenta como Mac táctil)', () => {
    expect(isIpad({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)' }, '')).toBe(true);
    expect(isIpad({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5 }, '')).toBe(true);
  });
  it('no confunde un Mac de escritorio ni un iPhone/Android', () => {
    expect(isIpad({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 }, '')).toBe(false);
    expect(isIpad({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', platform: 'iPhone', maxTouchPoints: 5 }, '')).toBe(false);
    expect(isIpad({ userAgent: 'Mozilla/5.0 (Linux; Android 13)', platform: 'Linux armv8l', maxTouchPoints: 5 }, '')).toBe(false);
  });
  it('?ipad fuerza la detección (pruebas)', () => { expect(isIpad({ userAgent: 'x' }, '?debug&ipad')).toBe(true); });
  it('detecta el modo app', () => {
    expect(isStandalone({ standalone: true }, null)).toBe(true);
    expect(isStandalone({}, { matchMedia: () => ({ matches: true }) })).toBe(true);
    expect(isStandalone({}, { matchMedia: () => ({ matches: false }) })).toBe(false);
    expect(isStandalone({}, null)).toBe(false);
  });
  it('se ofrece solo en iPad fuera del modo app', () => {
    expect(shouldOffer({ ipad: true, standalone: false })).toBe(true);
    expect(shouldOffer({ ipad: false, standalone: false })).toBe(false);
    expect(shouldOffer({ ipad: true, standalone: true })).toBe(false);
  });
  it('si se pospone, vuelve a los 14 días; «no volver a mostrar» es definitivo', () => {
    const now = 1_000_000 * DAY;
    expect(shouldOffer({ ipad: true, standalone: false, state: { dismissedAt: now - 3 * DAY }, now })).toBe(false);
    expect(shouldOffer({ ipad: true, standalone: false, state: { dismissedAt: now - REOFFER_DAYS * DAY }, now })).toBe(true);
    expect(shouldOffer({ ipad: true, standalone: false, state: { never: true, dismissedAt: 0 }, now })).toBe(false);
  });
});
