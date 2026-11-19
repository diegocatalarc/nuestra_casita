// Lógica pura del juego: todo se deriva de marcas de tiempo (simulación perezosa).
import { CROPS, ANIMALS, NODE_DEFS, BUILDINGS, DECOR, TILE, MAP, QUEST_POOL, HOUSE, VITALS, FAMILY, GOALS, FISH, DISHES, FISHING, PRICES, DEMAND_MULT, NEIGHBORS, VISITORS, AVATAR_LOCKS, lockKey, skillLevel, UPGRADES, FESTIVALS, DIG, COLLECT, COLLECT_ITEMS, FRIEND_LEVELS, BOND_LEVELS, PET_TRAITS, MINE, RECIPES, STATIONS, CRAFT } from './constants';
import { TIME_SCALE } from './time';
import { tileAt, idx, ISLAND } from './worldGen';
import { clamp, hashStr, mulberry32 } from './rng';
import { t } from '../i18n';
import { touchesVillageProp } from './villageProps';

// ---------- Cultivos ----------
export function cropRate(type, season, greenhouse) {
  if (greenhouse) return 1.5;
  return CROPS[type].seasons.includes(season) ? 1 : 0.5;
}

/** Velocidad de crecimiento según dónde esté plantado: invernadero (×1.5), cobertizo de hongos (×1.6) o al aire libre. */
export function rateAt(type, season, buildings, x, z) {
  const b = buildingAt(buildings, x, z);
  if (b?.type === 'greenhouse') return 1.5;
  if (b?.type === 'shroomhouse') return 1.6;
  return cropRate(type, season, false);
}

/** stage: 1 Sembrado · 2 Regado · 3 Creciendo · 4 Madurado · 5 Cosechado */
export function cropInfo(c, now) {
  if (c.harvested) return { stage: 5, p: 1, remaining: 0 };
  if (!c.wateredAt) return { stage: 1, p: 0, remaining: null };
  const grow = CROPS[c.type].growMin * 60000;
  const speed = (c.rate || 1) * TIME_SCALE;
  const p = clamp(((now - c.wateredAt) * speed) / grow, 0, 1);
  return { stage: p >= 1 ? 4 : p < 0.2 ? 2 : 3, p, remaining: (1 - p) * grow / speed };
}

export function buildingAt(buildings, x, z) {
  for (const b of Object.values(buildings)) if (x >= b.x && x < b.x + b.w && z >= b.z && z < b.z + b.d) return b;
  return null;
}
export const inGreenhouse = (buildings, x, z) => buildingAt(buildings, x, z)?.type === 'greenhouse';

/** Cultivos normales: tierra labrada o invernadero. Hongos (shade): suelo del bosque o cobertizo de hongos. */
export function isPlantable(world, buildings, tx, tz, cropId, soil) {
  const shade = cropId ? !!CROPS[cropId]?.shade : false;
  const tl = tileAt(world, tx, tz);
  const b = buildingAt(buildings, tx, tz);
  if (b) return !nodeBlocksTile(world, tx, tz) && (shade ? b.type === 'shroomhouse' : b.type === 'greenhouse');
  if (shade) return tl === TILE.FOREST && !nodeBlocksTile(world, tx, tz) && !world.byTile.has(`${tx}_${tz}`);
  return tl === TILE.SOIL || !!soil?.[`${tx}_${tz}`];
}

// ---------- Nodos de recurso ----------
export function nodeAlive(node, nodesState, now) {
  const s = nodesState[node.key];
  return !s || s.until <= now;
}
export function nodeBlocksTile(world, x, z, nodesState = {}, now = Infinity) {
  const n = world.byTile.get(`${x}_${z}`);
  return !!n && NODE_DEFS[n.type].blocks && nodeAlive(n, nodesState, now);
}
export function nodeAmount(node) {
  const d = NODE_DEFS[node.type];
  return d.min + Math.floor(node.v * (d.max - d.min + 1));
}

