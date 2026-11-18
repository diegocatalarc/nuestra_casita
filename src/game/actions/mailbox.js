import { partnerUid } from '../../store/gameStore';
import { serverNow } from '../time';
import { cropInfo, animalStats, newId, childInfo, weekKey } from '../logic';
import { me } from '../runtime';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { commit, earn, fx, heartOps, logActivity, st, statOp, toast } from './core';

// =====================================================================
//  BUZÓN · METAS · MIENTRAS NO ESTABAS
// =====================================================================
export function sendLetter({ text, image = null, quick = false }) {
  const s = st();
  const pu = partnerUid(s);
  if (!pu) return toast(t("Tu pareja aún no se ha unido"));
  if (!quick && !text.trim() && !image) return;
  commit([{ op: 'set', col: 'mailbox', id: newId('l'), data: { from: s.user.uid, to: pu, text: text.trim(), image, quick, at: serverNow(), readAt: null } }, statOp('letter', 1)]);
  logActivity('letter');
  sfx('pop');
  toast(t("💌 Carta enviada al buzón de tu pareja"));
}

export function readLetter(id) {
  const s = st();
  const m = s.mailbox[id];
  if (!m || m.to !== s.user.uid || m.readAt) return;
  const e = earn('letter');
  commit([{ op: 'set', col: 'mailbox', id, data: { readAt: serverNow() } }, ...e.ops]);
  if (e.n) fx(`+${e.n}💗`, me.x, me.z);
}

export function goalProgress(s, g) {
  return s.couple?.stats?.[weekKey(serverNow())]?.[g.metric] || 0;
}
export function claimGoal(g) {
  const s = st();
  const wk = weekKey(serverNow());
  if (s.couple?.goalsClaimed?.[wk]?.[g.id]) return;
  if (goalProgress(s, g) < g.target) return toast(t("Aún no habéis llegado"));
  commit([{ op: 'patch', data: { [`goalsClaimed.${wk}.${g.id}`]: true } }, ...heartOps(g.reward)]);
  toast(t("🎯 Meta cumplida: +{0} 💗", [g.reward]));
  sfx('love');
}

/** Última vez que estuvo aquí esta persona (base del resumen "mientras no estabas") */
export function touchSeen() {
  const s = st();
  if (!s.user || !s.couple?.players?.[s.user.uid]) return;
  commit([{ op: 'patch', data: { [`players.${s.user.uid}.lastSeenAt`]: serverNow() } }]);
}

export function computeAway(prevSeen) {
  const s = st();
  const now = serverNow();
  const uid = s.user.uid;
  const byKind = {};
  for (const a of Object.values(s.activity)) {
    if (a.by === uid || a.at <= prevSeen) continue;
    const k = (byKind[a.kind] ||= { kind: a.kind, count: 0, labels: [] });
    k.count++;
    if (a.label && !k.labels.includes(a.label)) k.labels.push(a.label);
  }
  const events = Object.values(byKind);
  const ready = Object.values(s.crops).filter((c) => cropInfo(c, now).stage === 4).length;
  const hungryAnimals = Object.values(s.animals).filter((a) => animalStats(a, now).hunger > 0.6).length;
  const hungryKids = Object.values(s.children).filter((c) => childInfo(c, now).hunger > 0.6).length;
  const mail = Object.values(s.mailbox).filter((m) => m.to === uid && !m.readAt).length;
  if (!events.length && !ready && !hungryAnimals && !hungryKids && !mail) return null;
  return { since: prevSeen, events, ready, hungryAnimals, hungryKids, mail };
}


