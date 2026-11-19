import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/game/rng';
import { generateWorld, tileAt } from '../src/game/worldGen';
import { cropInfo, animalStats, validateBuilding, validateDecor, decorSize, rollCatch, biteWait, recipeStatus, craftDur, canAfford } from '../src/game/logic';
import { CROPS, ANIMALS, BUILDINGS, DECOR, FISH, FISHING, RECIPES, MAP, TILE } from '../src/game/constants';
import { TIME_SCALE } from '../src/game/time';
import { t } from '../src/i18n';

// Mundo fijo (misma semilla que tests/logic.test.js): todo lo que sale de él es determinista.
const W = generateWorld(1234);
const MIN = 60000;
const emptyState = () => ({ soil: {}, nodes: {}, buildings: {}, decor: {}, crops: {} });
const OPEN = [TILE.GRASS, TILE.MEADOW, TILE.FOREST];

/** Primera casilla (x,z) con el tipo pedido, dentro de los márgenes donde caben edificios. */
function findTile(pred) {
  for (let z = 4; z < MAP - 6; z++) for (let x = 4; x < MAP - 6; x++) if (pred(x, z)) return { x, z };
  return null;
}
/** Rectángulo w×d de terreno abierto, sin nodos de recurso ni props del pueblo, libre de obstáculos. */
function findFreeRect(w, d) {
  return findTile((x, z) => {
    for (let j = z; j < z + d; j++) for (let i = x; i < x + w; i++) {
      if (!OPEN.includes(tileAt(W, i, j)) || W.byTile.has(`${i}_${j}`)) return false;
    }
    return true;
  });
}

describe('cropInfo (etapas del cultivo)', () => {
  const lettuce = { type: 'lettuce', rate: 1 };
  const grow = CROPS.lettuce.growMin * MIN;
  const T0 = 1e12; // marca de riego > 0 (cropInfo trata wateredAt 0 como 'sin regar')

  it('sin regar está en etapa 1 (sembrado) y sin tiempo restante', () => {
    expect(cropInfo(lettuce, 1e12)).toEqual({ stage: 1, p: 0, remaining: null });
  });
  it('cosechado siempre es etapa 5 completa', () => {
    expect(cropInfo({ ...lettuce, harvested: true, wateredAt: 0 }, 0)).toEqual({ stage: 5, p: 1, remaining: 0 });
  });
  it('recién regado está en etapa 2 (regado) con progreso 0', () => {
    const r = cropInfo({ ...lettuce, wateredAt: 1000 }, 1000);
    expect(r.stage).toBe(2); expect(r.p).toBe(0);
  });
  it('a mitad de crecimiento está en etapa 3 con p = 0.5', () => {
    const now = 1000 + (0.5 * grow) / TIME_SCALE;
    const r = cropInfo({ ...lettuce, wateredAt: 1000 }, now);
    expect(r.stage).toBe(3); expect(r.p).toBeCloseTo(0.5, 6);
  });
  it('tras el tiempo de crecimiento está madurado (etapa 4) y el progreso no pasa de 1', () => {
    const r = cropInfo({ ...lettuce, wateredAt: T0 }, T0 + (2 * grow) / TIME_SCALE);
    expect(r.stage).toBe(4); expect(r.p).toBe(1); expect(r.remaining).toBe(0);
  });
  it('el tiempo restante es coherente con el progreso', () => {
    const now = T0 + (0.25 * grow) / TIME_SCALE;
    const r = cropInfo({ ...lettuce, wateredAt: T0 }, now);
    expect(r.remaining).toBeCloseTo((0.75 * grow) / TIME_SCALE, 3);
  });
  it('un invernadero (rate 2) avanza el doble en el mismo tiempo', () => {
    const now = T0 + (0.1 * grow) / TIME_SCALE;
    expect(cropInfo({ ...lettuce, rate: 2, wateredAt: T0 }, now).p).toBeCloseTo(0.2, 6);
    expect(cropInfo({ ...lettuce, rate: 1, wateredAt: T0 }, now).p).toBeCloseTo(0.1, 6);
  });
});

