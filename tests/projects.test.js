import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PROJECTS, PROJECT_IDS, PROJECT_BY_SITE, projectProgress, projectReady, projectDone, contributable } from '../src/game/story/projects';
import { ITEMS, PRICES } from '../src/game/constants';
import { TOWN_BUILDINGS, TOWN_LANDMARKS } from '../src/game/exploreData';

describe('datos de proyectos', () => {
  it('hay los 7 proyectos del documento', () => {
    expect(PROJECT_IDS.sort()).toEqual(['bakery', 'cafe', 'clock', 'festival', 'fountain', 'school_garden', 'store']);
  });
  it('costes con ítems existentes y cantidades enteras > 0', () => {
    for (const p of Object.values(PROJECTS)) {
      expect(Object.keys(p.cost).length).toBeGreaterThan(0);
      for (const [k, n] of Object.entries(p.cost)) {
        expect(ITEMS[k], `${p.id}:${k}`).toBeDefined();
        expect(Number.isInteger(n) && n > 0).toBe(true);
      }
    }
  });
  it('valor total comparable a un edificio mediano (≈ 100-500 monedas)', () => {
    for (const p of Object.values(PROJECTS)) {
      const v = Object.entries(p.cost).reduce((a, [k, n]) => a + (PRICES[k] ?? 8) * n, 0);
      expect(v, p.id).toBeGreaterThan(100);
      expect(v, p.id).toBeLessThan(500);
    }
  });
  it('cada proyecto apunta a un sitio real y concede flags', () => {
    const sites = new Set([...TOWN_BUILDINGS, ...TOWN_LANDMARKS].map((b) => b.id));
    for (const p of Object.values(PROJECTS)) { expect(sites.has(p.site), p.id).toBe(true); expect(p.unlocks.length).toBeGreaterThan(0); }
    for (const [site, id] of Object.entries(PROJECT_BY_SITE)) expect(PROJECTS[id].site).toBe(site);
  });
  it('el reloj pide 5 piezas y el festival el reloj', () => {
    expect(PROJECTS.clock.needs.pieces).toBe(5);
    expect(PROJECTS.festival.needs.project).toBe('clock');
  });
});

describe('projectProgress / projectReady', () => {
  it('sin estado (partida antigua) → descuidado, 0 %, se puede aportar', () => {
    for (const st of [undefined, null, {}, { projects: null }]) {
      const pr = projectProgress(st, 'fountain');
      expect(pr).toMatchObject({ have: 0, pct: 0, done: false, complete: false });
      expect(pr.total).toBe(21);
    }
    expect(projectProgress({}, 'nope')).toBeNull();
    expect(projectReady({}, 'fountain').ok).toBe(true);
  });
  it('parcial, tope por ítem y completo', () => {
    const st = { projects: { fountain: { have: { stone: 5, clay: 99 } } } };
    const pr = projectProgress(st, 'fountain');
    expect(pr.items.find((i) => i.item === 'clay')).toMatchObject({ have: 6, left: 0 });
    expect(pr.have).toBe(11);
    expect(pr.pct).toBeCloseTo(11 / 21);
    const full = projectProgress({ projects: { fountain: { have: { ...PROJECTS.fountain.cost } } } }, 'fountain');
    expect(full).toMatchObject({ complete: true, done: true, pct: 1 });
    expect(projectDone({ projects: { fountain: { done: true } } }, 'fountain')).toBe(true);
  });
  it('valores raros no rompen (negativos, NaN)', () => {
    expect(projectProgress({ projects: { fountain: { have: { stone: -3, clay: NaN } } } }, 'fountain').have).toBe(0);
  });
  it('el reloj exige piezas; el festival exige el reloj', () => {
    expect(projectReady({ story: { pieces: 4 } }, 'clock')).toMatchObject({ ok: false, reason: 'pieces' });
    expect(projectReady({ story: { pieces: 5 } }, 'clock').ok).toBe(true);
    expect(projectReady({}, 'festival')).toMatchObject({ ok: false, reason: 'project' });
    expect(projectReady({ projects: { clock: { done: true } } }, 'festival').ok).toBe(true);
  });
  it('contributable recorta a mochila, a lo que falta y a ítems del proyecto', () => {
    const st = { projects: { fountain: { have: { stone: 8 } } } };
    expect(contributable(st, 'fountain', 'stone', 10, { stone: 50 })).toBe(2);
    expect(contributable(st, 'fountain', 'stone', 10, { stone: 1 })).toBe(1);
    expect(contributable(st, 'fountain', 'wood', 10, { wood: 9 })).toBe(0);
    expect(contributable(st, 'fountain', 'stone', -4, { stone: 9 })).toBe(0);
  });
});

