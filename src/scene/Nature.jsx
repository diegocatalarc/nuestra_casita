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

/** Un InstancedMesh por pieza; clic por instanceId → recolectar. */
function Layer({ list, geo, mat, refCb, onPick }) {
  const hover = (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  return (
    <instancedMesh
      ref={refCb} args={[null, null, Math.max(1, list.length)]} castShadow receiveShadow
      onClick={(e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); const n = list[e.instanceId]; if (n) onPick(n); }}
      onPointerOver={(e) => { if (useGame.getState().tool === 'interact') hover(e); }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      {geo}
      {mat}
    </instancedMesh>
  );
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
  const r = { trunk: useRef(), kpine: useRef(), round: useRef(), rock: useRef(), crystal: useRef(), clay: useRef(), flower: useRef(), stem: useRef(), cotton: useRef(), tuft: useRef(), round2: useRef(), wild: useRef(), wildStem: useRef() };

  const groups = useMemo(() => {
    const g = { tree: [], rock: [], crystal: [], clay: [], flower: [], cotton: [] };
    for (const n of world.nodes) g[n.type].push(n);
    return g;
  }, [world]);

  // Árboles y piezas (se recalculan al cambiar estado de nodos / estación)
  useLayoutEffect(() => {
    const now = useGame.getState().now;
    const upd = (m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; };

    groups.tree.forEach((n, i) => {
      const alive = nodeAlive(n, nodesState, now);
      const pine = world.tiles[idx(n.x, n.z)] === TILE.FOREST;
      const sc = 0.85 + n.v * 0.5, ry = n.v * 6.28;
      const x = n.x + 0.5, z = n.z + 0.5;
      const leaf = SEASON_COLORS.leaves[season][Math.floor(n.v * 3) % 3];
      if (alive && pine) {
        // pino de Kenney (incluye tronco)
        put(r.kpine.current, i, x, 0, z, 1.15 * sc, 1.15 * sc, 1.15 * sc, ry);
        put(r.trunk.current, i, x, -5, z, 0.001, 0.001, 0.001);
        put(r.round.current, i, x, -5, z, 0.001, 0.001, 0.001); put(r.round2.current, i, x, -5, z, 0.001, 0.001, 0.001);
        r.kpine.current.setColorAt(i, col.setRGB(1, 1, 1).multiplyScalar(0.9 + n.v * 0.2));
      } else if (alive) {
        put(r.kpine.current, i, x, -5, z, 0.001, 0.001, 0.001);
        put(r.trunk.current, i, x, 0.45 * sc, z, sc, sc, sc, ry);
        put(r.round.current, i, x, 1.35 * sc, z, sc, sc, sc, ry);
        r.round.current.setColorAt(i, col.set(leaf));
        put(r.round2.current, i, x + Math.cos(ry) * 0.3 * sc, 1.72 * sc, z + Math.sin(ry) * 0.3 * sc, 0.72 * sc, 0.72 * sc, 0.72 * sc, ry); // segunda copa más clara: copa menos esférica
        r.round2.current.setColorAt(i, col.set(leaf).offsetHSL(0.01, 0.02, 0.06));
      } else {
        // talado: solo queda el tocón
        put(r.kpine.current, i, x, -5, z, 0.001, 0.001, 0.001);
        put(r.round.current, i, x, -5, z, 0.001, 0.001, 0.001); put(r.round2.current, i, x, -5, z, 0.001, 0.001, 0.001);
        put(r.trunk.current, i, x, 0.15, z, sc, 0.3, sc, ry);
      }
      r.trunk.current.setColorAt(i, col.set('#8a5e3c'));
      if (!r.kpine.current.instanceColor) r.kpine.current.setColorAt(i, col.setRGB(1, 1, 1));
      if (!r.round.current.instanceColor) r.round.current.setColorAt(i, col.set(leaf));
      if (!r.round2.current.instanceColor) r.round2.current.setColorAt(i, col.set(leaf));
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
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
    // florecillas silvestres: una de cada 7 matas lleva una flor
    const WILD = ['#f7a8c4', '#fff6c4', '#ffffff', '#cbb2f2', '#ffb48a'];
    let n = 0;
    world.tufts.forEach((t, i) => {
      if (i % 7 || n >= wildMax) return;
      const sc = 0.9 + (i % 3) * 0.15;
      put(r.wildStem.current, n, t.x + 0.07, 0.11 * sc, t.z, 0.02, 0.22 * sc, 0.02);
      put(r.wild.current, n, t.x + 0.07, 0.25 * sc, t.z, 0.06 * sc, 0.06 * sc, 0.06 * sc);
      r.wild.current.setColorAt(n, col.set(WILD[i % 5])); r.wildStem.current.setColorAt(n, col.set('#6aa552')); n++;
    });
    r.wild.current.count = n; r.wildStem.current.count = n;
    for (const k of ['wild', 'wildStem']) { r[k].current.instanceMatrix.needsUpdate = true; if (r[k].current.instanceColor) r[k].current.instanceColor.needsUpdate = true; }
  }, [world, season]);

  const wildMax = Math.ceil(world.tufts.length / 7);
  const flat = (c) => <meshStandardMaterial color={c} roughness={1} flatShading />;
  const vc = <meshStandardMaterial roughness={1} flatShading />;
  const trees = groups.tree;
  return (
    <group>
      <Layer list={trees} refCb={r.trunk} onPick={gatherNode} geo={<cylinderGeometry args={[0.1, 0.15, 0.9, 6]} />} mat={vc} />
      <Layer list={trees} refCb={r.kpine} onPick={gatherNode} geo={<primitive object={treeGeo} attach="geometry" />} mat={<primitive object={kMat} attach="material" />} />
      <Layer list={trees} refCb={r.round} onPick={gatherNode} geo={<icosahedronGeometry args={[0.55, 1]} />} mat={<primitive object={swayTree} attach="material" />} />
      <instancedMesh ref={r.round2} args={[null, null, Math.max(1, trees.length)]} castShadow><icosahedronGeometry args={[0.55, 1]} /><primitive object={swayTree} attach="material" /></instancedMesh>
      <Layer list={groups.rock} refCb={r.rock} onPick={gatherNode} geo={<dodecahedronGeometry args={[0.6, 0]} />} mat={vc} />
      <Layer list={groups.crystal} refCb={r.crystal} onPick={gatherNode} geo={<octahedronGeometry args={[0.7, 0]} />} mat={<meshStandardMaterial roughness={0.2} metalness={0.2} emissive="#6a8cff" emissiveIntensity={0.55} flatShading vertexColors={false} />} />
      <Layer list={groups.clay} refCb={r.clay} onPick={gatherNode} geo={<cylinderGeometry args={[0.6, 0.9, 1, 8]} />} mat={vc} />
      <Layer list={groups.cotton} refCb={r.cotton} onPick={gatherNode} geo={<icosahedronGeometry args={[0.7, 0]} />} mat={vc} />
      <Layer list={groups.flower.flatMap((n) => [n, n, n])} refCb={r.flower} onPick={gatherNode} geo={<icosahedronGeometry args={[1, 0]} />} mat={vc} />
      <instancedMesh ref={r.stem} args={[null, null, Math.max(1, groups.flower.length * 3)]}><cylinderGeometry args={[1, 1, 1, 4]} /><primitive object={swayGrass} attach="material" /></instancedMesh>
      <instancedMesh ref={r.tuft} args={[null, null, world.tufts.length]} receiveShadow>
        <coneGeometry args={[1, 1.4, 4]} /><primitive object={swayGrass} attach="material" />
      </instancedMesh>
      <instancedMesh ref={r.wildStem} args={[null, null, Math.max(1, wildMax)]}><cylinderGeometry args={[1, 1, 1, 4]} /><primitive object={swayGrass} attach="material" /></instancedMesh>
      <instancedMesh ref={r.wild} args={[null, null, Math.max(1, wildMax)]}><icosahedronGeometry args={[1, 0]} /><primitive object={swayGrass} attach="material" /></instancedMesh>
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