describe('animalStats (hambre, felicidad y producción)', () => {
  const chicken = (extra = {}) => ({ id: 'c1', type: 'chicken', bornAt: 0, ...extra });
  const cycleMs = ANIMALS.chicken.prodMin * MIN;

  it('recién nacido: sin hambre, felicidad 1, no listo y con el ciclo completo por delante', () => {
    const s = animalStats(chicken(), 0);
    expect(s.hunger).toBe(0); expect(s.happy).toBe(1); expect(s.ready).toBe(false); expect(s.readyIn).toBeCloseTo(cycleMs, 0);
    expect(s.def).toBe(ANIMALS.chicken);
  });
  it('hambriento del todo baja la felicidad a 0.2 y no produce aunque haya pasado el ciclo', () => {
    const now = ANIMALS.chicken.hungerMin * MIN;
    const s = animalStats(chicken(), now);
    expect(s.hunger).toBe(1); expect(s.happy).toBeCloseTo(0.2, 6); expect(s.ready).toBe(false);
  });
  it('acariciar en los últimos 10 min sube la felicidad 0.2', () => {
    const now = (ANIMALS.chicken.hungerMin / 2) * MIN; // hambre 0.5 → felicidad base 0.6
    const base = animalStats(chicken(), now).happy;
    const petted = animalStats(chicken({ pettedAt: now - 60000 }), now).happy;
    expect(base).toBeCloseTo(0.6, 6); expect(petted).toBeCloseTo(0.8, 6);
  });
  it('una caricia de hace más de 10 min ya no cuenta', () => {
    const now = (ANIMALS.chicken.hungerMin / 2) * MIN;
    expect(animalStats(chicken({ pettedAt: now - 11 * MIN }), now).happy).toBeCloseTo(0.6, 6);
  });
  it('listo para recoger cuando ha pasado el ciclo y está lo bastante contento', () => {
    const s = animalStats(chicken({ fedAt: cycleMs * 10 }), cycleMs * 10 + cycleMs);
    expect(s.ready).toBe(true); expect(s.readyIn).toBe(0);
  });
  it('desde la última recogida se cuenta el ciclo de nuevo', () => {
    const now = 3 * cycleMs;
    const s = animalStats(chicken({ fedAt: now, lastCollectAt: now - cycleMs / 2 }), now);
    expect(s.ready).toBe(false); expect(s.readyIn).toBeCloseTo(cycleMs / 2, 0);
  });
});

describe('validateBuilding (colocación de edificios)', () => {
  const rect = findFreeRect(BUILDINGS.bedroom.w, BUILDINGS.bedroom.d);
  const T = (k) => t(k);

  it('hay sitio libre de prueba en el mundo fijo', () => { expect(rect).not.toBeNull(); });
  it('un rectángulo libre de hierba se puede construir', () => {
    expect(validateBuilding(W, emptyState(), 'bedroom', rect.x, rect.z, 0)).toEqual({ ok: true });
  });
  it('fuera del terreno (margen de 2 casillas) se rechaza', () => {
    expect(validateBuilding(W, emptyState(), 'bedroom', 1, 10, 0)).toEqual({ ok: false, reason: T('Fuera del terreno') });
  });
  it('una casilla sin comprar (VOID) bloquea la obra', () => {
    const v = findTile((x, z) => tileAt(W, x, z) === TILE.VOID);
    expect(v).not.toBeNull();
    expect(validateBuilding(W, emptyState(), 'bedroom', v.x, v.z, 0).reason).toBe(T('🔒 Terreno sin comprar'));
  });
  it('el agua no es terreno apto', () => {
    const w = findTile((x, z) => tileAt(W, x, z) === TILE.WATER);
    expect(w).not.toBeNull();
    expect(validateBuilding(W, emptyState(), 'bedroom', w.x, w.z, 0).reason).toBe(T('Terreno no apto'));
  });
  it('tierra arada en la huella impide construir', () => {
    const st = emptyState(); st.soil[`${rect.x}_${rect.z}`] = true;
    expect(validateBuilding(W, st, 'bedroom', rect.x, rect.z, 0).reason).toBe(T('Hay tierra arada'));
  });
  it('un edificio que se solapa con otro se rechaza', () => {
    const st = emptyState(); st.buildings.b1 = { x: rect.x + 1, z: rect.z, w: 2, d: 2, type: 'house' };
    expect(validateBuilding(W, st, 'bedroom', rect.x, rect.z, 0).reason).toBe(T('Se solapa con otro edificio'));
  });
  it('un edificio contiguo (sin solapar) sí se permite', () => {
    const st = emptyState(); st.buildings.b1 = { x: rect.x + BUILDINGS.bedroom.w, z: rect.z, w: 2, d: 2, type: 'house' };
    expect(validateBuilding(W, st, 'bedroom', rect.x, rect.z, 0)).toEqual({ ok: true });
  });
  it('un objeto decorativo dentro de la huella impide construir', () => {
    const st = emptyState(); st.decor.d1 = { type: 'table', x: rect.x + 1.5, z: rect.z + 1.5, rot: 0 };
    expect(validateBuilding(W, st, 'bedroom', rect.x, rect.z, 0).reason).toBe(T('Hay objetos decorativos'));
  });
});

