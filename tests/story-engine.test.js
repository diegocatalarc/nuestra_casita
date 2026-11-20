import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FIX } from './fixtures/story-chapters.js';

// ---- Doble del store/commit para probar las acciones sin red ----
const h = vi.hoisted(() => ({ state: null, ops: [] }));
const setDot = (o, path, v) => { const ks = path.split('.'); let c = o; for (const k of ks.slice(0, -1)) c = c[k] ||= {}; c[ks.at(-1)] = v; };
const getDot = (o, path) => path.split('.').reduce((c, k) => c?.[k], o);
vi.mock('../src/game/story/chapters', () => ({ CHAPTERS: FIX }));
vi.mock('../src/game/actions/core', () => ({
  st: () => h.state,
  commit: (ops) => {
    h.ops.push(...ops);
    for (const o of ops) {
      if (o.op === 'inc') setDot(h.state.couple, o.field, (getDot(h.state.couple, o.field) || 0) + o.by);
      else if (o.op === 'patch') for (const [k, v] of Object.entries(o.data)) setDot(h.state.couple, k, JSON.parse(JSON.stringify(v)));
    }
    return Promise.resolve();
  },
  coinOp: (n) => ({ op: 'inc', field: 'coins', by: n }),
  gain: (i, n) => ({ op: 'inc', field: `inventory.${i}`, by: n }),
  heartOps: (n) => [{ op: 'inc', field: 'hearts', by: n }, { op: 'inc', field: 'heartsTotal', by: n }],
  toast: () => {}, logActivity: () => {},
}));
vi.mock('../src/game/audio', () => ({ sfx: () => {} }));
vi.mock('../src/game/runtime', () => ({ me: { x: 60, z: 19.5 }, others: {} }));

import { evalCondition, totalStat, totalsSnapshot, presenceMet } from '../src/game/story/conditions';
import { currentChapter, chapterStatus, canClaim, nextStep } from '../src/game/story/engine';
import { startStory, completeStep, claimStoryChapter, tickStory, storyTalk, resetStoryInflight } from '../src/game/actions/story';

const mk = (couple = {}) => ({ user: { uid: 'u1' }, coupleId: 'c', couple: { inventory: {}, ...couple }, partner: { uid: 'u2', online: false }, env: { hour: 12 }, chatOpen: false });

describe('condiciones', () => {
  it('stat: suma todas las semanas y resta la base', () => {
    const s = mk({ stats: { '2026-W45': { harvest: 4 }, '2026-W46': { harvest: 3 } } });
    expect(totalStat(s.couple, 'harvest')).toBe(7);
    expect(evalCondition({ type: 'stat', metric: 'harvest', n: 5 }, s, { base: { harvest: 4 } })).toEqual({ done: false, progress: 3, target: 5 });
    expect(evalCondition({ type: 'stat', metric: 'harvest', n: 3 }, s, { base: { harvest: 4 } }).done).toBe(true);
    expect(evalCondition({ type: 'stat', metric: 'harvest', n: 3 }, s, {}).progress).toBe(3); // tope = objetivo
    expect(totalsSnapshot(s.couple)).toEqual({ harvest: 7 });
  });
  it('letter cuenta cartas enviadas desde la base', () => {
    const s = mk({ stats: { w: { letter: 5 } } });
    expect(evalCondition({ type: 'letter', n: 3 }, s, { base: { letter: 3 } })).toEqual({ done: false, progress: 2, target: 3 });
    expect(evalCondition({ type: 'letter', n: 2 }, s, { base: { letter: 3 } }).done).toBe(true);
  });
  it('deliver: solo se completa al entregar; el progreso muestra lo que se tiene', () => {
    const s = mk({ inventory: { wheat: 1 } });
    const c = { type: 'deliver', item: 'wheat', n: 2 };
    expect(evalCondition(c, s, {})).toEqual({ done: false, progress: 1, target: 2 });
    expect(evalCondition(c, s, { marked: true }).done).toBe(true);
  });
  it('talk, together y dusk dependen de la marca', () => {
    const s = mk();
    for (const c of [{ type: 'talk', npc: 'rosa' }, { type: 'together', what: 'plaza' }, { type: 'dusk' }]) {
      expect(evalCondition(c, s, {}).done).toBe(false);
      expect(evalCondition(c, s, { marked: true }).done).toBe(true);
    }
  });
  it('friend: nivel de amistad', () => {
    expect(evalCondition({ type: 'friend', npc: 'rosa', level: 2 }, mk({ friends: { rosa: { pts: 0 } } }), {}).done).toBe(false);
    expect(evalCondition({ type: 'friend', npc: 'rosa', level: 2 }, mk({ friends: { rosa: { pts: 100000 } } }), {}).done).toBe(true);
  });
  it('project y flag leen el estado de la pareja', () => {
    expect(evalCondition({ type: 'project', id: 'fountain' }, mk({ projects: { fountain: { done: true } } }), {}).done).toBe(true);
    expect(evalCondition({ type: 'project', id: 'fountain' }, mk({ projects: { fountain: { done: false } } }), {}).done).toBe(false);
    expect(evalCondition({ type: 'flag', id: 'x' }, mk({ story: { flags: { x: true } } }), {}).done).toBe(true);
    expect(evalCondition({ type: 'flag', id: 'x' }, mk(), {}).done).toBe(false);
  });
  it('presencia: plaza, atardecer y pareja desconectada', () => {
    const obs = { partner: { online: true, x: 60, z: 20 }, me: { x: 59, z: 19 }, hour: 19, chatOpen: false };
    expect(presenceMet({ type: 'together', what: 'plaza' }, obs)).toBe(true);
    expect(presenceMet({ type: 'together', what: 'clock' }, obs)).toBe(false);
    expect(presenceMet({ type: 'dusk' }, obs)).toBe(true);
    expect(presenceMet({ type: 'dusk' }, { ...obs, hour: 12 })).toBe(false);
    expect(presenceMet({ type: 'dusk' }, { ...obs, partner: { online: false } })).toBe(false);
  });
});

