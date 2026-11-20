// Rutinas de los vecinos del Valle (ver docs/historia.md). LÓGICA PURA, sin React ni red.
// Todo se calcula desde la hora de juego (env.hour): no se guarda ninguna posición, así que las dos personas ven
// a cada vecino en el mismo sitio a la misma hora. Las rutas se calculan UNA vez con findPath (A* de game/movement.js)
// y después solo se interpola a lo largo de la polilínea: cero pathfinding por fotograma.
import { CAST } from './characters';
import { friendLevel, friendPts } from '../logic';

/** Velocidad de paseo: casillas por segundo real. 1 hora de juego = 60 s reales (game/time.js). */
export const WALK_TILES_PER_SEC = 2.0;
export const SPEED = WALK_TILES_PER_SEC * 60; // casillas por hora de juego
/** Distancia máxima a la que dos vecinos «charlan» (para mostrar 💬). */
export const CHAT_DIST = 2.8;

// ---------- Lugares ----------
// rot: hacia dónde miran (atan2(dx, dz)); anim: animación de Avatar.jsx.
// Casas de Marta/Pablo/Luna: la puerta está en la fila de abajo (z + 3), como en Village.jsx.
const OLD = {
  marta: { home: { x: 41.5, z: 16.5, rot: 0 }, work: { x: 42.4, z: 12.1, rot: Math.PI, anim: 'water' }, icon: '🌱' },
  // El embarcadero está sobre el agua (casilla bloqueada): Pablo pesca desde la orilla, en la casilla pegada al muelle.
  pablo: { home: { x: 46.5, z: 16.5, rot: 0 }, work: { x: 39.5, z: 17.5, rot: -Math.PI / 2, anim: 'fish' }, icon: '🎣' },
  luna: { home: { x: 47.5, z: 22.5, rot: 0 }, work: { x: 45.5, z: 20.9, rot: -2.3, anim: 'build' }, icon: '🎨' },
};
// Animación de trabajo y icono de los vecinos del pueblo (su puesto = `stops.work` de characters.js, delante de su edificio)
const TOWN_WORK = {
  remedios: { anim: 'idle', icon: '🏛️' }, rosa: { anim: 'build', icon: '🥖' }, inigo: { anim: 'build', icon: '🕰️' },
  celia: { anim: 'water', icon: '🍎' }, tomas: { anim: 'harvest', icon: '🛍️' },
};

// Lugares compartidos. Tiene que ser transitable cada punto (lo comprueba tests/routines.test.js y checkStops()).
const SHARED = {
  // plaza vieja (junto a las casas): corrillo de tres alrededor de la fuente (43,18-19)
  oldA: { x: 42.4, z: 20.6, rot: Math.PI / 2 }, oldB: { x: 44.2, z: 20.6, rot: -Math.PI / 2 }, oldC: { x: 43.3, z: 21.8, rot: Math.PI },
  // Calle Mayor (entre las cunetas adoquinadas z=22 y z=25)
  calle1: { x: 56.5, z: 23.5, rot: Math.PI / 2 }, calle2: { x: 64.5, z: 23.5, rot: Math.PI / 2 }, calle3: { x: 72.5, z: 23.5, rot: Math.PI / 2 },
  // bancos de la plaza del pueblo (Discover.jsx): miran hacia el interior de la plaza
  bench1: { x: 57.2, z: 18.6, rot: 0, anim: 'sit' }, bench2: { x: 62.8, z: 18.6, rot: 0, anim: 'sit' },
  bench3: { x: 57.2, z: 21.0, rot: Math.PI, anim: 'sit' }, bench4: { x: 62.8, z: 21.0, rot: Math.PI, anim: 'sit' },
};

// ---------- Agendas ----------
// [hora de salida, lugar, opciones]. Lugar: 'home' (dentro de casa, invisible), 'work', 'social' (plaza), o un id de SHARED.
// opciones: via: [lugares por los que pasa de camino] · chat: id del vecino con quien charla · anim: anima distinta a la del lugar.
// Se queda en cada lugar hasta la salida de la siguiente línea. Antes de la primera línea y tras la última está en casa dentro.
// Con lluvia/tormenta (ver rainEntries): el puesto pasa a ser el portal de casa y todo lo demás, «dentro».
export const SCHEDULES = {
  marta: [[7.0, 'work'], [11.75, 'oldA', { chat: 'pablo' }], [13.75, 'home'], [14.75, 'work'], [17.75, 'oldA', { chat: 'luna' }], [20.0, 'home']],
  pablo: [[6.0, 'work'], [11.75, 'oldB', { chat: 'marta' }], [13.75, 'home'], [14.75, 'work'], [17.75, 'oldB', { chat: 'luna' }], [19.25, 'home']],
  luna: [[9.0, 'work'], [11.75, 'oldC', { chat: 'marta' }], [13.75, 'home'], [14.5, 'bench4', { via: ['oldA', 'calle1', 'calle2'] }], [16.5, 'work'], [17.75, 'oldC', { chat: 'marta' }], [20.0, 'work'], [22.0, 'home']],
  remedios: [[8.0, 'work'], [10.5, 'bench2', { via: ['calle1', 'calle2'] }], [12.0, 'social', { chat: 'tomas' }], [13.5, 'home'], [14.5, 'work'], [17.0, 'social', { via: ['calle2'], chat: 'inigo' }], [19.0, 'work'], [21.0, 'home']],
  rosa: [[6.0, 'work'], [11.75, 'social', { chat: 'remedios' }], [13.25, 'home'], [14.0, 'work'], [16.5, 'bench1', { via: ['calle1'] }], [17.5, 'social', { chat: 'remedios' }], [19.0, 'home']],
  inigo: [[8.0, 'work'], [11.75, 'social', { chat: 'celia' }], [13.25, 'home'], [14.25, 'work'], [17.5, 'social', { chat: 'remedios' }], [19.25, 'bench2'], [20.25, 'home']],
  celia: [[8.0, 'work'], [11.75, 'social', { chat: 'inigo' }], [13.25, 'home'], [14.0, 'work'], [16.0, 'bench4', { via: ['calle2'] }], [17.5, 'social', { chat: 'tomas' }], [19.0, 'home']],
  tomas: [[9.0, 'work'], [11.75, 'social', { chat: 'remedios' }], [13.25, 'home'], [14.0, 'work'], [17.5, 'social', { chat: 'celia' }], [19.5, 'home']],
};

