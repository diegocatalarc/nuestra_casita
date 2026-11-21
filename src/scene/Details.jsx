import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { MAP, TILE } from '../game/constants';
import { idx } from '../game/worldGen';
import { hashStr } from '../game/rng';
import { windMaterial } from './wind';

const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
const h01 = (k) => (hashStr(k) % 10000) / 10000;
const put = (m, i, x, y, z, sx, sy, sz, ry = 0, rx = 0) => { e.set(rx, ry, 0); q.setFromEuler(e); m4.compose(v.set(x, y, z), q, s.set(sx, sy, sz)); m.setMatrixAt(i, m4); };

/** Detalles de ambientación no interactivos: juncos, nenúfares, setas, guijarros y flores de pradera. */
export default function Details() {
  const world = useGame((s) => s.world);
  const season = useGame((s) => s.env.season);
  const r = { reed: useRef(), pad: useRef(), padF: useRef(), mush: useRef(), cap: useRef(), peb: useRef() };

  const d = useMemo(() => {
    const tiles = world.tiles, at = (x, z) => (x < 0 || z < 0 || x >= MAP || z >= MAP ? TILE.WATER : tiles[idx(x, z)]);
    const reeds = [], pads = [], mush = [], pebbles = [];
    const nodeAt = (x, z) => world.byTile.has(`${x}_${z}`);
    for (let z = 1; z < MAP - 1; z++) for (let x = 1; x < MAP - 1; x++) {
      const t = at(x, z), k = `${x},${z}`;
      const nearWater = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => at(x + a, z + b) === TILE.WATER);
      if (t === TILE.SAND && nearWater && !nodeAt(x, z)) {
        for (let n = 0; n < 3; n++) if (h01(k + 'r' + n) < 0.6) reeds.push([x + h01(k + 'rx' + n), z + h01(k + 'rz' + n), 0.7 + h01(k + 'rs' + n) * 0.8]);
      }
      if (t === TILE.WATER && h01(k + 'p') < 0.09 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => at(x + a, z + b) !== TILE.WATER)) pads.push([x + 0.2 + h01(k + 'px') * 0.6, z + 0.2 + h01(k + 'pz') * 0.6, 0.5 + h01(k + 'ps') * 0.5, h01(k + 'pf') < 0.35]);
      if (t === TILE.FOREST && !nodeAt(x, z) && h01(k + 'm') < 0.035) mush.push([x + 0.2 + h01(k + 'mx') * 0.6, z + 0.2 + h01(k + 'mz') * 0.6, 0.6 + h01(k + 'ms') * 0.7, h01(k + 'mc')]);
      if ((t === TILE.SAND || t === TILE.PATH || t === TILE.GRASS) && !nodeAt(x, z) && h01(k + 'b') < (t === TILE.GRASS ? 0.025 : 0.1)) pebbles.push([x + h01(k + 'bx'), z + h01(k + 'bz'), 0.5 + h01(k + 'bs')]);
    }
    return { reeds, pads, mush, pebbles };
  }, [world]);

  useLayoutEffect(() => {
    d.reeds.forEach(([x, z, k], i) => { put(r.reed.current, i, x, 0.35 * k - 0.05, z, 0.05, 0.7 * k, 0.05, h01('' + i) * 6, (h01('t' + i) - 0.5) * 0.3); r.reed.current.setColorAt(i, c.set(season === 3 ? '#cfc8a8' : '#7fa85a').offsetHSL(0, 0, (h01('c' + i) - 0.5) * 0.12)); });
    d.pads.forEach(([x, z, k, f], i) => { put(r.pad.current, i, x, -0.245, z, 0.3 * k, 0.02, 0.3 * k, h01('' + i) * 6); r.pad.current.setColorAt(i, c.set('#5fae55').offsetHSL(0, 0, (h01('q' + i) - 0.5) * 0.1)); put(r.padF.current, i, x, f ? -0.2 : -9, z, 0.09, 0.09, 0.09); r.padF.current.setColorAt(i, c.set('#f7a8c4')); });
    d.mush.forEach(([x, z, k, col], i) => { put(r.mush.current, i, x, 0.07 * k, z, 0.04 * k, 0.14 * k, 0.04 * k); r.mush.current.setColorAt(i, c.set('#f4ecd8')); put(r.cap.current, i, x, 0.16 * k, z, 0.1 * k, 0.07 * k, 0.1 * k); r.cap.current.setColorAt(i, c.set(col < 0.5 ? '#e0524a' : '#e8a85a')); });
    d.pebbles.forEach(([x, z, k], i) => { put(r.peb.current, i, x, 0.02, z, 0.07 * k, 0.045 * k, 0.06 * k, h01('' + i) * 6); r.peb.current.setColorAt(i, c.set('#bdb5a8').offsetHSL(0, 0, (h01('w' + i) - 0.5) * 0.15)); });
    for (const k in r) { r[k].current.instanceMatrix.needsUpdate = true; if (r[k].current.instanceColor) r[k].current.instanceColor.needsUpdate = true; }
  }, [d, season]);

  const std = <meshStandardMaterial roughness={1} />;
  const reedMat = useMemo(() => windMaterial(0.16), []); // los juncos se mecen con el viento
  return (
    <group>
      <instancedMesh ref={r.reed} args={[null, null, Math.max(1, d.reeds.length)]} castShadow><coneGeometry args={[1, 1, 4]} /><primitive object={reedMat} attach="material" /></instancedMesh>
      <instancedMesh ref={r.pad} args={[null, null, Math.max(1, d.pads.length)]} receiveShadow><cylinderGeometry args={[1, 1, 1, 10]} />{std}</instancedMesh>
      <instancedMesh ref={r.padF} args={[null, null, Math.max(1, d.pads.length)]}><icosahedronGeometry args={[1, 0]} />{std}</instancedMesh>
      <instancedMesh ref={r.mush} args={[null, null, Math.max(1, d.mush.length)]} castShadow><cylinderGeometry args={[1, 1, 1, 6]} />{std}</instancedMesh>
      <instancedMesh ref={r.cap} args={[null, null, Math.max(1, d.mush.length)]} castShadow><sphereGeometry args={[1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />{std}</instancedMesh>
      <instancedMesh ref={r.peb} args={[null, null, Math.max(1, d.pebbles.length)]} castShadow receiveShadow><icosahedronGeometry args={[1, 0]} />{std}</instancedMesh>
    </group>
  );
}
