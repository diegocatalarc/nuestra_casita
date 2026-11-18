import { MAP, MAP_BASE, TILE, HOUSE, ZONES, TOWN, TOWN_STREET, POIS } from './constants';
import { mulberry32, hashStr } from './rng';

// Centro del río (en x) para una fila z
export const riverX = (z) => 35 + 3 * Math.sin(z * 0.14) + 1.5 * Math.sin(z * 0.31 + 1);

export const idx = (x, z) => z * MAP + x;

/** Puntos fijos de la exploración (no dependen de la semilla) */
export const BAY = { z: 69, rx: 9.5, rz: 6.5 };
export const ISLAND = { x: riverX(BAY.z) + 3.2, z: BAY.z + 0.5, r: 2.7 };
export const CAVE = { x: 62.5, z: 62.5 };
export const VILLAGE = [39, 9, 50, 23]; // x0,z0,x1,z1 (casillas): se despeja de árboles
export const inMap = (x, z) => x >= 0 && z >= 0 && x < MAP && z < MAP;

/** Genera el mundo base de forma determinista. Solo se persisten las diferencias. */
export function generateWorld(seed, zonesIn = {}) {
  const zones = withFree(zonesIn);
  const rnd = mulberry32(hashStr('world' + seed));
  const tiles = new Uint8Array(MAP * MAP).fill(TILE.VOID);

  for (let z = 0; z < MAP_BASE; z++) {
    for (let x = 0; x < MAP_BASE; x++) {
      const cx = riverX(z);
      const d = Math.abs(x + 0.5 - cx);
      let t = TILE.GRASS;
      const forestScore = Math.max(11 - x, 10 - z, Math.min(z - 40, 32 - x));
      if (forestScore > 0 && (forestScore > 2 || rnd() < 0.5 + forestScore * 0.25)) t = TILE.FOREST;
      if (x + 0.5 >= cx + 3 || (z >= 36 && x >= 32)) t = TILE.MEADOW;
      if (x < 1 || z < 1 || x > MAP_BASE - 2 || z > MAP_BASE - 2) t = TILE.FOREST;
      if (d < 2.9) t = TILE.SAND;
      if (d < 1.7) t = TILE.WATER;
      tiles[idx(x, z)] = t;
    }
  }

  // Huerto
  for (let z = 25; z <= 28; z++) for (let x = 12; x <= 21; x++) tiles[idx(x, z)] = TILE.SOIL;
  // Camino casa → puente → pradera
  for (let z = HOUSE.z + HOUSE.d; z <= 23; z++) for (let x = 16; x <= 17; x++) tiles[idx(x, z)] = TILE.PATH;
  for (let x = 16; x <= 46; x++) {
    for (const z of [23, 24]) {
      if (tiles[idx(x, z)] === TILE.WATER) tiles[idx(x, z)] = TILE.BRIDGE;
      else if (z === 23 && tiles[idx(x, z)] !== TILE.SAND) tiles[idx(x, z)] = TILE.PATH;
    }
  }

  // Nodos de recurso
  const nodes = [];
  const reserved = (x, z) => x >= 10 && x <= 32 && z >= 15 && z <= 34;
  const add = (type, x, z) => nodes.push({ key: `${type}_${x}_${z}`, type, x, z, v: rnd() });
  for (let z = 1; z < MAP_BASE - 1; z++) {
    for (let x = 1; x < MAP_BASE - 1; x++) {
      const t = tiles[idx(x, z)];
      if (t === TILE.WATER || t === TILE.BRIDGE || t === TILE.SOIL || t === TILE.PATH) continue;
      const ring = x < 2 || z < 2 || x > MAP_BASE - 3 || z > MAP_BASE - 3;
      const r = rnd();
      if (ring) { if (r < 0.9) add('tree', x, z); continue; }
      if (reserved(x, z)) continue;
      if (t === TILE.FOREST) {
        if (r < 0.5) add('tree', x, z);
        else if (r < 0.545) add('rock', x, z);
        else if (r < 0.555) add('crystal', x, z);
      } else if (t === TILE.SAND) {
        if (r < 0.28) add('clay', x, z);
      } else if (t === TILE.MEADOW) {
        if (r < 0.17) add('flower', x, z);
        else if (r < 0.2) add('cotton', x, z);
        else if (r < 0.215) add('rock', x, z);
        else if (r < 0.225) add('tree', x, z);
      } else if (t === TILE.GRASS) {
        if (r < 0.03) add('tree', x, z);
        else if (r < 0.045) add('rock', x, z);
        else if (r < 0.06) add('flower', x, z);
      }
    }
  }
  // Garantía de mínimos (cristales/algodón)
  const count = (t) => nodes.filter((n) => n.type === t).length;
  let guard = 0;
  while (count('crystal') < 8 && guard++ < 2000) {
    const x = 2 + Math.floor(rnd() * 8), z = 2 + Math.floor(rnd() * 44);
    if (tiles[idx(x, z)] === TILE.FOREST && !nodes.some((n) => n.x === x && n.z === z)) add('crystal', x, z);
  }
  guard = 0;
  while (count('cotton') < 8 && guard++ < 2000) {
    const x = 40 + Math.floor(rnd() * 8), z = 10 + Math.floor(rnd() * 36);
    if (tiles[idx(x, z)] === TILE.MEADOW && !nodes.some((n) => n.x === x && n.z === z)) add('cotton', x, z);
  }

  // Elementos decorativos (no interactivos): matas de hierba
  const tufts = [];
  for (let i = 0; i < 520; i++) {
    const x = rnd() * MAP_BASE, z = rnd() * MAP_BASE;
    const t = tiles[idx(Math.floor(x), Math.floor(z))];
    if (t === TILE.GRASS || t === TILE.MEADOW || t === TILE.FOREST) tufts.push({ x, z, s: 0.6 + rnd() * 0.8, r: rnd() * 6.28 });
  }

  // Puertas hacia las ampliaciones: camino sin árboles
  const gates = Object.values(ZONES).filter((zn) => zn.gate);
  const inGate = (x, z) => gates.some((zn) => x >= zn.gate[0] && x < zn.gate[2] && z >= zn.gate[1] && z < zn.gate[3]);
  for (let i = nodes.length - 1; i >= 0; i--) if (inGate(nodes[i].x, nodes[i].z)) nodes.splice(i, 1);
  for (let x = 47; x < MAP_BASE; x++) { tiles[idx(x, 23)] = TILE.PATH; tiles[idx(x, 24)] = TILE.PATH; }
  for (let z = 44; z < MAP_BASE; z++) { tiles[idx(25, z)] = TILE.PATH; tiles[idx(26, z)] = TILE.PATH; }
  for (let i = nodes.length - 1; i >= 0; i--) { const n = nodes[i]; if (n.x >= VILLAGE[0] && n.x < VILLAGE[2] && n.z >= VILLAGE[1] && n.z < VILLAGE[3]) nodes.splice(i, 1); }
  // el territorio principal es continuo: se despejan los árboles del borde con el Este y el Sur
  for (let i = nodes.length - 1; i >= 0; i--) { const n = nodes[i]; if ((n.x >= 46 && n.z >= 2 && n.z <= 47) || (n.z >= 46 && n.x >= 2 && n.x <= 47)) nodes.splice(i, 1); }
  for (let z = 2; z <= 47; z++) for (let x = 46; x < MAP_BASE; x++) if (tiles[idx(x, z)] === TILE.FOREST) tiles[idx(x, z)] = TILE.MEADOW;
  for (let z = 46; z < MAP_BASE; z++) for (let x = 2; x <= 47; x++) if (tiles[idx(x, z)] === TILE.FOREST) tiles[idx(x, z)] = TILE.GRASS;
  for (const zn of Object.values(ZONES)) if (zones[zn.id]) expandZone(seed, zn, tiles, nodes, tufts);

  // Descubrimientos: se ajustan a tierra firme y se despeja su entorno
  const isLand = (x, z) => { const t = tiles[idx(x, z)]; return t === TILE.GRASS || t === TILE.MEADOW || t === TILE.SAND || t === TILE.FOREST || t === TILE.PATH; };
  const pois = [];
  for (const p of POIS) {
    const tx = Math.round(p.x), tz = Math.round(p.z);
    if (tx < 3 || tz < 3 || tx > MAP - 4 || tz > MAP - 4 || tiles[idx(tx, tz)] === TILE.VOID) continue;
    let best = null;
    for (let r = 0; r <= 6 && !best; r++) for (let dz = -r; dz <= r && !best; dz++) for (let dx = -r; dx <= r && !best; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const x = tx + dx, z = tz + dz;
      if (x < 3 || z < 3 || x > MAP - 4 || z > MAP - 4 || !isLand(x, z)) continue;
      let n = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (isLand(x + a, z + b)) n++;
      if (n >= 8 && tiles[idx(x, z)] !== TILE.PATH) best = [x, z];
    }
    if (!best) continue;
    for (let i = nodes.length - 1; i >= 0; i--) if (Math.hypot(nodes[i].x - best[0], nodes[i].z - best[1]) < 2.6) nodes.splice(i, 1);
    pois.push({ ...p, x: best[0] + 0.5, z: best[1] + 0.5 });
  }

  const byTile = new Map(nodes.map((n) => [`${n.x}_${n.z}`, n]));
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  return { seed, zk: zoneKey(zones), tiles, nodes, tufts, byTile, byKey, pois };
}


