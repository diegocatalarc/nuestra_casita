import { useGame, partnerUid } from '../../store/gameStore';
import { GIFT } from '../constants';
import { serverNow } from '../time';
import { newId } from '../logic';
import { me } from '../runtime';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { wave } from './base';
import { commit, doAnim, gain, heartOps, logActivity, st, statOp, toast } from './core';
import { dist } from './dates';

// =====================================================================
//  REGALOS ESCONDIDOS
// =====================================================================
export function hideGift({ kind, item, n, note, hint }) {
  const s = st(), uid = s.user.uid, pu = partnerUid(s);
  if (!pu) return toast(t("Tu pareja aún no se ha unido"));
  if (me.boat) return toast(t("Baja del bote para esconder el regalo"));
  if (Object.values(s.gifts).filter((g) => g.from === uid && !g.foundBy).length >= GIFT.max) return toast(t("Ya tienes {0} regalos escondidos sin encontrar", [GIFT.max]));
  const cost = kind === 'coins' ? [{ op: 'inc', field: 'coins', by: -n }] : [gain(item, -n)];
  if (kind === 'coins' ? (s.couple.coins || 0) < n : (s.couple.inventory?.[item] || 0) < n) return toast(t("No tenéis suficiente"));
  commit([...cost, { op: 'set', col: 'gifts', id: newId('g'), data: { from: uid, x: +me.x.toFixed(1), z: +me.z.toFixed(1), kind, item: item || null, n, note: (note || '').trim().slice(0, GIFT.noteMax), hint: (hint || '').trim().slice(0, 80), at: serverNow(), foundBy: null } }]);
  sfx('pop');
  toast(t("🎁 Regalo escondido aquí. ¡Que lo encuentre!"));
}

/** Recupera un regalo tuyo que nadie ha encontrado */
export function retrieveGift(id) {
  const s = st(), g = s.gifts[id];
  if (!g || g.from !== s.user.uid || g.foundBy) return;
  commit([{ op: 'del', col: 'gifts', id }, g.kind === 'coins' ? { op: 'inc', field: 'coins', by: g.n } : gain(g.item, g.n)]);
}

export const claiming = new Set();
/** Cada segundo: si pasas por encima de un regalo que escondió tu pareja, lo encuentras. */
export function checkGifts() {
  const s = st(), uid = s.user?.uid;
  if (!uid || me.boat || me.sleeping) return;
  for (const g of Object.values(s.gifts)) {
    if (g.from === uid || g.foundBy || claiming.has(g.id) || dist(me, g) > GIFT.findDist) continue;
    claiming.add(g.id);
    const ops = [{ op: 'set', col: 'gifts', id: g.id, data: { foundBy: uid, foundAt: serverNow() } }, g.kind === 'coins' ? { op: 'inc', field: 'coins', by: g.n } : gain(g.item, g.n), ...heartOps(6), statOp('gift', 1)];
    commit(ops);
    logActivity('gift', s.couple.players?.[uid]?.name || '');
    sfx('love'); doAnim('wave', 1500);
    useGame.setState({ giftFound: { ...g, foundBy: uid } });
  }
}