// ---------- Animales ----------
export function animalStats(a, now) {
  const def = ANIMALS[a.type];
  const hunger = clamp((now - (a.fedAt || a.bornAt)) / (def.hungerMin * 60000), 0, 1);
  const bonus = a.pettedAt && now - a.pettedAt < 600000 ? 0.2 : 0;
  const happy = clamp(1 - 0.8 * hunger + bonus, 0, 1);
  const cycle = (def.prodMin * 60000) / Math.max(happy, 0.3);
  const since = now - (a.lastCollectAt || a.bornAt);
  return { def, hunger, happy, ready: since >= cycle && happy >= 0.3, readyIn: Math.max(0, cycle - since) };
}

const SLOT = 8000;
const out = { x: 0, z: 0, rot: 0, moving: false };
/** Paseo determinista: misma posición en ambas pantallas sin sincronizar. */
export function animalPos(a, t) {
  const s = Math.floor(t / SLOT);
  const f = (t % SLOT) / SLOT;
  const wp = (k) => {
    const r = mulberry32(hashStr(a.id + ':' + k));
    const ang = r() * 6.283, rad = r() * 3;
    return [a.home.x + Math.cos(ang) * rad, a.home.z + Math.sin(ang) * rad];
  };
  const A = wp(s), B = wp(s + 1);
  const m = clamp(f / 0.45, 0, 1);
  const e = m * m * (3 - 2 * m);
  out.x = A[0] + (B[0] - A[0]) * e;
  out.z = A[1] + (B[1] - A[1]) * e;
  out.rot = Math.atan2(B[0] - A[0], B[1] - A[1]);
  out.moving = f < 0.45;
  return out;
}

// ---------- Validación de colocación ----------
export const canAfford = (inv, cost) => Object.entries(cost).every(([k, v]) => (inv?.[k] || 0) >= v);

export function validateBuilding(world, st, type, x, z, now) {
  const def = BUILDINGS[type];
  const { w, d } = def;
  if (x < 2 || z < 2 || x + w > MAP - 2 || z + d > MAP - 2) return { ok: false, reason: t("Fuera del terreno") };
  for (let j = z; j < z + d; j++) {
    for (let i = x; i < x + w; i++) {
      const tl = tileAt(world, i, j);
      if (tl === TILE.VOID) return { ok: false, reason: t("🔒 Terreno sin comprar") };
      if (tl !== TILE.GRASS && tl !== TILE.MEADOW && tl !== TILE.FOREST) return { ok: false, reason: t("Terreno no apto") };
      if (st.soil?.[`${i}_${j}`]) return { ok: false, reason: t("Hay tierra arada") };
      const n = world.byTile.get(`${i}_${j}`);
      if (n && nodeAlive(n, st.nodes, now)) return { ok: false, reason: t("Hay un recurso en el camino") };
    }
  }
  if (touchesVillageProp(x, z, w, d)) return { ok: false, reason: t("Hay una fuente o un puesto del pueblo") };
  for (const b of Object.values(st.buildings)) {
    if (x < b.x + b.w && x + w > b.x && z < b.z + b.d && z + d > b.z) return { ok: false, reason: t("Se solapa con otro edificio") };
  }
  for (const o of Object.values(st.decor)) {
    if (o.x > x && o.x < x + w && o.z > z && o.z < z + d) return { ok: false, reason: t("Hay objetos decorativos") };
  }
  return { ok: true };
}

export const decorSize = (type, rot) => {
  const def = DECOR[type];
  return rot % 2 === 1 ? { w: def.d, d: def.w } : { w: def.w, d: def.d };
};

export function validateDecor(world, st, type, x, z, rot, ignoreId, now) {
  const { w, d } = decorSize(type, rot);
  if (x - w / 2 < 1.5 || z - d / 2 < 1.5 || x + w / 2 > MAP - 1.5 || z + d / 2 > MAP - 1.5) return { ok: false, reason: t("Fuera del terreno") };
  const tl = tileAt(world, Math.floor(x), Math.floor(z));
  if (tl === TILE.VOID) return { ok: false, reason: t("🔒 Terreno sin comprar") };
  if (tl === TILE.WATER || tl === TILE.BRIDGE) return { ok: false, reason: t("No se puede sobre el agua") };
  const crop = st.crops[`${Math.floor(x)}_${Math.floor(z)}`];
  if (tl === TILE.SOIL || st.soil?.[`${Math.floor(x)}_${Math.floor(z)}`] || (crop && !crop.harvested)) return { ok: false, reason: t("Esa tierra es para cultivar") };
  if (nodeBlocksTile(world, Math.floor(x), Math.floor(z), st.nodes, now)) return { ok: false, reason: t("Hay algo en medio") };
  const flat = DECOR[type].flat;
  for (const [id, o] of Object.entries(st.decor)) {
    if (id === ignoreId) continue;
    if (!!DECOR[o.type].flat !== !!flat) continue; // alfombras se superponen con todo
    const s = decorSize(o.type, o.rot || 0);
    if (Math.abs(o.x - x) < (w + s.w) / 2 - 0.12 && Math.abs(o.z - z) < (d + s.d) / 2 - 0.12) return { ok: false, reason: t("Hay otro objeto") };
  }
  return { ok: true };
}