/** Las ampliaciones gratuitas (Este y Sur) forman parte del territorio principal. */
export const withFree = (zones = {}) => { const o = { ...zones }; for (const z of Object.values(ZONES)) if (z.free) o[z.id] = true; return o; };
export const zoneKey = (zones = {}) => { const w = withFree(zones); return Object.keys(ZONES).filter((k) => w[k]).join(','); };

/** Terreno nuevo de una ampliación: determinista por semilla + zona (no altera el terreno inicial). */
function expandZone(seed, zn, tiles, nodes, tufts) {
  const r = mulberry32(hashStr('zone' + seed + zn.id));
  const [x0, z0, x1, z1] = zn.rect;
  const ph = r() * 6.28, ph2 = r() * 6.28;
  r(); r(); r(); // (compatibilidad de secuencia)
  const lake = zn.id === 'south' ? { cx: 0, cz: 0, rx: 0, rz: 0 } : zn.id === 'east' ? { cx: 64 + r() * 6, cz: 36 + r() * 4, rx: 4.2, rz: 3.2 } : { cx: 66, cz: 66, rx: 0, rz: 0 };
  for (let z = z0; z < z1; z++) {
    for (let x = x0; x < x1; x++) {
      const nz = Math.sin(x * 0.31 + ph) * Math.cos(z * 0.27 + ph2) + Math.sin((x + z) * 0.13);
      let t = zn.id === 'east' ? TILE.MEADOW : zn.id === 'south' ? TILE.GRASS : TILE.FOREST;
      if (zn.id === 'east' && nz > 1.0) t = TILE.GRASS;
      if (zn.id === 'south' && nz > 0.55) t = TILE.FOREST;
      if (zn.id === 'southeast' && nz < -0.4) t = TILE.GRASS;
      if (x >= MAP - 2 || z >= MAP - 2) t = TILE.FOREST;
      if (lake.rx) {
        const d = Math.hypot((x + 0.5 - lake.cx) / lake.rx, (z + 0.5 - lake.cz) / lake.rz);
        if (d < 1.28) t = TILE.SAND;
        if (d < 1) t = TILE.WATER;
      }
      if (zn.id === 'south') {
        // el río sigue hacia el sur y se abre en una bahía con islas
        const cx = riverX(z), dr = Math.abs(x + 0.5 - cx);
        if (dr < 2.9) t = TILE.SAND;
        if (dr < 1.7) t = TILE.WATER;
        const bd = Math.hypot((x + 0.5 - riverX(BAY.z)) / BAY.rx, (z + 0.5 - BAY.z) / BAY.rz);
        if (bd < 1.22 && t !== TILE.WATER) t = TILE.SAND;
        if (bd < 1) t = TILE.WATER;
        const isl = Math.hypot(x + 0.5 - ISLAND.x, z + 0.5 - ISLAND.z);
        if (isl < ISLAND.r) t = isl < ISLAND.r - 1 ? TILE.GRASS : TILE.SAND;
        const mini = Math.hypot(x + 0.5 - (riverX(BAY.z) - 4.5), z + 0.5 - (BAY.z - 2));
        if (mini < 1.6) t = mini < 0.8 ? TILE.GRASS : TILE.SAND;
      }
      tiles[idx(x, z)] = t;
    }
  }
  // caminos desde la puerta
  if (zn.id === 'east') {
    // el pueblo grande: terreno despejado y Calle Mayor
    for (let z = TOWN[1]; z < Math.min(TOWN[3], 31); z++) for (let x = TOWN[0]; x < TOWN[2]; x++) { const t0 = tiles[idx(x, z)]; if (t0 === TILE.FOREST || t0 === TILE.SAND || t0 === TILE.WATER) tiles[idx(x, z)] = ((x + z) & 3) ? TILE.MEADOW : TILE.GRASS; }
    for (let x = x0; x < TOWN_STREET.x1; x++) { tiles[idx(x, 23)] = TILE.PATH; tiles[idx(x, 24)] = TILE.PATH; }
  }
  if (zn.id === 'south') for (let z = z0; z < 62; z++) { tiles[idx(25, z)] = TILE.PATH; tiles[idx(26, z)] = TILE.PATH; }
  if (zn.id === 'southeast') {
    for (let zz = 59; zz < 67; zz++) for (let xx = 58; xx < 67; xx++) tiles[idx(xx, zz)] = TILE.GRASS;
    for (let i = 0; i < 12; i++) { tiles[idx(50 + i, 56 + (i >> 1))] = TILE.PATH; tiles[idx(50 + i, 57 + (i >> 1))] = TILE.PATH; }
    for (let xx = 56; xx < 64; xx++) tiles[idx(xx, 62)] = TILE.PATH;
  }
  const add = (type, x, z) => nodes.push({ key: `${type}_${x}_${z}`, type, x, z, v: r() });
  for (let z = z0; z < z1; z++) {
    for (let x = x0; x < x1; x++) {
      const t = tiles[idx(x, z)];
      if (t === TILE.WATER || t === TILE.PATH || t === TILE.SOIL) continue;
      const q = r();
      if (zn.id === 'southeast' && x >= 58 && x < 67 && z >= 59 && z < 67) continue;
      if (zn.id === 'east' && x >= TOWN[0] + 1 && x < TOWN[2] && z >= TOWN[1] + 1 && z < 31) continue;
      if (zn.id === 'south' && Math.hypot(x + 0.5 - ISLAND.x, z + 0.5 - ISLAND.z) < ISLAND.r - 1.2) continue;
      if (x >= MAP - 2 || z >= MAP - 2) { if (q < 0.9) add('tree', x, z); continue; }
      if (t === TILE.SAND) { if (q < 0.18) add('clay', x, z); }
      else if (t === TILE.FOREST) { if (q < 0.42) add('tree', x, z); else if (q < 0.47) add('rock', x, z); else if (q < 0.485 + (zn.id === 'southeast' ? 0.03 : 0)) add('crystal', x, z); }
      else if (t === TILE.MEADOW) { if (q < 0.13) add('flower', x, z); else if (q < 0.17) add('cotton', x, z); else if (q < 0.185) add('rock', x, z); else if (q < 0.2) add('tree', x, z); }
      else if (t === TILE.GRASS) { if (q < 0.04) add('tree', x, z); else if (q < 0.055) add('rock', x, z); else if (q < 0.075) add('flower', x, z); }
    }
  }
  for (let i = 0; i < Math.round(((x1 - x0) * (z1 - z0)) / 5); i++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
    const t = tiles[idx(Math.floor(x), Math.floor(z))];
    const s = 0.6 + r() * 0.8, rot = r() * 6.28;
    if (t === TILE.GRASS || t === TILE.MEADOW || t === TILE.FOREST) tufts.push({ x, z, s, r: rot });
  }
}
export const tileAt = (world, x, z) => (inMap(x, z) ? world.tiles[idx(x, z)] : TILE.WATER);