// ---- acciones, con un backend en memoria que replica la semántica inc/patch ----
const db = { couple: null };
const setDot = (o, path, v) => { const k = path.split('.'); let c = o; for (const p of k.slice(0, -1)) c = c[p] ||= {}; c[k.at(-1)] = v; };
const getDot = (o, path) => path.split('.').reduce((c, p) => c?.[p], o);
const writes = [];
vi.mock('../src/services/backend', () => ({
  getBackend: () => ({
    write: async (_id, ops) => {
      writes.push(ops);
      await Promise.resolve();
      for (const op of ops) {
        if (op.op === 'inc') setDot(db.couple, op.field, (getDot(db.couple, op.field) || 0) + op.by);
        else if (op.op === 'patch') for (const [k, v] of Object.entries(op.data)) setDot(db.couple, k, v);
      }
      useStore.setState({ couple: structuredClone(db.couple) });
    },
  }),
}));
import { useGame as useStore } from '../src/store/gameStore';
import { contribute, syncProjects } from '../src/game/actions/projects';

const reset = (inv, extra = {}) => {
  db.couple = { inventory: { ...inv }, ...extra };
  writes.length = 0;
  useStore.setState({ user: { uid: 'a' }, coupleId: 'c1', couple: structuredClone(db.couple), toast: () => {}, addFx: () => {} });
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe('contribute', () => {
  beforeEach(async () => { await wait(400); reset({ stone: 30, clay: 30, flower: 30 }); });

  it('descuenta de la mochila y suma a have', async () => {
    await contribute('fountain', 'stone', 4);
    expect(db.couple.inventory.stone).toBe(26);
    expect(db.couple.projects.fountain.have.stone).toBe(4);
    expect(db.couple.projects.fountain.done).toBeUndefined();
  });
  it('no aporta de más: recorta a lo que falta', async () => {
    await contribute('fountain', 'clay', 100);
    expect(db.couple.projects.fountain.have.clay).toBe(6);
    expect(db.couple.inventory.clay).toBe(24);
    await wait(400);
    expect(await contribute('fountain', 'clay', 5)).toBe(false);
    expect(db.couple.inventory.clay).toBe(24);
  });
  it('ítem ajeno al proyecto, proyecto inexistente o sin mochila → nada', async () => {
    expect(await contribute('fountain', 'wood', 1)).toBe(false);
    expect(await contribute('nope', 'stone', 1)).toBe(false);
    reset({});
    expect(await contribute('fountain', 'stone', 1)).toBe(false);
    expect(writes).toHaveLength(0);
  });
  it('doble clic: solo una escritura', async () => {
    const r = await Promise.all([contribute('fountain', 'stone', 3), contribute('fountain', 'stone', 3), contribute('fountain', 'stone', 3)]);
    expect(r.filter(Boolean)).toHaveLength(1);
    expect(db.couple.projects.fountain.have.stone).toBe(3);
    expect(db.couple.inventory.stone).toBe(27);
  });
  it('al cubrir todos los costes marca done y concede los flags', async () => {
    await contribute('fountain', 'stone', 10); await wait(400);
    await contribute('fountain', 'clay', 6); await wait(400);
    expect(db.couple.projects.fountain.done).toBeUndefined();
    await contribute('fountain', 'flower', 5);
    expect(db.couple.projects.fountain.done).toBe(true);
    expect(db.couple.projects.fountain.doneAt).toBeGreaterThan(0);
    expect(db.couple.story.flags['town:fountain']).toBe(true);
    expect(projectDone(db.couple, 'fountain')).toBe(true);
    await wait(400);
    expect(await contribute('fountain', 'flower', 1)).toBe(false); // ya terminado
  });
  it('dos personas aportando a la vez suman con inc, sin pisarse', async () => {
    // cada persona aporta con su propia vista del estado; los inc de ambas se aplican al documento
    const view = structuredClone(db.couple);
    const mine = contribute('fountain', 'stone', 4);
    useStore.setState({ user: { uid: 'b' }, couple: view });
    const theirs = contribute('fountain', 'stone', 5);
    await Promise.all([mine, theirs]);
    expect(db.couple.projects.fountain.have.stone).toBe(9);
    expect(db.couple.inventory.stone).toBe(21);
  });
  it('si las dos completan lo último a la vez, syncProjects remata done y flags', async () => {
    await wait(400);
    reset({ stone: 30, clay: 30, flower: 30 }, { projects: { fountain: { have: { stone: 10, clay: 6, flower: 3 } } } });
    const a = structuredClone(db.couple);
    const p1 = contribute('fountain', 'flower', 1);
    useStore.setState({ user: { uid: 'b' }, couple: a });
    const p2 = contribute('fountain', 'flower', 1); // otro dispositivo, otro clave → no coincide el cerrojo local
    await Promise.all([p1, p2]);
    expect(db.couple.projects.fountain.have.flower).toBe(5);
    syncProjects();
    await wait(10);
    expect(db.couple.projects.fountain.done).toBe(true);
    expect(db.couple.story.flags['town:fountain']).toBe(true);
    const n = writes.length;
    syncProjects(); // idempotente: ya no hay nada que hacer
    expect(writes.length).toBe(n);
  });
  it('el reloj no admite aportes sin 5 piezas', async () => {
    reset({ stone: 9, wood: 9, cloth: 9, crystal: 5 }, { story: { pieces: 3 } });
    expect(await contribute('clock', 'stone', 1)).toBe(false);
    db.couple.story.pieces = 5; useStore.setState({ couple: structuredClone(db.couple) });
    expect(await contribute('clock', 'stone', 1)).toBe(true);
  });
});