// ---------- Misiones ----------
export function dailyQuests(date) {
  const r = mulberry32(hashStr('quests' + date));
  const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const texts = shuffle(QUEST_POOL.filter((q) => q.kind === 'text'));
  const media = shuffle(QUEST_POOL.filter((q) => q.kind !== 'text'));
  return [texts[0], media[0], texts[1]];
}

// ---------- Recuerdos: huecos físicos ----------
export function memorySlots(buildings, n) {
  const room = Object.values(buildings).find((b) => b.type === 'memory');
  const slots = [];
  for (let i = 0; i < n; i++) {
    const k = i % 16, tier = Math.floor(i / 16) * 0.28;
    if (room) {
      let p;
      if (k < 4) p = { x: room.x + 0.75 + k * 0.85, y: 0.98, z: room.z + 0.5, rot: 0 };
      else if (k < 7) p = { x: room.x + 0.5, y: 0.98, z: room.z + 1.55 + (k - 4) * 0.85, rot: Math.PI / 2 };
      else { const q = k - 7; p = { x: room.x + 1.5 + (q % 3) * 0.9, y: 0.56, z: room.z + 1.9 + Math.floor(q / 3) * 0.8, rot: ((q * 37) % 7) * 0.1 - 0.3 }; }
      slots.push({ ...p, y: p.y + tier, inRoom: true });
    } else {
      const col = Math.floor(i / 6), row = i % 6;
      slots.push({ x: HOUSE.x - 0.7 - col * 0.7, y: 0, z: HOUSE.z + 0.6 + row * 0.6, rot: Math.PI / 2, inRoom: false });
    }
  }
  return slots;
}

export function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

// ---------- Necesidades personales (energía y saciedad) ----------
export function vitals(p, now) {
  const energy0 = p?.energy ?? 100, eAt = p?.energyAt ?? now, full0 = p?.full ?? 80, fAt = p?.fullAt ?? now;
  const full = clamp(full0 - (now - fAt) / VITALS.fullDrainMs, 0, 100);
  const dt = Math.max(0, now - eAt);
  const energy = p?.sleepSince
    ? clamp(energy0 + dt / VITALS.sleepGainMs, 0, 100)
    : clamp(energy0 - (dt / VITALS.energyDrainMs) * (full < VITALS.hungryBelow ? 2 : 1), 0, 100);
  return { energy, full, sleeping: !!p?.sleepSince, tired: energy < VITALS.tiredBelow, hungry: full < VITALS.hungryBelow };
}

// ---------- Camas ----------
export function bedSpots(buildings, decor) {
  const out = [];
  for (const b of Object.values(buildings)) {
    if (b.type === 'house') out.push({ id: b.id + ':0', x: b.x + 0.95, z: b.z + 1.3, rot: 0 });
    if (b.type === 'bedroom') { out.push({ id: b.id + ':0', x: b.x + 1.0, z: b.z + 1.4, rot: 0 }); out.push({ id: b.id + ':1', x: b.x + 2.95, z: b.z + 1.4, rot: 0 }); }
  }
  for (const [id, o] of Object.entries(decor)) if (o.type === 'bed') out.push({ id, x: o.x, z: o.z, rot: o.rot || 0 });
  return out;
}
export const animalCapacity = (buildings) => 4 + 6 * Object.values(buildings).filter((b) => b.type === 'barn').length;

