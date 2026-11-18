// Niebla del mapa: se descubre andando. Estado mutable (fuera de React) con una versión que avisa a la UI.
import { MAP, EXPLORE } from './constants';

export const CH = Math.ceil(MAP / EXPLORE.chunk);
export const fog = { bits: new Uint8Array(CH * CH), reveal: new Float32Array(CH * CH), ver: 0, last: '', pending: false, lastWrite: 0 };

export const cidx = (cx, cz) => cz * CH + cx;
export const chunkAt = (x, z) => cidx(Math.min(CH - 1, Math.max(0, Math.floor(x / EXPLORE.chunk))), Math.min(CH - 1, Math.max(0, Math.floor(z / EXPLORE.chunk))));
export const isExplored = (x, z) => !!fog.bits[chunkAt(x, z)];

export const bitsToStr = () => Array.from(fog.bits, (b) => (b ? '1' : '0')).join('');

/** Une el texto guardado en la nube con lo que ya sabe este dispositivo. Devuelve true si algo cambió. */
export function mergeStr(str) {
  if (typeof str !== 'string' || str === fog.last) return false;
  fog.last = str;
  let ch = false;
  for (let i = 0; i < Math.min(str.length, fog.bits.length); i++) if (str[i] === '1' && !fog.bits[i]) { fog.bits[i] = 1; ch = true; }
  if (ch) fog.ver++;
  return ch;
}

/** Marca como descubiertas las celdas que toca el círculo. true si hay alguna nueva. */
export function markCircle(x, z, r) {
  const c = EXPLORE.chunk;
  let ch = false;
  for (let cz = Math.max(0, Math.floor((z - r) / c)); cz <= Math.min(CH - 1, Math.floor((z + r) / c)); cz++) {
    for (let cx = Math.max(0, Math.floor((x - r) / c)); cx <= Math.min(CH - 1, Math.floor((x + r) / c)); cx++) {
      const mx = cx * c + c / 2, mz = cz * c + c / 2;
      if (Math.hypot(mx - x, mz - z) <= r + c * 0.4 && !fog.bits[cidx(cx, cz)]) { fog.bits[cidx(cx, cz)] = 1; ch = true; }
    }
  }
  if (ch) { fog.ver++; fog.pending = true; }
  return ch;
}
export function resetFog() { fog.bits.fill(0); fog.reveal.fill(0); fog.last = ''; fog.pending = false; fog.ver++; }
