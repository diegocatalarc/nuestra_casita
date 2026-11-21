// Director de la historia: decide QUÉ escena narrada toca ver y QUÉ objetivo guía al jugador. Lógica PURA (testeable);
// la parte con estado (cola de escenas, «ya vistas» por dispositivo) vive abajo y la pinta src/ui/StoryScene.jsx.
// Las escenas ya vistas se guardan en localStorage por pareja y persona: cada uno ve cada escena una vez en su dispositivo
// y no se escribe nada en la nube.
import { create } from 'zustand';
import { CHAPTERS } from './chapters';
import { SCENES } from './scenes';
import { PLACES } from './conditions';
import { currentChapter, chapterStatus, hasStory, storyOf } from './engine';
import { castById } from './characters';
import { t } from '../../i18n';

export const sceneExists = (id) => !!SCENES[id];

/** Ids de escena de un capítulo (intro, un beat por paso y cierre) que existan en el guion. */
export const chapterSceneIds = (ch) => [`${ch.id}.intro`, ...(ch.steps || []).map((s) => `${ch.id}.${s.id}`), `${ch.id}.outro`].filter(sceneExists);

/**
 * Qué escenas reproducir ahora y cuáles dar por vistas sin mostrarlas.
 * seen: Set de ids ya vistos en este dispositivo. Devuelve { play: [ids en orden], mark: [ids] }.
 *  - Una pareja que ya iba por el capítulo 3 no ve el prólogo ni los capítulos pasados.
 *  - Si te incorporas a mitad de capítulo, los pasos que ya estaban hechos no se repiten.
 *  - Si el capítulo se completa de golpe, solo se ve el cierre (los beats sobrarían).
 */
export function dueScenes(state, seen = new Set(), chapters = CHAPTERS) {
  const play = [], mark = [];
  if (!hasStory(state)) return { play, mark };
  const story = storyOf(state);
  const cur = currentChapter(state, chapters);
  const progressed = (story.chapter || 1) > 1 || Object.keys(story.claimed || {}).length > 0;
  if (sceneExists('prologue') && !seen.has('prologue')) (progressed ? mark : play).push('prologue');
  for (const ch of chapters) if (story.claimed?.[ch.id]) for (const id of chapterSceneIds(ch)) if (!seen.has(id)) mark.push(id);
  if (!cur) return { play, mark };
  const status = chapterStatus(state, cur);
  const introId = `${cur.id}.intro`;
  const fresh = sceneExists(introId) && !seen.has(introId);
  if (fresh) play.push(introId);
  for (const row of status.steps) {
    const id = `${cur.id}.${row.step.id}`;
    if (!sceneExists(id) || seen.has(id) || !row.done) continue;
    if (fresh || status.allDone) mark.push(id);
    else play.push(id);
  }
  const outro = `${cur.id}.outro`;
  if (status.allDone && !status.claimed && sceneExists(outro) && !seen.has(outro)) play.push(outro);
  return { play, mark };
}

// ---------- Objetivo (la guía siempre visible) ----------

/** A quién o a dónde hay que ir para un paso: { npc } | { place } | null (sin sitio concreto: es en tu parcela o en un panel). */
export function stepTarget(chapter, step) {
  const c = step?.cond || {};
  switch (c.type) {
    case 'talk': return { npc: c.npc };
    case 'deliver': return { npc: chapter?.from };
    case 'friend': return { npc: c.npc };
    case 'together': return PLACES[c.what] && (c.what === 'plaza' || c.what === 'clock') ? { place: c.what } : null;
    case 'dusk': return { place: 'plaza' };
    case 'project': return c.id === 'clock' ? { place: 'clock' } : null;
    default: return null;
  }
}

/** Qué le toca hacer ahora a la pareja: { chapter, num, step, text, progress, target, npc, place, ready } o null. */
export function objectiveFor(state, chapters = CHAPTERS) {
  if (!hasStory(state)) return null;
  const ch = currentChapter(state, chapters);
  if (!ch) return null;
  const status = chapterStatus(state, ch);
  const num = chapters.indexOf(ch) + 1;
  if (status.allDone && !status.claimed) {
    return { chapter: ch, num, step: null, text: t("Capítulo completado: recibid vuestra recompensa"), progress: 1, target: 1, npc: ch.from, place: null, ready: true };
  }
  const row = status.steps.find((r) => !r.done);
  if (!row) return null;
  const tg = stepTarget(ch, row.step) || {};
  return { chapter: ch, num, step: row.step, text: row.step.text, progress: row.progress, target: row.target, npc: tg.npc || null, place: tg.place || null, ready: false };
}

/** Posición en el mundo del objetivo: un vecino (posición viva si se pasa npcPos) o un lugar fijo. */
export function objectivePos(obj, npcPos = {}) {
  if (!obj) return null;
  if (obj.npc && npcPos[obj.npc] && !npcPos[obj.npc].hidden && npcPos[obj.npc].x != null) return npcPos[obj.npc];
  if (obj.npc && castById[obj.npc]?.stops?.work) return castById[obj.npc].stops.work;
  if (obj.place && PLACES[obj.place]) return PLACES[obj.place];
  return null;
}

/** Ángulo (rad) de la flecha en pantalla: 0 = hacia arriba, positivo = hacia la derecha. yaw = ángulo de la cámara. */
export function arrowAngle(dx, dz, yaw) {
  const right = dx * Math.cos(yaw) - dz * Math.sin(yaw);
  const fwd = dx * -Math.sin(yaw) + dz * -Math.cos(yaw);
  return Math.atan2(right, fwd);
}

// ---------- Escenas vistas (por dispositivo) ----------
const key = (coupleId, uid) => `nc_scenes_${coupleId}_${uid}`;
const memory = {};
export function loadSeen(coupleId, uid) {
  const k = key(coupleId, uid);
  try { return new Set(JSON.parse(localStorage.getItem(k) || '[]')); } catch { return new Set(memory[k] || []); }
}
export function addSeen(coupleId, uid, ids) {
  const k = key(coupleId, uid);
  const all = loadSeen(coupleId, uid);
  for (const id of ids) all.add(id);
  memory[k] = [...all];
  try { localStorage.setItem(k, JSON.stringify(memory[k])); } catch { /* noop */ }
}

// ---------- Cola de escenas en pantalla ----------
export const useScene = create(() => ({ queue: [], cur: null, replay: false }));
/** Encola escenas; si no se está reproduciendo ninguna, empieza la primera. */
export function enqueueScenes(ids, replay = false) {
  const s = useScene.getState();
  const queue = [...s.queue, ...ids.filter((id) => sceneExists(id))];
  if (s.cur) useScene.setState({ queue });
  else useScene.setState({ cur: queue[0] || null, queue: queue.slice(1), replay });
}
/** Termina la escena actual y pasa a la siguiente. */
export function nextScene() {
  const s = useScene.getState();
  useScene.setState({ cur: s.queue[0] || null, queue: s.queue.slice(1), replay: false });
}
export const replayScene = (id) => enqueueScenes([id], true);
