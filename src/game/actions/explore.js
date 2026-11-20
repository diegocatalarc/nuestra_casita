import { useGame } from '../../store/gameStore';
import { getBackend } from '../../services/backend';
import { ITEMS, EXPLORE, DISCOVERIES_FIXED, COLLECT, COLLECT_ITEMS, COLLECT_PAGES, DIG, MINE } from '../constants';
import { serverNow } from '../time';
import { digLoot, weekIdx, chestReady, albumProgress, dayUTC } from '../logic';
import { ISLAND } from '../worldGen';
import { me } from '../runtime';
import { sfx } from '../audio';
import { mulberry32, hashStr } from '../rng';
import { t } from '../../i18n';
import { goAndDo, wave } from './base';
import { commit, doAnim, fx, gain, heartOps, logActivity, myVitals, st, toast, vitalsPatch, xpOp } from './core';

// =====================================================================
//  EXPLORACIÓN: excavar, cofre de la isla, álbum y mina
// =====================================================================
/** Suma un objeto y, si es un coleccionable, lo apunta en el álbum. */
export const loot = (id, n = 1) => [gain(id, n), ...(COLLECT_ITEMS[id] ? [{ op: 'inc', field: `found.${id}`, by: n }] : [])];
export const firstFound = (couple, id) => COLLECT_ITEMS[id] && !(couple?.found?.[id] > 0);

export function digAt(spot) {
  goAndDo(spot.x, spot.z, () => {
    const s = st(), now = serverNow(), day = dayUTC(now);
    if (s.couple.digs?.[day]?.[spot.i]) return toast(t("Aquí ya se ha excavado"));
    const l = digLoot(s.couple.seed, day, spot.i);
    const ops = [{ op: 'patch', data: { [`digs.${day}.${spot.i}`]: s.user.uid } }, xpOp('fish', 1)];
    let msg;
    if (l.kind === 'coins') { ops.push({ op: 'inc', field: 'coins', by: l.coins }); msg = `+${l.coins} 🪙`; }
    else { ops.push(...loot(l.item)); const q = ITEMS[l.item]; msg = `${q.emoji} ${q.label}`; if (firstFound(s.couple, l.item)) { ops.push(...heartOps(2)); msg += t(" ¡nueva para el álbum! +2 💗"); } }
    doAnim('dig', 1200);
    commit(ops);
    fx(msg, spot.x, spot.z);
    toast(t("⛏️ ¡Excavando has encontrado: {0}!", [msg]));
  }, DIG.reach);
}

/** Cofre del tesoro de la isla: uno por semana. */
export function openChest() {
  goAndDo(ISLAND.x, ISLAND.z, () => {
    const s = st(), now = serverNow();
    if (!chestReady(s.couple, now)) return toast(t("El cofre está vacío. Volverá a llenarse el lunes 🏴‍☠️"));
    const w = weekIdx(now), r = mulberry32(hashStr('chest' + s.couple.seed + w));
    const coins = DIG.chestCoins[0] + Math.floor(r() * (DIG.chestCoins[1] - DIG.chestCoins[0]));
    const rares = Object.values(COLLECT).flat().filter((c) => c.rare), rare = rares[Math.floor(r() * rares.length)];
    commit([{ op: 'patch', data: { chestWeek: w } }, { op: 'inc', field: 'coins', by: coins }, ...loot(rare.id), ...heartOps(8)]);
    logActivity('chest', DIG.islandName);
    sfx('love'); doAnim('harvest', 1500);
    fx(`🏴‍☠️ +${coins}🪙 ${rare.emoji}`, ISLAND.x, ISLAND.z);
    toast(t("🏴‍☠️ ¡Cofre del tesoro! +{0} 🪙, {1} {2} y +8 💗", [coins, rare.emoji, rare.label]));
  }, 2.4);
}

