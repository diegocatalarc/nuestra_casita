import { describe, it, expect } from 'vitest';
import { questsStatus, currentGoal, ordersStatus, todayEvent } from '../src/game/today';

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
});
