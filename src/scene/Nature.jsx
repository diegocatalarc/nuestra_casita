import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { NODE_DEFS, TILE } from '../game/constants';
import { SEASON_COLORS } from '../game/lighting';
import { nodeAlive } from '../game/logic';
import { gatherNode } from '../game/actions';
import { idx } from '../game/worldGen';
import { hashStr } from '../game/rng';
import { useKGeo } from '../game/models';
import { makeChunks, useChunkSet, ChunkLayer } from './chunks';

const U = { uTime: { value: 0 } };
/** Material con balanceo de viento en el vertex shader (por instancia). */
function swayMaterial(amp, base = false, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ roughness: 1, flatShading: !base, ...opts });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  float ph = instanceMatrix[3].x * 0.6 + instanceMatrix[3].z * 0.8;
  float sw = ${base ? 'max(position.y, 0.0) * 0.45' : '(position.y * 0.5 + 0.5)'} * ${amp};
  transformed.x += sin(uTime * 1.6 + ph) * sw + sin(uTime * 3.1 + ph * 2.0) * sw * 0.3;
  transformed.z += cos(uTime * 1.3 + ph * 1.1) * sw * 0.7;
#endif`);
  };
  m.customProgramCacheKey = () => 'sway' + amp + base;
  return m;
}

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const eul = new THREE.Euler();
const v3 = new THREE.Vector3();
const s3 = new THREE.Vector3();
const col = new THREE.Color();

function put(mesh, i, x, y, z, sx, sy, sz, ry = 0) {
  eul.set(0, ry, 0); q.setFromEuler(eul);
  m4.compose(v3.set(x, y, z), q, s3.set(sx, sy, sz));
  mesh.setMatrixAt(i, m4);
}