// ---------- Familia ----------
export function childInfo(c, now) {
  const ageDays = ((now - c.bornAt) * TIME_SCALE) / 86400000;
  const stage = FAMILY.stages.find((s) => ageDays < s.maxDays) || FAMILY.stages[FAMILY.stages.length - 1];
  const hunger = clamp((now - (c.fedAt || c.bornAt)) / (FAMILY.hungerMin * 60000), 0, 1);
  const playReady = now - (c.playedAt || 0) > FAMILY.playCooldownMin * 60000;
  const happy = clamp(1 - 0.7 * hunger + (now - (c.playedAt || 0) < 20 * 60000 ? 0.2 : 0), 0, 1);
  return { stage, ageDays, hunger, happy, playReady };
}

export function familyStatus(st) {
  const hasBedroom = Object.values(st.buildings).some((b) => b.type === 'bedroom');
  const hasCrib = Object.values(st.decor).some((d) => d.type === 'crib');
  const hearts = (st.couple?.heartsTotal || 0) >= FAMILY.needHeartsTotal;
  const kids = Object.keys(st.children || {}).length + (st.couple?.family?.due ? 1 : 0);
  const space = kids < FAMILY.maxChildren;
  const money = (st.couple?.hearts || 0) >= FAMILY.cost;
  return { hasBedroom, hasCrib, hearts, space, money, ok: hasBedroom && hasCrib && hearts && space && money, kids };
}

/** Rasgos del bebé: mezcla determinista de los de ambos padres */
export function childLook(id, players) {
  const r = mulberry32(hashStr('child' + id));
  const list = Object.values(players || {}).map((p) => p.avatar).filter(Boolean);
  const a = list[Math.floor(r() * list.length)] || { skin: 1, hairColor: 1 };
  const b = list[Math.floor(r() * list.length)] || a;
  return { skin: r() < 0.5 ? a.skin : b.skin, hairColor: r() < 0.5 ? a.hairColor : b.hairColor, hair: Math.floor(r() * 6), top: Math.floor(r() * 8), bottom: Math.floor(r() * 6), acc: r() < 0.2 ? 3 : 0 };
}

// ---------- Semana (UTC, lunes) y metas ----------
export function weekKey(now) {
  const d = new Date(now);
  const day = (d.getUTCDay() + 6) % 7; // lunes = 0
  const mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  return mon.toISOString().slice(0, 10);
}
export function weeklyGoals(now) {
  const r = mulberry32(hashStr('goals' + weekKey(now)));
  const pool = [...GOALS];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, 3);
}

// ---------- Pesca ----------
const hourBand = (h) => ({ night: h < 6 || h >= 20, dawn: (h >= 5 && h < 9) || (h >= 17 && h < 21), day: h >= 8 && h < 18 });

/** Segundos de espera hasta que pique (más rápido al amanecer, al atardecer y con lluvia). */
export function biteWait(env, rnd = Math.random) {
  let w = FISHING.waitMin + rnd() * (FISHING.waitMax - FISHING.waitMin);
  if (hourBand(env.hour).dawn) w *= 0.7;
  if (env.weather === 'rain' || env.weather === 'storm') w *= 0.75;
  return w;
}

/** Qué sale del agua: pez (según hora, estación y clima), objeto raro o basura. */
export function rollCatch(env, rnd = Math.random, rareMult = 1) {
  const r = rnd();
  if (r < FISHING.junkChance) return { kind: 'junk' };
  if (r < FISHING.junkChance + FISHING.treasureChance * rareMult) return { kind: 'treasure' };
  const b = hourBand(env.hour), rain = env.weather === 'rain' || env.weather === 'storm';
  const entries = Object.entries(FISH).map(([id, f]) => {
    let w = f.w;
    if (f.seasons?.includes(env.season)) w *= 1.6;
    if (f.night && b.night) w *= f.night;
    if (f.day && b.day) w *= f.day;
    if (f.rain && rain) w *= f.rain;
    if (f.rare) w *= rareMult;
    return [id, w];
  });
  let x = rnd() * entries.reduce((a, [, w]) => a + w, 0), id = entries[0][0];
  for (const [k, w] of entries) { if ((x -= w) <= 0) { id = k; break; } }
  const [lo, hi] = FISH[id].size;
  return { kind: 'fish', id, size: Math.round(lo + (hi - lo) * Math.pow(rnd(), 1.6)) };
}

