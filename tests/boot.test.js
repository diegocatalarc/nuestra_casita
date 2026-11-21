import { describe, it, expect } from 'vitest';
import { bootStatus, MAX_WAIT_MS, HARD_WAIT_MS } from '../src/game/boot';

describe('pantalla de carga', () => {
  it('no deja entrar hasta que todo está listo', () => {
    expect(bootStatus({ assetsDone: true, worldReady: true, smooth: false, elapsed: 1000 }).ready).toBe(false);
    expect(bootStatus({ assetsDone: false, worldReady: true, smooth: true, elapsed: 1000 }).ready).toBe(false);
  });
  it('con todo listo, deja entrar y marca el 100 %', () => {
    const s = bootStatus({ assetsDone: true, worldReady: true, smooth: true, elapsed: 500 });
    expect(s.ready).toBe(true); expect(s.pct).toBe(100); expect(s.slow).toBe(false);
  });
  it('tras la espera máxima deja entrar avisando de que va lento, siempre que el mundo exista', () => {
    const s = bootStatus({ assetsDone: true, worldReady: true, smooth: false, elapsed: MAX_WAIT_MS });
    expect(s.ready).toBe(true); expect(s.slow).toBe(true);
    expect(bootStatus({ assetsDone: false, worldReady: false, smooth: false, elapsed: MAX_WAIT_MS }).ready).toBe(false);
  });
  it('nunca bloquea al jugador: tras el tope duro deja entrar aunque nada esté listo', () => {
    expect(bootStatus({ assetsDone: false, worldReady: false, smooth: false, elapsed: HARD_WAIT_MS }).ready).toBe(true);
  });
});
