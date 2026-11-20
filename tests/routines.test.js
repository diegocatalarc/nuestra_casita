import { describe, it, expect, beforeAll } from 'vitest';
import { generateWorld } from '../src/game/worldGen';
import { rebuildCollision, ctx, tileBlocked, findPath } from '../src/game/movement';
import { MAP } from '../src/game/constants';
import { CAST } from '../src/game/story/characters';
import { buildRoutines, positionAt, SCHEDULES, CHAT_DIST, hasNews } from '../src/game/story/routines';

const SEEDS = [1, 7, 99, 1234];
const HOURS = Array.from({ length: 24 * 12 }, (_, i) => i / 12); // cada 5 min de juego
const world = (seed) => { const w = generateWorld(seed, {}); rebuildCollision(w, {}, {}, Date.now()); return w; };
const build = (seed) => { world(seed); return buildRoutines(findPath, tileBlocked); };
const free = (x, z) => !tileBlocked(Math.floor(x), Math.floor(z));

describe('rutinas de los vecinos', () => {
  it('hay agenda para los 8 vecinos de CAST', () => {
    expect(Object.keys(SCHEDULES).sort()).toEqual(CAST.map((c) => c.id).sort());
  });

  for (const seed of SEEDS) {
    describe(`mundo con semilla ${seed}`, () => {
      let R;
      beforeAll(() => { R = build(seed); });

      it('todos los puntos de parada de characters.js y de las agendas son transitables (sin moverlos)', () => {
        expect(R.moved).toEqual([]);
        for (const c of CAST) if (c.stops) for (const p of Object.values(c.stops)) expect(free(p.x, p.z)).toBe(true);
        for (const npc of Object.values(R.npcs)) for (const pl of Object.values(npc.places)) if (pl && pl.x !== undefined) expect(free(pl.x, pl.z), `${npc.id} (${pl.x},${pl.z})`).toBe(true);
      });

      it('todas las rutas existen y llegan a tiempo para la siguiente salida', () => {
        expect(R.issues).toEqual([]);
      });

      it('ningún vecino pisa una casilla bloqueada ni cruza un edificio en ningún momento del día (con sol y con lluvia)', () => {
        for (const npc of Object.values(R.npcs)) for (const rain of [false, true]) {
          let prev = null;
          for (let h = 0; h < 24; h += 1 / 60) {
            const p = positionAt(npc, h, rain, {});
            if (!p.hidden) expect(free(p.x, p.z), `${npc.id} ${rain ? 'lluvia' : 'sol'} ${h.toFixed(2)} (${p.x.toFixed(2)},${p.z.toFixed(2)})`).toBe(true);
            if (prev && !prev.hidden && !p.hidden) {
              // el paso entre dos instantes consecutivos no salta más de lo que se camina en 1 min de juego (+margen)
              expect(Math.hypot(p.x - prev.x, p.z - prev.z)).toBeLessThan(2.5);
              // y el segmento recto entre ambos tampoco atraviesa casillas bloqueadas
              for (let k = 1; k < 4; k++) expect(free(prev.x + ((p.x - prev.x) * k) / 4, prev.z + ((p.z - prev.z) * k) / 4)).toBe(true);
            }
            prev = p;
          }
        }
      });

      it('empieza y acaba el día dentro de casa (invisible) y es continuo al dar la vuelta a medianoche', () => {
        for (const npc of Object.values(R.npcs)) for (const rain of [false, true]) {
          const a = positionAt(npc, 0, rain, {}), b = positionAt(npc, 23.99, rain, {});
          expect(a.hidden && b.hidden).toBe(true);
          expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeLessThan(0.01);
        }
      });

      it('con lluvia nadie está al aire libre salvo en el portal de su casa', () => {
        for (const npc of Object.values(R.npcs)) for (const h of HOURS) {
          const p = positionAt(npc, h, true, {});
          if (p.hidden || p.walking) continue;
          expect(Math.hypot(p.x - npc.places.home.x, p.z - npc.places.home.z), `${npc.id} ${h}`).toBeLessThan(0.01);
        }
      });

      it('cada charla tiene a su interlocutor cerca a la mitad del tiempo', () => {
        let chats = 0;
        for (const npc of Object.values(R.npcs)) for (const s of npc.clear) {
          if (s.k !== 'stay' || !s.chat) continue;
          chats++;
          // la mitad del tramo de espera que además cae dentro de la franja en la que el otro también está
          const o = R.npcs[s.chat];
          const hs = HOURS.filter((h) => h >= s.t0 && h < s.t1 && !positionAt(o, h, false, {}).hidden && !positionAt(o, h, false, {}).walking);
          expect(hs.length, `${npc.id}↔${s.chat}`).toBeGreaterThan(6); // al menos 30 min de juego juntos
          for (const h of hs) { const a = positionAt(npc, h, false, {}), b = positionAt(o, h, false, {}); if (Math.hypot(a.x - b.x, a.z - b.z) < CHAT_DIST) { chats += 0; } }
          const together = hs.filter((h) => { const a = positionAt(npc, h, false, {}), b = positionAt(o, h, false, {}); return Math.hypot(a.x - b.x, a.z - b.z) < CHAT_DIST; });
          expect(together.length, `${npc.id}↔${s.chat} juntos`).toBeGreaterThan(4);
        }
        expect(chats).toBeGreaterThan(10);
      });
    });
  }

  it('es determinista: misma hora → misma posición, y aparecen en sitios distintos según la hora', () => {
    const A = build(1), B = build(1);
    for (const id of Object.keys(A.npcs)) for (const h of [6, 9.3, 12.6, 15, 18.4, 21.9]) {
      expect(positionAt(A.npcs[id], h, false, {})).toEqual(positionAt(B.npcs[id], h, false, {}));
    }
    const at = (h) => Object.keys(A.npcs).map((id) => { const p = positionAt(A.npcs[id], h, false, {}); return p.hidden ? 'in' : `${p.x.toFixed(1)},${p.z.toFixed(1)}`; }).join('|');
    expect(new Set([at(7), at(9), at(13), at(16), at(20), at(23)]).size).toBe(6);
    // de noche nadie está fuera
    expect(Object.values(A.npcs).every((n) => positionAt(n, 23.5, false, {}).hidden)).toBe(true);
  });

  it('hasNews: cartas pendientes del motor y capítulos de amistad por reclamar', () => {
    expect(hasNews('rosa', { couple: {} })).toBe(false);
    expect(hasNews('rosa', { couple: { story: { pending: ['rosa'] } } })).toBe(true);
    expect(hasNews('inigo', { couple: { story: { pending: { rosa: true } } } })).toBe(false);
    expect(hasNews('marta', { couple: { friends: { marta: { pts: 0, ch: 0 } } } })).toBe(false);
    expect(hasNews('marta', { couple: { friends: { marta: { pts: 6, ch: 0 } } } })).toBe(true); // nivel 2: capítulo 1 por reclamar
    expect(hasNews('marta', { couple: { friends: { marta: { pts: 6, ch: 1 } } } })).toBe(false);
  });
});
