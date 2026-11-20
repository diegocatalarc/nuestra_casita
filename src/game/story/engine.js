// Motor de misiones de la historia (puro y testeable). Los capítulos son datos: ver chapters.js y docs/historia.md.
import { CHAPTERS } from './chapters';
import { evalCondition, ACTION_TYPES } from './conditions';

export const storyOf = (state) => state?.couple?.story || null;
export const hasStory = (state) => !!storyOf(state);

/** Un paso marcado como hecho. Se admite la forma anidada (story.steps.<cap>.<paso>, la que escriben las acciones)
 *  y la plana de la biblia ("<cap>.<paso>"). */
export function stepMark(story, chapterId, stepId) {
  const steps = story?.steps;
  if (!steps) return null;
  const m = steps[chapterId]?.[stepId] ?? steps[`${chapterId}.${stepId}`];
  return m && m.done ? m : null;
}

/** Capítulo actual (según story.chapter, 1-based) o null si ya no quedan. */
export function currentChapter(state, chapters = CHAPTERS) {
  const n = storyOf(state)?.chapter || 1;
  return chapters[n - 1] || null;
}

/** Estado de un capítulo: cada paso con done/progress/target. */
export function chapterStatus(state, chapter, chapters = CHAPTERS) {
  void chapters;
  if (!chapter) return null;
  const story = storyOf(state);
  const steps = (chapter.steps || []).map((step) => {
    const mark = stepMark(story, chapter.id, step.id);
    const r = evalCondition(step.cond, state, { base: story?.base, marked: !!mark, chapterId: chapter.id, stepId: step.id });
    return { step, done: r.done, marked: !!mark, progress: r.progress, target: r.target, action: ACTION_TYPES.includes(step.cond?.type) };
  });
  const doneCount = steps.filter((s) => s.done).length;
  const claimed = !!story?.claimed?.[chapter.id];
  return { chapter, steps, doneCount, total: steps.length, allDone: steps.length > 0 && doneCount === steps.length, claimed };
}

/** ¿Se puede reclamar? Solo el capítulo actual, con todos los pasos hechos y sin reclamar. */
export function canClaim(state, chapter, chapters = CHAPTERS) {
  if (!chapter || !hasStory(state)) return false;
  const cur = currentChapter(state, chapters);
  if (!cur || cur.id !== chapter.id) return false;
  const st = chapterStatus(state, chapter);
  return st.allDone && !st.claimed;
}

/** Primer paso pendiente del capítulo actual (para sugerirlo en la interfaz). */
export function nextStep(state, chapters = CHAPTERS) {
  const ch = currentChapter(state, chapters);
  if (!ch) return null;
  const st = chapterStatus(state, ch);
  return st.steps.find((s) => !s.done) || null;
}

/** Capítulos ya reclamados (para el historial plegado). */
export const claimedChapters = (state, chapters = CHAPTERS) => chapters.filter((c) => storyOf(state)?.claimed?.[c.id]);

/** Libro terminado: hay historia y no queda capítulo actual. */
export const storyFinished = (state, chapters = CHAPTERS) => hasStory(state) && !currentChapter(state, chapters);