export function claimAlbum(page) {
  const s = st(), pg = COLLECT_PAGES.find((x) => x.id === page);
  const pr = albumProgress(s.couple, page);
  if (!pg || pr.have < pr.total || s.couple.albumClaimed?.[page]) return;
  commit([{ op: 'patch', data: { [`albumClaimed.${page}`]: true } }, { op: 'inc', field: 'coins', by: pg.reward.coins }, ...heartOps(pg.reward.hearts)]);
  sfx('love');
  toast(t("📚 ¡Página completada! +{0} 🪙 +{1} 💗", [pg.reward.coins, pg.reward.hearts]));
}

/** Empieza una visita a la mina: cuesta energía. */
export function mineStart() {
  const s = st();
  const v = myVitals();
  if (v.energy < MINE.energy) { toast(t("Estás demasiado cansada/o para picar. ¡Descansa!")); return false; }
  getBackend().write(s.coupleId, [vitalsPatch({ ...v, energy: v.energy - MINE.energy })]).catch(() => {});
  return true;
}
/** Fin de la visita: items = {id: n} */
export function mineFinish(items, floor) {
  const s = st(), ops = [];
  let hearts = 0;
  for (const [id, n] of Object.entries(items)) {
    if (!n) continue;
    ops.push(...loot(id, n));
    if (firstFound(s.couple, id)) hearts += 2;
  }
  if (!ops.length) return;
  if ((s.couple.mineBest || 0) < floor) ops.push({ op: 'patch', data: { mineBest: floor } });
  ops.push(...heartOps(hearts));
  commit(ops);
  sfx('harvest');
  toast(t("⛏️ Mina: has subido al piso {0} y lo recogido está en la mochila{1}", [floor, hearts ? t(" · ¡piezas nuevas para el álbum! +{0} 💗", [hearts]) : '']));
}

// =====================================================================
//  EXPLORACIÓN: niebla y descubrimientos
// =====================================================================
/** Todo lo descubrible del mundo actual (puntos de interés + pueblo) */
export const allDiscoveries = () => [...(st().world?.pois || []), ...DISCOVERIES_FIXED];

/** Cada segundo: recoge los descubrimientos (rincones y edificios del pueblo) cuando alguien pasa cerca. */
export function exploreTick() {
  const s = st();
  if (!s.couple || !s.world || !s.user) return;
  // descubrimientos
  for (const d of allDiscoveries()) {
    if (s.couple.discovered?.[d.id] || discovering.has(d.id)) continue;
    if (Math.hypot(me.x - d.x, me.z - d.z) > EXPLORE.discoverDist) continue;
    discovering.add(d.id);
    const rw = d.reward || {};
    const ops = [{ op: 'patch', data: { [`discovered.${d.id}`]: s.user.uid } }];
    let msg = '';
    if (rw.coins) { ops.push({ op: 'inc', field: 'coins', by: rw.coins }); msg += ` +${rw.coins} 🪙`; }
    if (rw.hearts) { ops.push(...heartOps(rw.hearts)); msg += ` +${rw.hearts} 💗`; }
    if (rw.item) { ops.push(...loot(rw.item)); msg += ` ${ITEMS[rw.item].emoji}`; }
    commit(ops);
    logActivity('discover', d.name);
    sfx('love'); doAnim('wave', 1500);
    useGame.setState({ discoverFx: { ...d, msg, at: Date.now() } });
    toast(t("🧭 ¡Descubierto: {0} {1}!{2}", [d.emoji, d.name, msg]));
  }
}
export const discovering = new Set();

export const EXPLORER_REWARDS = [
  { at: 6, coins: 100, hearts: 10 },
  { at: 12, coins: 250, hearts: 20 },
  { at: 20, coins: 500, hearts: 40 },
];
export function claimExplorer(at) {
  const s = st(), r = EXPLORER_REWARDS.find((x) => x.at === at);
  const n = Object.keys(s.couple.discovered || {}).length;
  if (!r || n < at || s.couple.explorerClaimed?.[at]) return;
  commit([{ op: 'patch', data: { [`explorerClaimed.${at}`]: true } }, { op: 'inc', field: 'coins', by: r.coins }, ...heartOps(r.hearts)]);
  sfx('love');
  toast(t("🧭 ¡Explorador/a! +{0} 🪙 +{1} 💗", [r.coins, r.hearts]));
}