const rainEntries = (entries) => entries.map(([h, p, o]) => [h, p === 'work' ? 'doorstep' : 'home', p === 'work' ? { anim: 'idle' } : {}]);

export const isRaining = (weather) => weather === 'rain' || weather === 'storm';

// ---------- Validación de puntos ----------
const tileOf = (p) => [Math.floor(p.x), Math.floor(p.z)];
/** Si el punto cae en una casilla bloqueada, devuelve el centro de la casilla libre más cercana (espiral). */
export function nudgeFree(p, isBlocked) {
  const [cx, cz] = tileOf(p);
  if (!isBlocked(cx, cz)) return p;
  for (let r = 1; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    if (!isBlocked(cx + dx, cz + dz)) return { ...p, x: cx + dx + 0.5, z: cz + dz + 0.5 };
  }
  return p;
}

/** Lugares resueltos por vecino: { home, doorstep, work, social, ...SHARED } con cada punto ya transitable. */
export function resolvePlaces(isBlocked) {
  const fix = (p) => nudgeFree(p, isBlocked);
  const shared = Object.fromEntries(Object.entries(SHARED).map(([k, p]) => [k, fix(p)]));
  const out = {}, moved = [];
  for (const c of CAST) {
    let home, work, social, icon;
    if (OLD[c.id]) {
      ({ icon } = OLD[c.id]);
      home = OLD[c.id].home; work = OLD[c.id].work;
      social = null;
    } else if (c.stops) {
      icon = TOWN_WORK[c.id]?.icon || c.emoji;
      home = { ...c.stops.home, rot: 0 };
      work = { ...c.stops.work, rot: 0, anim: TOWN_WORK[c.id]?.anim || 'idle' };
      social = { ...c.stops.social, rot: 0 };
    } else continue;
    const f = (k, p) => { if (!p) return p; const q = fix(p); if (q !== p) moved.push(`${c.id}.${k}: (${p.x},${p.z}) → (${q.x},${q.z})`); return q; };
    home = f('home', home); work = f('work', work); social = f('social', social);
    out[c.id] = { ...shared, home: { ...home, hidden: true }, doorstep: { ...home, anim: 'idle' }, work, social: social || shared.oldA, icon };
  }
  return { places: out, moved };
}

// ---------- Construcción de la línea temporal ----------
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function makeRoute(findPath, cache, a, b, viaPts) {
  const stops = [a, ...viaPts, b];
  const pts = [{ x: a.x, z: a.z }];
  for (let i = 0; i < stops.length - 1; i++) {
    const p = stops[i], q = stops[i + 1];
    if (Math.floor(p.x) === Math.floor(q.x) && Math.floor(p.z) === Math.floor(q.z)) { if (dist(p, q) > 0.01) pts.push({ x: q.x, z: q.z }); continue; }
    const key = `${Math.floor(p.x)},${Math.floor(p.z)}>${Math.floor(q.x)},${Math.floor(q.z)}`;
    let path = cache.get(key);
    if (path === undefined) { path = findPath(Math.floor(p.x), Math.floor(p.z), Math.floor(q.x), Math.floor(q.z), 0.5); cache.set(key, path); }
    if (path === null) return null; // sin camino
    // findPath devuelve centros de casilla; el último se sustituye por el punto exacto
    for (const c of path.slice(0, -1)) pts.push(c);
    pts.push({ x: q.x, z: q.z });
  }
  // quita puntos repetidos
  const clean = [pts[0]];
  for (const p of pts.slice(1)) if (dist(p, clean[clean.length - 1]) > 0.01) clean.push(p);
  const cum = [0];
  for (let i = 1; i < clean.length; i++) cum.push(cum[i - 1] + dist(clean[i - 1], clean[i]));
  return { pts: clean, cum, total: cum[cum.length - 1] };
}

