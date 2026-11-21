import { describe, it, expect } from 'vitest';
import { CHAPTERS } from '../src/game/story/chapters';
import { FEATURE_CHAPTER, METRIC_FEATURE, ITEM_SOURCE, LEGACY_BEFORE, progressiveMode, isUnlocked, chapterOf, unlockedIds } from '../src/game/unlocks';

const fresh = (chapter = 1) => ({ startedAt: LEGACY_BEFORE + 1000, story: { chapter } });
const old = (chapter = 1) => ({ startedAt: LEGACY_BEFORE - 1000, story: { chapter } });
const NO = { showAll: false, force: false };

describe('descubrimiento progresivo', () => {
  it('las parejas anteriores a la fecha lo ven todo; las nuevas, no', () => {
    expect(progressiveMode(old(), NO)).toBe(false);
    expect(progressiveMode(fresh(), NO)).toBe(true);
    expect(isUnlocked(old(1), 'family', NO)).toBe(true);
    expect(isUnlocked(fresh(1), 'family', NO)).toBe(false);
  });
  it('«mostrar todas las funciones» lo desactiva; el modo forzado (pruebas) lo activa incluso en partidas viejas', () => {
    expect(isUnlocked(fresh(1), 'family', { showAll: true, force: false })).toBe(true);
    expect(isUnlocked(old(1), 'family', { showAll: false, force: true })).toBe(false);
  });
  it('sin datos de la pareja no se oculta nada', () => { expect(isUnlocked(null, 'family', NO)).toBe(true); expect(isUnlocked(undefined, 'market', NO)).toBe(true); });
  it('cada función aparece en su capítulo y no antes', () => {
    expect(isUnlocked(fresh(1), 'orders', NO)).toBe(true);
    expect(isUnlocked(fresh(1), 'build', NO)).toBe(false);
    expect(isUnlocked(fresh(2), 'build', NO)).toBe(true);
    expect(isUnlocked(fresh(3), 'market', NO)).toBe(true);
    expect(isUnlocked(fresh(4), 'fish', NO)).toBe(false);
    expect(isUnlocked(fresh(5), 'fish', NO)).toBe(true);
    expect(isUnlocked(fresh(7), 'family', NO)).toBe(true);
  });
  it('con el libro terminado, todo está disponible', () => {
    expect(chapterOf(fresh(8))).toBe(99);
    expect(unlockedIds(fresh(8), NO).length).toBe(Object.keys(FEATURE_CHAPTER).length);
  });
  it('un id desconocido no se bloquea', () => { expect(isUnlocked(fresh(1), 'inventado', NO)).toBe(true); });
  it('el desbloqueo es monótono: cada capítulo conserva lo anterior', () => {
    let prev = 0;
    for (let c = 1; c <= 8; c++) { const n = unlockedIds(fresh(c), NO).length; expect(n).toBeGreaterThanOrEqual(prev); prev = n; }
  });
});

describe('la historia nunca pide algo que aún no está desbloqueado', () => {
  it('las condiciones `stat` de cada capítulo usan funciones ya disponibles en ese capítulo', () => {
    CHAPTERS.forEach((ch, i) => ch.steps.forEach((s) => {
      const c = s.cond || {};
      if (c.type === 'stat') { const f = METRIC_FEATURE[c.metric]; expect(f, `${ch.id}.${s.id}: métrica ${c.metric} sin función asociada`).toBeTruthy(); expect(FEATURE_CHAPTER[f], `${ch.id}.${s.id} necesita «${f}»`).toBeLessThanOrEqual(i + 1); }
      if (c.type === 'letter') expect(FEATURE_CHAPTER.mail).toBeLessThanOrEqual(i + 1);
      if (c.type === 'deliver') expect(FEATURE_CHAPTER.inv).toBeLessThanOrEqual(i + 1);
    }));
  });
  it('todo objeto que se pide entregar (y sus ingredientes) tiene una fuente ya desbloqueada en ese capítulo', () => {
    CHAPTERS.forEach((ch, i) => ch.steps.forEach((s) => {
      if (s.cond?.type !== 'deliver') return;
      const item = s.cond.item;
      expect(ITEM_SOURCE[item], `${ch.id}.${s.id}: falta la fuente de «${item}»`).toBeTruthy();
      expect(FEATURE_CHAPTER[ITEM_SOURCE[item]], `${ch.id}.${s.id}: «${item}» viene de «${ITEM_SOURCE[item]}»`).toBeLessThanOrEqual(i + 1);
    }));
    // la tortilla necesita huevos: su fuente (animales) debe estar abierta en el capítulo en que se pide
    expect(FEATURE_CHAPTER[ITEM_SOURCE.egg]).toBeLessThanOrEqual(2);
  });
  it('el capítulo 1 recompensa con huevos para la tortilla del capítulo 2', () => { expect(CHAPTERS[0].reward.items.egg).toBeGreaterThanOrEqual(2); });
  it('cocinar (capítulo 2) exige construir la cocina: Construir y Comer están desde el capítulo 2', () => {
    expect(FEATURE_CHAPTER.build).toBeLessThanOrEqual(2); expect(FEATURE_CHAPTER.food).toBeLessThanOrEqual(2);
  });
});
