// Colisiones y pathfinding sobre la rejilla. Estado mutable, fuera de React.
import { MAP, TILE, NODE_DEFS, BUILDINGS, NEIGHBORS, TOWN_BUILDINGS } from './constants';
import { idx, inMap } from './worldGen';
import { nodeAlive } from './logic';
import { propFree } from './villageProps';

export const ctx = { blocked: new Uint8Array(MAP * MAP), tiles: null, walls: [], ready: false };

export function rebuildCollision(world, nodesState, buildings, now) {
  const g = ctx.blocked;
  ctx.tiles = world.tiles;
  for (let i = 0; i < g.length; i++) g[i] = world.tiles[i] === TILE.WATER || world.tiles[i] === TILE.VOID ? 1 : 0;
  for (const nb of NEIGHBORS) for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) g[idx(nb.house.x + dx, nb.house.z + dz)] = 1;
  const fr = { fountain: propFree('fountain', buildings), stall: propFree('stall', buildings) };
  for (const [x, z, k] of [[43, 18, 'fountain'], [43, 19, 'fountain'], [40, 20, 'stall'], [40, 21, 'stall'], [59, 19], [60, 19]]) if (!k || fr[k]) g[idx(x, z)] = 1; // fuentes y puesto del pueblo (si no hay un edificio encima)
  for (const b of TOWN_BUILDINGS) if (world.tiles[idx(b.x, b.z)] !== TILE.VOID) for (let dz = 0; dz < b.d; dz++) for (let dx = 0; dx < b.w; dx++) g[idx(b.x + dx, b.z + dz)] = 1;
  if (world.tiles[idx(62, 62)] !== TILE.VOID) for (let dx = -1; dx <= 1; dx++) g[idx(62 + dx, 62)] = 1;
  for (const n of world.nodes) {
    if (NODE_DEFS[n.type].blocks && nodeAlive(n, nodesState, now)) g[idx(n.x, n.z)] = 1;
  }
  ctx.walls = Object.values(buildings).filter((b) => !BUILDINGS[b.type]?.open);
  ctx.ready = true;
}

export const tileBlocked = (x, z) => !inMap(x, z) || x < 1 || z < 1 || x > MAP - 2 || z > MAP - 2 || ctx.blocked[idx(x, z)] === 1;

/** El bote solo navega por agua (y bajo el puente). */
export const boatTileBlocked = (x, z) => {
  if (!ctx.tiles || !inMap(x, z) || x < 1 || z < 1 || x > MAP - 2 || z > MAP - 2) return true;
  const t = ctx.tiles[idx(x, z)];
  return t !== TILE.WATER && t !== TILE.BRIDGE;
};
export function boatBlockedPoint(x, z) {
  const R = 0.3;
  return boatTileBlocked(Math.floor(x - R), Math.floor(z - R)) || boatTileBlocked(Math.floor(x + R), Math.floor(z - R)) ||
    boatTileBlocked(Math.floor(x - R), Math.floor(z + R)) || boatTileBlocked(Math.floor(x + R), Math.floor(z + R));
}

export function blockedPoint(x, z) {
  const R = 0.2;
  if (tileBlocked(Math.floor(x - R), Math.floor(z - R)) || tileBlocked(Math.floor(x + R), Math.floor(z - R)) ||
      tileBlocked(Math.floor(x - R), Math.floor(z + R)) || tileBlocked(Math.floor(x + R), Math.floor(z + R))) return true;
  for (const b of ctx.walls) {
    if (x > b.x - 0.28 && x < b.x + 0.22 && z > b.z - 0.28 && z < b.z + b.d) return true; // muro oeste
    if (z > b.z - 0.28 && z < b.z + 0.22 && x > b.x - 0.28 && x < b.x + b.w) return true; // muro norte
  }
  return false;
}

function wallCrossed(x0, z0, x1, z1) {
  for (const b of ctx.walls) {
    if ((x0 - b.x) * (x1 - b.x) < 0) {
      const zc = z0 + ((z1 - z0) * (b.x - x0)) / (x1 - x0);
      if (zc > b.z && zc < b.z + b.d) return true;
    }
    if ((z0 - b.z) * (z1 - b.z) < 0) {
      const xc = x0 + ((x1 - x0) * (b.z - z0)) / (z1 - z0);
      if (xc > b.x && xc < b.x + b.w) return true;
    }
  }
  return false;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** A* 8-direcciones. Termina cuando el centro de un tile queda a ≤ reach del objetivo. */
export function findPath(sx, sz, gx, gz, reach = 0.5, boat = false) {
  const blockedT = boat ? boatTileBlocked : tileBlocked;
  const cx = gx + 0.5, cz = gz + 0.5;
  const start = [Math.floor(sx), Math.floor(sz)];
  const isGoal = (x, z) => Math.hypot(x + 0.5 - cx, z + 0.5 - cz) <= reach;
  if (isGoal(start[0], start[1])) return [];
  const N = MAP * MAP;
  const g = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const open = [];
  const h = (x, z) => Math.max(0, Math.hypot(x + 0.5 - cx, z + 0.5 - cz) - reach);
  const si = idx(start[0], start[1]);
  g[si] = 0; open.push([h(start[0], start[1]), si]);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [, cur] = open.splice(bi, 1)[0];
    if (closed[cur]) continue;
    closed[cur] = 1;
    const x = cur % MAP, z = (cur / MAP) | 0;
    if (isGoal(x, z)) {
      const pts = [];
      for (let c = cur; c !== si; c = came[c]) pts.push({ x: (c % MAP) + 0.5, z: ((c / MAP) | 0) + 0.5 });
      return pts.reverse();
    }
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (blockedT(nx, nz)) continue;
      if (dx && dz && (blockedT(x + dx, z) || blockedT(x, z + dz))) continue;
      if (!boat && wallCrossed(x + 0.5, z + 0.5, nx + 0.5, nz + 0.5)) continue;
      const ni = idx(nx, nz);
      if (closed[ni]) continue;
      const ng = g[cur] + (dx && dz ? 1.414 : 1);
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; open.push([ng + h(nx, nz), ni]); }
    }
  }
  return null;
}
