import { describe, it, expect } from 'vitest';
import { dailyOrders, weeklyOrder, weeklyStatus, weekIdx, sourceHint } from '../src/game/logic';
import { CROPS, CRAFT_ITEMS, PRICES } from '../src/game/constants';

const DAYS = Array.from({ length: 60 }, (_, i) => 20400 + i);
const isCrop = (k) => !!CROPS[k];
const inSeason = (k, s) => CROPS[k].shade || CROPS[k].seasons.includes(s);

describe('pedidos del día', () => {
  it('misma semilla/día/estación → mismo resultado', () => {
    for (const s of [0, 1, 2, 3]) expect(dailyOrders(7, 20500, s)).toEqual(dailyOrders(7, 20500, s));
  });
  it('sin estación sigue funcionando (compatibilidad) y da 4 pedidos', () => {
    expect(dailyOrders(7, 20500)).toHaveLength(4);
    expect(dailyOrders(7, 20500)).toEqual(dailyOrders(7, 20500, undefined));
  });
  it('los cultivos pedidos son de temporada y nunca hay objetos fabricados', () => {
    for (const season of [0, 1, 2, 3]) for (const d of DAYS) for (const o of dailyOrders(3, d, season)) {
      expect(o.coins).toBeGreaterThan(0);
      for (const k of Object.keys(o.need)) {
        expect(CRAFT_ITEMS[k]).toBeUndefined();
        if (isCrop(k)) expect(inSeason(k, season)).toBe(true);
      }
    }
  });
  it('recompensas del mismo orden: monedas ≈ valor × multiplicador (≤ 2.5)', () => {
    for (const o of dailyOrders(3, 20500, 1)) {
      const v = Object.entries(o.need).reduce((a, [k, n]) => a + PRICES[k] * n, 0);
      expect(o.coins).toBeLessThanOrEqual(v * 2.5 + 5);
    }
  });
});

describe('pedido grande semanal', () => {
  const mon = Date.UTC(2026, 10, 16); // lunes
  it('estable dentro de la semana y cambia a la siguiente', () => {
    const a = weeklyOrder(5, mon, 1);
    for (let d = 0; d < 7; d++) expect(weeklyOrder(5, mon + d * 86400000 + 3600000, 1)).toEqual(a);
    const seen = new Set();
    for (let w = 0; w < 12; w++) seen.add(JSON.stringify(weeklyOrder(5, mon + w * 7 * 86400000, 1).need));
    expect(seen.size).toBeGreaterThan(6);
    expect(weekIdx(mon + 7 * 86400000)).toBe(weekIdx(mon) + 1);
  });
  it('cultivos de temporada, más cantidad que un pedido normal y mejor recompensa', () => {
    for (const season of [0, 1, 2, 3]) for (let w = 0; w < 30; w++) {
      const o = weeklyOrder(9, mon + w * 7 * 86400000, season);
      const crops = Object.keys(o.need).filter(isCrop);
      expect(crops).toHaveLength(2);
      for (const k of crops) { expect(inSeason(k, season)).toBe(true); expect(o.need[k]).toBeGreaterThanOrEqual(6); }
      expect(o.hearts).toBeGreaterThan(6);
    }
  });
  it('progreso cooperativo: suma lo de las dos personas y usa el pedido guardado', () => {
    const w = weeklyOrder(5, mon, 1), [a, b] = Object.keys(w.need);
    const couple = { seed: 5, members: ['u1', 'u2'], orders: { [w.key]: { need: w.need, u1: { [a]: 3 }, u2: { [a]: w.need[a] - 3 } } } };
    const st = weeklyStatus(couple, mon, 2); // otra estación: manda el guardado
    expect(st.need).toEqual(w.need);
    expect(st.given[a]).toBe(w.need[a]);
    expect(st.given[b]).toBe(0);
    expect(st.complete).toBe(false);
  });
});

describe('pistas', () => {
  it('hay pista para cultivos, peces y huevos', () => {
    expect(sourceHint('carrot', 0).emoji).toBe('🌱');
    expect(sourceHint('trout').emoji).toBe('🎣');
    expect(sourceHint('egg')).not.toBeNull();
  });
});