describe('validateDecor (colocación de decoración)', () => {
  const cell = findFreeRect(1, 1);
  const cx = cell.x + 0.5, cz = cell.z + 0.5;

  it('una casilla de hierba libre admite un mueble', () => {
    expect(validateDecor(W, emptyState(), 'table', cx, cz, 0, null, 0)).toEqual({ ok: true });
  });
  it('fuera del terreno se rechaza', () => {
    expect(validateDecor(W, emptyState(), 'table', 0.5, 10.5, 0, null, 0).reason).toBe(t('Fuera del terreno'));
  });
  it('no se puede poner sobre el agua', () => {
    const w = findTile((x, z) => tileAt(W, x, z) === TILE.WATER);
    expect(validateDecor(W, emptyState(), 'table', w.x + 0.5, w.z + 0.5, 0, null, 0).reason).toBe(t('No se puede sobre el agua'));
  });
  it('la tierra labrada es para cultivar, no para decorar', () => {
    const st = emptyState(); st.soil[`${cell.x}_${cell.z}`] = true;
    expect(validateDecor(W, st, 'table', cx, cz, 0, null, 0).reason).toBe(t('Esa tierra es para cultivar'));
  });
  it('un cultivo sin cosechar bloquea la casilla; cosechado ya no', () => {
    const st = emptyState(); st.crops[`${cell.x}_${cell.z}`] = { type: 'lettuce', harvested: false };
    expect(validateDecor(W, st, 'table', cx, cz, 0, null, 0).reason).toBe(t('Esa tierra es para cultivar'));
    st.crops[`${cell.x}_${cell.z}`].harvested = true;
    expect(validateDecor(W, st, 'table', cx, cz, 0, null, 0)).toEqual({ ok: true });
  });
  it('otro objeto solapado se rechaza', () => {
    const st = emptyState(); st.decor.a = { type: 'table', x: cx, z: cz, rot: 0 };
    expect(validateDecor(W, st, 'table', cx + 0.1, cz, 0, null, 0).reason).toBe(t('Hay otro objeto'));
  });
  it('al mover un objeto se ignora su propia posición (ignoreId)', () => {
    const st = emptyState(); st.decor.a = { type: 'table', x: cx, z: cz, rot: 0 };
    expect(validateDecor(W, st, 'table', cx, cz, 0, 'a', 0)).toEqual({ ok: true });
  });
  it('decorSize intercambia ancho y fondo al girar 90°', () => {
    expect(decorSize('sofa', 0)).toEqual({ w: DECOR.sofa.w, d: DECOR.sofa.d });
    expect(decorSize('sofa', 1)).toEqual({ w: DECOR.sofa.d, d: DECOR.sofa.w });
    expect(decorSize('sofa', 2)).toEqual({ w: DECOR.sofa.w, d: DECOR.sofa.d });
  });
});