// ---------- Economía, pedidos y habilidades ----------
/** Día común para las dos personas (UTC): los pedidos y la demanda no dependen de la zona horaria. */
export const dayUTC = (now) => new Date(now).toISOString().slice(0, 10);
export const msToNextDay = (now) => { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - now; };

/** Producto "de moda" del día: se paga un 50 % más en el Mercado. */
export function demandItem(seed, day) {
  const ids = Object.keys(PRICES);
  return ids[Math.floor(mulberry32(hashStr('demand' + seed + day))() * ids.length)];
}
export const priceOf = (id, seed, day) => Math.round((PRICES[id] || 0) * (demandItem(seed, day) === id ? DEMAND_MULT : 1));

export const skillLv = (couple, k) => skillLevel(couple?.skills?.[k] || 0);
export const tierOf = (couple, k) => couple?.upgrades?.[k] || 0;
export const upgradeMax = (k) => UPGRADES[k].costs.length;

/** Mejoras que afectan a la pesca */
export function fishMods(couple) {
  const lv = skillLv(couple, 'fish') - 1, tier = tierOf(couple, 'rod');
  return { wait: (1 - 0.03 * lv) * Math.pow(0.9, tier), window: FISHING.biteWindow + 0.1 * lv + 0.4 * tier, rare: 1 + 0.06 * lv + 0.15 * tier + 0.1 * (couple?.upgrades?.hook || 0) };
}
export const doubleHarvestChance = (couple) => 0.04 * (skillLv(couple, 'farm') - 1) + 0.08 * tierOf(couple, 'can');
export const dishBoost = (couple) => 1 + 0.04 * (skillLv(couple, 'cook') - 1);
export const doubleCookChance = (couple) => 0.15 * tierOf(couple, 'pan');

// --- ropa desbloqueable ---
export const ownsCosmetic = (couple, key) => !AVATAR_LOCKS[key] || !!couple?.unlocks?.[lockKey(key)];
/** ¿Una prenda está bloqueada para esta persona? (lo que ya lleva puesto se respeta) */
export function cosmeticLocked(couple, saved, cat, idx) {
  const key = `${cat}:${idx}`;
  if (!AVATAR_LOCKS[key] || ownsCosmetic(couple, key)) return false;
  return (saved?.[cat] ?? 0) !== idx;
}
export const rareCrop = (couple, id) => !CROPS[id]?.rare || !!couple?.unlocks?.[`crop_${id}`];

// --- Tablón de pedidos: 4 pedidos al día, idénticos para las dos personas ---
const ORDER_CROPS = ['lettuce', 'carrot', 'tomato', 'strawberry', 'pumpkin', 'rose'];
const ORDER_FISH = ['minnow', 'shrimp', 'carp', 'trout', 'catfish', 'crab'];
const ORDER_DISH = ['salad', 'carrotsoup', 'omelette', 'jam', 'pie', 'fishsoup', 'grilled'];
const EXCLUSIVES = Object.keys(AVATAR_LOCKS).filter((k) => AVATAR_LOCKS[k].visitor);

/** Cultivos de la lista que se pueden sembrar en la estación (sin estación = todos). Invierno: lechuga + champiñón. */
const inSeason = (list, season) => (season == null ? list : list.filter((k) => CROPS[k]?.shade || CROPS[k]?.seasons.includes(season)));
const SEASON_CROPS = [...ORDER_CROPS, 'mushroom'];

