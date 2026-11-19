import { partnerUid } from '../../store/gameStore';
import { CROPS, NODE_DEFS, BUILDINGS, DECOR, ANIMALS, FOOD, ITEMS, PASTURE, HOUSE, QUEST_HEARTS, QUEST_BOTH_BONUS, PET } from '../constants';
import { serverNow, dateKey, daysBetween, TIME_SCALE, fmtDuration } from '../time';
import { cropInfo, isPlantable, nodeAlive, nodeAmount, animalStats, animalPos, validateBuilding, validateDecor, canAfford, newId, dailyQuests, petTrait, doubleHarvestChance, tierOf, rareCrop, rateAt, animalCapacity, buildingAt } from '../logic';
import { findPath } from '../movement';
import { me, others } from '../runtime';
import { HOUSE_DOC } from '../initialState';
import { t } from '../../i18n';
import { commit, doAnim, earn, fx, gain, heartOps, logActivity, spend, st, statOp, toast, xpOp } from './core';
import { cancelFish } from './fishing';
import { cook, wake } from './vitals';

export function goAndDo(tx, tz, fn, reach = 1.5) {
  if (me.sleeping) wake();
  if (Math.hypot(me.x - tx, me.z - tz) <= reach) {
    me.rot = Math.atan2(tx - me.x, tz - me.z);
    me.path = []; me.pending = null;
    fn();
    return true;
  }
  const path = findPath(me.x, me.z, Math.floor(tx), Math.floor(tz), Math.max(0.5, reach - 0.1), me.boat);
  if (!path) { toast(t("No puedo llegar hasta ahí")); return false; }
  me.path = path;
  me.pending = { fn, tx, tz, reach };
  return true;
}

export function walkTo(tx, tz) {
  if (me.sleeping) wake();
  if (me.fish) cancelFish();
  const path = findPath(me.x, me.z, tx, tz, 0.5, me.boat);
  if (!path) { toast(me.boat ? t("El bote solo navega por el agua") : t("No puedo llegar hasta ahí")); return; }
  me.path = path; me.pending = null;
}

// ---------- Mundo base ----------
export function ensureHouse() {
  const s = st();
  if (s.loaded.buildings && !s.buildings.house) commit([{ op: 'set', col: 'buildings', id: 'house', data: HOUSE_DOC }]);
}

export function dailyLogin() {
  const s = st();
  const uid = s.user.uid, date = dateKey();
  const p = s.couple.players?.[uid];
  if (!p || p.lastLogin === date) return;
  const streak = p.lastLogin && daysBetween(p.lastLogin, date) === 1 ? (p.streak || 0) + 1 : 1;
  const n = 5 + Math.min(streak - 1, 7);
  commit([...heartOps(n), { op: 'patch', data: { [`players.${uid}.lastLogin`]: date, [`players.${uid}.streak`]: streak } }]);
  toast(t("¡Bienvenida/o de nuevo! +{0} 💗{1}", [n, streak > 1 ? t(" · racha de {0} días", [streak]) : '']));
}

/** La lluvia riega los cultivos al aire libre (idéntico en ambos clientes). */
let lastRainSlot = -1;
export function rainWater() {
  const s = st();
  if ((s.env.weather !== 'rain' && s.env.weather !== 'storm') || s.env.slot === lastRainSlot || !s.loaded.crops) return;
  lastRainSlot = s.env.slot;
  const t0 = s.env.slot * 8 * 60 * 1000;
  const ops = Object.values(s.crops)
    .filter((c) => !c.harvested && !c.wateredAt && !buildingAt(s.buildings, c.x, c.z))
    .map((c) => ({ op: 'set', col: 'crops', id: c.id, data: { wateredAt: t0, lastWaterAt: t0, rate: rateAt(c.type, s.env.season, s.buildings, c.x, c.z) } }));
  if (ops.length) { commit(ops); toast(t("🌧️ La lluvia ha regado el huerto")); }
}