describe('rollCatch y biteWait (pesca)', () => {
  const env = { hour: 12, weather: 'clear', season: 0 };

  it('con rnd = 0 sale basura (el primer tramo es la basura)', () => {
    expect(rollCatch(env, () => 0)).toEqual({ kind: 'junk' });
  });
  it('justo por encima de la probabilidad de basura sale un pez, no una basura', () => {
    expect(rollCatch(env, () => FISHING.junkChance + 0.001, 0).kind).toBe('fish');
  });
  it('un tesoro se obtiene en el tramo siguiente a la basura, escalado por rareMult', () => {
    const r = FISHING.junkChance + FISHING.treasureChance / 2;
    expect(rollCatch(env, () => r, 1)).toEqual({ kind: 'treasure' });
    expect(rollCatch(env, () => r, 0).kind).toBe('fish'); // sin rareza no hay tesoro
  });
  it('el tamaño del pez queda dentro del rango de su especie', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const r = rollCatch(env, mulberry32(seed));
      if (r.kind !== 'fish') continue;
      const [lo, hi] = FISH[r.id].size;
      expect(r.size).toBeGreaterThanOrEqual(lo); expect(r.size).toBeLessThanOrEqual(hi);
    }
  });
  it('misma semilla de azar, mismo resultado (determinismo)', () => {
    expect(rollCatch(env, mulberry32(77))).toEqual(rollCatch(env, mulberry32(77)));
  });
  it('biteWait: rnd = 0 da la espera mínima; al amanecer y con lluvia es más corta', () => {
    expect(biteWait({ hour: 12, weather: 'clear' }, () => 0)).toBeCloseTo(FISHING.waitMin, 6);
    expect(biteWait({ hour: 6, weather: 'clear' }, () => 0)).toBeCloseTo(FISHING.waitMin * 0.7, 6);
    expect(biteWait({ hour: 12, weather: 'rain' }, () => 0)).toBeCloseTo(FISHING.waitMin * 0.75, 6);
  });
});

describe('recipeStatus (recetas bloqueadas)', () => {
  it('una receta sin desbloqueo está siempre disponible', () => {
    expect(recipeStatus({}, RECIPES.plank)).toEqual({ ok: true });
  });
  it('desbloqueo por nivel de Artesanía', () => {
    const r = RECIPES.d_cart; // unlock { lv: 3 }
    expect(recipeStatus({ skills: { craft: 0 } }, r).ok).toBe(false);
    expect(recipeStatus({ skills: { craft: 48 } }, r).ok).toBe(true); // 48 xp → nivel 3
  });
  it('desbloqueo por amistad con un vecino', () => {
    const r = RECIPES.d_swing; // unlock { friend: ['marta', 3] }
    expect(recipeStatus({ friends: {} }, r).ok).toBe(false);
    expect(recipeStatus({ friends: { marta: { pts: 1e9 } } }, r).ok).toBe(true);
  });
  it('desbloqueo por página de álbum completada', () => {
    const r = RECIPES.crown; // unlock { album: 'mineral' }
    expect(recipeStatus({ albumClaimed: {} }, r).ok).toBe(false);
    expect(recipeStatus({ albumClaimed: { mineral: true } }, r).ok).toBe(true);
  });
});

describe('craftDur (duración de recetas con Artesanía)', () => {
  const plank = RECIPES.plank; // dur 15

  it('sin datos de habilidad usa la duración base', () => {
    expect(craftDur(undefined, plank)).toBe(plank.dur);
    expect(craftDur({}, plank)).toBe(plank.dur);
  });
  it('nivel 5 reduce un 16 % la duración', () => {
    expect(craftDur({ skills: { craft: 192 } }, plank)).toBe(Math.round(plank.dur * 0.84)); // 15 → 13
  });
  it('nunca baja de 5 segundos', () => {
    expect(craftDur({ skills: { craft: 1e9 } }, { dur: 6 })).toBe(5);
  });
  it('a más nivel nunca tarda más', () => {
    let prev = Infinity;
    for (const xp of [0, 12, 48, 108, 192, 300, 432, 1200]) {
      const d = craftDur({ skills: { craft: xp } }, plank);
      expect(d).toBeLessThanOrEqual(prev); prev = d;
    }
  });
});

describe('canAfford (coste con inventario ausente)', () => {
  it('sin inventario no se puede pagar nada que cueste algo', () => {
    expect(canAfford(undefined, { wood: 1 })).toBe(false);
    expect(canAfford(null, {})).toBe(true);
  });
});