/** 4 pedidos del día. `season` (0..3) es opcional: con ella los cultivos pedidos son de temporada. */
export function dailyOrders(seed, day, season) {
  const r = mulberry32(hashStr('orders' + seed + day));
  const cropPool = season == null ? ORDER_CROPS : inSeason(SEASON_CROPS, season);
  const visitorCrops = season == null ? ['rose', 'pumpkin', 'strawberry'] : inSeason(['rose', 'pumpkin', 'strawberry'], season);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const qty = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const take = (list, n, lo, hi) => { const pool = [...list], out = {}; for (let i = 0; i < n; i++) out[pool.splice(Math.floor(r() * pool.length), 1)[0]] = qty(lo, hi); return out; };
  const value = (need) => Object.entries(need).reduce((a, [k, n]) => a + (PRICES[k] || 5) * n, 0);
  const reward = (need, mult, hearts) => ({ coins: Math.round((value(need) * mult) / 5) * 5, hearts });
  const orders = [];
  let need = take(cropPool, 2, 2, 5);
  orders.push({ slot: 0, npc: NEIGHBORS[0], line: Math.floor(r() * 3), need, ...reward(need, 1.5, 3) });
  need = take(ORDER_FISH, 2, 1, 3);
  orders.push({ slot: 1, npc: NEIGHBORS[1], line: Math.floor(r() * 3), need, ...reward(need, 1.5, 3) });
  need = r() < 0.5 ? { [pick(ORDER_DISH)]: qty(1, 2) } : { egg: qty(2, 4), flower: qty(3, 6) };
  orders.push({ slot: 2, npc: NEIGHBORS[2], line: Math.floor(r() * 3), need, kitchen: Object.keys(need).some((k) => PRICES[k] >= 30), ...reward(need, 1.6, 4) });
  const v = pick(VISITORS);
  need = { ...take([...visitorCrops, 'trout', 'catfish', 'crab'], 2, 1, 3), ...(r() < 0.4 ? { [pick(['goldfish', 'koi'])]: 1 } : {}) };
  orders.push({ slot: 3, npc: v, visitor: true, line: Math.floor(r() * 3), need, cos: pick(EXCLUSIVES), ...reward(need, 2.2, 6) });
  return orders;
}

// --- Pedido grande semanal (cooperativo): misma semana UTC + seed = mismo pedido ---
export const WEEKLY_MULT = 1.8, WEEKLY_HEARTS = 12, DAILY_BONUS = { coins: 50, hearts: 5 };
/** Clave dentro de couple.orders donde se guarda el progreso de la semana (los de día son números) */
export const weeklyOrderKey = (now) => 'w' + weekIdx(now);
export function weeklyOrder(seed, now, season) {
  const r = mulberry32(hashStr('weekorder' + seed + weekIdx(now)));
  const pool = season == null ? ORDER_CROPS : inSeason(SEASON_CROPS, season);
  const need = {};
  for (let i = 0; i < 2; i++) need[pool.splice(Math.floor(r() * pool.length), 1)[0]] = 6 + Math.floor(r() * 5); // 6..10
  const extra = ['egg', 'trout', 'carp', 'crab', 'flower'];
  need[extra[Math.floor(r() * extra.length)]] = 4 + Math.floor(r() * 4); // 4..7
  const value = Object.entries(need).reduce((a, [k, n]) => a + (PRICES[k] || 5) * n, 0);
  return { key: weeklyOrderKey(now), need, coins: Math.round((value * WEEKLY_MULT) / 5) * 5, hearts: WEEKLY_HEARTS };
}
/** Estado del pedido semanal: usa la lista guardada al primer aporte (la estación puede cambiar a mitad de semana). */
export function weeklyStatus(couple, now, season) {
  const w = weeklyOrder(couple.seed, now, season);
  const saved = couple.orders?.[w.key] || {};
  const need = saved.need || w.need;
  const players = couple.members || Object.keys(couple.players || {});
  const given = {};
  for (const k of Object.keys(need)) given[k] = players.reduce((a, u) => a + (saved[u]?.[k] || 0), 0);
  const mine = (uid) => saved[uid] || {};
  const complete = Object.keys(need).every((k) => given[k] >= need[k]);
  return { ...w, need, given, mine, complete, claimed: !!saved.claimed };
}

/** Pista corta de dónde conseguir un ingrediente (null si no hay) */
export function sourceHint(item, season) {
  if (CROPS[item]) {
    const ok = CROPS[item].shade || season == null || CROPS[item].seasons.includes(season);
    return { emoji: '🌱', text: ok ? t("Sembrar {0}", [CROPS[item].label]) : t("Sembrar {0} (fuera de temporada)", [CROPS[item].label]) };
  }
  if (FISH[item]) return { emoji: '🎣', text: t("Pescar en el río") };
  if (DISHES[item]) return { emoji: '🍳', text: t("Cocinar en la Cocina") };
  if (item === 'egg') return { emoji: '🐔', text: t("Gallinas del gallinero") };
  if (item === 'milk') return { emoji: '🐄', text: t("Vacas del establo") };
  if (item === 'flower') return { emoji: '🌸', text: t("Flores del campo o rosas") };
  return null;
}

