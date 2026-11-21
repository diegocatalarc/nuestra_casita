import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useGame } from '../store/gameStore';
import { TILE, MAP, HOUSE } from '../game/constants';
import { idx } from '../game/worldGen';
import { L, isWet, SEASON_COLORS } from '../game/lighting';
import { mulberry32 } from '../game/rng';
import { me } from '../game/runtime';
import { windMaterial } from './wind';

/**
 * Vida alrededor de la casa y el huerto (puramente decorativa; Math.random permitido):
 *  · mariposas y libélulas: UNA malla instanciada (1 llamada) con aleteo en el vertex shader, que van de flor en flor
 *    (más en primavera/verano de día; ninguna de noche, con lluvia, nieve o en invierno);
 *  · pajarillos que saltan por el suelo y a veces cruzan volando (de día, sin lluvia), 1 llamada;
 *  · hierba alta y flores extra en el entorno (instancias con el viento de wind.js), 3 llamadas;
 *  · chispas al sembrar, regar y cosechar (se detectan en `store.fx`, sin tocar las acciones), 1 llamada.
 * En táctil (pointer: coarse) hay la mitad de insectos y pájaros y menos hierba. Apagar: quitar <Life /> de GameCanvas.
 */
const COARSE = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
const ZONE = { x0: 6, x1: 28, z0: 12, z1: 34 }; // alrededor de la casa (HOUSE) y el huerto
const BUT_MAX = COARSE ? 6 : 12, BIRD_MAX = COARSE ? 2 : 4, GRASS_N = COARSE ? 70 : 120, FLOWER_N = COARSE ? 40 : 80, SPARK_N = 40;
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), col = new THREE.Color();
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- mariposas y libélulas
const WING_VS = `attribute float aPh; attribute float aSpd; varying vec3 vC;
uniform float uTime;
void main() {
  vec3 p = position;
  float f = sin(uTime * aSpd + aPh);                  // aleteo: las alas se pliegan hacia arriba
  float s = sign(p.x);
  float ang = f * 0.9;
  p.y += abs(p.x) * sin(ang) * 1.0;
  p.x = s * abs(p.x) * cos(ang);
  vC = instanceColor * (0.75 + 0.25 * abs(position.x) * 3.0);
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}`;
const WING_FS = `varying vec3 vC; uniform float uLight;
void main() {
  gl_FragColor = vec4(vC * uLight, 1.0);
  #include <colorspace_fragment>
}`;

