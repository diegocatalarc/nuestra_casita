import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { MAP, TILE } from '../game/constants';
import { idx } from '../game/worldGen';
import { SEASON_COLORS, L, isWet } from '../game/lighting';
import { hashStr } from '../game/rng';
import { rbGeo } from './rb';

const RES = 4; // vértices por tile
const N = MAP * RES;
const TOP = { [TILE.GRASS]: 0, [TILE.MEADOW]: 0, [TILE.FOREST]: 0, [TILE.SAND]: -0.07, [TILE.SOIL]: 0.02, [TILE.PATH]: -0.015, [TILE.WATER]: -0.46, [TILE.BRIDGE]: -0.46, [TILE.VOID]: 0 };
const WATER_Y = -0.26;
const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash2 = (x, z) => ((hashStr(`${x},${z}`) % 10000) / 10000);
// ruido de valor suave (para bordes orgánicos y variación de color)
const vnoise = (x, z) => {
  const ix = Math.floor(x), iz = Math.floor(z), fx = sm(0, 1, x - ix), fz = sm(0, 1, z - iz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
};

/** Textura de grano que se repite sobre todo el terreno: briznas, motas y granos. Da detalle fino sin geometría ni coste por frame. */
function detailTexture() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, S, S);
  let a = 12345; const rnd = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const wrap = (x, y, f) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) f(x + dx, y + dy); }; // sin costuras al repetir
  for (let i = 0; i < 1400; i++) { // briznas
    const x = rnd() * S, y = rnd() * S, len = 3 + rnd() * 6, ang = -Math.PI / 2 + (rnd() - 0.5) * 1.1, dark = rnd() < 0.62;
    g.strokeStyle = dark ? `rgba(150,150,150,${0.25 + rnd() * 0.3})` : `rgba(255,255,255,${0.5 + rnd() * 0.4})`; g.lineWidth = 1 + rnd() * 0.8;
    wrap(x, y, (px, py) => { g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len); g.stroke(); });
  }
  for (let i = 0; i < 260; i++) { // motas
    const x = rnd() * S, y = rnd() * S, r = 1 + rnd() * 2.4;
    g.fillStyle = rnd() < 0.5 ? 'rgba(120,120,120,0.16)' : 'rgba(255,255,255,0.35)';
    wrap(x, y, (px, py) => { g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); });
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(MAP / 4, MAP / 4); t.anisotropy = 1; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const tmp = new THREE.Color();
function baseColor(t, season, out) {
  const g = SEASON_COLORS.grass[season];
  switch (t) {
    case TILE.MEADOW: out.set(g).offsetHSL(0.015, 0.06, 0.05); break;
    case TILE.FOREST: out.set(g).offsetHSL(0.0, -0.02, -0.07); break;
    case TILE.SAND: out.set(season === 3 ? '#ece7da' : '#ecd9aa'); break;
    case TILE.SOIL: out.set('#7d533a'); break;
    case TILE.PATH: out.set('#dcc99f'); break;
    case TILE.VOID: out.set('#b9c7ad'); break; // terreno aún sin comprar (entre la niebla)
    case TILE.WATER: case TILE.BRIDGE: out.set('#c9bb92'); break; // lecho del río (visible bajo el agua)
    default: out.set(g);
  }
  return out;
}

