import { useGame, partnerUid } from '../../store/gameStore';
import { FISH, FISHING, BOAT, TILE } from '../constants';
import { serverNow } from '../time';
import { canAfford, fishMods, rollCatch, biteWait } from '../logic';
import { ctx as moveCtx } from '../movement';
import { idx, riverX } from '../worldGen';
import { me, others, doAnim as rawAnim } from '../runtime';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { goAndDo } from './base';
import { commit, doAnim, earn, fx, gain, heartOps, logActivity, spend, st, statOp, toast, xpOp } from './core';
import { wake } from './vitals';

// =====================================================================
//  PESCA
// =====================================================================
export const setFishState = (v) => useGame.setState({ fishState: v });

export function cancelFish(msg) {
  if (!me.fish) return;
  me.fish = null;
  setFishState('idle');
  if (msg) toast(msg);
}

/** Lanza la caña a una casilla de agua (se acerca a la orilla si hace falta). */
export function castLine(tx, tz) {
  if (me.sleeping) wake();
  if (me.fish) return reelIn();
  const reach = me.boat ? 5.5 : 3.6;
  goAndDo(tx + 0.5, tz + 0.5, () => {
    const s = st();
    if (me.sleeping) return;
    const x = tx + 0.2 + Math.random() * 0.6, z = tz + 0.2 + Math.random() * 0.6;
    me.rot = Math.atan2(x - me.x, z - me.z);
    me.path = []; me.pending = null;
    me.fish = { x, z, state: 'wait', biteAt: performance.now() + biteWait(s.env) * fishMods(s.couple).wait * 1000, missAt: 0, win: fishMods(s.couple).window };
    setFishState('wait');
    rawAnim('reel', 700);
    sfx('cast');
  }, reach);
}

/** Llamado cada fotograma por el jugador local: picada, escape y cancelación al moverse. */
export function updateFishing() {
  const f = me.fish;
  if (!f) return;
  if (me.moving || me.sleeping) { cancelFish(); return; }
  const now = performance.now();
  if (f.state === 'wait' && now >= f.biteAt) {
    f.state = 'bite'; f.missAt = now + (f.win || FISHING.biteWindow) * 1000;
    setFishState('bite'); sfx('bite');
    try { navigator.vibrate?.(60); } catch { /* noop */ }
  } else if (f.state === 'bite' && now > f.missAt) {
    cancelFish(t("🐟 Se escapó… ¡sé más rápida/o!"));
  }
}

/** Tira de la caña: si pica, captura; si no, recoge la línea. */
export function reelIn() {
  const f = me.fish;
  if (!f) return;
  if (f.state === 'wait') return cancelFish(t("Aún no pica. Espera al ❗ y tira justo entonces."));
  catchFish(f);
}

export function catchFish(f) {
  const s = st();
  const r = rollCatch(s.env, Math.random, fishMods(s.couple).rare);
  me.fish = null; setFishState('idle');
  doAnim('reel', 900);
  sfx('catch');
  if (r.kind === 'junk') {
    commit([gain('cloth', 1), xpOp('fish', 1)]);
    fx('👢 +1🧶', f.x, f.z);
    return toast(t("👢 Una bota vieja… ¡con un trozo de tela dentro!"));
  }
  if (r.kind === 'treasure') {
    commit([gain('crystal', 1), xpOp('fish', 3), ...heartOps(2)]);
    fx('💎 +1 +2💗', f.x, f.z);
    return toast(t("💎 ¡Un cristal brillante enganchado en el anzuelo!"));
  }
  const def = FISH[r.id];
  const first = !(s.couple.fishLog?.[r.id] > 0);
  const e = earn('fish');
  const bonus = (def.hearts || 0) + (first ? 3 : 0);
  const ops = [gain(r.id, 1), statOp('fish', 1), xpOp('fish', def.rare ? 6 : 3), { op: 'inc', field: `fishLog.${r.id}`, by: 1 }, ...e.ops, ...heartOps(bonus)];
  if (r.size > (s.couple.fishBest?.[r.id] || 0)) ops.push({ op: 'patch', data: { [`fishBest.${r.id}`]: r.size } });
  commit(ops);
  fx(`${def.emoji} ${r.size} cm${e.n + bonus ? ` +${e.n + bonus}💗` : ''}`, f.x, f.z);
  toast(first ? t("🎉 ¡Nueva especie! {0} {1} ({2} cm) +3 💗", [def.emoji, def.label, r.size]) : t("{0} ¡Has pescado: {1} ({2} cm)!", [def.emoji, def.label, r.size]));
  if (def.rare || first) logActivity('fish', def.label);
}

