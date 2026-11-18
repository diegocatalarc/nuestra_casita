import { partnerUid } from '../../store/gameStore';
import { DATES, DATE_LIMIT, DATE_REWARD } from '../constants';
import { serverNow, dateKey } from '../time';
import { newId, inHours, dayUTC } from '../logic';
import { me, others } from '../runtime';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { commit, doAnim, fx, heartOps, logActivity, st, statOp, toast } from './core';

// =====================================================================
//  CITAS EN PAREJA
// =====================================================================
export const online = () => { const pu = partnerUid(st()); return pu && others[pu]?.online ? others[pu] : null; };
export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** ¿Se cumple ahora la condición de la cita? (lo calcula la persona que invitó) */
export function dateCondition(date) {
  const s = st(), o = online(), k = DATES[date.kind];
  if (!o) return { ok: false, why: t("Esperando a tu pareja…") };
  if (k.hours && !inHours(s.env.hour, k.hours)) return { ok: false, why: t("Ahora no es el momento del día adecuado") };
  switch (date.kind) {
    case 'picnic': case 'stars': {
      const sp = date.spot || { x: me.x, z: me.z };
      if (me.boat || o.boat) return { ok: false, why: t("Bajad del bote") };
      return dist(me, sp) < 5 && dist(o, sp) < 5 ? { ok: true } : { ok: false, why: t("Acercaos los dos a la manta 🧺") };
    }
    case 'boat': return me.boat && o.boat ? { ok: true } : { ok: false, why: t("Subid los dos al bote ⛵") };
    case 'fishing': return me.fish && o.fx != null ? { ok: true } : { ok: false, why: t("Lanzad los dos la caña 🎣") };
    case 'dinner': return me.insideId && me.insideId === o.inside ? { ok: true } : { ok: false, why: t("Entrad los dos en la misma habitación") };
    default: return { ok: false, why: '' };
  }
}

export function inviteDate(kind) {
  const s = st(), uid = s.user.uid, o = online();
  if (!o) return toast(t("Tu pareja tiene que estar en línea"));
  if (s.couple.date) return toast(t("Ya hay una cita en marcha"));
  if ((s.couple.datesDone?.[dayUTC(serverNow())] || 0) >= DATE_LIMIT) return toast(t("Hoy ya habéis tenido {0} citas 💞 ¡Mañana más!", [DATE_LIMIT]));
  const d = { kind, by: uid, state: 'invited', at: serverNow(), progress: 0, spot: { x: +me.x.toFixed(1), z: +me.z.toFixed(1) } };
  commit([{ op: 'patch', data: { date: d } }]);
  toast(t("💌 Invitación enviada: {0} {1}", [DATES[kind].emoji, DATES[kind].label]));
}

export function respondDate(accept) {
  const s = st(), d = s.couple.date;
  if (!d || d.by === s.user.uid || d.state !== 'invited') return;
  commit([{ op: 'patch', data: { date: accept ? { ...d, state: 'active', startedAt: serverNow() } : null } }]);
  if (accept) { sfx('love'); toast(t("💞 ¡Cita aceptada!")); }
}
export function cancelDate() { if (st().couple.date) commit([{ op: 'patch', data: { date: null } }]); }

let dateProg = 0, dateId = null, lastDateWrite = 0;
/** Cada segundo: quien invitó cuenta el tiempo juntos y cierra la cita. */
export function datesTick() {
  const s = st(), d = s.couple?.date;
  if (!d || d.state !== 'active' || d.by !== s.user?.uid) { dateId = null; return; }
  const key = d.by + d.at;
  if (dateId !== key) { dateId = key; dateProg = d.progress || 0; }
  const goal = DATES[d.kind].goal;
  if (!dateCondition(d).ok) return;
  dateProg += 1;
  if (dateProg < goal) {
    if (dateProg - (d.progress || 0) >= 5 && performance.now() - lastDateWrite > 4000) { lastDateWrite = performance.now(); commit([{ op: 'patch', data: { 'date.progress': dateProg } }]); }
    return;
  }
  // ¡completada!
  dateId = null;
  const k = DATES[d.kind], pu = partnerUid(s), name = s.couple.players?.[pu]?.name || t("tu pareja");
  const day = dayUTC(serverNow());
  const mid = newId('m');
  commit([
    { op: 'patch', data: { date: null } },
    { op: 'inc', field: `datesDone.${day}`, by: 1 },
    { op: 'inc', field: 'coins', by: DATE_REWARD.coins },
    ...heartOps(DATE_REWARD.hearts), statOp('date', 1),
    { op: 'set', col: 'memories', id: mid, data: { kind: 'date', title: `${k.emoji} ${k.label}`, text: t("Una cita de {0} con {1}. ¡Qué bonito rato juntos!", [k.label.toLowerCase(), name]), date: dateKey(), by: s.user.uid, at: serverNow(), auto: true } },
  ]);
  logActivity('date', k.label);
  sfx('love'); doAnim('love', 2000);
  fx(`💞 +${DATE_REWARD.hearts}💗 +${DATE_REWARD.coins}🪙`, me.x, me.z);
  toast(t("💞 ¡Cita completada! {0} +{1} 💗 +{2} 🪙 y un recuerdo nuevo en la sala", [k.emoji, DATE_REWARD.hearts, DATE_REWARD.coins]));
}

