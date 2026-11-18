import { partnerUid } from '../../store/gameStore';
import { FOOD, ITEMS, DISHES, FOOD_VALUE, VITALS } from '../constants';
import { serverNow, dateKey } from '../time';
import { animalStats, canAfford, dishBoost, doubleCookChance, skillLv, buildingAt, bedSpots } from '../logic';
import { me, others } from '../runtime';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { goAndDo } from './base';
import { commit, doAnim, fx, gain, heartOps, logActivity, myVitals, spend, st, statOp, toast, vitalsPatch, xpOp } from './core';

// =====================================================================
//  DORMIR · COMER · COCINAR
// =====================================================================
export const bedFoot = (spot, k) => { const th = (spot.rot * Math.PI) / 2; return { x: spot.x + Math.sin(th) * k, z: spot.z + Math.cos(th) * k, th }; };

export function startSleep(spot) {
  if (me.sleeping) return;
  const f = bedFoot(spot, 0.55);
  me.path = []; me.pending = null; me.sleeping = true; me.sleepSpot = spot;
  me.x = f.x; me.z = f.z; me.rot = f.th;
  me.act = 'sleep'; me.actUntil = Infinity;
  st().set({ sleeping: true }); sfx('sleep');
  const v = myVitals();
  commit([vitalsPatch(v, { sleepSince: serverNow() })]);
  toast(t("😴 Durmiendo… pulsa cualquier tecla o \"Despertar\" para levantarte"));
}

export function sleepAt(spot) {
  const f = bedFoot(spot, 1.3);
  goAndDo(f.x, f.z, () => startSleep(spot), 1.1);
}

export function goSleep() {
  const s = st();
  const beds = bedSpotsNow();
  if (!beds.length) return toast(t("Necesitáis una cama: la casita tiene una, o colocad una en Decorar 🛏️"));
  const b = beds.sort((a, c) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(c.x - me.x, c.z - me.z))[0];
  sleepAt(b);
}
export const bedSpotsNow = () => { const s = st(); return bedSpots(s.buildings, s.decor); };

export function wake() {
  if (!me.sleeping) return;
  const s = st();
  const v = myVitals();
  const spot = me.sleepSpot;
  me.sleeping = false; me.act = null; me.actUntil = 0;
  st().set({ sleeping: false });
  if (spot) { const f = bedFoot(spot, 1.5); me.x = f.x; me.z = f.z; }
  commit([vitalsPatch(v, { sleepSince: null })]);
  toast(t("☀️ Te despiertas con {0} % de energía", [Math.round(v.energy)]));
}

let bothSince = 0;
export function checkSleepTogether() {
  const s = st();
  const pu = partnerUid(s);
  const p = pu && others[pu];
  const date = dateKey();
  if (!me.sleeping || !p?.online || p.anim !== 'sleep') { bothSince = 0; return; }
  if (!bothSince) bothSince = serverNow();
  if (serverNow() - bothSince >= VITALS.sleepTogetherSec * 1000 && s.couple.lastSleepTogether !== date) {
    commit([{ op: 'patch', data: { lastSleepTogether: date } }, ...heartOps(VITALS.sleepTogetherHearts), statOp('sleepTogether', 1)]);
    logActivity('sleepTogether');
    toast(t("💤 Dormir juntos: +{0} 💗", [VITALS.sleepTogetherHearts]));
    bothSince = 0;
  }
}

let warnedTired = false, warnedHungry = false;
export function vitalsNotices() {
  const v = myVitals();
  me.tired = v.tired;
  if (v.tired && !warnedTired && !me.sleeping) { warnedTired = true; toast(t("🥱 Estás agotada/o: ve a dormir (botón 😴)")); }
  if (!v.tired) warnedTired = false;
  if (v.hungry && !warnedHungry) { warnedHungry = true; toast(t("🍽️ Tienes hambre: abre Comer")); }
  if (!v.hungry) warnedHungry = false;
}