/** Terreno suave: una sola malla con colores por vértice mezclados entre tiles, orillas en pendiente y ruido. */
function buildTerrain(world, season) {
  const geo = new THREE.PlaneGeometry(MAP, MAP, N, N);
  geo.rotateX(-Math.PI / 2);
  geo.translate(MAP / 2, 0, MAP / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(), cB = new THREE.Color(), cc = new THREE.Color();
  const tileAt = (i, j) => world.tiles[idx(Math.min(MAP - 1, Math.max(0, i)), Math.min(MAP - 1, Math.max(0, j)))];
  for (let k = 0; k < pos.count; k++) {
    const px = pos.getX(k), pz = pos.getZ(k);
    // bordes orgánicos: se deforma ligeramente el punto de muestreo
    const wx = px + (vnoise(px * 1.7, pz * 1.7) - 0.5) * 0.45, wz = pz + (vnoise(px * 1.7 + 40, pz * 1.7 + 40) - 0.5) * 0.45;
    const u = wx - 0.5, v = wz - 0.5;
    const i = Math.floor(u), j = Math.floor(v);
    const fx = sm(0.3, 0.7, u - i), fz = sm(0.3, 0.7, v - j);
    const t00 = tileAt(i, j), t10 = tileAt(i + 1, j), t01 = tileAt(i, j + 1), t11 = tileAt(i + 1, j + 1);
    // altura (mezcla suave)
    const hx0 = TOP[t00] + (TOP[t10] - TOP[t00]) * sm(0, 1, u - i), hx1 = TOP[t01] + (TOP[t11] - TOP[t01]) * sm(0, 1, u - i);
    let h = hx0 + (hx1 - hx0) * sm(0, 1, v - j);
    // ondulación muy suave en tierra firme
    if (h > -0.02) h += (vnoise(px * 0.35, pz * 0.35) - 0.5) * 0.06;
    // color
    baseColor(t00, season, cA); baseColor(t10, season, cB); const c0 = cc.copy(cA).lerp(cB, fx);
    const r0 = c0.r, g0 = c0.g, b0 = c0.b;
    baseColor(t01, season, cA); baseColor(t11, season, cB); const c1 = cA.lerp(cB, fx);
    tmp.setRGB(r0, g0, b0).lerp(c1, fz);
    // variación de color a dos escalas (manchas + grano)
    const patch = (vnoise(px * 0.18, pz * 0.18) - 0.5) * 0.09 + (vnoise(px * 0.9, pz * 0.9) - 0.5) * 0.05;
    tmp.offsetHSL(0, 0, patch);
    tmp.multiplyScalar(1.07); // compensa el tono medio de la textura de grano
    // franja de espuma / arena mojada junto al agua
    const foam = sm(-0.36, -0.27, h) * (1 - sm(-0.27, -0.2, h));
    if (foam > 0) tmp.lerp(cA.set('#f6f3e8'), foam * 0.75);
    pos.setY(k, h);
    colors[k * 3] = tmp.r; colors[k * 3 + 1] = tmp.g; colors[k * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Falda del diorama: pared de tierra alrededor del terreno. */
function buildSkirt(terrain) {
  const pos = terrain.attributes.position, col = terrain.attributes.color;
  const verts = [], cols = [], ind = [];
  const dirt = new THREE.Color('#8f6f52'), deep = new THREE.Color('#6f523c');
  const edges = [];
  for (let i = 0; i <= N; i++) edges.push(i); // z=0 (fila 0)
  const rows = [
    Array.from({ length: N + 1 }, (_, i) => i), // z = 0
    Array.from({ length: N + 1 }, (_, i) => N * (N + 1) + i), // z = MAP
    Array.from({ length: N + 1 }, (_, i) => i * (N + 1)), // x = 0
    Array.from({ length: N + 1 }, (_, i) => i * (N + 1) + N), // x = MAP
  ];
  for (const r of rows) {
    const base = verts.length / 3;
    r.forEach((vi, n) => {
      const x = pos.getX(vi), y = pos.getY(vi), z = pos.getZ(vi);
      verts.push(x, y, z, x, -1.5, z);
      const c = new THREE.Color(col.getX(vi), col.getY(vi), col.getZ(vi)).lerp(dirt, y < -0.3 ? 1 : 0.55);
      cols.push(c.r, c.g, c.b, deep.r, deep.g, deep.b);
      if (n < N) { const a = base + n * 2; ind.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(ind);
  g.computeVertexNormals();
  return g;
}

export default function Terrain() {
  const world = useGame((s) => s.world);
  const season = useGame((s) => s.env.season);
  const landMat = useRef(), waterMat = useRef(), plankRef = useRef(), railRef = useRef(), sparkRef = useRef();

  const terrain = useMemo(() => buildTerrain(world, season), [world, season]);
  const skirt = useMemo(() => buildSkirt(terrain), [terrain]);
  const grain = useMemo(detailTexture, []);

  const { planks, rails, water } = useMemo(() => {
    const planks = [], rails = [], water = [];
    for (let z = 0; z < MAP; z++) for (let x = 0; x < MAP; x++) {
      const t = world.tiles[idx(x, z)];
      if (t === TILE.WATER || t === TILE.BRIDGE) water.push([x, z]);
      if (t === TILE.BRIDGE) {
        planks.push([x, z]);
        if (world.tiles[idx(x, z - 1)] !== TILE.BRIDGE) rails.push([x, z, 0]);
        if (world.tiles[idx(x, z + 1)] !== TILE.BRIDGE) rails.push([x, z, 1]);
      }
    }
    return { planks, rails, water };
  }, [world]);

  const posts = useMemo(() => {
    const has = new Set(rails.map(([x, z, s]) => `${x},${z},${s}`));
    const o = [];
    rails.forEach(([x, z, side]) => { o.push([x + 0.03, z + (side ? 0.96 : 0.04)]); if (!has.has(`${x + 1},${z},${side}`)) o.push([x + 0.97, z + (side ? 0.96 : 0.04)]); });
    return o;
  }, [rails]);
  const postRef = useRef(), beamRef = useRef(), capRef = useRef(), knobRef = useRef();
  const sparks = useMemo(() => Array.from({ length: 120 }, (_, i) => { const w = water[(i * 7919) % water.length] || [0, 0]; return { x: w[0] + 0.15 + ((i * 37) % 70) / 100, z: w[1] + 0.15 + ((i * 53) % 70) / 100, ph: i * 1.7 }; }), [water]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const col = new THREE.Color(), q0 = new THREE.Quaternion();
    planks.forEach(([x, z], i) => {
      for (let b = 0; b < 4; b++) {
        const k = i * 4 + b, h = hash2(x * 4 + b, z);
        m.compose(new THREE.Vector3(x + 0.125 + b * 0.25, 0.02 + (h - 0.5) * 0.012, z + 0.5), q0, new THREE.Vector3(1, 1, 1));
        plankRef.current.setMatrixAt(k, m);
        plankRef.current.setColorAt(k, col.set('#b98254').offsetHSL((h - 0.5) * 0.02, 0, (h - 0.5) * 0.12));
      }
      for (const dz of [0.1, 0.9]) { // vigas bajo el puente
        m.compose(new THREE.Vector3(x + 0.5, -0.1, z + dz), q0, new THREE.Vector3(1, 1, 1));
        beamRef.current.setMatrixAt(i * 2 + (dz > 0.5 ? 1 : 0), m);
      }
    });
    plankRef.current.instanceMatrix.needsUpdate = true; if (plankRef.current.instanceColor) plankRef.current.instanceColor.needsUpdate = true;
    beamRef.current.instanceMatrix.needsUpdate = true;
    rails.forEach(([x, z, side], i) => {
      m.compose(new THREE.Vector3(x + 0.5, 0.47, z + (side ? 0.96 : 0.04)), q0, new THREE.Vector3(1, 1, 1));
      capRef.current.setMatrixAt(i, m);
    });
    capRef.current.instanceMatrix.needsUpdate = true;
    rails.forEach(([x, z, side], i) => {
      m.compose(new THREE.Vector3(x + 0.5, 0.3, z + (side ? 0.96 : 0.04)), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
      railRef.current.setMatrixAt(i, m);
    });
    railRef.current.instanceMatrix.needsUpdate = true;
  }, [planks, rails]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    posts.forEach(([x, z], i) => { m.compose(new THREE.Vector3(x, 0.32, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); postRef.current.setMatrixAt(i, m); m.compose(new THREE.Vector3(x, 0.68, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); knobRef.current.setMatrixAt(i, m); });
    postRef.current.instanceMatrix.needsUpdate = true; knobRef.current.instanceMatrix.needsUpdate = true;
  }, [posts]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    sparks.forEach((k, i) => {
      const a = Math.max(0, Math.sin(t * 1.8 + k.ph)); const sc = a * a * a * 0.2;
      e.set(-Math.PI / 2, 0, k.ph); q.setFromEuler(e);
      m4.compose(new THREE.Vector3(k.x, WATER_Y + 0.01, k.z), q, new THREE.Vector3(sc * 1.8, sc * 0.5, 1));
      sparkRef.current.setMatrixAt(i, m4);
    });
    sparkRef.current.instanceMatrix.needsUpdate = true;
    if (waterMat.current) waterMat.current.color.setHSL(0.52, 0.55, 0.52 + Math.sin(t * 1.2) * 0.03);
    if (landMat.current) {
      const wet = isWet(L.weather), k = Math.min(1, dt * 1.2);
      landMat.current.roughness += ((wet ? 0.5 : 1) - landMat.current.roughness) * k;
      const c = landMat.current.color.r; landMat.current.color.setScalar(c + ((wet ? 0.78 : 1) - c) * k);
    }
  });

  return (
    <group>
      <mesh geometry={terrain} receiveShadow castShadow>
        <meshStandardMaterial ref={landMat} vertexColors map={grain} roughness={1} />
      </mesh>
      <mesh geometry={skirt}>
        <meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* agua */}
      <mesh position={[MAP / 2, WATER_Y, MAP / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[MAP, MAP]} />
        <meshStandardMaterial ref={waterMat} color="#6cc3d8" roughness={0.22} metalness={0.1} transparent opacity={0.78} />
      </mesh>
      <instancedMesh ref={sparkRef} args={[null, null, 120]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      {/* puente */}
      <instancedMesh ref={plankRef} args={[null, null, Math.max(1, planks.length * 4)]} castShadow receiveShadow>
        <primitive object={rbGeo(0.23, 0.1, 0.98)} attach="geometry" /><meshStandardMaterial vertexColors roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={beamRef} args={[null, null, Math.max(1, planks.length * 2)]} castShadow receiveShadow>
        <primitive object={rbGeo(1, 0.1, 0.12)} attach="geometry" /><meshStandardMaterial vertexColors color="#6b4630" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[null, null, Math.max(1, rails.length)]} castShadow>
        <primitive object={rbGeo(1, 0.05, 0.13)} attach="geometry" /><meshStandardMaterial vertexColors color="#a8764c" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={knobRef} args={[null, null, Math.max(1, posts.length)]} castShadow>
        <sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#c9a46a" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={postRef} args={[null, null, Math.max(1, posts.length)]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.66, 8]} /><meshStandardMaterial color="#7a5238" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={railRef} args={[null, null, Math.max(1, rails.length)]} castShadow>
        <boxGeometry args={[1, 0.28, 0.08]} /><meshStandardMaterial color="#8a5e3c" roughness={1} flatShading />
      </instancedMesh>
    </group>
  );
}
