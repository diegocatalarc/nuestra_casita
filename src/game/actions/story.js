// Acciones de la historia del Valle (motor de misiones). Escribe solo con commit(); los campos viven en couple.story.
import { CHAPTERS } from '../story/chapters';
import { currentChapter, chapterStatus, canClaim, stepMark, hasStory, storyOf } from '../story/engine';
import { totalsSnapshot, presenceMet, ACTION_TYPES } from '../story/conditions';
import { AVATAR_LOCKS, lockKey } from '../constants';
import { me, others } from '../runtime';
import { serverNow } from '../time';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { st, commit, coinOp, gain, heartOps, toast, logActivity } from './core';

// Operaciones en vuelo: la nube tarda en devolver el snapshot y un doble clic (o dos ticks) no debe pagar/marcar dos veces.
const inflight = new Map(); // clave → instante de caducidad
const busy = (key, ms = 6000) => {
  const now = Date.now();
  if ((inflight.get(key) || 0) > now) return true;
  inflight.set(key, now + ms);
  return false;
};

/** Solo para tests: olvida las operaciones en vuelo. */
export const resetStoryInflight = () => inflight.clear();

const markOp = (chapterId, stepId, uid) => ({ op: 'patch', data: { [`story.steps.${chapterId}.${stepId}`]: { done: true, at: serverNow(), by: uid } } });
const chaptersNow = () => CHAPTERS;

/** Inicializa couple.story con la base de contadores (lo que ya se hizo antes no cuenta). Idempotente. */
export function startStory() {
  const s = st();
  if (!s.couple || !s.coupleId || !s.user || hasStory(s)) return;
  if (busy('start', 15000)) return;
  commit([{ op: 'patch', data: { story: { chapter: 1, steps: {}, base: totalsSnapshot(s.couple), claimed: {}, pieces: 0, flags: {} } } }]);
}

/** Marca un paso de acción (deliver / talk / together / dusk) como hecho. payload: { npc? } para talk. */
export function completeStep(stepId, payload = {}) {
  const s = st();
  if (!hasStory(s)) return false;
  const ch = currentChapter(s, chaptersNow());
  if (!ch) return false;
  const step = ch.steps.find((x) => x.id === stepId);
  if (!step || stepMark(storyOf(s), ch.id, stepId)) return false;
  const cond = step.cond || {};
  if (!ACTION_TYPES.includes(cond.type)) return false;
  if (cond.type === 'talk' && payload.npc !== cond.npc) return false;
  if (busy(`step:${ch.id}.${stepId}`)) return false;
  const ops = [markOp(ch.id, stepId, s.user.uid)];
  if (cond.type === 'deliver') {
    const n = cond.n || 1;
    if ((s.couple.inventory?.[cond.item] || 0) < n) { inflight.delete(`step:${ch.id}.${stepId}`); toast(t("Todavía no tenéis lo que hace falta")); return false; }
    ops.push(gain(cond.item, -n));
  }
  commit(ops);
  sfx('love');
  toast(t("📜 Paso cumplido: {0}", [step.text || '']));
  return true;
}

/** Atajo para el diálogo: la persona ha hablado con un vecino → marca el paso 'talk' del capítulo actual si lo hay. */
export function storyTalk(npc) {
  const s = st();
  const ch = hasStory(s) && currentChapter(s, chaptersNow());
  const step = ch && ch.steps.find((x) => x.cond?.type === 'talk' && x.cond.npc === npc);
  return step ? completeStep(step.id, { npc }) : false;
}

/** Entrega recompensa del capítulo y avanza. Idempotente (ni doble clic ni dos veces). */
export function claimStoryChapter(chapterId) {
  const s = st();
  const ch = currentChapter(s, chaptersNow());
  if (!ch || ch.id !== chapterId || !canClaim(s, ch, chaptersNow())) return false;
  if (busy(`claim:${chapterId}`, 10000)) return false;
  const rw = ch.reward || {};
  const ops = [];
  if (rw.coins) ops.push(coinOp(rw.coins));
  if (rw.hearts) ops.push(...heartOps(rw.hearts));
  for (const [item, n] of Object.entries(rw.items || {})) ops.push(gain(item, n));
  const unlocks = [].concat(rw.unlock || []);
  const data = {};
  for (const u of unlocks) {
    data[`story.flags.${u}`] = true;
    if (AVATAR_LOCKS[u]) data[`unlocks.${lockKey(u)}`] = true; // prenda/decoración de catálogo
  }
  if (rw.piece) ops.push({ op: 'inc', field: 'story.pieces', by: rw.piece });
  Object.assign(data, {
    [`story.claimed.${ch.id}`]: true,
    'story.chapter': (storyOf(s).chapter || 1) + 1,
    'story.base': totalsSnapshot(s.couple), // el siguiente capítulo cuenta desde ahora
  });
  ops.push({ op: 'patch', data });
  commit(ops);
  logActivity('story', ch.title || '');
  sfx('love');
  toast(t("📖 ¡Capítulo completado! {0}", [ch.title || '']));
  return true;
}

/** Observación de presencia con lo que hay en el runtime (no React). */
function observe(s) {
  const pu = s.partner?.uid, p = pu && others[pu];
  return { partner: { online: !!s.partner?.online, x: p?.x, z: p?.z }, me: { x: me.x, z: me.z }, hour: s.env?.hour ?? 0, chatOpen: !!s.chatOpen };
}

/** Cada segundo (App.jsx): arranca la historia y marca los pasos automáticos y de presencia ya cumplidos. */
export function tickStory() {
  const s = st();
  if (!s.couple || !s.coupleId || !s.user || !chaptersNow().length) return;
  if (!hasStory(s)) return startStory();
  const ch = currentChapter(s, chaptersNow());
  if (!ch) return;
  const status = chapterStatus(s, ch);
  const obs = observe(s);
  const ops = [];
  for (const row of status.steps) {
    if (row.marked) continue;
    const cond = row.step.cond || {};
    const auto = row.done && !row.action;                              // calculado solo (stat, friend, project…)
    const here = row.action && cond.type !== 'deliver' && cond.type !== 'talk' && presenceMet(cond, obs); // together / dusk
    if (!(auto || here)) continue;
    if (busy(`step:${ch.id}.${row.step.id}`)) continue;
    ops.push(markOp(ch.id, row.step.id, s.user.uid));
  }
  if (ops.length) commit(ops);
}