// ---------- Huerto ----------
export function plantAt(tx, tz, cropId) {
  goAndDo(tx + 0.5, tz + 0.5, () => {
    const s = st();
    const key = `${tx}_${tz}`;
    if (!rareCrop(s.couple, cropId)) return toast(t("Esa semilla se desbloquea en el 🏪 Mercado"));
    if (!isPlantable(s.world, s.buildings, tx, tz, cropId, s.soil)) return toast(CROPS[cropId]?.shade ? t("Los hongos crecen en el suelo del bosque o en el Cobertizo de hongos") : t("Aquí no se puede plantar"));
    const ex = s.crops[key];
    if (ex && !ex.harvested) return toast(t("Ya hay algo plantado ahí"));
    doAnim('dig');
    commit([{ op: 'set', col: 'crops', id: key, data: { type: cropId, x: tx, z: tz, plantedAt: serverNow(), wateredAt: null, lastWaterAt: 0, rate: 1, harvested: false, by: s.user.uid } }]);
    fx('🌱', tx + 0.5, tz + 0.5);
  }, 1.6);
}

export function cropInteract(key) {
  const c = st().crops[key];
  if (!c) return;
  goAndDo(c.x + 0.5, c.z + 0.5, () => {
    const s = st();
    const c2 = s.crops[key];
    if (!c2 || c2.harvested) return toast(t("La parcela está vacía. Elige 🌱 para plantar."));
    const now = serverNow();
    const info = cropInfo(c2, now);
    const def = CROPS[c2.type];
    if (info.stage === 4) {
      const e = earn('harvest', def.hearts);
      const dbl = Math.random() < doubleHarvestChance(s.couple);
      const ops = [
        { op: 'set', col: 'crops', id: key, data: { harvested: true, harvestedAt: now } },
        gain(c2.type, dbl ? 2 : 1), statOp('harvest', 1), xpOp('farm', 2),
        ...Object.entries(def.bonus || {}).map(([k, v]) => gain(k, v)),
        ...e.ops,
      ];
      doAnim('harvest');
      commit(ops); logActivity('harvest', def.label);
      fx(`+${dbl ? 2 : 1} ${def.emoji}${dbl ? '✨' : ''}${e.n ? ` +${e.n}💗` : ''}`, c2.x + 0.5, c2.z + 0.5);
      return;
    }
    if (!c2.wateredAt) {
      const e = earn('water');
      doAnim('water');
      commit([{ op: 'set', col: 'crops', id: key, data: { wateredAt: now, lastWaterAt: now, rate: rateAt(c2.type, s.env.season, s.buildings, c2.x, c2.z) } }, ...e.ops]);
      fx(`💧${e.n ? ' +1💗' : ''}`, c2.x + 0.5, c2.z + 0.5);
      return;
    }
    if (now - (c2.lastWaterAt || 0) > 4 * 60000) {
      const e = earn('water');
      const shift = ((0.1 + 0.05 * tierOf(s.couple, 'can')) * def.growMin * 60000) / ((c2.rate || 1) * TIME_SCALE);
      doAnim('water');
      commit([{ op: 'set', col: 'crops', id: key, data: { wateredAt: c2.wateredAt - shift, lastWaterAt: now } }, ...e.ops]);
      fx(t("💧 ¡crece más rápido!{0}", [e.n ? ' +1💗' : '']), c2.x + 0.5, c2.z + 0.5);
      return;
    }
    toast(t('{0} {1}: listo en {2}', [def.emoji, def.label, fmtDuration(info.remaining)]));
  }, 1.6);
}

// ---------- Recursos ----------
export function gatherNode(node) {
  goAndDo(node.x + 0.5, node.z + 0.5, () => {
    const s = st();
    const now = serverNow();
    if (!nodeAlive(node, s.nodes, now)) return toast(t("Ya se ha recolectado. Volverá a crecer."));
    const def = NODE_DEFS[node.type];
    const n = nodeAmount(node);
    doAnim('harvest');
    commit([{ op: 'set', col: 'nodes', id: node.key, data: { until: now + def.respawnMin * 60000 } }, gain(def.res, n), statOp('gather', 1)]);
    fx(`+${n} ${ITEMS[def.res].emoji}`, node.x + 0.5, node.z + 0.5);
  }, 1.6);
}

