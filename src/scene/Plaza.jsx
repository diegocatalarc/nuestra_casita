import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { sfx } from '../game/audio';
import { TOWN_LIGHTS } from './Discover';

/**
 * Vida de la plaza y la Calle Mayor (ambiente puro, sin estado compartido):
 * pájaros que se posan y vuelan, palomas que picotean, hojas o pétalos según la estación
 * y la campana a mediodía y a las 18:00.
 * Todo son instancias (pocas llamadas de dibujo) y se actualiza por fotograma sin renders de React.
 * Con calidad baja (store.quality === false) no se monta nada: pensado para el iPad.
 */

const CENTER = { x: 43.5, z: 19 }; // misma plaza que Village.jsx
const BIRDS = 6, PIGEONS = 6, LEAVES = 28;
/** Zona de caída de hojas: plaza + Calle Mayor (x 51-79, z 7-33) */
const FALL = { x0: 38, x1: 79, z0: 8, z1: 32 };
/** Puntos donde se posan los pájaros: borde de la fuente y farolas de la calle */
const PERCHES = [
  ...[0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2 + 0.4; return [CENTER.x + Math.cos(a), 0.44, CENTER.z + Math.sin(a)]; }),
  ...TOWN_LIGHTS.map((q) => [q.x, 1.75, q.z]),
];
const LEAF_COLORS = { 0: ['#f7b6c9', '#f49bb8', '#fbd3df'], 2: ['#d9822b', '#c4552a', '#e0a43a'] };
const BELL_HOURS = [12, 18];
const RING_S = 2.6;

export default function Plaza() {
  const on = useGame((s) => s.quality);
  return on ? <PlazaLife /> : null;
}

