import { FOOD, ITEMS, HOUSE, FAMILY } from '../constants';
import { serverNow, TIME_SCALE } from '../time';
import { animalPos, childInfo, familyStatus, childLook } from '../logic';
import { t } from '../../i18n';
import { goAndDo, wave } from './base';
import { commit, doAnim, earn, fx, gain, logActivity, st, toast } from './core';

// =====================================================================
//  FAMILIA
// =====================================================================
export function proposeBaby() {
  const s = st();
  const f = s.couple.family || {};
  if (f.plan || f.due) return;
  const fs = familyStatus(s);
  if (!fs.ok) return toast(t("Aún faltan requisitos para tener un bebé (mira la lista)"));
  commit([{ op: 'patch', data: { 'family.plan': { by: s.user.uid, at: serverNow() } } }]);
  toast(t("💌 Propuesta enviada. Vuestra pareja tiene que aceptarla."));
}

export function respondBaby(accept) {
  const s = st();
  const plan = s.couple.family?.plan;
  if (!plan) return;
  if (!accept || plan.by === s.user.uid) { commit([{ op: 'patch', data: { 'family.plan': null } }]); return toast(plan.by === s.user.uid ? t("Propuesta cancelada") : t("Habéis decidido esperar un poco 💛")); }
  const fs = familyStatus(s);
  if (!fs.ok) return toast(t("Ya no se cumplen los requisitos"));
  const now = serverNow();
  commit([
    { op: 'inc', field: 'hearts', by: -FAMILY.cost },
    { op: 'patch', data: { 'family.plan': null, 'family.due': { startedAt: now, dueAt: now + FAMILY.gestationMs / TIME_SCALE, by: plan.by } } },
  ]);
  toast(t("🍼 ¡Estáis esperando un bebé!"));
  logActivity('baby', t("esperáis"));
}

export function checkBirth() {
  const s = st();
  const due = s.couple?.family?.due;
  if (!due || !s.loaded.children || serverNow() < due.dueAt) return;
  const id = `c_${due.startedAt}`;
  if (s.children[id]) { commit([{ op: 'patch', data: { 'family.due': null } }]); return; }
  const now = serverNow();
  const look = childLook(id, s.couple.players);
  const home = { x: HOUSE.x + 2 + Math.random() * 2, z: HOUSE.z + HOUSE.d + 1.2 + Math.random() };
  commit([
    { op: 'set', col: 'children', id, data: { name: t("Bebé"), bornAt: now, fedAt: now, playedAt: 0, home, ...look } },
    { op: 'patch', data: { 'family.due': null } },
  ]);
  s.set({ panel: 'family' });
  toast(t("👶 ¡Ha nacido vuestro bebé! Ponedle nombre en Familia"));
  logActivity('baby', t("nació"));
}

export function renameChild(id, name) {
  const n = name.trim().slice(0, 16);
  if (n) commit([{ op: 'set', col: 'children', id, data: { name: n } }]);
}

export function childInteract(id) {
  const c0 = st().children[id];
  if (!c0) return;
  const p = animalPos({ id: c0.id, home: c0.home }, serverNow());
  goAndDo(p.x, p.z, () => careChild(id), 1.6);
}

export function careChild(id) {
  const s = st();
  const c = s.children[id];
  if (!c) return;
  const now = serverNow();
  const info = childInfo(c, now);
  const pos = animalPos({ id: c.id, home: c.home }, now);
  if (info.hunger > 0.35) {
    const food = (s.couple.inventory?.milk || 0) > 0 ? 'milk' : FOOD.find((f) => (s.couple.inventory?.[f] || 0) > 0);
    if (!food) return toast(t("No hay comida para el peque. Las vacas dan leche 🥛"));
    const e = earn('care');
    commit([{ op: 'set', col: 'children', id, data: { fedAt: now } }, gain(food, -1), ...e.ops]);
    doAnim('harvest'); fx(t("{0} ¡ñam!{1}", [ITEMS[food].emoji, e.n ? ` +${e.n}💗` : '']), pos.x, pos.z);
  } else if (info.playReady) {
    const e = earn('care');
    commit([{ op: 'set', col: 'children', id, data: { playedAt: now } }, ...e.ops]);
    doAnim('love', 1400); fx(t("🧸 ¡jugamos!{0}", [e.n ? ` +${e.n}💗` : '']), pos.x, pos.z);
  } else {
    doAnim('wave'); fx('💗', pos.x, pos.z);
  }
}