// =====================================================================
//  BOTE
// =====================================================================
export function buyBoat() {
  const s = st();
  if (s.couple.boat) return;
  if (!canAfford(s.couple.inventory, BOAT.cost)) return toast(t("Faltan recursos"));
  const z = 20.5;
  commit([...spend(BOAT.cost), { op: 'patch', data: { boat: { x: riverX(z), z, rot: 0, at: serverNow() } } }, ...heartOps(5)]);
  logActivity('boat');
  toast(t("⛵ ¡Tenéis un bote! Está amarrado en el río, junto al puente. +5 💗"));
  sfx('build');
}

/** Sube al bote: como remero, o de pasajera/o si tu pareja ya navega. */
export function boardBoat() {
  const s = st();
  const boat = s.couple.boat;
  if (!boat || me.boat) return;
  if (me.sleeping) wake();
  if (me.fish) cancelFish();
  const pu = partnerUid(s), po = pu && others[pu];
  const go = (x, z, kind) => goAndDo(x, z, () => {
    me.boat = true; me.passenger = kind === 2 ? pu : null;
    if (kind === 1) { me.x = boat.x; me.z = boat.z; me.rot = boat.rot || 0; }
    me.path = []; me.pending = null;
    useGame.setState({ boating: kind });
    sfx('splash');
    toast(kind === 1 ? t("⛵ Navegando: clic en el agua para ir · ⚓ para bajar") : t("⛵ Vas de pasajera/o con tu pareja 💗"));
  }, 3.6);
  if (po?.online && po.boat === 1) go(po.x, po.z, 2);
  else if (po?.online && po.boat === 2) toast(t("El bote ya va lleno 💗"));
  else go(boat.x, boat.z, 1);
}

/** Baja a la orilla más cercana; el bote queda amarrado donde lo dejes. */
export function leaveBoat(auto = false) {
  const s = st();
  if (!me.boat) return;
  if (me.fish) cancelFish();
  const cx = Math.floor(me.x), cz = Math.floor(me.z);
  let best = null;
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    const tx = cx + dx, tz = cz + dz;
    if (tx < 1 || tz < 1 || tx > 48 || tz > 48) continue;
    const tl = moveCtx.tiles?.[idx(tx, tz)];
    if (tl === undefined || tl === TILE.WATER || tl === TILE.BRIDGE || moveCtx.blocked[idx(tx, tz)]) continue;
    const d = Math.hypot(tx + 0.5 - me.x, tz + 0.5 - me.z);
    if (!best || d < best.d) best = { tx, tz, d };
  }
  if (!best || best.d > 4.4) { if (!auto) toast(t("Acércate más a la orilla para bajar")); return; }
  const driver = !me.passenger;
  const bx = me.x, bz = me.z, brot = me.rot;
  me.boat = false; me.passenger = null; me.moving = false; me.path = [];
  me.x = best.tx + 0.5; me.z = best.tz + 0.5;
  useGame.setState({ boating: 0 });
  if (driver) commit([{ op: 'patch', data: { boat: { x: +bx.toFixed(2), z: +bz.toFixed(2), rot: +brot.toFixed(2), at: serverNow() } } }]);
  sfx('splash');
  toast(t("⚓ Has bajado del bote"));
}


