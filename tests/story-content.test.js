import { describe, it, expect } from 'vitest';
import { CHAPTERS, CONDITION_TYPES, STAT_METRICS } from '../src/game/story/chapters';
import { lineFor, firstMeeting, GREETINGS, STORIES_NEW, LINES_PER_NPC } from '../src/game/story/dialogue';
import { CAST } from '../src/game/story/characters';
import { ITEMS, CROPS, STORIES } from '../src/game/constants';

const NPCS = CAST.map((c) => c.id);
import { PROJECTS as PROJECT_DATA } from '../src/game/story/projects';
const PROJECTS = Object.keys(PROJECT_DATA); // los ids reales (antes una lista a mano que se desincronizó)
const LOOP = ['harvest', 'sell', 'order'];

describe('chapters', () => {
  it('son 7, con ids únicos y 3 pasos cada uno', () => {
    expect(CHAPTERS).toHaveLength(7);
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(7);
    for (const c of CHAPTERS) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(NPCS).toContain(c.from);
      expect(PROJECTS).toContain(c.project);
      expect(c.steps).toHaveLength(3);
      expect(new Set(c.steps.map((s) => s.id)).size).toBe(3);
      expect(c.id).not.toContain('.');
      const frases = c.letter.split(/[.!?…]+\s/).filter((x) => x.trim().length > 3).length;
      expect(frases).toBeGreaterThanOrEqual(3);
      expect(frases).toBeLessThanOrEqual(8);
    }
  });
  it('condiciones conocidas y con ítems/métricas existentes', () => {
    for (const c of CHAPTERS) for (const s of c.steps) {
      expect(s.text.length).toBeGreaterThan(0);
      expect(CONDITION_TYPES).toContain(s.cond.type);
      if (s.cond.type === 'stat') { expect(STAT_METRICS).toContain(s.cond.metric); expect(s.cond.n).toBeGreaterThan(0); }
      if (s.cond.type === 'deliver') { expect(ITEMS[s.cond.item]).toBeTruthy(); expect(s.cond.n).toBeGreaterThan(0); }
      if (s.cond.type === 'talk' || s.cond.type === 'friend') expect(NPCS).toContain(s.cond.npc);
      if (s.cond.type === 'friend') expect(s.cond.level).toBeGreaterThanOrEqual(1);
      if (s.cond.type === 'project') expect(PROJECTS).toContain(s.cond.id);
      if (s.cond.type === 'together') expect(['plaza', 'bench', 'chat', 'clock']).toContain(s.cond.what);
      if (s.cond.type === 'letter') expect(s.cond.n).toBeGreaterThan(0);
    }
  });
  it('cada capítulo usa el bucle de siempre (cosechar, vender o pedidos) o entrega cultivos', () => {
    for (const c of CHAPTERS) {
      const ok = c.steps.some((s) => (s.cond.type === 'stat' && LOOP.includes(s.cond.metric)) || (s.cond.type === 'deliver' && CROPS[s.cond.item]));
      expect(ok, c.id).toBe(true);
    }
  });
  it('capítulos 3, 6 y 7 tienen un paso juntos', () => {
    for (const n of [3, 6, 7]) expect(CHAPTERS[n - 1].steps.some((s) => ['together', 'dusk'].includes(s.cond.type))).toBe(true);
  });
  it('recompensas razonables y 5 piezas en los capítulos 2-6', () => {
    CHAPTERS.forEach((c, i) => {
      const r = c.reward;
      expect(r.coins).toBeGreaterThan(0); expect(r.coins).toBeLessThanOrEqual(600);
      expect(r.hearts).toBeGreaterThan(0); expect(r.hearts).toBeLessThanOrEqual(50);
      for (const k of Object.keys(r.items || {})) expect(ITEMS[k]).toBeTruthy();
      expect(!!r.piece).toBe(i >= 1 && i <= 5);
    });
  });
});

describe('dialogue', () => {
  const ctxs = [];
  for (const hour of [7, 14, 19, 23]) for (const weather of ['clear', 'rain', 'snow', 'fog']) for (const season of [0, 1, 2, 3]) for (const chapter of [1, 3, 5, 7, 8]) for (const friendLevel of [0, 2, 4]) ctxs.push({ hour, weather, season, chapter, friendLevel, day: '2026-05-01', partner: 'Alex' });

  it('≥ 12 líneas por vecino, sin textos vacíos ni repetidos', () => {
    for (const id of NPCS) {
      expect(LINES_PER_NPC[id], id).toBeGreaterThanOrEqual(12);
    }
    const seen = new Set();
    for (const id of NPCS) for (const [i, c] of ctxs.entries()) {
      const l = lineFor(id, { ...c, n: i });
      expect(l.text.trim().length, id).toBeGreaterThan(10);
      expect(l.text).not.toMatch(/\{\d\}/);
      seen.add(id + l.id);
    }
    for (const id of NPCS) expect([...seen].filter((s) => s.startsWith(id)).length).toBeGreaterThanOrEqual(8);
  });
  it('es determinista y cambia con el día', () => {
    for (const id of NPCS) for (const c of ctxs.slice(0, 60)) expect(lineFor(id, c)).toEqual(lineFor(id, c));
    const days = new Set();
    for (let d = 1; d <= 28; d++) days.add(lineFor('rosa', { hour: 10, weather: 'clear', season: 0, chapter: 2, friendLevel: 2, day: `2026-05-${String(d).padStart(2, '0')}` }).id);
    expect(days.size).toBeGreaterThan(2);
  });
  it('respeta clima, capítulo y amistad', () => {
    for (let d = 1; d <= 20; d++) {
      const day = `2026-06-${String(d).padStart(2, '0')}`;
      const base = { hour: 10, season: 1, day, friendLevel: 0, partner: 'Alex' };
      expect(lineFor('pablo', { ...base, weather: 'clear', chapter: 1 }).text).not.toMatch(/promesa que le hice|Nieva|Con lluvia/);
      expect(lineFor('remedios', { ...base, weather: 'clear', chapter: 1 }).text).not.toMatch(/mejor noticia/);
    }
  });
  it('sin nombre de la pareja no sale ninguna línea con {0}', () => {
    for (const id of NPCS) for (let d = 1; d <= 30; d++) expect(lineFor(id, { hour: 12, weather: 'clear', season: 0, chapter: 3, friendLevel: 5, day: `2026-07-${String(d).padStart(2, '0')}` }).text).not.toContain('{0}');
  });
  it('presentaciones y saludos de los 5 vecinos nuevos', () => {
    for (const id of ['remedios', 'rosa', 'inigo', 'celia', 'tomas']) {
      const m = firstMeeting(id);
      expect(m.lines.length).toBeGreaterThanOrEqual(3);
      expect(m.text.length).toBeGreaterThan(100);
    }
    for (const id of NPCS) expect(GREETINGS[id].length).toBeGreaterThan(5);
    expect(firstMeeting('nadie')).toBeNull();
  });
  it('historias de amistad nuevas: 5 capítulos por vecino, sin pisar las de constants', () => {
    expect(Object.keys(STORIES_NEW).sort()).toEqual(['celia', 'inigo', 'remedios', 'rosa', 'tomas']);
    for (const [id, arr] of Object.entries(STORIES_NEW)) {
      expect(STORIES[id]).toBeUndefined();
      expect(arr).toHaveLength(5);
      for (const s of arr) { expect(s.title.length).toBeGreaterThan(2); expect(s.text.length).toBeGreaterThan(80); expect(s.reward.coins).toBeGreaterThan(0); }
    }
  });
});