// ---------- Eventos del mundo (idénticos para las dos personas: dependen de seed + día UTC) ----------
export function eventsFor(seed, now, season) {
  const day = dayUTC(now);
  const r = mulberry32(hashStr('ev' + seed + day));
  const a = r(), b = r(), c = r();
  const dow = new Date(now).getUTCDay();
  const festival = dow === 6 ? FESTIVALS[season] : null;
  const visitor = !festival && a < 0.5 ? VISITORS[Math.floor(b * VISITORS.length)] : null;
  return { day, festival, visitor, meteor: c < 0.3, dow };
}
export const daysToFestival = (now) => (6 - new Date(now).getUTCDay() + 7) % 7;

/** Regalo del visitante (determinista por día) */
export function visitorGift(seed, day) {
  const r = mulberry32(hashStr('gift' + seed + day));
  const x = r();
  if (x < 0.4) return { kind: 'coins', coins: 80 + Math.floor(r() * 12) * 10 };
  if (x < 0.8) { const pool = [['egg', 4], ['flower', 6], ['clay', 4], ['cloth', 4], ['crystal', 2], ['stone', 8], ['wood', 12]]; const [item, n] = pool[Math.floor(r() * pool.length)]; return { kind: 'item', item, n }; }
  const seeds = Object.keys(CROPS).filter((k) => CROPS[k].rare);
  return { kind: 'seed', crop: seeds[Math.floor(r() * seeds.length)], coins: 120 };
}
/** ¿Es de noche con lluvia de estrellas? */
export const meteorActive = (ev, hour) => ev.meteor && (hour >= 21 || hour < 5);

// ---------- Citas y regalos ----------
export const inHours = (h, [a, b]) => (a <= b ? h >= a && h < b : h >= a || h < b);
export const gifts = (state) => Object.values(state.gifts || {});

/** "Frío / caliente" según la distancia a un regalo escondido. */
export function warmth(d) {
  if (d < 3) return { icon: '🔥', text: t("¡Quemando!"), lvl: 5 };
  if (d < 6) return { icon: '♨️', text: t("Muy caliente"), lvl: 4 };
  if (d < 12) return { icon: '🌤️', text: t("Caliente"), lvl: 3 };
  if (d < 22) return { icon: '🌥️', text: t("Templado"), lvl: 2 };
  return { icon: '❄️', text: t("Frío"), lvl: 1 };
}

// ---------- Exploración: excavación, cofre y colecciones ----------
const digCache = new WeakMap();
/** Sitios de excavación del día (✨ en la arena y la isla): idénticos para las dos personas. */
export function digSpots(world, seed, day) {
  if (!world) return [];
  let c = digCache.get(world);
  if (!c) {
    const cand = [];
    for (let z = 2; z < MAP - 2; z++) for (let x = 2; x < MAP - 2; x++) {
      if (world.tiles[idx(x, z)] === TILE.SAND && !world.byTile.has(`${x}_${z}`)) cand.push([x, z]);
    }
    c = { cand, day: null, spots: [] };
    digCache.set(world, c);
  }
  if (c.day === day) return c.spots;
  const r = mulberry32(hashStr('dig' + seed + day));
  const spots = [], used = new Set();
  // la mitad en la isla/costa lejana si existe; el resto repartido
  for (let i = 0; i < DIG.perDay * 6 && spots.length < DIG.perDay && c.cand.length; i++) {
    const k = Math.floor(r() * c.cand.length);
    if (used.has(k)) continue;
    used.add(k);
    const [x, z] = c.cand[k];
    spots.push({ i: spots.length, x: x + 0.5, z: z + 0.5 });
  }
  c.day = day; c.spots = spots;
  return spots;
}

