import { CROPS, UPGRADES, AVATAR_LOCKS, lockKey, PRICES, ITEMS } from '../constants';
import { serverNow } from '../time';
import { canAfford, tierOf, dayUTC, priceOf, dailyOrders, ownsCosmetic, weeklyStatus, DAILY_BONUS } from '../logic';
import { me } from '../runtime';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { coinOp, commit, fx, gain, heartOps, logActivity, spend, st, statOp, toast } from './core';

// =====================================================================
//  ECONOMÍA: mercado, mejoras y pedidos
// =====================================================================
export function sellItem(id, n = 1) {
  const s = st();
  const have = s.couple.inventory?.[id] || 0;
  n = Math.min(n, have);
  if (n < 1 || !PRICES[id]) return;
  const total = priceOf(id, s.couple.seed, dayUTC(serverNow())) * n;
  commit([gain(id, -n), coinOp(total), statOp('sell', n)]);
  sfx('harvest');
  fx(`+${total} 🪙`, me.x, me.z);
}

/** Compra un desbloqueo: semilla rara (crop:ID) o prenda (hat:7…). */
export function buyUnlock(key) {
  const s = st();
  const price = key.startsWith('crop:') ? CROPS[key.slice(5)]?.price : AVATAR_LOCKS[key]?.coins;
  const k = key.startsWith('crop:') ? 'crop_' + key.slice(5) : lockKey(key);
  if (!price || s.couple.unlocks?.[k]) return;
  if ((s.couple.coins || 0) < price) return toast(t("Faltan monedas 🪙"));
  commit([coinOp(-price), { op: 'patch', data: { [`unlocks.${k}`]: true } }]);
  sfx('love');
  toast(t("🛍️ ¡Desbloqueado!"));
}

export function buyUpgrade(tool) {
  const s = st();
  const lv = tierOf(s.couple, tool), costs = UPGRADES[tool].costs;
  if (lv >= costs.length) return;
  if ((s.couple.coins || 0) < costs[lv]) return toast(t("Faltan monedas 🪙"));
  commit([coinOp(-costs[lv]), { op: 'patch', data: { [`upgrades.${tool}`]: lv + 1 } }]);
  sfx('build');
  toast(t("⬆️ {0} mejorada al nivel {1}", [UPGRADES[tool].label, lv + 1]));
}

export const ordersToday = () => { const s = st(); return dailyOrders(s.couple.seed, dayUTC(serverNow()), s.env?.season); };

export function completeOrder(slot) {
  const s = st();
  const day = dayUTC(serverNow());
  const o = dailyOrders(s.couple.seed, day, s.env?.season).find((x) => x.slot === slot);
  if (!o || s.couple.orders?.[day]?.[slot]) return;
  if (!canAfford(s.couple.inventory, o.need)) return toast(t("Aún os faltan cosas para este pedido"));
  const ops = [...spend(o.need), coinOp(o.coins), ...heartOps(o.hearts), statOp('order', 1), { op: 'patch', data: { [`orders.${day}.${slot}`]: s.user.uid } }];
  let extra = '';
  if (o.cos) {
    if (!ownsCosmetic(s.couple, o.cos)) { ops.push({ op: 'patch', data: { [`unlocks.${lockKey(o.cos)}`]: true } }); extra = t(" ¡y una prenda exclusiva para el Vestidor! 👗"); }
    else ops.push(coinOp(100));
  }
  // Bonus por completar los 4 pedidos del día (se paga una sola vez, con el último)
  const doneNow = s.couple.orders?.[day] || {};
  const all = dailyOrders(s.couple.seed, day, s.env?.season);
  let bonus = '';
  if (!doneNow.bonus && all.every((x) => x.slot === slot || doneNow[x.slot])) {
    ops.push(coinOp(DAILY_BONUS.coins), ...heartOps(DAILY_BONUS.hearts), { op: 'patch', data: { [`orders.${day}.bonus`]: true } });
    bonus = t(" ¡Bonus del día: +{0} 🪙 +{1} 💗!", [DAILY_BONUS.coins, DAILY_BONUS.hearts]);
  }
  commit(ops);
  logActivity('order', o.npc.name);
  sfx('love');
  fx(`+${o.coins} 🪙 +${o.hearts}💗`, me.x, me.z);
  toast(t("📋 Pedido entregado: +{0} 🪙 +{1} 💗", [o.coins, o.hearts]) + extra + bonus);
}

/** Aporta al pedido grande semanal todo lo que se pueda de un ingrediente (la mochila es compartida). */
export function contributeWeekly(item) {
  const s = st();
  const w = weeklyStatus(s.couple, serverNow(), s.env?.season);
  if (w.claimed || !(item in w.need)) return;
  const n = Math.min(w.need[item] - w.given[item], s.couple.inventory?.[item] || 0);
  if (n <= 0) return toast(t("No tenéis más de eso para aportar"));
  const uid = s.user.uid, k = w.key;
  const ops = [...spend({ [item]: n }), { op: 'inc', field: `orders.${k}.${uid}.${item}`, by: n }];
  if (!s.couple.orders?.[k]?.need) ops.push({ op: 'patch', data: { [`orders.${k}.need`]: w.need } });
  const complete = Object.keys(w.need).every((x) => w.given[x] + (x === item ? n : 0) >= w.need[x]);
  if (complete) ops.push(coinOp(w.coins), ...heartOps(w.hearts), statOp('order', 1), { op: 'patch', data: { [`orders.${k}.claimed`]: true } });
  commit(ops);
  sfx(complete ? 'love' : 'harvest');
  if (complete) { fx(`+${w.coins} 🪙 +${w.hearts}💗`, me.x, me.z); toast(t("🎁 ¡Pedido grande completado entre los dos! +{0} 🪙 +{1} 💗", [w.coins, w.hearts])); }
  else toast(t("Aportado: {0} × {1}", [ITEMS[item].label, n]));
}


