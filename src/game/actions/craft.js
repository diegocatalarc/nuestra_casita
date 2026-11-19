import { partnerUid } from '../../store/gameStore';
import { ITEMS, ALL_RECIPES as RECIPES, STATIONS, CRAFT, MINE, lockKey } from '../constants';
import { serverNow, fmtDuration } from '../time';
import { canAfford, newId, stationPlaced, recipeStatus, craftDur, jobList, recipeOwned } from '../logic';
import { me } from '../runtime';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { sendChat } from './chat';
import { commit, doAnim, fx, heartOps, spend, st, statOp, toast, xpOp } from './core';
import { loot } from './explore';

// =====================================================================
//  CRAFTEO
// =====================================================================
export const recipeLabel = (id) => { const r = RECIPES[id]; if (r.label) return r.label; const k = Object.keys(r.out)[0]; return ITEMS[k]?.label || id; };
export const recipeInfo = (id) => { const r = RECIPES[id]; const k = Object.keys(r.out)[0]; return { label: r.label || ITEMS[k]?.label || id, emoji: r.emoji || ITEMS[k]?.emoji || '🛠️', desc: r.desc || '' }; };

export function startCraft(id, fromRequest = null) {
  const s = st(), r = RECIPES[id], now = serverNow();
  if (!r) return;
  if (!stationPlaced(s.decor, r.station)) return toast(t("Necesitas colocar «{0}» con 🛋️ Decorar", [STATIONS[r.station].label]));
  if (!recipeStatus(s.couple, r).ok) return toast(t("Receta aún bloqueada"));
  if (recipeOwned(s.couple, r)) return toast(t("Ya tienes esta prenda"));
  if (jobList(s.crafts).length >= CRAFT.slots) return toast(t("Ya hay {0} trabajos en marcha. Recoge alguno.", [CRAFT.slots]));
  if (!canAfford(s.couple.inventory, r.in)) return toast(t("Faltan materiales"));
  const dur = craftDur(s.couple, r);
  const ops = [...spend(r.in), { op: 'set', col: 'crafts', id: newId('k'), data: { recipe: id, by: s.user.uid, start: now, dur, end: now + dur * 1000, state: 'work', assisted: false } }];
  if (fromRequest) { ops.push({ op: 'del', col: 'crafts', id: fromRequest }, ...heartOps(2)); }
  commit(ops);
  sfx('build'); doAnim('build', 1200);
  toast(t("🛠️ Fabricando {0} ({1})", [recipeLabel(id), fmtDuration(dur * 1000)]));
}

/** La otra persona acelera un trabajo (−30 % del tiempo restante, una vez por trabajo) */
export function assistCraft(jobId) {
  const s = st(), j = s.crafts[jobId], now = serverNow();
  if (!j || j.state !== 'work' || now >= j.end) return;
  if (j.by === s.user.uid) return toast(t("Solo tu pareja puede ayudarte con este trabajo"));
  if (j.assisted) return toast(t("Ya le ayudaron con este trabajo"));
  commit([{ op: 'set', col: 'crafts', id: jobId, data: { assisted: true, end: now + (j.end - now) * (1 - CRAFT.assist) } }, ...heartOps(1)]);
  sfx('love'); doAnim('build', 1000);
  toast(t("🤝 ¡Ayuda enviada! El trabajo va más rápido (+1 💗)"));
}

export function collectCraft(jobId) {
  const s = st(), j = s.crafts[jobId], now = serverNow();
  if (!j || j.state !== 'work' || now < j.end) return;
  const r = RECIPES[j.recipe], info = recipeInfo(j.recipe);
  const ops = [{ op: 'del', col: 'crafts', id: jobId }, xpOp('craft', 4 + Math.round(r.dur / 40)), statOp('craft', 1), ...heartOps(1)];
  let msg = '';
  for (const [k, v] of Object.entries(r.out)) {
    if (k === 'unlock') { ops.push({ op: 'patch', data: { [`unlocks.${lockKey(v)}`]: true } }); msg = t("¡Nueva prenda en el Vestidor! 👗"); }
    else if (k === 'upgrade') { ops.push({ op: 'inc', field: `upgrades.${v}`, by: 1 }); msg = t("¡Mejora aplicada!"); }
    else { ops.push(...loot(k, v)); msg = `+${v} ${ITEMS[k].emoji}`; }
  }
  commit(ops);
  sfx('harvest');
  fx(`${info.emoji} ${msg}`, me.x, me.z);
  toast(t("🛠️ {0} listo: {1}", [info.label, msg]));
}

/** Taller sencillo: recoge solo los trabajos propios ya terminados (se llama cada segundo desde App). */
const collecting = new Set();
export function autoCollectCrafts() {
  const s = st(), now = serverNow();
  for (const j of jobList(s.crafts)) {
    if (!RECIPES[j.recipe]?.simple || j.by !== s.user.uid || now < j.end || collecting.has(j.id)) continue;
    collecting.add(j.id);
    setTimeout(() => collecting.delete(j.id), 8000);
    collectCraft(j.id);
  }
}

/** Pide a tu pareja que fabrique algo (aparece en su panel y en el chat) */
export function requestCraft(id) {
  const s = st(), uid = s.user.uid, pu = partnerUid(s);
  if (!pu) return toast(t("Tu pareja aún no se ha unido"));
  if (Object.values(s.crafts).filter((j) => j.state === 'request' && j.by === uid).length >= CRAFT.maxRequests) return toast(t("Ya tienes {0} peticiones abiertas", [CRAFT.maxRequests]));
  const info = recipeInfo(id);
  commit([{ op: 'set', col: 'crafts', id: newId('k'), data: { recipe: id, by: uid, state: 'request', at: serverNow() } }]);
  sendChat(t("🛠️ ¿Me fabricas {0} {1}, porfa? (Mira 🛠️ Taller)", [info.emoji, info.label]));
  toast(t("🙏 Petición enviada a tu pareja"));
}
export function cancelRequest(id) { commit([{ op: 'del', col: 'crafts', id }]); }

/** Efectos de las mejoras fabricadas */
export const boatSpeedMult = (couple) => 1 + 0.25 * (couple?.upgrades?.boat || 0);
export const mineSwings = (couple) => MINE.swings + 4 * (couple?.upgrades?.pick || 0);


