import { describe, it, expect } from 'vitest';
import { RECIPES, SIMPLE_RECIPES, ALL_RECIPES, RESOURCES, DECOR, AVATAR_LOCKS, lockKey } from '../src/game/constants';
import { recipeStatus, craftDur, stationPlaced, canAfford, recipeOwned } from '../src/game/logic';
import { craftSuggestion } from '../src/game/today';

describe('Taller sencillo', () => {
  const list = Object.entries(SIMPLE_RECIPES);
  it('hay entre 8 y 12 recetas con ids nuevos', () => {
    expect(list.length).toBeGreaterThanOrEqual(8);
    expect(list.length).toBeLessThanOrEqual(12);
    for (const [id] of list) expect(RECIPES[id]).toBeUndefined();
  });
  it('solo usan recursos crudos, en la mesa de trabajo y sin nivel', () => {
    for (const [, r] of list) {
      for (const k of Object.keys(r.in)) expect(RESOURCES[k], k).toBeDefined();
      expect(r.station).toBe('bench');
      expect(r.unlock).toBeUndefined();
      expect(recipeStatus({}, r).ok).toBe(true);
      expect(stationPlaced({}, r.station)).toBe(true);
      expect(r.dur).toBeLessThanOrEqual(120);
    }
  });
  it('producen objetos o prendas que ya existen', () => {
    for (const [, r] of list) {
      const [k, v] = Object.entries(r.out)[0];
      if (k === 'unlock') expect(AVATAR_LOCKS[v]).toBeDefined();
      else expect(DECOR[k]).toBeDefined();
    }
  });
  it('la duración no depende de la Artesanía', () => {
    const hi = { skills: { craft: { xp: 99999 } } };
    for (const [, r] of list) expect(craftDur(hi, r)).toBe(r.dur);
  });
  it('se pueden hacer con la mochila inicial (al menos 6)', () => {
    const inv = { wood: 30, stone: 12, clay: 6, cloth: 6, crystal: 1, flower: 6 };
    expect(list.filter(([, r]) => canAfford(inv, r.in)).length).toBeGreaterThanOrEqual(5);
  });
  it('prenda ya conseguida: recipeOwned', () => {
    const r = SIMPLE_RECIPES.s_catears;
    expect(recipeOwned({}, r)).toBe(false);
    expect(recipeOwned({ unlocks: { [lockKey('hat:4')]: true } }, r)).toBe(true);
    expect(recipeOwned({}, SIMPLE_RECIPES.s_stool)).toBe(false);
  });
  it('Hoy sugiere una receta sencilla por defecto', () => {
    const s = craftSuggestion({ inventory: { wood: 30 } }, {});
    expect(s.kind).toBe('ready');
    expect(SIMPLE_RECIPES[s.id]).toBeDefined();
  });
  it('los datos originales siguen intactos', () => {
    expect(Object.keys(RECIPES).length).toBe(35);
    expect(RECIPES.d_stool).toEqual({ station: 'carpentry', in: { plank: 2 }, out: { d_stool: 1 }, dur: 40 });
    expect(RECIPES.crown.unlock).toEqual({ album: 'mineral' });
    expect(Object.keys(ALL_RECIPES).length).toBe(35 + list.length);
    expect(craftDur({}, RECIPES.d_stool)).toBe(40);
  });
});
