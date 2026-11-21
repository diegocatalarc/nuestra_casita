import { describe, it, expect } from 'vitest';
import { CHAPTERS } from '../src/game/story/chapters';
import { SCENES } from '../src/game/story/scenes';
import { castById } from '../src/game/story/characters';
import { dueScenes, stepTarget, objectiveFor, arrowAngle, objectivePos, chapterSceneIds } from '../src/game/story/director';

const state = (story) => ({ couple: { story: { chapter: 1, steps: {}, base: {}, claimed: {}, pieces: 0, flags: {}, ...story }, inventory: {}, stats: {}, friends: {} } });
const mark = (c, s) => ({ [c]: { [s]: { done: true } } });

describe('guion de escenas', () => {
  it('cada capítulo tiene intro, un beat por paso y cierre', () => {
    for (const ch of CHAPTERS) {
      expect(SCENES[`${ch.id}.intro`], ch.id + ' intro').toBeTruthy();
      expect(SCENES[`${ch.id}.outro`], ch.id + ' outro').toBeTruthy();
      for (const s of ch.steps) expect(SCENES[`${ch.id}.${s.id}`], `${ch.id}.${s.id}`).toBeTruthy();
    }
    expect(SCENES.prologue).toBeTruthy();
  });
  it('quien habla es el narrador o un vecino del reparto, y no hay páginas vacías', () => {
    for (const [id, sc] of Object.entries(SCENES)) {
      expect(sc.pages.length, id).toBeGreaterThan(0);
      for (const p of sc.pages) { expect(p.who === 'narrator' || castById[p.who], `${id}: ${p.who}`).toBeTruthy(); expect(p.text.length).toBeGreaterThan(10); }
    }
  });
});

describe('director: qué escena toca', () => {
  it('pareja nueva: prólogo + intro del capítulo 1', () => {
    expect(dueScenes(state({}), new Set()).play).toEqual(['prologue', 'c1.intro']);
  });
  it('lo ya visto no se repite', () => {
    expect(dueScenes(state({}), new Set(['prologue', 'c1.intro'])).play).toEqual([]);
  });
  it('al cumplir un paso toca su reacción', () => {
    const r = dueScenes(state({ steps: mark('c1', 'a') }), new Set(['prologue', 'c1.intro']));
    expect(r.play).toEqual(['c1.a']);
  });
  it('quien llega a mitad de capítulo no ve de golpe los pasos ya hechos', () => {
    const r = dueScenes(state({ steps: mark('c1', 'a') }), new Set(['prologue']));
    expect(r.play).toEqual(['c1.intro']);
    expect(r.mark).toContain('c1.a');
  });
  it('capítulo completo: solo el cierre, sin beats', () => {
    const steps = { c1: { a: { done: true }, b: { done: true }, c: { done: true } } };
    expect(dueScenes(state({ steps }), new Set(['prologue', 'c1.intro'])).play).toEqual(['c1.outro']);
  });
  it('pareja avanzada: ni prólogo ni capítulos pasados', () => {
    const r = dueScenes(state({ chapter: 3, claimed: { c1: true, c2: true } }), new Set());
    expect(r.play).toEqual(['c3.intro']);
    expect(r.mark).toContain('prologue');
    for (const id of [...chapterSceneIds(CHAPTERS[0]), ...chapterSceneIds(CHAPTERS[1])]) expect(r.mark).toContain(id);
  });
  it('sin historia no hay escenas', () => {
    expect(dueScenes({ couple: {} }, new Set())).toEqual({ play: [], mark: [] });
  });
});

describe('objetivo y guía', () => {
  it('paso de hablar apunta al vecino; entregar, a quien escribe el capítulo', () => {
    expect(stepTarget(CHAPTERS[0], CHAPTERS[0].steps[0])).toEqual({ npc: 'remedios' });
    expect(stepTarget(CHAPTERS[1], CHAPTERS[1].steps[1])).toEqual({ npc: 'rosa' });
    expect(stepTarget(CHAPTERS[0], CHAPTERS[0].steps[1])).toBeNull();
  });
  it('el objetivo es el primer paso pendiente y luego «recibir recompensa»', () => {
    const o = objectiveFor(state({}));
    expect(o.num).toBe(1); expect(o.npc).toBe('remedios'); expect(o.ready).toBe(false);
    const steps = { c1: { a: { done: true }, b: { done: true }, c: { done: true } } };
    const r = objectiveFor(state({ steps }));
    expect(r.ready).toBe(true); expect(r.npc).toBe('remedios');
  });
  it('sin historia no hay objetivo', () => { expect(objectiveFor({ couple: {} })).toBeNull(); });
  it('posición: usa la viva del vecino y, si no, su puesto de trabajo', () => {
    const o = objectiveFor(state({}));
    expect(objectivePos(o, { remedios: { x: 1, z: 2 } })).toEqual({ x: 1, z: 2 });
    expect(objectivePos(o, {})).toEqual(castById.remedios.stops.work);
  });
  it('flecha: con la cámara base, un objetivo al frente apunta arriba', () => {
    const yaw = Math.PI / 4;
    expect(arrowAngle(-Math.sin(yaw), -Math.cos(yaw), yaw)).toBeCloseTo(0);
    expect(arrowAngle(Math.cos(yaw), -Math.sin(yaw), yaw)).toBeCloseTo(Math.PI / 2);
  });
});
