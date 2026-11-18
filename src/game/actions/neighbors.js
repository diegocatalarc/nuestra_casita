import { ANIMALS, ITEMS, COLLECT, COLLECT_ITEMS, NEIGHBORS, FRIEND, STORIES, PET, PET_HELP, PET_CONTEST, lockKey } from '../constants';
import { serverNow, fmtDuration } from '../time';
import { animalStats, friendPts, friendLevel, petTrait, bondLevel, dayUTC, ownsCosmetic } from '../logic';
import { sfx } from '../audio';
import { mulberry32, hashStr } from '../rng';
import { t } from '../../i18n';
import { wave } from './base';
import { commit, doAnim, gain, heartOps, logActivity, st, toast } from './core';
import { loot } from './explore';

// =====================================================================
//  VECINOS: amistad e historias
// =====================================================================
export function talkNeighbor(id) {
  const s = st(), day = dayUTC(serverNow());
  if (s.couple.friends?.[id]?.talkDay === day) return toast(t("Ya habéis charlado hoy. ¡Vuelve mañana!"));
  commit([{ op: 'inc', field: `friends.${id}.pts`, by: FRIEND.talk }, { op: 'patch', data: { [`friends.${id}.talkDay`]: day } }]);
  sfx('pop'); doAnim('wave', 1200);
  toast(t("💬 Charla agradable: +{0} de amistad", [FRIEND.talk]));
}

export function giftNeighbor(id, item) {
  const s = st(), day = dayUTC(serverNow()), n = NEIGHBORS.find((x) => x.id === id);
  if (s.couple.friends?.[id]?.giftDay === day) return toast(t("Hoy ya le habéis hecho un regalo"));
  if ((s.couple.inventory?.[item] || 0) < 1) return toast(t("No tenéis de eso"));
  const likes = n.likes.includes(item);
  const pts = likes ? FRIEND.like : FRIEND.other;
  commit([gain(item, -1), { op: 'inc', field: `friends.${id}.pts`, by: pts }, { op: 'patch', data: { [`friends.${id}.giftDay`]: day } }, ...(likes ? heartOps(1) : [])]);
  sfx(likes ? 'love' : 'pop');
  toast(likes ? t("😍 ¡Le encanta! +{0} de amistad", [pts]) : t("🙂 Lo agradece: +{0} de amistad", [pts]));
}

export function claimChapter(id) {
  const s = st(), n = NEIGHBORS.find((x) => x.id === id);
  const lvl = friendLevel(friendPts(s.couple, id)), done = s.couple.friends?.[id]?.ch || 0;
  if (lvl - 1 <= done) return;
  const rw = STORIES[id][done].reward;
  const ops = [{ op: 'patch', data: { [`friends.${id}.ch`]: done + 1 } }];
  let extra = '';
  if (rw.coins) ops.push({ op: 'inc', field: 'coins', by: rw.coins });
  if (rw.hearts) ops.push(...heartOps(rw.hearts));
  if (rw.prize) {
    if (!ownsCosmetic(s.couple, n.prize)) { ops.push({ op: 'patch', data: { [`unlocks.${lockKey(n.prize)}`]: true } }); extra = t(" ¡y un regalo para el Vestidor! 👗"); }
    else ops.push({ op: 'inc', field: 'coins', by: 150 });
  }
  commit(ops);
  logActivity('story', n.name);
  sfx('love');
  toast(t("📖 Nuevo capítulo de {0}{1}", [n.name, extra]));
}

// =====================================================================
//  MASCOTAS: jugar, ayuda diaria y concurso
// =====================================================================
export function trainPet(id) {
  const s = st(), a = s.animals[id];
  if (!a) return;
  const now = serverNow();
  if (a.playedAt && now - a.playedAt < PET.playCooldownMin * 60000) return toast(t("{0} está cansada/o de jugar. Vuelve en {1}", [a.name, fmtDuration(PET.playCooldownMin * 60000 - (now - a.playedAt))]));
  const gainB = Math.round(PET.play * (petTrait(a) === 'playful' ? 1.5 : 1));
  commit([{ op: 'set', col: 'animals', id, data: { bond: (a.bond || 0) + gainB, playedAt: now } }, ...heartOps(1)]);
  sfx('love'); doAnim('love', 1500);
  toast(t("🎾 ¡{0} se lo ha pasado genial! Vínculo +{1}", [a.name, gainB]));
}

export function petHelp(id) {
  const s = st(), a = s.animals[id];
  if (!a) return;
  const lvl = bondLevel(a.bond), day = dayUTC(serverNow());
  if (lvl < PET.helpLevel) return toast(t("Necesita más vínculo (nivel {0})", [PET.helpLevel]));
  if (a.helpDay === day) return toast(t("{0} ya ha ayudado hoy", [a.name]));
  const h = PET_HELP[a.type], r = mulberry32(hashStr('help' + a.id + day));
  const trait = petTrait(a);
  const item = h.pool[Math.floor(r() * h.pool.length)];
  const base = COLLECT_ITEMS[item] ? 1 : lvl;
  const n = (trait === 'lazy' ? 2 : 1) * base;
  const ops = [{ op: 'set', col: 'animals', id, data: { helpDay: day } }, ...loot(item, n)];
  let msg = `${ITEMS[item].emoji} ×${n}`;
  if (trait === 'curious' && r() < 0.25) { const rare = Object.values(COLLECT).flat().filter((c) => c.rare); const q = rare[Math.floor(r() * rare.length)]; ops.push(...loot(q.id)); msg += ` + ${q.emoji}`; }
  commit(ops);
  sfx('harvest'); doAnim('harvest', 1000);
  toast(t("{0} {1} {2}: ¡trae {3}!", [ANIMALS[a.type].emoji, a.name, h.label, msg]));
}

export function contestInfo(now = serverNow()) {
  const s = st(), day = dayUTC(now);
  const open = new Date(now).getUTCDay() === PET_CONTEST.dow;
  const r = mulberry32(hashStr('contest' + s.couple.seed + day));
  const rivals = ['Bigotes', 'Pelusa', 'Rayo', 'Nube'].slice(0, 3).map((name) => ({ name, score: 55 + Math.floor(r() * 55) }));
  return { open, day, rivals, done: s.couple.contest?.[day] };
}
export function enterContest(id) {
  const s = st(), a = s.animals[id], ci = contestInfo();
  if (!a || !ci.open) return toast(t("El concurso es los domingos"));
  if (ci.done) return toast(t("Ya habéis participado hoy"));
  const stt = animalStats(a, serverNow());
  const noise = hashStr('c' + a.id + ci.day) % 16;
  const score = Math.round(40 + bondLevel(a.bond) * 12 + stt.happy * 20 + (petTrait(a) === 'brave' ? 10 : 0) + noise);
  const rank = 1 + ci.rivals.filter((x) => x.score > score).length;
  const rw = PET_CONTEST.rewards[rank - 1];
  const ops = [{ op: 'patch', data: { [`contest.${ci.day}`]: { animal: a.name, type: a.type, score, rank } } }];
  if (rw) ops.push({ op: 'inc', field: 'coins', by: rw.coins }, ...heartOps(rw.hearts));
  commit(ops);
  logActivity('contest', a.name);
  sfx(rank === 1 ? 'love' : 'pop');
  toast(rw ? t("🏆 ¡{0} queda en el puesto {1}! +{2} 🪙 +{3} 💗", [a.name, rank, rw.coins, rw.hearts]) : t("🎗️ {0} queda en el puesto {1}. ¡Mejor suerte el próximo domingo!", [a.name, rank]));
}