/** Compila una agenda en segmentos [{k:'stay'|'walk', t0, t1, ...}] de 0 a 24 h. `issues` lista problemas (sin camino, llegada tarde). */
function compile(id, entries, P, findPath, cache, speed) {
  const segs = [], issues = [];
  const stay = (t0, t1, c) => {
    if (t1 > t0) segs.push({ k: 'stay', t0, t1, x: c.x, z: c.z, rot: c.rot || 0, anim: c.o.anim || c.anim || 'idle', hidden: !!c.hidden, chat: c.o.chat || null, place: c.name });
  };
  let cur = { ...P.home, name: 'home', o: {} }, t = 0;
  entries.forEach(([at, name, o = {}], i) => {
    const pl = P[name];
    if (!pl) { issues.push(`${id}: lugar desconocido ${name}`); return; }
    stay(t, at, cur);
    const via = (o.via || []).map((v) => P[v]).filter(Boolean);
    const route = makeRoute(findPath, cache, cur, pl, via);
    let dur = 0;
    if (!route) issues.push(`${id}: sin camino a ${name}`);
    else if (route.total > 0.01) {
      dur = route.total / speed;
      segs.push({ k: 'walk', t0: at, t1: at + dur, pts: route.pts, cum: route.cum, total: route.total });
    }
    cur = { ...pl, name, o };
    t = at + dur;
    const next = entries[i + 1];
    if (next && t > next[0] + 1e-6) issues.push(`${id}: llega a ${name} a las ${t.toFixed(2)} y debía salir a las ${next[0]}`);
  });
  stay(t, 24, cur); // el último lugar debe ser 'home' (lo comprueba el test)
  return { segs, issues };
}

/**
 * Construye las agendas de los 8 vecinos para el mundo actual.
 * @param findPath  findPath(sx,sz,gx,gz,reach) de game/movement.js (o equivalente)
 * @param isBlocked (x,z) → bool, casilla bloqueada (tileBlocked de game/movement.js)
 */
export function buildRoutines(findPath, isBlocked, speed = SPEED) {
  const { places, moved } = resolvePlaces(isBlocked);
  const cache = new Map();
  const out = { npcs: {}, moved, issues: [] };
  for (const id of Object.keys(SCHEDULES)) {
    const P = places[id];
    const clear = compile(id, SCHEDULES[id], P, findPath, cache, speed);
    const rain = compile(id, rainEntries(SCHEDULES[id]), P, findPath, cache, speed);
    out.npcs[id] = { id, icon: P.icon, clear: clear.segs, rain: rain.segs, places: P };
    out.issues.push(...clear.issues, ...rain.issues);
  }
  return out;
}

// ---------- Evaluación (barata: sin allocations salvo el objeto de salida reutilizable) ----------
const wrap24 = (h) => ((h % 24) + 24) % 24;

/** Posición de un vecino a una hora. Escribe en `out` (reutilizable) {x,z,rot,anim,hidden,chat,walking}. */
export function positionAt(npc, hour, raining, out = {}) {
  const segs = raining ? npc.rain : npc.clear, h = wrap24(hour);
  let s = segs[segs.length - 1];
  for (let i = 0; i < segs.length; i++) if (h < segs[i].t1) { s = segs[i]; break; }
  out.walking = false; out.chat = null; out.hidden = false;
  if (s.k === 'stay') {
    out.x = s.x; out.z = s.z; out.rot = s.rot; out.anim = s.anim; out.hidden = s.hidden; out.chat = s.chat;
    return out;
  }
  const d = Math.min(s.total, Math.max(0, ((h - s.t0) / (s.t1 - s.t0)) * s.total));
  let i = 1;
  while (i < s.cum.length - 1 && s.cum[i] < d) i++;
  const a = s.pts[i - 1], b = s.pts[i], seg = s.cum[i] - s.cum[i - 1] || 1, k = (d - s.cum[i - 1]) / seg;
  out.x = a.x + (b.x - a.x) * k; out.z = a.z + (b.z - a.z) * k;
  out.rot = Math.atan2(b.x - a.x, b.z - a.z); out.anim = 'walk'; out.walking = true;
  return out;
}

// ---------- ❗ lo que tienen que contarte ----------
/**
 * ¿Tiene este vecino algo que decir? Conectar con el motor de misiones aquí (una sola función):
 *  · couple.story.pending: array de ids de vecino, u objeto {id: true} (cartas pendientes de recoger/entregar).
 *  · amistad: hay un capítulo de su historia de amistad por reclamar (solo Marta, Pablo y Luna, STORIES).
 */
export function hasNews(npcId, state) {
  const couple = state?.couple;
  if (!couple) return false;
  const p = couple.story?.pending;
  if (p && (Array.isArray(p) ? p.includes(npcId) : !!p[npcId])) return true;
  if (OLD[npcId]) return friendLevel(friendPts(couple, npcId)) - 1 > (couple.friends?.[npcId]?.ch || 0);
  return false;
}