export default function Nature() {
  const world = useGame((s) => s.world);
  const nodesState = useGame((s) => s.nodes);
  const season = useGame((s) => s.env.season);
  const tick = useGame((s) => Math.floor(s.now / 5000));
  const swayTree = useMemo(() => swayMaterial(0.05), []);
  const swayGrass = useMemo(() => swayMaterial(0.35), []);
  useFrame((st) => { U.uTime.value = st.clock.elapsedTime; });
  // Pino de Kenney (CC0) con paleta estacional
  const treeGeo = useKGeo('tree');
  const treeMaps = useMemo(() => ['spring', 'summer', 'autumn', 'winter'].map((n) => {
    const t = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}models/Textures/colormap_${n}.png`);
    t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
  }), []);
  const kMat = useMemo(() => swayMaterial(0.08, true, { map: treeMaps[1] }), [treeMaps]);
  useLayoutEffect(() => { kMat.map = treeMaps[season]; kMat.needsUpdate = true; }, [season, kMat, treeMaps]);

  // Geometrías y materiales compartidos por todos los bloques
  const G = useMemo(() => ({
    trunk: new THREE.CylinderGeometry(0.1, 0.15, 0.9, 6), round: new THREE.IcosahedronGeometry(0.55, 1),
    rock: new THREE.DodecahedronGeometry(0.6, 0), crystal: new THREE.OctahedronGeometry(0.7, 0), clay: new THREE.CylinderGeometry(0.6, 0.9, 1, 8),
    cotton: new THREE.IcosahedronGeometry(0.7, 0), ico1: new THREE.IcosahedronGeometry(1, 0), stem: new THREE.CylinderGeometry(1, 1, 1, 4), tuft: new THREE.ConeGeometry(1, 1.4, 4),
  }), []);
  const M = useMemo(() => ({
    vc: new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }),
    crystal: new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.2, emissive: '#6a8cff', emissiveIntensity: 0.55, flatShading: true }),
  }), []);

  const groups = useMemo(() => {
    const g = { tree: [], rock: [], crystal: [], clay: [], flower: [], cotton: [] };
    for (const n of world.nodes) g[n.type].push(n);
    // Los pinos (tile de bosque) y los árboles de copa no comparten capas: así no se dibujan instancias ocultas.
    g.pine = []; g.broad = []; g.treeRef = g.tree.map((n) => (world.tiles[idx(n.x, n.z)] === TILE.FOREST ? { pine: true, k: g.pine.push(n) - 1 } : { pine: false, k: g.broad.push(n) - 1 }));
    g.flower3 = g.flower.flatMap((n) => [n, n, n]);
    g.wild = world.tufts.filter((_, i) => i % 7 === 0);
    return g;
  }, [world]);
  const P = useMemo(() => {
    const pt = (n) => [n.x + 0.5, n.z + 0.5];
    return {
      trunk: makeChunks(groups.tree.map(pt)), pine: makeChunks(groups.pine.map(pt)), broad: makeChunks(groups.broad.map(pt)),
      rock: makeChunks(groups.rock.map(pt)), crystal: makeChunks(groups.crystal.map(pt)), clay: makeChunks(groups.clay.map(pt)), cotton: makeChunks(groups.cotton.map(pt)),
      flower: makeChunks(groups.flower3.map(pt)), tuft: makeChunks(world.tufts.map((t) => [t.x, t.z])), wild: makeChunks(groups.wild.map((t) => [t.x, t.z])),
    };
  }, [groups, world]);
  const r = {
    trunk: useChunkSet(P.trunk), kpine: useChunkSet(P.pine), round: useChunkSet(P.broad), round2: useChunkSet(P.broad),
    rock: useChunkSet(P.rock), crystal: useChunkSet(P.crystal), clay: useChunkSet(P.clay), cotton: useChunkSet(P.cotton),
    flower: useChunkSet(P.flower), stem: useChunkSet(P.flower), tuft: useChunkSet(P.tuft), wild: useChunkSet(P.wild), wildStem: useChunkSet(P.wild),
  };

  // Árboles y piezas (se recalculan al cambiar estado de nodos / estación)
  useLayoutEffect(() => {
    const now = useGame.getState().now;
    const upd = (m) => { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.refresh(); };
    const HIDE = (set, i, x, z) => put(set, i, x, -5, z, 0.001, 0.001, 0.001);

    groups.tree.forEach((n, i) => {
      const alive = nodeAlive(n, nodesState, now);
      const { pine, k } = groups.treeRef[i];
      const sc = 0.85 + n.v * 0.5, ry = n.v * 6.28;
      const x = n.x + 0.5, z = n.z + 0.5;
      if (pine) {
        if (alive) {
          // pino de Kenney (incluye tronco)
          put(r.kpine.current, k, x, 0, z, 1.15 * sc, 1.15 * sc, 1.15 * sc, ry);
          r.kpine.current.setColorAt(k, col.setRGB(1, 1, 1).multiplyScalar(0.9 + n.v * 0.2));
          HIDE(r.trunk.current, i, x, z);
        } else {
          // talado: solo queda el tocón
          HIDE(r.kpine.current, k, x, z);
          put(r.trunk.current, i, x, 0.15, z, sc, 0.3, sc, ry);
        }
      } else {
        const leaf = SEASON_COLORS.leaves[season][Math.floor(n.v * 3) % 3];
        if (alive) {
          put(r.trunk.current, i, x, 0.45 * sc, z, sc, sc, sc, ry);
          put(r.round.current, k, x, 1.35 * sc, z, sc, sc, sc, ry);
          r.round.current.setColorAt(k, col.set(leaf));
          put(r.round2.current, k, x + Math.cos(ry) * 0.3 * sc, 1.72 * sc, z + Math.sin(ry) * 0.3 * sc, 0.72 * sc, 0.72 * sc, 0.72 * sc, ry); // segunda copa más clara: copa menos esférica
          r.round2.current.setColorAt(k, col.set(leaf).offsetHSL(0.01, 0.02, 0.06));
        } else {
          HIDE(r.round.current, k, x, z); HIDE(r.round2.current, k, x, z);
          r.round.current.setColorAt(k, col.set(leaf)); r.round2.current.setColorAt(k, col.set(leaf));
          put(r.trunk.current, i, x, 0.15, z, sc, 0.3, sc, ry);
        }
      }
      r.trunk.current.setColorAt(i, col.set('#8a5e3c'));
    });
    ['trunk', 'kpine', 'round', 'round2'].forEach((k) => upd(r[k].current));

    const simple = (list, ref, y, sx, sy, sz) => list.forEach((n, i) => {
      const alive = nodeAlive(n, nodesState, now);
      const sc = alive ? 1 : 0.001;
      put(ref.current, i, n.x + 0.5, y * sc, n.z + 0.5, sx * sc * (0.8 + n.v * 0.5), sy * sc * (0.8 + n.v * 0.5), sz * sc * (0.8 + n.v * 0.5), n.v * 6.28);
    });
    simple(groups.rock, r.rock, 0.2, 0.55, 0.42, 0.5);
    simple(groups.crystal, r.crystal, 0.4, 0.35, 0.7, 0.35);
    simple(groups.clay, r.clay, 0.08, 0.5, 0.25, 0.5);
    simple(groups.cotton, r.cotton, 0.28, 0.4, 0.4, 0.4);
    groups.rock.forEach((n, i) => r.rock.current.setColorAt(i, col.set(season === 3 ? '#dfe6ea' : '#a8a39c').offsetHSL(0, 0, (n.v - 0.5) * 0.1)));
    groups.crystal.forEach((n, i) => r.crystal.current.setColorAt(i, col.set(['#8fd3ff', '#c9a6ff', '#ff9ed2'][Math.floor(n.v * 3) % 3])));
    groups.clay.forEach((n, i) => r.clay.current.setColorAt(i, col.set('#c9805a')));
    groups.cotton.forEach((n, i) => r.cotton.current.setColorAt(i, col.set('#fffaf0')));
    ['rock', 'crystal', 'clay', 'cotton'].forEach((k) => upd(r[k].current));

    // Flores: 3 flores por nodo
    groups.flower.forEach((n, i) => {
      const alive = nodeAlive(n, nodesState, now);
      for (let k = 0; k < 3; k++) {
        const a = n.v * 6.28 + k * 2.1;
        const x = n.x + 0.5 + Math.cos(a) * 0.22, z = n.z + 0.5 + Math.sin(a) * 0.22;
        const sc = alive ? 1 : 0.001;
        put(r.stem.current, i * 3 + k, x, 0.12 * sc, z, 0.05 * sc, 0.24 * sc, 0.05 * sc);
        put(r.flower.current, i * 3 + k, x, 0.27 * sc, z, 0.13 * sc, 0.13 * sc, 0.13 * sc);
        r.flower.current.setColorAt(i * 3 + k, col.set(['#f7a8c4', '#fff3b0', '#ffffff', '#c9a6f0', '#f6a07a'][(hashStr(n.key) + k) % 5]));
        r.stem.current.setColorAt(i * 3 + k, col.set('#5f9a4a'));
      }
    });
    upd(r.flower.current); upd(r.stem.current);
  }, [groups, nodesState, season, tick, world]);

  // Matas de hierba decorativas
  useLayoutEffect(() => {
    const m = r.tuft.current;
    world.tufts.forEach((t, i) => {
      put(m, i, t.x, 0.1 * t.s, t.z, 0.18 * t.s, 0.22 * t.s, 0.18 * t.s, t.r);
      m.setColorAt(i, col.set(SEASON_COLORS.grass[season]).offsetHSL(0, 0, -0.07 + (i % 5) * 0.01));
    });
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.refresh();
    // florecillas silvestres: una de cada 7 matas lleva una flor
    const WILD = ['#f7a8c4', '#fff6c4', '#ffffff', '#cbb2f2', '#ffb48a'];
    world.tufts.forEach((t, i) => {
      if (i % 7) return;
      const n = i / 7;
      const sc = 0.9 + (i % 3) * 0.15;
      put(r.wildStem.current, n, t.x + 0.07, 0.11 * sc, t.z, 0.02, 0.22 * sc, 0.02);
      put(r.wild.current, n, t.x + 0.07, 0.25 * sc, t.z, 0.06 * sc, 0.06 * sc, 0.06 * sc);
      r.wild.current.setColorAt(n, col.set(WILD[i % 5])); r.wildStem.current.setColorAt(n, col.set('#6aa552'));
    });
    for (const k of ['wild', 'wildStem']) { r[k].current.instanceMatrix.needsUpdate = true; r[k].current.instanceColor.needsUpdate = true; r[k].current.refresh(); }
  }, [world, season]);

  const L = (set, list, geo, mat, extra) => <ChunkLayer set={set} list={list} geo={geo} mat={mat} {...extra} />;
  const pick = { castShadow: true, receiveShadow: true, onPick: gatherNode };
  return (
    <group>
      {L(r.trunk, groups.tree, G.trunk, M.vc, pick)}
      {L(r.kpine, groups.pine, treeGeo, kMat, pick)}
      {L(r.round, groups.broad, G.round, swayTree, pick)}
      {L(r.round2, groups.broad, G.round, swayTree, { castShadow: true })}
      {L(r.rock, groups.rock, G.rock, M.vc, pick)}
      {L(r.crystal, groups.crystal, G.crystal, M.crystal, pick)}
      {L(r.clay, groups.clay, G.clay, M.vc, pick)}
      {L(r.cotton, groups.cotton, G.cotton, M.vc, pick)}
      {L(r.flower, groups.flower3, G.ico1, M.vc, pick)}
      {L(r.stem, groups.flower3, G.stem, swayGrass)}
      {L(r.tuft, null, G.tuft, swayGrass, { receiveShadow: true })}
      {L(r.wildStem, null, G.stem, swayGrass)}
      {L(r.wild, null, G.ico1, swayGrass)}
      <Fence />
    </group>
  );
}

// Pequeña valla alrededor del huerto
function Fence() {
  const ref = useRef();
  const posts = useMemo(() => {
    const p = [];
    for (let x = 11; x <= 22; x += 1) { p.push([x, 24.55, 0]); p.push([x, 29.45, 0]); }
    for (let z = 25; z <= 29; z += 1) { p.push([11, z - 0.05, 1]); p.push([22, z - 0.05, 1]); }
    return p;
  }, []);
  useLayoutEffect(() => {
    posts.forEach(([x, z], i) => { m4.compose(v3.set(x, 0.22, z), q.identity(), s3.set(1, 1, 1)); ref.current.setMatrixAt(i, m4); });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [posts]);
  const rails = [[16.5, 24.55, 11, 0.07], [16.5, 29.45, 11, 0.07]];
  const sides = [11, 22]; // travesaños de los laterales (antes solo estaban los postes)
  return (
    <group>
      <instancedMesh ref={ref} args={[null, null, posts.length]} castShadow>
        <boxGeometry args={[0.1, 0.44, 0.1]} /><meshStandardMaterial color="#a8764c" roughness={1} flatShading />
      </instancedMesh>
      {sides.map((x) => <mesh key={x} position={[x, 0.3, 27]} castShadow><boxGeometry args={[0.05, 0.06, 4.9]} /><meshStandardMaterial color="#b98254" roughness={1} flatShading /></mesh>)}
      {rails.map(([x, z], i) => ( // travesaño bajo
        <mesh key={'l' + i} position={[x + 0.5, 0.14, z]} castShadow><boxGeometry args={[11, 0.05, 0.05]} /><meshStandardMaterial color="#a8764c" roughness={1} flatShading /></mesh>
      ))}
      {rails.map(([x, z, w], i) => (
        <mesh key={i} position={[x + 0.5, 0.3, z]} castShadow><boxGeometry args={[w, 0.06, 0.05]} /><meshStandardMaterial color="#b98254" roughness={1} flatShading /></mesh>
      ))}
    </group>
  );
}