function wingGeo() {
  const g = new THREE.BufferGeometry();
  const L2 = [[0, 0, 0.2], [0, 0, -0.2], [-0.42, 0, -0.32], [-0.42, 0, 0.28]], R = L2.map(([x, y, z]) => [-x, y, z]);
  const pos = [];
  for (const w of [L2, R]) pos.push(...w[0], ...w[1], ...w[2], ...w[0], ...w[2], ...w[3]);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

function Insects() {
  const ref = useRef();
  const world = useGame((s) => s.world);
  const flowers = useMemo(() => world.nodes.filter((n) => n.type === 'flower' && n.x > ZONE.x0 && n.x < ZONE.x1 && n.z > ZONE.z0 && n.z < ZONE.z1).map((n) => [n.x + 0.5, n.z + 0.5]), [world]);
  const geo = useMemo(() => { const g = wingGeo(); g.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(BUT_MAX), 1)); g.setAttribute('aSpd', new THREE.InstancedBufferAttribute(new Float32Array(BUT_MAX), 1)); return g; }, []);
  const uni = useMemo(() => ({ uTime: { value: 0 }, uLight: { value: 1 } }), []);
  const bugs = useMemo(() => Array.from({ length: BUT_MAX }, (_, i) => {
    const dragon = i % 4 === 3;
    return { dragon, x: rnd(ZONE.x0, ZONE.x1), z: rnd(ZONE.z0, ZONE.z1), y: 0.8, tx: 0, tz: 0, ty: 0.6, wait: 0, ang: 0, sp: dragon ? rnd(2.4, 3.4) : rnd(0.8, 1.4), ph: rnd(0, 6), c: dragon ? ['#4aa8e0', '#3fc7b0'][i % 2] : ['#ffd23a', '#f58cb4', '#ffffff', '#ff9a4c', '#b69cf0'][i % 5] };
  }), []);
  useLayoutEffect(() => {
    bugs.forEach((b, i) => { ref.current.setColorAt(i, col.set(b.c)); geo.attributes.aPh.array[i] = b.ph; geo.attributes.aSpd.array[i] = b.dragon ? 55 : 24; });
    geo.attributes.aPh.needsUpdate = true; geo.attributes.aSpd.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
  }, [bugs, geo]);
  const pick = (b) => {
    const f = flowers.length && !b.dragon ? flowers[Math.floor(Math.random() * flowers.length)] : null;
    b.tx = f ? f[0] + rnd(-0.15, 0.15) : rnd(ZONE.x0, ZONE.x1); b.tz = f ? f[1] + rnd(-0.15, 0.15) : rnd(ZONE.z0, ZONE.z1);
    b.ty = f ? 0.35 : rnd(0.8, 1.6); b.wait = f ? rnd(1, 3) : rnd(0, 0.6);
  };
  useFrame((s, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05), t = s.clock.elapsedTime;
    const day = 1 - L.night;
    // cuántos hay: primavera/verano de día, pocos en otoño; ninguno de noche, con lluvia/nieve o en invierno
    const season = L.season, calm = !isWet(L.weather) && L.weather !== 'snow';
    const want = !calm || L.night > 0.3 || season === 3 ? 0 : Math.round(BUT_MAX * (season === 2 ? 0.35 : 1) * Math.min(1, day * 1.4));
    const n = Math.min(BUT_MAX, want);
    ref.current.count = n; ref.current.visible = n > 0;
    if (n === 0) return;
    uni.uTime.value = t; uni.uLight.value = 0.85 + 0.25 * day;
    for (let i = 0; i < n; i++) {
      const b = bugs[i];
      if (!b.tx && !b.tz) pick(b);
      const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { b.wait -= dt; if (b.wait <= 0) pick(b); } else {
        const sp = b.sp * (b.dragon ? 1 : 0.8 + 0.4 * Math.sin(t * 5 + b.ph)); // las mariposas van a trompicones
        b.x += (dx / d) * sp * dt; b.z += (dz / d) * sp * dt; b.ang = Math.atan2(dx, dz);
      }
      b.y += (b.ty + Math.sin(t * 2.2 + b.ph) * 0.12 - b.y) * Math.min(1, dt * 2);
      e.set(0, b.ang, 0); q.setFromEuler(e);
      const k = b.dragon ? 0.22 : 0.3;
      m4.compose(v3.set(b.x + Math.sin(t * 1.7 + b.ph) * 0.12, b.y, b.z), q, s3.set(b.dragon ? k * 0.55 : k, k, b.dragon ? k * 2.6 : k));
      ref.current.setMatrixAt(i, m4);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, null, BUT_MAX]} frustumCulled={false}>
      <shaderMaterial vertexShader={WING_VS} fragmentShader={WING_FS} uniforms={uni} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------- pajarillos
function birdGeo() {
  const body = new THREE.SphereGeometry(0.5, 10, 8); body.scale(0.9, 0.7, 1.3); body.translate(0, 0.45, 0);
  const head = new THREE.SphereGeometry(0.3, 8, 6); head.translate(0, 0.78, 0.5);
  const beak = new THREE.ConeGeometry(0.1, 0.28, 5); beak.rotateX(Math.PI / 2); beak.translate(0, 0.76, 0.82);
  const tail = new THREE.BoxGeometry(0.22, 0.06, 0.5); tail.rotateX(-0.3); tail.translate(0, 0.5, -0.78);
  const paint = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  return mergeGeometries([paint(body, [1, 1, 1]), paint(head, [1, 1, 1]), paint(beak, [1, 0.62, 0.2]), paint(tail, [0.55, 0.5, 0.45])].map((g) => g.index ? g.toNonIndexed() : g));
}