describe('motor', () => {
  it('estado del capítulo y siguiente paso', () => {
    const s = mk({ stats: { w: { harvest: 5 } }, story: { chapter: 1, base: { harvest: 3 }, steps: { c1: { talk: { done: true } } }, claimed: {} } });
    expect(currentChapter(s, FIX).id).toBe('c1');
    const st = chapterStatus(s, FIX[0]);
    expect(st.steps.map((x) => x.done)).toEqual([true, false, false]);
    expect(st.steps[1].progress).toBe(2);
    expect(nextStep(s, FIX).step.id).toBe('harvest');
    expect(canClaim(s, FIX[0], FIX)).toBe(false);
  });
  it('acepta la forma plana "<cap>.<paso>" de la biblia', () => {
    const s = mk({ story: { chapter: 1, base: {}, steps: { 'c1.talk': { done: true } }, claimed: {} } });
    expect(chapterStatus(s, FIX[0]).steps[0].done).toBe(true);
  });
  it('un capítulo futuro no se puede reclamar', () => {
    const s = mk({ story: { chapter: 1, steps: {}, base: {}, claimed: {} } });
    expect(canClaim(s, FIX[1], FIX)).toBe(false);
  });
});

describe('acciones', () => {
  beforeEach(() => { resetStoryInflight(); h.ops = []; h.state = mk({ inventory: { wheat: 2 }, stats: { w: { harvest: 10, sell: 1 } } }); });

  it('startStory toma la base de contadores y es idempotente', () => {
    startStory(); startStory();
    expect(h.state.couple.story.base).toEqual({ harvest: 10, sell: 1 });
    expect(h.ops.filter((o) => o.op === 'patch').length).toBe(1);
  });

  it('flujo completo: pasos, reclamar, avanzar y no pagar dos veces', () => {
    startStory();
    expect(completeStep('talk', { npc: 'rosa' })).toBe(false);          // vecino equivocado
    expect(storyTalk('remedios')).toBe(true);
    h.state.couple.stats.w.harvest += 3;                                 // 3 cosechas más
    tickStory();                                                         // marca el paso stat
    expect(h.state.couple.story.steps.c1.harvest.done).toBe(true);
    expect(claimStoryChapter('c1')).toBe(false);                              // falta entregar
    expect(completeStep('give')).toBe(true);
    expect(h.state.couple.inventory.wheat).toBe(0);                      // consume el objeto
    h.state.couple.inventory.wheat = 5;
    expect(completeStep('give')).toBe(false);                            // ya hecho: no consume otra vez
    expect(h.state.couple.inventory.wheat).toBe(5);

    h.state.couple.stats.w.sell += 1;                                    // la base del capítulo 2 aún no existe
    expect(claimStoryChapter('c1')).toBe(true);
    expect(claimStoryChapter('c1')).toBe(false);                              // doble clic
    const c = h.state.couple;
    expect(c.coins).toBe(100); expect(c.hearts).toBe(5); expect(c.inventory.wood).toBe(3);
    expect(c.story.pieces).toBe(1); expect(c.story.flags['shop:bakery']).toBe(true);
    expect(c.story.chapter).toBe(2); expect(c.story.claimed.c1).toBe(true);
    expect(c.story.base).toEqual({ harvest: 13, sell: 2 });              // nueva base
    expect(currentChapter(h.state, FIX).id).toBe('c2');
    expect(chapterStatus(h.state, FIX[1]).steps[0].progress).toBe(0);    // lo anterior no cuenta
  });

  it('reclamar sin historia iniciada o con capítulo equivocado no hace nada', () => {
    expect(claimStoryChapter('c1')).toBe(false);
    startStory();
    expect(claimStoryChapter('c2')).toBe(false);
    expect(h.state.couple.coins).toBeUndefined();
  });

  it('together: tickStory marca el paso una sola vez', () => {
    const CH = FIX[1]; CH.steps.push({ id: 'dusk', text: 'x', cond: { type: 'dusk' } });
    h.state.couple.story = { chapter: 2, base: {}, steps: {}, claimed: {} };
    h.state.partner.online = true; h.state.env.hour = 19;
    tickStory(); tickStory();
    expect(h.ops.filter((o) => o.op === 'patch' && 'story.steps.c2.dusk' in o.data).length).toBe(1);
    CH.steps.pop();
  });
});
