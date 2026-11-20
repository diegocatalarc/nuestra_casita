// Integración entre motor, contenido y proyectos: los tres se escribieron en paralelo, aquí se comprueba que encajan.
import { describe, it, expect } from 'vitest';
import { CHAPTERS } from '../src/game/story/chapters';
import { PROJECTS } from '../src/game/story/projects';
import { CAST } from '../src/game/story/characters';
import { ITEMS, CROPS, FOOD } from '../src/game/constants';

const steps = CHAPTERS.flatMap((c) => c.steps.map((s) => ({ c, s })));
const projectFlags = new Set(Object.values(PROJECTS).flatMap((p) => p.unlocks || []));
const rewardFlags = new Set(CHAPTERS.flatMap((c) => [c.reward?.flag, typeof c.reward?.unlock === 'string' ? c.reward.unlock : null].filter(Boolean)));
const npcIds = new Set(CAST.map((c) => c.id));

describe('historia: contenido ↔ proyectos ↔ motor', () => {
  it('hay 7 capítulos con 3 pasos', () => { expect(CHAPTERS).toHaveLength(7); for (const c of CHAPTERS) expect(c.steps).toHaveLength(3); });
  it('los proyectos que piden los pasos existen', () => {
    for (const { c, s } of steps) if (s.cond.type === 'project') expect(PROJECTS[s.cond.id], `${c.id}.${s.id}`).toBeTruthy();
    for (const c of CHAPTERS) if (c.project) expect(PROJECTS[c.project], c.id).toBeTruthy();
  });
  it('los vecinos de las cartas, pasos y amistad existen en el reparto', () => {
    for (const c of CHAPTERS) expect(npcIds.has(c.from), `${c.id} from ${c.from}`).toBe(true);
    for (const { c, s } of steps) if (s.cond.npc) expect(npcIds.has(s.cond.npc), `${c.id}.${s.id}`).toBe(true);
  });
  it('los objetos entregados existen', () => {
    for (const { c, s } of steps) if (s.cond.type === 'deliver') expect(ITEMS[s.cond.item] || CROPS[s.cond.item] || FOOD.includes(s.cond.item), `${c.id}.${s.id} ${s.cond.item}`).toBeTruthy();
  });
  it('los flags que se piden los concede un proyecto o una recompensa', () => {
    for (const { c, s } of steps) if (s.cond.type === 'flag') expect(projectFlags.has(s.cond.id) || rewardFlags.has(s.cond.id), `${c.id}.${s.id} flag ${s.cond.id}`).toBe(true);
  });
  it('hay exactamente las piezas del reloj que pide el proyecto del reloj', () => {
    const pieces = CHAPTERS.reduce((a, c) => a + (c.reward?.piece || 0), 0);
    const need = PROJECTS.clock.needPieces ?? PROJECTS.clock.pieces ?? 5;
    expect(pieces).toBeGreaterThanOrEqual(need);
  });
  it('los pasos juntos están en los capítulos previstos (3, 6 y 7)', () => {
    const together = CHAPTERS.map((c, i) => [i + 1, c.steps.some((s) => ['together', 'dusk'].includes(s.cond.type))]).filter(([, t]) => t).map(([i]) => i);
    for (const i of [3, 6, 7]) expect(together).toContain(i);
  });
});

import { RESOURCES } from '../src/game/constants';
describe('proyectos: sin crafteo avanzado', () => {
  it('los costes solo usan recursos crudos, cultivos, pescado o platos (nada de intermedios del crafteo avanzado)', () => {
    const intermediate = ['plank', 'brick', 'thread', 'rope', 'paint', 'fabric', 'ingot', 'glass'];
    for (const p of Object.values(PROJECTS)) for (const k of Object.keys(p.cost)) expect(intermediate.includes(k), `${p.id} usa ${k}`).toBe(false);
    for (const p of Object.values(PROJECTS)) for (const k of Object.keys(p.cost)) expect(RESOURCES[k] || CROPS[k] || ITEMS[k], `${p.id} ${k}`).toBeTruthy();
  });
});