// ---------- Construcción ----------
export function placeBuilding(type, x, z) {
  const s = st();
  const def = BUILDINGS[type];
  const now = serverNow();
  const v = validateBuilding(s.world, s, type, x, z, now);
  if (!v.ok) return toast(v.reason);
  if (!canAfford(s.couple.inventory, def.cost)) return toast(t("Faltan recursos"));
  const e = earn('build');
  const id = newId('b');
  doAnim('build', 1400);
  commit([...spend(def.cost), { op: 'set', col: 'buildings', id, data: { type, x, z, w: def.w, d: def.d, builtAt: now, by: s.user.uid } }, statOp('build', 1), ...e.ops]);
  logActivity('build', def.label);
  fx(`¡${def.label}!${e.n ? ` +${e.n}💗` : ''}`, x + def.w / 2, z + def.d / 2);
  s.setTool('interact');
}

// ---------- Decoración ----------
export function placeDecor(type, x, z, rot, variant) {
  const s = st();
  const def = DECOR[type];
  const v = validateDecor(s.world, s, type, x, z, rot, null, serverNow());
  if (!v.ok) return toast(v.reason);
  if (!canAfford(s.couple.inventory, def.cost)) { toast(t("Faltan recursos")); s.setTool('interact'); return; }
  if (def.heartCost && (s.couple.hearts || 0) < def.heartCost) { toast(t("Faltan corazones")); s.setTool('interact'); return; }
  commit([...spend(def.cost), ...(def.heartCost ? [{ op: 'inc', field: 'hearts', by: -def.heartCost }] : []), { op: 'set', col: 'decor', id: newId('d'), data: { type, x, z, rot, variant, by: s.user.uid } }]);
  fx('✨', x, z);
}

export function moveDecor(id, x, z, rot, variant) {
  const s = st();
  const o = s.decor[id];
  if (!o) return;
  const v = validateDecor(s.world, s, o.type, x, z, rot, id, serverNow());
  if (!v.ok) return toast(v.reason);
  commit([{ op: 'set', col: 'decor', id, data: { x, z, rot, variant } }]);
}

/** Gira 90° el objeto seleccionado (o el fantasma mientras lo mueves / colocas uno nuevo). */
export function rotateDecor(dir = 1) {
  const s = st();
  if (s.dragId || s.decorSel) { s.set({ decorRot: (((s.decorRot + dir) % 4) + 4) % 4 }); return; }
  const o = s.decor[s.selId];
  if (!o) return toast(t("Toca un objeto para seleccionarlo"));
  const rot = ((((o.rot || 0) + dir) % 4) + 4) % 4;
  const v = validateDecor(s.world, s, o.type, o.x, o.z, rot, o.id, serverNow());
  if (!v.ok) return toast(v.reason);
  commit([{ op: 'set', col: 'decor', id: o.id, data: { rot } }]);
}

export function recolorDecor() {
  const s = st();
  if (s.dragId || s.decorSel) { s.set({ decorVariant: (s.decorVariant + 1) % 3 }); return; }
  const o = s.decor[s.selId];
  if (!o) return toast(t("Toca un objeto para seleccionarlo"));
  commit([{ op: 'set', col: 'decor', id: o.id, data: { variant: ((o.variant || 0) + 1) % (DECOR[o.type].colors?.length || 3) } }]);
}

/** Modo "mover": el objeto sigue al cursor y se suelta con el siguiente clic o toque. */
export function startMoveDecor() {
  const s = st();
  const o = s.decor[s.selId];
  if (!o) return toast(t("Toca un objeto para seleccionarlo"));
  s.set({ dragId: o.id, moveMode: true, decorRot: o.rot || 0, decorVariant: o.variant || 0 });
  toast(t("Toca el sitio nuevo para soltarlo"));
}

export function deleteSelectedDecor() {
  const s = st();
  if (!s.selId || !s.decor[s.selId]) return toast(t("Toca un objeto para seleccionarlo"));
  removeDecor(s.selId);
  s.set({ selId: null, dragId: null, moveMode: false });
}

