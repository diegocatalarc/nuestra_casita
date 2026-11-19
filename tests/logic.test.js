import { describe, it, expect } from 'vitest';
import { mulberry32, hashStr } from '../src/game/rng';
import { generateWorld, riverX, tileAt, idx } from '../src/game/worldGen';
import { dailyOrders, eventsFor, visitorGift, digSpots, dailyQuests, canAfford, priceOf, weekIdx, weekKey, friendLevel, dayUTC } from '../src/game/logic';
import { MAP, TILE, NEIGHBORS, POIS, EXPLORE, TOWN } from '../src/game/constants';
import { fog, resetFog, markCircle, mergeStr, bitsToStr, isExplored, CH } from '../src/game/fog';

describe('rng', () => {
  it('mulberry32 es determinista y está en [0,1)', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 50; i++) { const x = a(); expect(x).toBe(b()); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
  });
  it('hashStr distingue textos', () => { expect(hashStr('a')).not.toBe(hashStr('b')); expect(hashStr('x')).toBe(hashStr('x')); });
});

describe('worldGen', () => {
  const w1 = generateWorld(1234), w2 = generateWorld(1234), w3 = generateWorld(999);
  it('es determinista por semilla', () => {
    expect(Array.from(w1.tiles)).toEqual(Array.from(w2.tiles));
    expect(w1.pois.map((p) => [p.id, p.x, p.z])).toEqual(w2.pois.map((p) => [p.id, p.x, p.z]));
  });
  it('cambia con otra semilla', () => { expect(Array.from(w1.tiles)).not.toEqual(Array.from(w3.tiles)); });
  it('tiene el tamaño del mapa', () => { expect(w1.tiles.length).toBe(MAP * MAP); });
  it('todos los POIs están sobre tierra y dentro del mapa', () => {
    for (const p of w1.pois) {
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(MAP);
      const t = tileAt(w1, Math.floor(p.x), Math.floor(p.z));
      expect([TILE.WATER, TILE.VOID]).not.toContain(t);
    }
  });
  it('el río es continuo en x', () => { for (let z = 1; z < 50; z++) expect(Math.abs(riverX(z) - riverX(z - 1))).toBeLessThan(2.5); });
  it('el pueblo (este) es transitable en la calle', () => {
    const z = 23; for (let x = TOWN[0]; x < TOWN[2]; x += 4) expect(tileAt(w1, x, z)).not.toBe(TILE.WATER);
  });
});

describe('determinismo diario (ambas personas ven lo mismo)', () => {
  const day = '2026-11-18', now = Date.UTC(2026, 10, 18, 12);
  it('pedidos', () => {
    expect(dailyOrders(7, day)).toEqual(dailyOrders(7, day));
    expect(dailyOrders(7, day)).toHaveLength(4);
    for (const o of dailyOrders(7, day)) { expect(o.coins).toBeGreaterThan(0); expect(Object.keys(o.need).length).toBeGreaterThan(0); }
  });
  it('eventos y regalo de visitante', () => {
    expect(eventsFor(7, now, 1)).toEqual(eventsFor(7, now, 1));
    expect(visitorGift(7, day)).toEqual(visitorGift(7, day));
  });
  it('misiones: 3 y estables', () => { expect(dailyQuests(day)).toHaveLength(3); expect(dailyQuests(day)).toEqual(dailyQuests(day)); });
  it('excavaciones', () => { const w = generateWorld(5); expect(digSpots(w, 5, day)).toEqual(digSpots(w, 5, day)); });
  it('el día UTC cambia a medianoche', () => { expect(dayUTC(Date.UTC(2026, 0, 1, 23, 59))).toBe('2026-01-01'); expect(dayUTC(Date.UTC(2026, 0, 2, 0, 0))).toBe('2026-01-02'); });
  it('weekIdx y weekKey cambian a la vez (lunes 00:00 UTC)', () => {
    for (let d = 0; d < 21; d++) { const a = Date.UTC(2026, 10, 1 + d, 23, 59), b = Date.UTC(2026, 10, 2 + d, 0, 0); expect(weekIdx(a) !== weekIdx(b)).toBe(weekKey(a) !== weekKey(b)); }
  });
  it('semanas empiezan en lunes', () => { expect(weekIdx(Date.UTC(2026, 10, 16))).toBe(weekIdx(Date.UTC(2026, 10, 22))); expect(weekIdx(Date.UTC(2026, 10, 23))).toBe(weekIdx(Date.UTC(2026, 10, 16)) + 1); });
});

describe('economía', () => {
  it('canAfford', () => {
    expect(canAfford({ wood: 5 }, { wood: 5 })).toBe(true);
    expect(canAfford({ wood: 4 }, { wood: 5 })).toBe(false);
    expect(canAfford(undefined, { wood: 1 })).toBe(false);
    expect(canAfford({}, {})).toBe(true);
  });
  it('los precios son números no negativos', () => { expect(priceOf('wood', 1, '2026-01-01')).toBeGreaterThanOrEqual(0); });
  it('niveles de amistad crecen con los puntos', () => { expect(friendLevel(0)).toBeLessThanOrEqual(friendLevel(10000)); });
});

describe('niebla', () => {
  it('empieza vacía y se descubre al caminar', () => {
    resetFog();
    expect(isExplored(70, 20)).toBe(false);
    expect(markCircle(70, 20, EXPLORE.radius)).toBe(true);
    expect(isExplored(70, 20)).toBe(true);
    expect(markCircle(70, 20, EXPLORE.radius)).toBe(false);
  });
  it('mezcla lo guardado en la nube sin perder lo local', () => {
    resetFog(); markCircle(10, 10, 5);
    const local = bitsToStr();
    const other = '0'.repeat(CH * CH - 1) + '1';
    expect(mergeStr(other)).toBe(true);
    const merged = bitsToStr();
    for (let i = 0; i < local.length; i++) if (local[i] === '1') expect(merged[i]).toBe('1');
    expect(merged[merged.length - 1]).toBe('1');
  });
  it('mergeStr ignora entradas inválidas', () => { expect(mergeStr(undefined)).toBe(false); expect(mergeStr(5)).toBe(false); });
});

describe('contenido', () => {
  it('ids de POIs únicos', () => { const ids = POIS.map((p) => p.id); expect(new Set(ids).size).toBe(ids.length); });
  it('vecinos definidos', () => { expect(NEIGHBORS.length).toBeGreaterThanOrEqual(3); });
});

import { propFree, touchesVillageProp } from '../src/game/villageProps';
describe('props del pueblo viejo', () => {
  it('un edificio encima de la fuente oculta el prop y las obras nuevas no pueden pisarla', () => {
    expect(propFree('fountain', {})).toBe(true);
    expect(propFree('fountain', { a: { x: 42, z: 18, w: 5, d: 4 } })).toBe(false);
    expect(propFree('fountain', { a: { x: 50, z: 5, w: 3, d: 3 } })).toBe(true);
    expect(touchesVillageProp(42, 18, 5, 4)).toBe(true);
    expect(touchesVillageProp(10, 10, 5, 4)).toBe(false);
  });
});

import { t } from '../src/i18n';
describe('i18n', () => {
  it('fusiona los diccionarios en-*.js (en inglés el idioma por defecto del test)', () => {
    // en el entorno de test no hay navegador: idioma 'en'
    expect(t('Texto de prueba i18n')).toBe('i18n test text');
  });
});