/** Qué sale de una excavación (determinista por sitio y día: igual para los dos) */
export function digLoot(seed, day, i, curious = false) {
  const r = mulberry32(hashStr('loot' + seed + day + i));
  const x = r();
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  if (x < 0.5) { const c = pick(COLLECT.shell.filter((q) => !q.rare)); return { kind: 'item', item: c.id }; }
  if (x < 0.75) { const c = pick(COLLECT.fossil.filter((q) => !q.rare)); return { kind: 'item', item: c.id }; }
  if (x < 0.9) return { kind: 'coins', coins: 30 + Math.floor(r() * 8) * 10 };
  if (x < 0.97) return { kind: 'item', item: pick([...COLLECT.shell, ...COLLECT.fossil].filter((q) => q.rare)).id };
  return { kind: 'item', item: 'crystal' };
}

export const weekIdx = (now) => Math.floor((now - 4 * 86400000) / (7 * 86400000)); // semanas que empiezan en lunes (UTC)
export const chestReady = (couple, now) => couple?.chestWeek !== weekIdx(now);
export const islandChest = ISLAND;

/** Progreso de una página del álbum: cuántas piezas se han encontrado alguna vez */
export function albumProgress(couple, page) {
  if (page === 'fish') { const ids = Object.keys(FISH); return { have: ids.filter((k) => (couple?.fishLog?.[k] || 0) > 0).length, total: ids.length }; }
  const list = COLLECT[page];
  return { have: list.filter((c) => (couple?.found?.[c.id] || 0) > 0).length, total: list.length };
}

// ---------- Mina ----------
export function mineFloor(floor, rnd = Math.random) {
  const { cols, rows } = MINE;
  const cells = Array.from({ length: cols * rows }, () => ({ open: false, kind: 'rock' }));
  const place = (kind, n) => { let g = 0; while (n > 0 && g++ < 200) { const i = Math.floor(rnd() * cells.length); if (cells[i].kind === 'rock' && !cells[i].open) { cells[i].kind = kind; n--; } } };
  place('stairs', 1);
  const richness = 0.8 + floor * 0.35;
  place('clay', 2); place('stone', 3); place('crystal', Math.round(1 + floor * 0.3));
  const minerals = COLLECT.mineral.filter((c) => !c.rare || floor >= 4);
  const mins = Math.max(1, Math.round(richness));
  for (let i = 0; i < mins; i++) { const m = minerals[Math.floor(rnd() * Math.min(minerals.length, 2 + floor))]; place('min:' + m.id, 1); }
  return cells;
}

// ---------- Amistad con vecinos ----------
export const friendPts = (couple, id) => couple?.friends?.[id]?.pts || 0;
export const friendLevel = (pts) => FRIEND_LEVELS.filter((x) => pts >= x).length;

// ---------- Mascotas ----------
export const petTrait = (a) => Object.keys(PET_TRAITS)[hashStr('trait' + a.id) % Object.keys(PET_TRAITS).length];
export const bondLevel = (bond = 0) => BOND_LEVELS.filter((x) => bond >= x).length;

// ---------- Crafteo ----------
export const stationPlaced = (decor, id) => STATIONS[id]?.always || Object.values(decor || {}).some((o) => o.type === STATIONS[id]?.decor);

/** ¿Está disponible la receta? Devuelve {ok, why} */
export function recipeStatus(couple, r, albumFn) {
  const u = r.unlock;
  if (!u) return { ok: true };
  if (u.lv) return skillLv(couple, 'craft') >= u.lv ? { ok: true } : { ok: false, why: t("Artesanía nivel {0}", [u.lv]) };
  if (u.friend) { const n = NEIGHBORS.find((x) => x.id === u.friend[0]); return friendLevel(friendPts(couple, u.friend[0])) >= u.friend[1] ? { ok: true } : { ok: false, why: t("Amistad nivel {0} con {1}", [u.friend[1], n?.name || '']) }; }
  if (u.album) return couple?.albumClaimed?.[u.album] ? { ok: true } : { ok: false, why: t("Completa la página del álbum: {0}", [u.album === 'mineral' ? t("Minerales") : u.album]) };
  return { ok: true };
}
/** Duración real de una receta (la Artesanía acorta el tiempo) */
export const craftDur = (couple, r) => Math.max(5, Math.round(r.dur * (1 - 0.04 * (skillLv(couple, 'craft') - 1))));
export const jobList = (crafts) => Object.values(crafts || {}).filter((j) => j.state === 'work');