export function removeDecor(id) {
  const o = st().decor[id];
  if (!o) return;
  const refund = Object.entries(DECOR[o.type].cost).map(([k, v]) => gain(k, DECOR[o.type].craft ? v : Math.floor(v / 2)));
  const hr = Math.floor((DECOR[o.type].heartCost || 0) / 2); // reembolso del 50 % también en corazones
  commit([{ op: 'del', col: 'decor', id }, ...refund, ...(hr ? [{ op: 'inc', field: 'hearts', by: hr }] : [])]);
  toast(DECOR[o.type].craft ? t("Objeto guardado en la mochila") : t("Objeto guardado (50 % de reembolso)"));
}

// ---------- Animales ----------
export function adoptAnimal(type) {
  const s = st();
  const def = ANIMALS[type];
  const c = s.couple;
  if (c.heartsTotal < def.unlockAt) return toast(t("Aún no desbloqueado"));
  if (c.hearts < def.cost) return toast(t("Faltan corazones"));
  if (def.needsBarn && !Object.values(s.buildings).some((b) => b.type === 'barn')) return toast(t("Necesitáis construir un Granero para esos animales"));
  const total = Object.keys(s.animals).length, cap = animalCapacity(s.buildings);
  if (total >= cap) return toast(t("El corral está lleno ({0}/{1}). Un Granero da +6 plazas.", [total, cap]));
  const count = Object.values(s.animals).filter((a) => a.type === type).length;
  const now = serverNow();
  const name = def.names[count % def.names.length];
  const home = { x: PASTURE.x0 + 1 + Math.random() * (PASTURE.x1 - PASTURE.x0 - 2), z: PASTURE.z0 + 1 + Math.random() * (PASTURE.z1 - PASTURE.z0 - 2) };
  commit([
    { op: 'inc', field: 'hearts', by: -def.cost },
    { op: 'set', col: 'animals', id: newId('a'), data: { type, name, home, bornAt: now, fedAt: now, pettedAt: 0, lastCollectAt: now } },
  ]);
  toast(t("{0} ¡{1} se ha mudado a la casita!", [def.emoji, name]));
  logActivity('adopt', `${def.label} (${name})`);
}

export function animalInteract(id) {
  const a0 = st().animals[id];
  if (!a0) return;
  const p = animalPos(a0, serverNow());
  goAndDo(p.x, p.z, () => {
    const s = st();
    const a = s.animals[id];
    if (!a) return;
    const now = serverNow();
    const stt = animalStats(a, now);
    const pos = animalPos(a, now);
    if (stt.ready) {
      const prod = stt.def.prod;
      const e = earn('collect');
      commit([
        { op: 'set', col: 'animals', id, data: { lastCollectAt: now, bond: (a.bond || 0) + PET.collect } },
        ...(prod.item === 'hearts' ? heartOps(prod.amount) : [gain(prod.item, prod.amount)]),
        ...e.ops,
      ]);
      doAnim('harvest');
      fx(prod.item === 'hearts' ? `+${prod.amount} 💗` : `+${prod.amount} ${ITEMS[prod.item].emoji}`, pos.x, pos.z);
      return;
    }
    if (stt.hunger > 0.3) {
      const food = FOOD.find((f) => (s.couple.inventory?.[f] || 0) > 0);
      if (!food) return toast(t("No tenéis comida. ¡Cosechad algo del huerto!"));
      const e = earn('feed');
      commit([{ op: 'set', col: 'animals', id, data: { fedAt: now, bond: (a.bond || 0) + PET.feed } }, gain(food, -1), statOp('feed', 1), ...e.ops, ...(petTrait(a) === 'greedy' ? heartOps(1) : [])]);
      doAnim('harvest');
      fx(t("{0} ñam{1}", [ITEMS[food].emoji, e.n ? ' +1💗' : '']), pos.x, pos.z);
      return;
    }
    commit([{ op: 'set', col: 'animals', id, data: { pettedAt: now, bond: (a.bond || 0) + PET.pet } }]);
    doAnim('wave');
    fx('💗', pos.x, pos.z);
  }, 1.6);
}

