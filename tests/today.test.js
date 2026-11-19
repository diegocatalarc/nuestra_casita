import { describe, it, expect } from 'vitest';
import { questsStatus, currentGoal, ordersStatus, todayEvent, craftSuggestion } from '../src/game/today';

describe('today', () => {
  const quests = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }, { id: 'c', title: 'C' }];
  it('questsStatus cuenta respuestas propias y de la pareja', () => {
    const log = { '2026-01-01_a': { answers: { me: {}, you: {} } }, '2026-01-01_b': { answers: { you: {} } }, '2026-01-02_c': { answers: { me: {} } } };
    const s = questsStatus(quests, log, '2026-01-01', 'me', 'you');
    expect(s).toMatchObject({ total: 3, mine: 1, theirs: 2, pending: 2, done: false });
    expect(questsStatus(quests, {}, 'd', 'me', null)).toMatchObject({ mine: 0, theirs: 0, pending: 3 });
  });
  it('currentGoal elige la primera sin reclamar y limita el progreso', () => {
    const goals = [{ id: 'x', metric: 'm', target: 5 }, { id: 'y', metric: 'n', target: 3 }];
    expect(currentGoal(goals, { x: true }, { n: 9 })).toMatchObject({ progress: 3, ready: true, claimed: false, left: 1 });
    expect(currentGoal(goals, {}, {})).toMatchObject({ progress: 0, ready: false, left: 2 });
    expect(currentGoal(goals, { x: true, y: true }, {})).toMatchObject({ claimed: true, left: 0 });
    expect(currentGoal([], {}, {})).toBeNull();
  });
  it('ordersStatus', () => {
    const o = [{ slot: 0 }, { slot: 1 }];
    expect(ordersStatus(o, { 0: 'me' })).toEqual({ done: 1, total: 2, all: false });
    expect(ordersStatus(o, { 0: 'me', 1: 'x' }).all).toBe(true);
    expect(ordersStatus([], {}).all).toBe(false);
  });
  it('todayEvent prioriza festival > estrellas > visitante', () => {
    const f = { emoji: 'F', name: 'Fest' };
    expect(todayEvent({ festival: f, meteor: true, visitor: null }, 12, false).kind).toBe('festival');
    expect(todayEvent({ festival: null, meteor: true, visitor: { emoji: 'V', name: 'N' } }, 22, false)).toMatchObject({ kind: 'meteor', night: true });
    expect(todayEvent({ festival: null, meteor: false, visitor: { emoji: 'V', name: 'N' } }, 12, false)).toMatchObject({ kind: 'visitor', open: true });
    expect(todayEvent({ festival: null, meteor: false, visitor: null }, 12, false)).toBeNull();
  });
  it('craftSuggestion: receta fabricable con la mochila, si no la más cercana, si no nada', () => {
    const recipes = {
      plank: { station: 'bench', in: { wood: 3 }, out: { plank: 2 } },
      brick: { station: 'bench', in: { clay: 3, stone: 1 }, out: { brick: 2 } },
      locked: { station: 'bench', in: { wood: 1 }, out: { x: 1 }, unlock: { lv: 9 } },
      carp: { station: 'carpentry', in: { wood: 1 }, out: { y: 1 } },
    };
    // Con 3 madera se puede fabricar la tabla
    expect(craftSuggestion({ inventory: { wood: 3 } }, {}, recipes)).toEqual({ kind: 'ready', id: 'plank' });
    // Sin nada: la más cercana (ladrillo, faltan 3 arcilla y 1 piedra = 4; tabla faltan 3) → tabla
    expect(craftSuggestion({ inventory: { wood: 1 } }, {}, recipes)).toEqual({ kind: 'close', id: 'plank', lack: [{ key: 'wood', need: 3, have: 1, short: 2 }] });
    // Ladrillo más cercano que la tabla si tiene casi todo
    const near = craftSuggestion({ inventory: { clay: 3 } }, {}, recipes);
    expect(near).toMatchObject({ kind: 'close', id: 'brick' });
    expect(near.lack).toEqual([{ key: 'stone', need: 1, have: 0, short: 1 }]);
    // Sin inventario ni recetas posibles: nada
    expect(craftSuggestion({}, {}, { locked: recipes.locked })).toEqual({ kind: 'none' });
    expect(craftSuggestion(null, null, {})).toEqual({ kind: 'none' });
  });
  it('craftSuggestion ignora estaciones sin colocar', () => {
    const recipes = { carp: { station: 'carpentry', in: { wood: 1 }, out: { y: 1 } } };
    expect(craftSuggestion({ inventory: { wood: 5 } }, {}, recipes)).toEqual({ kind: 'none' });
    expect(craftSuggestion({ inventory: { wood: 5 } }, { a: { type: 'st_carpentry' } }, recipes)).toEqual({ kind: 'ready', id: 'carp' });
  });
});
