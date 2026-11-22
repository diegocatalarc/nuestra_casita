// Arranque del juego: mide cuándo la escena va fluida para mostrar la pantalla de carga hasta entonces.
import { create } from 'zustand';

/** Fotogramas seguidos «buenos» (< 45 ms). Los escribe scene/BootProbe.jsx dentro del Canvas. */
export const boot = { smoothRun: 0, frames: 0, prewarmed: false }; // prewarmed: ya se hizo el segundo precalentamiento de la GPU (ver GameCanvas)
export const SMOOTH_FRAMES = 30;
export const MAX_WAIT_MS = 15000;
export const HARD_WAIT_MS = 30000; // pasado este tiempo se deja entrar aunque el mundo no esté listo (nunca bloquear al jugador)

export function tickBoot(dt) {
  boot.frames++;
  boot.smoothRun = dt < 0.045 ? boot.smoothRun + 1 : 0;
}

const skip = () => { try { return localStorage.getItem('nc_noboot') === '1'; } catch { return false; } };
/** entered: la persona ya pulsó «Entrar» (o se saltó la pantalla, p. ej. en las pruebas automáticas). */
export const useBoot = create(() => ({ entered: skip() }));
export const enterGame = () => useBoot.setState({ entered: true });

/** Estado de la carga (puro, testeable): pasos hechos y si se puede entrar. */
export function bootStatus({ assetsDone, worldReady, smooth, elapsed, prewarmed = true }) {
  const timedOut = elapsed >= MAX_WAIT_MS;
  const world = !!worldReady && !!prewarmed; // «preparar el mundo» incluye subir geometrías y compilar shaders
  const steps = [!!assetsDone, world, !!smooth];
  const done = steps.filter(Boolean).length;
  return { steps, pct: Math.round((done / steps.length) * 100), ready: (assetsDone && world && smooth) || (timedOut && world) || elapsed >= HARD_WAIT_MS, slow: timedOut && !smooth };
}