function Birds() {
  const ref = useRef();
  const geo = useMemo(birdGeo, []);
  const birds = useMemo(() => Array.from({ length: BIRD_MAX }, (_, i) => ({ x: rnd(ZONE.x0 + 4, ZONE.x1 - 4), z: rnd(ZONE.z0 + 4, ZONE.z1 - 4), y: 0, fx: 0, fz: 0, tx: 0, tz: 0, k: 1, mode: 'idle', wait: rnd(0.5, 3), ang: rnd(0, 6), peck: 0, dur: 1, hop: 0.2, c: ['#b8864f', '#8f9aa8', '#d7a46a', '#a56a4a'][i % 4] })), []);
  useLayoutEffect(() => { birds.forEach((b, i) => ref.current.setColorAt(i, col.set(b.c))); ref.current.instanceColor.needsUpdate = true; }, [birds]);
  useFrame((s, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05), t = s.clock.elapsedTime;
    const show = !isWet(L.weather) && L.weather !== 'snow' && L.night < 0.3;
    const n = show ? BIRD_MAX : 0;
    ref.current.count = n; ref.current.visible = n > 0;
    for (let i = 0; i < n; i++) {
      const b = birds[i];
      if (b.mode === 'idle') {
        b.wait -= dt; b.peck = Math.max(0, Math.sin(t * 9 + i * 2) * 0.5);
        if (b.wait <= 0) {
          const far = Math.random() < 0.2; // a veces cruzan volando; casi siempre saltan un poco
          b.fx = b.x; b.fz = b.z; b.k = 0; b.mode = far ? 'fly' : 'hop';
          const r = far ? rnd(7, 12) : rnd(0.5, 1.4), a = Math.random() * 6.28;
          b.tx = THREE.MathUtils.clamp(b.x + Math.cos(a) * r, ZONE.x0, ZONE.x1); b.tz = THREE.MathUtils.clamp(b.z + Math.sin(a) * r, ZONE.z0, ZONE.z1);
          b.dur = far ? 1.6 : 0.28; b.hop = far ? 1.6 : 0.18; b.ang = Math.atan2(b.tx - b.x, b.tz - b.z);
        }
      } else {
        b.k += dt / b.dur;
        const k = Math.min(1, b.k);
        b.x = b.fx + (b.tx - b.fx) * k; b.z = b.fz + (b.tz - b.fz) * k; b.y = Math.sin(k * Math.PI) * b.hop;
        if (k >= 1) { b.mode = 'idle'; b.y = 0; b.wait = rnd(0.8, 3.5); }
      }
      // un pájaro se asusta si el personaje pasa muy cerca
      if (b.mode === 'idle' && Math.hypot(me.x - b.x, me.z - b.z) < 1.2) b.wait = 0;
      e.set(b.mode === 'idle' ? b.peck * 0.5 : -0.2, b.ang, 0); q.setFromEuler(e);
      const sc = 0.2;
      m4.compose(v3.set(b.x, b.y + 0.02, b.z), q, s3.set(sc, sc, sc)); ref.current.setMatrixAt(i, m4);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, null, BIRD_MAX]} frustumCulled={false}>
      <meshStandardMaterial vertexColors roughness={0.9} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------- hierba alta y flores extra
function Plants() {
  const world = useGame((s) => s.world);
  const buildings = useGame((s) => s.buildings);
  const season = useGame((s) => s.env.season);
  const grassRef = useRef(), stemRef = useRef(), headRef = useRef();
  const spots = useMemo(() => {
    const r = mulberry32(777), g = [], f = [];
    const ok = (x, z) => {
      const ix = Math.floor(x), iz = Math.floor(z);
      if (ix < 0 || iz < 0 || ix >= MAP || iz >= MAP) return false;
      const t = world.tiles[idx(ix, iz)];
      if (t !== TILE.GRASS && t !== TILE.MEADOW) return false;
      if (x > HOUSE.x - 1.5 && x < HOUSE.x + HOUSE.w + 1.5 && z > HOUSE.z - 1.5 && z < HOUSE.z + HOUSE.d + 1.5) return false;
      if (x > 10 && x < 23 && z > 24 && z < 30.2) return false; // huerto
      if (world.byTile.has(`${ix}_${iz}`)) return false;
      for (const b of Object.values(buildings)) if (x > b.x - 0.6 && x < b.x + b.w + 0.6 && z > b.z - 0.6 && z < b.z + b.d + 0.6) return false;
      return true;
    };
    let tries = 0;
    while ((g.length < GRASS_N || f.length < FLOWER_N) && tries++ < 4000) {
      const x = ZONE.x0 + r() * (ZONE.x1 - ZONE.x0), z = ZONE.z0 + r() * (ZONE.z1 - ZONE.z0);
      if (!ok(x, z)) continue;
      // más densidad cerca de la casa y de los caminos (el camino sale de la puerta hacia el sureste)
      const near = Math.hypot(x - (HOUSE.x + 2.5), z - (HOUSE.z + 2)) < 9 || r() < 0.35;
      if (!near) continue;
      if (g.length < GRASS_N && r() < 0.6) g.push([x, z, 0.8 + r() * 0.7, r() * 6.28, r()]); else if (f.length < FLOWER_N) f.push([x, z, 0.8 + r() * 0.5, r()]);
    }
    return { g, f };
  }, [world, buildings]);
  const grassMat = useMemo(() => windMaterial(0.28, { flatShading: true }), []);
  const stemMat = useMemo(() => windMaterial(0.25), []);
  const headMat = useMemo(() => windMaterial(0.25, { roughness: 0.8 }), []);
  useLayoutEffect(() => {
    const gm = grassRef.current, sm = stemRef.current, hm = headRef.current;
    const winter = season === 3, spring = season === 0;
    spots.g.forEach(([x, z, k, ry, c], i) => {
      e.set(0, ry, 0); q.setFromEuler(e);
      m4.compose(v3.set(x, 0.22 * k, z), q, s3.set(0.16 * k, 0.5 * k, 0.16 * k)); gm.setMatrixAt(i, m4);
      gm.setColorAt(i, col.set(SEASON_COLORS.grass[season]).offsetHSL(0.01, 0.05, -0.04 + c * 0.1));
    });
    gm.count = spots.g.length; gm.instanceMatrix.needsUpdate = true; gm.instanceColor.needsUpdate = true;
    const PAL = spring ? ['#f7a8c4', '#fff3b0', '#ffffff', '#c9a6f0', '#ff9ec8'] : ['#fff3b0', '#ffd24a', '#f6a07a', '#ffffff', '#f7a8c4'];
    spots.f.forEach(([x, z, k, c], i) => {
      const sc = winter ? 0.0001 : k * (spring ? 1.25 : 1);
      e.set(0, c * 6, 0); q.setFromEuler(e);
      m4.compose(v3.set(x, 0.13 * sc, z), q, s3.set(0.04, 0.26 * sc, 0.04)); sm.setMatrixAt(i, m4); sm.setColorAt(i, col.set('#5f9a4a'));
      m4.compose(v3.set(x, 0.29 * sc, z), q, s3.set(0.1 * sc, 0.1 * sc, 0.1 * sc)); hm.setMatrixAt(i, m4); hm.setColorAt(i, col.set(PAL[Math.floor(c * 5) % 5]));
    });
    sm.count = hm.count = spots.f.length;
    for (const m of [sm, hm]) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
  }, [spots, season]);
  return (
    <group>
      <instancedMesh ref={grassRef} args={[null, grassMat, GRASS_N]} receiveShadow><coneGeometry args={[1, 1.6, 4]} /></instancedMesh>
      <instancedMesh ref={stemRef} args={[null, stemMat, FLOWER_N]}><cylinderGeometry args={[1, 1, 1, 4]} /></instancedMesh>
      <instancedMesh ref={headRef} args={[null, headMat, FLOWER_N]}><icosahedronGeometry args={[1, 0]} /></instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------- chispas al sembrar, regar y cosechar
function Sparks() {
  const ref = useRef();
  const P = useMemo(() => Array.from({ length: SPARK_N }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, c: '#fff', s: 0.06, on: false })), []);
  const next = useRef(0), seen = useRef(new Set());
  useEffect(() => {
    const burst = (x, z, c, n, up, spread) => { for (let i = 0; i < n; i++) { const p = P[next.current++ % SPARK_N]; const a = Math.random() * 6.28, sp = rnd(0.3, 1) * spread; p.life = 1; p.x = x; p.y = 0.15; p.z = z; p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp; p.vy = rnd(0.6, 1) * up; p.c = c[i % c.length]; p.s = rnd(0.04, 0.08); } };
    return useGame.subscribe((s) => {
      for (const f of s.fx) {
        if (seen.current.has(f.id)) continue;
        seen.current.add(f.id); if (seen.current.size > 60) seen.current.delete(seen.current.values().next().value);
        const tx = f.text || '';
        if (tx.startsWith('🌱')) burst(f.x, f.z, ['#8a5e3c', '#6fbf4a', '#b98254'], 10, 2.2, 1.4); // sembrar: tierra y brotes
        else if (tx.startsWith('💧')) burst(f.x, f.z, ['#8ad0ff', '#c9ecff'], 12, 1.6, 1.0); // regar: gotas
        else if (/^\+\d/.test(tx)) burst(f.x, f.z, ['#ffe27a', '#fff3b0', '#ffb84a'], 14, 2.6, 1.6); // cosechar: destellos dorados
      }
    });
  }, [P]);
  useFrame((s, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05); let any = false;
    for (let i = 0; i < SPARK_N; i++) {
      const p = P[i];
      if (p.life > 0) {
        any = true; p.on = true; p.life = Math.max(0, p.life - dt * 1.6);
        p.vy -= 6 * dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y = Math.max(0.03, p.y + p.vy * dt);
        const k = p.life > 0 ? Math.min(1, p.life * 3) * p.s : 0.0001;
        m4.compose(v3.set(p.x, p.y, p.z), q.identity(), s3.set(k, k, k)); ref.current.setMatrixAt(i, m4); ref.current.setColorAt(i, col.set(p.c));
      } else if (p.on) { p.on = false; any = true; m4.compose(v3.set(0, -9, 0), q.identity(), s3.set(0.0001, 0.0001, 0.0001)); ref.current.setMatrixAt(i, m4); }
    }
    if (any) { ref.current.instanceMatrix.needsUpdate = true; if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true; }
  });
  return (
    <instancedMesh ref={ref} args={[null, null, SPARK_N]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} /><meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

export default function Life() {
  return (
    <>
      <Insects />
      <Birds />
      <Plants />
      <Sparks />
    </>
  );
}