function PlazaLife() {
  const birdRef = useRef(), pigeonRef = useRef(), leafRef = useRef(), ringRef = useRef();
  const st = useRef(null);
  if (!st.current) st.current = makeState();
  const S = st.current;

  useFrame((s, rawDt) => {
    const dt = Math.min(rawDt, 0.05), time = s.clock.elapsedTime;
    const env = useGame.getState().env || {};
    const dm = S.dm;

    if (birdRef.current) {
      S.birds.forEach((b, i) => {
        let heading = b.heading, flap = 0, x = b.pos[0], y = b.pos[1], z = b.pos[2];
        if (b.fly) {
          b.k += dt / b.dur;
          if (b.k >= 1) { b.fly = false; b.k = 1; b.wait = 3 + Math.random() * 7; }
          const k = Math.min(1, b.k), e = k * k * (3 - 2 * k);
          x = b.from[0] + (b.to[0] - b.from[0]) * e;
          z = b.from[2] + (b.to[2] - b.from[2]) * e;
          y = b.from[1] + (b.to[1] - b.from[1]) * e + Math.sin(k * Math.PI) * 0.9;
          heading = Math.atan2(b.to[0] - b.from[0], b.to[2] - b.from[2]);
          b.heading = heading;
          flap = Math.sin(time * 26 + i) * 0.3;
          b.pos = [x, y, z];
        } else {
          b.wait -= dt;
          if (b.wait <= 0) nextPerch(b);
          heading = b.heading + Math.sin(time * 0.7 + i) * 0.35; // se acicala mirando a un lado y a otro
        }
        dm.position.set(x, y, z);
        dm.rotation.order = 'YXZ';
        dm.rotation.set(0, heading, 0);
        dm.scale.set(1, 1 + flap, 1.4);
        dm.updateMatrix();
        birdRef.current.setMatrixAt(i, dm.matrix);
      });
      birdRef.current.instanceMatrix.needsUpdate = true;
    }

    if (pigeonRef.current) {
      S.pigeons.forEach((p, i) => {
        p.timer -= dt;
        if (p.mode === 'walk') {
          p.a += p.dir * 0.3 * dt;
          if (p.timer <= 0) { p.mode = 'peck'; p.timer = 1.2 + Math.random() * 1.6; }
        } else if (p.timer <= 0) { p.mode = 'walk'; p.timer = 2.5 + Math.random() * 3; }
        const x = CENTER.x + Math.cos(p.a) * p.r, z = CENTER.z + Math.sin(p.a) * p.r;
        const peck = p.mode === 'peck';
        const heading = Math.atan2(-Math.sin(p.a) * p.dir, Math.cos(p.a) * p.dir);
        dm.position.set(x, 0.09, z);
        dm.rotation.order = 'YXZ';
        dm.rotation.set(peck ? 0.7 + Math.sin(time * 14 + i) * 0.12 : 0, heading, 0); // cabeza al suelo al picotear
        dm.scale.set(1, 1, 1.5);
        dm.updateMatrix();
        pigeonRef.current.setMatrixAt(i, dm.matrix);
      });
      pigeonRef.current.instanceMatrix.needsUpdate = true;
    }

    if (leafRef.current) {
      const season = env.season, wx = env.weather;
      const active = (season === 0 || season === 2) && !(wx === 'rain' || wx === 'storm' || wx === 'snow');
      if (season !== S.colored && LEAF_COLORS[season]) {
        const pal = LEAF_COLORS[season];
        S.leaves.forEach((_, i) => leafRef.current.setColorAt(i, new THREE.Color(pal[i % pal.length])));
        if (leafRef.current.instanceColor) leafRef.current.instanceColor.needsUpdate = true;
        S.colored = season;
      }
      S.leaves.forEach((l, i) => {
        l.y -= l.sp * dt;
        l.x += Math.sin(time * l.dr + l.ph) * 0.35 * dt;
        if (l.y < 0.05) { l.y = 3.2 + Math.random() * 0.6; respawnLeaf(l); }
        dm.position.set(l.x, l.y, l.z);
        dm.rotation.order = 'XYZ';
        dm.rotation.set(time * l.dr, time * l.dr * 0.7 + l.ph, time * 0.5 + l.ph);
        const k = active ? 1 : 0; // fuera de temporada: escala 0 (invisible)
        dm.scale.set(k, k, k);
        dm.updateMatrix();
        leafRef.current.setMatrixAt(i, dm.matrix);
      });
      leafRef.current.instanceMatrix.needsUpdate = true;
    }

    // Campana: al cambiar la hora a 12 o 18 (no al cargar la partida)
    const h = Math.floor(env.hour ?? -1);
    if (S.lastHour !== null && h !== S.lastHour && BELL_HOURS.includes(h)) { S.ring = 0; sfx('bell', 0.9); }
    S.lastHour = h;
    if (S.ring !== null && ringRef.current) {
      S.ring += dt;
      if (S.ring >= RING_S) { S.ring = null; ringRef.current.visible = false; }
      else {
        const k = S.ring / RING_S;
        ringRef.current.visible = true;
        ringRef.current.scale.setScalar(1 + k * 6);
        ringRef.current.material.opacity = (1 - k) * 0.55;
      }
    }
  });

  return (
    <group>
      <instancedMesh ref={birdRef} args={[null, null, BIRDS]} frustumCulled={false}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshStandardMaterial color="#5e5560" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={pigeonRef} args={[null, null, PIGEONS]} frustumCulled={false}>
        <sphereGeometry args={[0.11, 8, 6]} />
        <meshStandardMaterial color="#8e96a3" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[null, null, LEAVES]} frustumCulled={false}>
        <planeGeometry args={[0.14, 0.09]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>
      <mesh ref={ringRef} visible={false} position={[CENTER.x, 0.06, CENTER.z]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <ringGeometry args={[0.92, 1, 32]} />
        <meshBasicMaterial color="#ffe9a8" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---- estado (fuera de React) ----

function makeState() {
  const birds = Array.from({ length: BIRDS }, (_, i) => {
    const p = PERCHES[(i * 5) % PERCHES.length];
    return { pos: [...p], from: [...p], to: [...p], fly: false, k: 0, dur: 1, wait: 1 + i * 1.7, heading: 0 };
  });
  const pigeons = Array.from({ length: PIGEONS }, (_, i) => ({
    a: (i / PIGEONS) * Math.PI * 2, r: 1.7 + Math.random() * 1.1, dir: i % 2 ? 1 : -1,
    mode: 'walk', timer: 2 + Math.random() * 3,
  }));
  const leaves = Array.from({ length: LEAVES }, (_, i) => {
    const l = { x: 0, y: 0, z: 0, sp: 0, dr: 0, ph: i * 1.3 };
    respawnLeaf(l);
    l.y = Math.random() * 3.2;
    return l;
  });
  return { birds, pigeons, leaves, dm: new THREE.Object3D(), colored: null, lastHour: null, ring: null };
}

function respawnLeaf(l) {
  l.x = FALL.x0 + Math.random() * (FALL.x1 - FALL.x0);
  l.z = FALL.z0 + Math.random() * (FALL.z1 - FALL.z0);
  l.y = 3.2 + Math.random() * 0.6;
  l.sp = 0.35 + Math.random() * 0.35;
  l.dr = 0.8 + Math.random() * 1.6;
}

function nextPerch(b) {
  let j = 0;
  for (let tries = 0; tries < 8; tries++) {
    j = Math.floor(Math.random() * PERCHES.length);
    const p = PERCHES[j];
    if (Math.hypot(p[0] - b.pos[0], p[2] - b.pos[2]) > 0.8) break;
  }
  const to = PERCHES[j];
  const d = Math.hypot(to[0] - b.pos[0], to[2] - b.pos[2]);
  b.from = [...b.pos];
  b.to = [...to];
  b.dur = 0.9 + d / 2.6;
  b.k = 0;
  b.fly = true;
}