export function eatItem(item) {
  const s = st();
  if (me.sleeping) return toast(t("Estás durmiendo 😴"));
  const now = serverNow();
  const uid = s.user.uid;
  const v = myVitals();
  if ((s.couple.inventory?.[item] || 0) < 1) return toast(t("No tenéis de eso"));
  const dish = DISHES[item];
  let food = dish ? dish.food : FOOD_VALUE[item];
  if (!food) return toast(t("Eso no se come"));
  if (v.full > 92) return toast(t("No tienes hambre 😊"));
  const nearTable = Object.values(s.decor).some((d) => d.type === 'table' && Math.hypot(d.x - me.x, d.z - me.z) < 2.6) || !!buildingAt(s.buildings, me.x, me.z);
  if (dish) food = Math.round(food * dishBoost(s.couple));
  if (dish && nearTable) food = Math.round(food * 1.2);
  const nv = { energy: Math.min(100, v.energy + (dish?.energy ?? 2)), full: Math.min(100, v.full + food) };
  const ops = [gain(item, -1), vitalsPatch(nv, { lastEatAt: now })];
  if (dish?.hearts) ops.push(...heartOps(dish.hearts));
  const pu = partnerUid(s), p2 = pu && s.couple.players?.[pu];
  if (p2?.lastEatAt && now - p2.lastEatAt < 90000 && others[pu]?.online && Math.hypot(others[pu].x - me.x, others[pu].z - me.z) < 4 && now - (s.couple.lastMeal || 0) > 20 * 60000) {
    ops.push(...heartOps(VITALS.eatTogetherHearts), { op: 'patch', data: { lastMeal: now } });
    toast(t("🍽️ Comer juntos: +{0} 💗", [VITALS.eatTogetherHearts]));
  }
  doAnim('eat', 1500);
  commit(ops);
  fx(t("{0} ñam +{1}", [ITEMS[item].emoji, Math.round(food)]), me.x, me.z);
}

export function cook(id) {
  const s = st();
  const d = DISHES[id];
  if (!Object.values(s.buildings).some((b) => b.type === 'kitchen')) return toast(t("Necesitáis construir la Cocina"));
  if (!canAfford(s.couple.inventory, d.need)) return toast(t("Faltan ingredientes"));
  doAnim('harvest', 1200);
  const dbl = Math.random() < doubleCookChance(s.couple);
  const hearts = (d.hearts || 0) + (skillLv(s.couple, 'cook') >= 5 ? 1 : 0);
  commit([...spend(d.need), gain(id, dbl ? 2 : 1), xpOp('cook', 4), ...(hearts ? heartOps(hearts) : [])]);
  fx(t("{0} ¡listo!{1}", [d.emoji, hearts ? ` +${hearts}💗` : '']) + (dbl ? ' ×2✨' : ''), me.x, me.z);
  toast(`${d.emoji} ${d.label} cocinada`);
  logActivity('cook', d.label);
}

// =====================================================================
//  GRANERO: alimentación automática
// =====================================================================
let lastAuto = 0;
export function autoFeedAnimals() {
  const s = st();
  const now = serverNow();
  if (now - lastAuto < 15000 || !s.loaded.animals || !Object.values(s.buildings).some((b) => b.type === 'barn')) return;
  const pu = partnerUid(s);
  if (pu && others[pu]?.online && s.user.uid > pu) return; // solo una persona ejecuta la tarea
  lastAuto = now;
  const inv = { ...s.couple.inventory };
  const ops = [];
  const names = [];
  for (const a of Object.values(s.animals)) {
    if (animalStats(a, now).hunger < 0.7) continue;
    const food = FOOD.find((f) => f !== 'milk' && (inv[f] || 0) > 0);
    if (!food) break;
    inv[food]--;
    ops.push({ op: 'set', col: 'animals', id: a.id, data: { fedAt: now } }, gain(food, -1));
    names.push(a.name);
  }
  if (ops.length) { commit(ops); toast(t("🛖 El granero ha dado de comer a {0}", [names.join(', ')])); }
}

