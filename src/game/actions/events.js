import { partnerUid } from '../../store/gameStore';
import { CROPS, ITEMS, FESTIVAL_TIERS, WISH, lockKey } from '../constants';
import { serverNow } from '../time';
import { eventsFor, visitorGift, meteorActive, ownsCosmetic } from '../logic';
import { me } from '../runtime';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { commit, doAnim, fx, gain, heartOps, logActivity, st, toast } from './core';

// =====================================================================
//  EVENTOS: festivales, visitante y lluvia de estrellas
// =====================================================================
export const todayEvents = () => { const s = st(); return eventsFor(s.couple.seed, serverNow(), s.env.season); };

/** Guarda el resultado de un intento del minijuego (cuenta el mejor de cada persona). */
export function submitFestivalScore(score) {
  const s = st(), uid = s.user.uid, ev = todayEvents();
  const cur = s.couple.events?.[ev.day] || {};
  const ops = [{ op: 'inc', field: `events.${ev.day}.tries.${uid}`, by: 1 }];
  if (score > (cur.score?.[uid] || 0)) ops.push({ op: 'patch', data: { [`events.${ev.day}.score.${uid}`]: score } });
  commit(ops);
  logActivity('festival', ev.festival?.name || '');
}

export const festivalTotal = (couple, day) => Object.values(couple.events?.[day]?.score || {}).reduce((a, b) => a + b, 0);

/** Reclama todos los premios alcanzados que aún no hayas cobrado. */
export function claimFestival() {
  const s = st(), uid = s.user.uid, ev = todayEvents();
  if (!ev.festival) return;
  const total = festivalTotal(s.couple, ev.day);
  const got = s.couple.events?.[ev.day]?.claimed?.[uid] || 0;
  const reached = FESTIVAL_TIERS.filter((tr) => total >= tr.score).length;
  if (reached <= got) return toast(t("Aún no hay premios nuevos"));
  const ops = [{ op: 'patch', data: { [`events.${ev.day}.claimed.${uid}`]: reached } }];
  let coins = 0, hearts = 0, extra = '';
  for (let i = got; i < reached; i++) {
    const tr = FESTIVAL_TIERS[i];
    coins += tr.coins; hearts += tr.hearts;
    if (tr.prize) {
      const key = ev.festival.prize;
      if (!ownsCosmetic(s.couple, key)) { ops.push({ op: 'patch', data: { [`unlocks.${lockKey(key)}`]: true } }); extra = t(" ¡y una prenda de festival para el Vestidor! 👗"); }
      else coins += 150;
    }
  }
  ops.push({ op: 'inc', field: 'coins', by: coins }, ...heartOps(hearts));
  commit(ops);
  sfx('love');
  fx(`+${coins} 🪙 +${hearts}💗`, me.x, me.z);
  toast(t("🎉 Premios del festival: +{0} 🪙 +{1} 💗", [coins, hearts]) + extra);
}

export function claimVisitorGift() {
  const s = st(), uid = s.user.uid, ev = todayEvents();
  if (!ev.visitor || s.couple.events?.[ev.day]?.gift) return;
  const g = visitorGift(s.couple.seed, ev.day);
  const ops = [{ op: 'patch', data: { [`events.${ev.day}.gift`]: uid } }, ...heartOps(2)];
  let msg;
  if (g.kind === 'coins') { ops.push({ op: 'inc', field: 'coins', by: g.coins }); msg = `+${g.coins} 🪙`; }
  else if (g.kind === 'item') { ops.push(gain(g.item, g.n)); msg = `+${g.n} ${ITEMS[g.item].emoji}`; }
  else if (!s.couple.unlocks?.[`crop_${g.crop}`]) { ops.push({ op: 'patch', data: { [`unlocks.crop_${g.crop}`]: true } }); msg = t("¡semillas de {0}!", [CROPS[g.crop].label]); }
  else { ops.push({ op: 'inc', field: 'coins', by: g.coins }); msg = `+${g.coins} 🪙`; }
  commit(ops);
  logActivity('visitor', ev.visitor.name);
  sfx('love');
  toast(t("🎁 {0} os regala: {1} +2 💗", [ev.visitor.name, msg]));
}

/** Pide un deseo a una estrella fugaz: +3 💗; si los dos lo piden con pocos minutos de diferencia, +10 💗 extra. */
export function makeWish() {
  const s = st(), uid = s.user.uid, ev = todayEvents();
  if (!meteorActive(ev, s.env.hour)) return toast(t("Solo se ven estrellas fugaces de noche"));
  const cur = s.couple.events?.[ev.day] || {};
  if (cur.wish?.[uid]) return toast(t("Ya has pedido tu deseo esta noche ✨"));
  const now = serverNow();
  const pu = partnerUid(s);
  const together = pu && cur.wish?.[pu] && now - cur.wish[pu] < WISH.windowMs && !cur.wishBonus;
  const ops = [{ op: 'patch', data: { [`events.${ev.day}.wish.${uid}`]: now, ...(together ? { [`events.${ev.day}.wishBonus`]: true } : {}) } }, ...heartOps(WISH.hearts + (together ? WISH.bonus : 0))];
  commit(ops);
  sfx('love'); doAnim('love', 1800);
  fx(`🌠 +${WISH.hearts + (together ? WISH.bonus : 0)}💗`, me.x, me.z);
  toast(together ? t("🌠 ¡Pedisteis el deseo juntos! +{0} 💗", [WISH.hearts + WISH.bonus]) : t("🌠 Deseo pedido: +{0} 💗. Si {1} también pide uno pronto, ¡bonus!", [WISH.hearts, pu ? st().partner.name : t('tu pareja')]));
}