// ---------- Recuerdos y misiones ----------
export function addMemory(mem) {
  const s = st();
  const id = newId('m');
  commit([{ op: 'set', col: 'memories', id, data: { ...mem, by: s.user.uid, at: serverNow() } }, statOp('memory', 1)]);
  logActivity('memory', mem.title || '');
  return id;
}
export function deleteMemory(id) { commit([{ op: 'del', col: 'memories', id }]); }

export function submitQuest(quest, payload) {
  const s = st();
  const uid = s.user.uid;
  const date = dateKey();
  const logId = `${date}_${quest.id}`;
  const ex = s.questLog[logId];
  if (ex?.answers?.[uid]) return toast(t("Ya respondiste esta misión"));
  const other = partnerUid(s);
  const both = !!(other && ex?.answers?.[other]);
  const total = QUEST_HEARTS + (both ? QUEST_BOTH_BONUS : 0);
  const { saveMemory, ...answer } = payload;
  commit([
    { op: 'set', col: 'questLog', id: logId, data: { date, questId: quest.id, answers: { [uid]: { ...answer, at: serverNow() } } } },
    ...heartOps(total), statOp('quest', 1),
  ]);
  logActivity('quest', quest.title);
  if (saveMemory) {
    addMemory({
      kind: quest.kind === 'image' ? 'photo' : quest.kind === 'audio' ? 'audio' : 'message',
      title: quest.title, text: answer.text || '', image: answer.image || null, audio: answer.audio || null,
    });
  }
  toast(t("💌 Misión completada: +{0} 💗{1}", [total, both ? t(" (¡las dos habéis respondido!)") : '']));
}

// ---------- Actividades de pareja ----------
export function cookDinner() {
  const s = st();
  const date = dateKey();
  if (!Object.values(s.buildings).some((b) => b.type === 'kitchen')) return toast(t("Necesitáis construir la Cocina"));
  if (s.couple.lastDinner === date) return toast(t("Ya cenasteis hoy 🍝"));
  const inv = s.couple.inventory || {};
  const crops = ['lettuce', 'carrot', 'tomato', 'strawberry', 'pumpkin'].filter((k) => (inv[k] || 0) > 0).sort((a, b) => inv[b] - inv[a]);
  const picks = [];
  const left = { ...inv };
  while (picks.length < 3 && crops.some((k) => left[k] > 0)) {
    const k = crops.filter((c) => left[c] > 0).sort((a, b) => left[b] - left[a])[0];
    left[k]--; picks.push(k);
  }
  if (picks.length < 3) return toast(t("Faltan ingredientes: 3 cultivos"));
  commit([...picks.map((k) => gain(k, -1)), { op: 'patch', data: { lastDinner: date } }, ...heartOps(20)]);
  doAnim('love', 1600);
  toast(t("🍝 Cena romántica: +20 💗"));
  logActivity('cook', t("una cena romántica"));
}

export function hug() {
  const s = st();
  const uid = partnerUid(s);
  const p = uid && others[uid];
  if (!p || !p.online) return toast(t("Tu pareja no está conectada"));
  if (Math.hypot(p.x - me.x, p.z - me.z) > 2.5) return toast(t("Acércate a tu pareja para abrazarla"));
  const now = serverNow();
  if (now - (s.couple.lastHug || 0) < 30 * 60000) return toast(t("Ya os abrazasteis hace poco 🤗"));
  commit([{ op: 'patch', data: { lastHug: now } }, ...heartOps(3), statOp('hug', 1)]);
  logActivity('hug');
  toast(t("🤗 Abrazo: +3 💗"));
}

export function checkStars() {
  const s = st();
  const uid = partnerUid(s);
  const p = uid && others[uid];
  const date = dateKey();
  if (!p?.online || s.couple.lastStars === date) return;
  const obs = Object.values(s.buildings).find((b) => b.type === 'observatory');
  if (!obs || me.insideId !== obs.id || p.inside !== obs.id) return;
  if (s.env.hour > 5 && s.env.hour < 20) return;
  commit([{ op: 'patch', data: { lastStars: date } }, ...heartOps(15)]);
  toast(t("🔭 Mirando las estrellas juntos: +15 💗"));
}

// ---------- Emotes ----------
export function wave() { doAnim('wave', 1500); }


