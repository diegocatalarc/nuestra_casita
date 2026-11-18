import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { NEIGHBORS } from '../game/constants';
import { L } from '../game/lighting';
import { goAndDo } from '../game/actions';
import { rbGeo } from './rb';
import Avatar from './Avatar';
import { t } from '../i18n';
import ContactShadow from './shadow';
import { propFree } from '../game/villageProps';

const PLAZA = { x: 43.5, z: 19.0 };
/** Farolas del pueblo (las toma el LightPool) */
export const VILLAGE_LIGHTS = [[41.4, 17.8], [45.6, 17.8], [43.5, 22.4], [39.6, 21.6]].map(([x, z]) => ({ x, y: 1.5, z, c: '#ffcf8a', base: 0.8, dayMul: 0 }));

const Bx = ({ p, s, c, r, e }) => <mesh position={p} rotation={r} geometry={rbGeo(s[0], s[1], s[2])} castShadow receiveShadow><meshStandardMaterial vertexColors color={c} roughness={0.9} {...(e || {})} /></mesh>;
const Cyl = ({ p, a, h, c, seg = 10 }) => <mesh position={p} castShadow receiveShadow><cylinderGeometry args={[a[0], a[1] ?? a[0], h, seg]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>;
const Ball = ({ p, r, c, s = [1, 1, 1] }) => <mesh position={p} scale={s} castShadow><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color={c} roughness={1} flatShading /></mesh>;
const can = () => useGame.getState().tool === 'interact';
const ptr = (on) => () => { if (can()) document.body.style.cursor = on ? 'pointer' : ''; };

// material de ventanas compartido: se enciende de noche
const winMat = new THREE.MeshStandardMaterial({ color: '#cfe8f2', emissive: '#ffd27a', emissiveIntensity: 0 });
const lampMat = new THREE.MeshStandardMaterial({ color: '#fff1c8', emissive: '#ffb84a', emissiveIntensity: 0.3 });

function Cobbles() {
  const tiles = useMemo(() => {
    const o = [];
    const add = (x, z) => o.push([x, z]);
    for (let x = 41; x <= 47; x++) add(x, 17);                // calle de las dos puertas
    for (const x of [41, 46]) add(x, 16);
    for (let z = 21; z <= 22; z++) { add(43, z); add(44, z); } // calle principal hacia el camino
    add(47, 22);
    const ring = []; for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.hypot(dx, dz) <= 2.2) ring.push([Math.floor(PLAZA.x) + dx, Math.floor(PLAZA.z) + dz]);
    return [...o, ...ring];
  }, []);
  return <group>{tiles.map(([x, z], i) => <Bx key={i} p={[x + 0.5, 0.03, z + 0.5]} s={[0.96, 0.06, 0.96]} c={['#d6cdbb', '#cfc5b0', '#dcd3c2'][(x * 3 + z) % 3]} />)}</group>;
}

function Fountain() {
  const drops = useRef([]);
  useFrame((s) => { const t = s.clock.elapsedTime; drops.current.forEach((d, i) => { if (!d) return; const k = ((t * 0.9 + i / 6) % 1); d.position.set(Math.cos(i * 1.05) * 0.5 * k, 0.9 + Math.sin(k * Math.PI) * 0.55 - k * 0.2, Math.sin(i * 1.05) * 0.5 * k); d.visible = true; }); });
  return (
    <group position={[PLAZA.x, 0, PLAZA.z]}>
      <Cyl p={[0, 0.2, 0]} a={[1.0, 1.1]} h={0.4} c="#cfc9bd" seg={14} />
      <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.85, 0.85, 0.05, 14]} /><meshStandardMaterial color="#6cc3d8" roughness={0.2} /></mesh>
      <Cyl p={[0, 0.7, 0]} a={[0.12, 0.18]} h={0.8} c="#cfc9bd" />
      <Cyl p={[0, 1.12, 0]} a={[0.42, 0.22]} h={0.14} c="#cfc9bd" seg={12} />
      {Array.from({ length: 6 }, (_, i) => <mesh key={i} ref={(r) => (drops.current[i] = r)}><sphereGeometry args={[0.045, 6, 5]} /><meshBasicMaterial color="#bfeaf6" /></mesh>)}
    </group>
  );
}

function Lantern({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.05, 0]} a={[0.12, 0.15]} h={0.1} c="#5a4a52" />
      <Cyl p={[0, 0.78, 0]} a={[0.03, 0.045]} h={1.5} c="#4a3e48" />
      <mesh position={[0, 1.5, 0]} material={lampMat}><boxGeometry args={[0.22, 0.26, 0.22]} /></mesh>
      <mesh position={[0, 1.7, 0]}><coneGeometry args={[0.2, 0.16, 4]} /><meshStandardMaterial color="#4a3e48" /></mesh>
    </group>
  );
}

function Bench({ x, z, r = 0 }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <Bx p={[0, 0.42, 0]} s={[1.2, 0.08, 0.4]} c="#b98254" /><Bx p={[0, 0.75, -0.18]} s={[1.2, 0.35, 0.06]} c="#a8764c" />
      <Bx p={[-0.5, 0.2, 0]} s={[0.08, 0.4, 0.36]} c="#6b4630" /><Bx p={[0.5, 0.2, 0]} s={[0.08, 0.4, 0.36]} c="#6b4630" />
    </group>
  );
}

function Stall({ x, z, r }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      {[[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]].map(([a, b], i) => <Bx key={i} p={[a, 0.85, b]} s={[0.08, 1.7, 0.08]} c="#8a5e3c" />)}
      <Bx p={[0, 0.5, 0]} s={[1.8, 0.7, 0.9]} c="#d9b384" />
      {[0, 1, 2, 3, 4].map((i) => <Bx key={i} p={[-0.8 + i * 0.4, 1.78, 0]} s={[0.4, 0.06, 1.3]} c={i % 2 ? '#ffffff' : '#e8624a'} r={[0.12, 0, 0]} />)}
      {[[-0.5, '#e0524a'], [-0.15, '#f2c94c'], [0.2, '#7fc45a'], [0.55, '#f4a6c0']].map(([a, c], i) => <Ball key={i} p={[a, 0.95, 0.05]} r={0.13} c={c} />)}
      <Bx p={[1.2, 0.25, 0.3]} s={[0.5, 0.5, 0.5]} c="#c9a070" /><Bx p={[1.25, 0.65, 0.3]} s={[0.4, 0.3, 0.4]} c="#d9b384" />
    </group>
  );
}

function Garden() {
  return (
    <group position={[42.2, 0, 11.4]}>
      {[-1.9, 1.9].map((x) => <Bx key={x} p={[x, 0.3, 0]} s={[0.08, 0.6, 2.4]} c="#8a5e3c" />)}
      <Bx p={[0, 0.3, 1.2]} s={[3.9, 0.08, 0.08]} c="#8a5e3c" /><Bx p={[0, 0.5, 1.2]} s={[3.9, 0.08, 0.08]} c="#8a5e3c" />
      {[-1.2, 0, 1.2].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <Bx p={[0, 0.07, 0]} s={[0.9, 0.14, 2.0]} c="#6a4630" />
          {[-0.7, -0.25, 0.2, 0.65].map((z, k) => <group key={k} position={[0, 0.2, z]}><Ball p={[0, 0.08, 0]} r={0.17} c={['#6fbf4a', '#e8793a', '#d96a8a', '#7fc45a'][(i + k) % 4]} s={[1, 0.8, 1]} /><Ball p={[0.18, 0.05, 0.05]} r={0.1} c="#5fae55" /></group>)}
        </group>
      ))}
      <group position={[2.4, 0, 0.8]}><Cyl p={[0, 0.2, 0]} a={[0.2, 0.17]} h={0.4} c="#8fb8de" /><Bx p={[0.22, 0.28, 0]} s={[0.3, 0.06, 0.06]} c="#8fb8de" /></group>
    </group>
  );
}

function Laundry() {
  const cloths = useRef([]);
  useFrame((s) => { const t = s.clock.elapsedTime; cloths.current.forEach((c, i) => { if (c) c.rotation.x = Math.sin(t * 1.6 + i) * 0.2; }); });
  return (
    <group position={[39.2, 0, 13.4]}>
      {[0, 2.6].map((z) => <Bx key={z} p={[0, 0.9, z]} s={[0.08, 1.8, 0.08]} c="#8a5e3c" />)}
      <Bx p={[0, 1.7, 1.3]} s={[0.03, 0.03, 2.6]} c="#f6efe6" />
      {[['#f4a6c0', 0.5], ['#8fb8de', 1.0], ['#f6efe6', 1.5], ['#ffd98a', 2.0]].map(([c, z], i) => <mesh key={i} ref={(r) => (cloths.current[i] = r)} position={[0, 1.45, z]}><boxGeometry args={[0.04, 0.4, 0.3]} /><meshStandardMaterial color={c} /></mesh>)}
    </group>
  );
}

function Pier() {
  return (
    <group position={[39.0, 0, 17.0]}>
      {[0, 1, 2, 3, 4].map((i) => <Bx key={i} p={[-1.4 + i * 0.45, 0.14, 0.5]} s={[0.4, 0.06, 1.1]} c="#b98254" />)}
      {[[-1.5, 0], [-1.5, 1], [0.3, 0], [0.3, 1]].map(([a, b], i) => <Bx key={i} p={[a, -0.1, b]} s={[0.1, 0.5, 0.1]} c="#6b4630" />)}
      <Cyl p={[0.9, 0.25, 0.2]} a={[0.14, 0.11]} h={0.3} c="#8fb8de" />
      <Bx p={[1.2, 0.2, 0.9]} s={[0.4, 0.28, 0.4]} c="#c9a070" />
    </group>
  );
}
function PabloLine() {
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(37.1, 1.35, 17.75), new THREE.Vector3(36.7, -0.1, 17.95)]), []);
  return (
    <group>
      <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#f6efe6' }))} />
      <mesh position={[36.7, -0.2, 17.95]}><sphereGeometry args={[0.07, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshBasicMaterial color="#e0524a" toneMapped={false} /></mesh>
    </group>
  );
}
function DryRack() {
  return (
    <group position={[44.6, 0, 11.6]}>
      {[-0.9, 0.9].map((x) => <Bx key={x} p={[x, 0.65, 0]} s={[0.08, 1.3, 0.08]} c="#8a5e3c" />)}
      <Bx p={[0, 1.25, 0]} s={[1.9, 0.06, 0.06]} c="#8a5e3c" />
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => <Ball key={i} p={[x, 0.95, 0]} r={0.14} c={['#8fb8de', '#c9d8e8', '#8fb8de', '#f2c27a'][i]} s={[0.5, 1.5, 0.35]} />)}
    </group>
  );
}

function Easel() {
  return (
    <group position={[44.9, 0, 20.2]} rotation={[0, -0.9, 0]}>
      {[[-0.3, 0.1], [0.3, 0.1], [0, -0.3]].map(([a, b], i) => <Bx key={i} p={[a, 0.7, b]} s={[0.06, 1.4, 0.06]} c="#8a5e3c" r={[b < 0 ? -0.25 : 0.12, 0, a * 0.4]} />)}
      <Bx p={[0, 1.05, 0.14]} s={[0.85, 0.65, 0.04]} c="#fff7e6" />
      {[[-0.2, 1.15, '#e86a8a'], [0.1, 1.0, '#6a9bd9'], [0.25, 1.2, '#f2c94c'], [-0.1, 0.95, '#7fc45a']].map(([a, b, c], i) => <mesh key={i} position={[a, b, 0.17]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color={c} /></mesh>)}
    </group>
  );
}

function Arch() {
  return (
    <group position={[39.6, 0, 23.8]}>
      {[-1.7, 1.7].map((z) => <Bx key={z} p={[0, 1.4, z]} s={[0.22, 2.8, 0.22]} c="#8a5e3c" />)}
      <Bx p={[0, 2.85, 0]} s={[0.3, 0.2, 4.0]} c="#a8764c" />
      {[-1.2, -0.6, 0, 0.6, 1.2].map((z, i) => <mesh key={i} position={[0.05, 2.62, z]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.14, 0.26, 3]} /><meshBasicMaterial color={['#f7a8c4', '#ffd98a', '#8fd0f0', '#b8e0a0'][i % 4]} toneMapped={false} /></mesh>)}
      <Html position={[0, 3.45, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[2, 0]}><div className="zone-tag small" style={{ pointerEvents: 'none' }}>🏘️ {t("Pueblo")}</div></Html>
    </group>
  );
}

function Tree({ x, z, s = 1, c = '#6fae5c' }) {
  return <group position={[x, 0, z]} scale={s}><Cyl p={[0, 0.5, 0]} a={[0.1, 0.16]} h={1} c="#8a5e3c" seg={6} /><Ball p={[0, 1.4, 0]} r={0.7} c={c} /><Ball p={[0.3, 1.1, 0.2]} r={0.45} c={c} /></group>;
}

function Cat() {
  const tail = useRef();
  useFrame((s) => { if (tail.current) tail.current.rotation.z = Math.sin(s.clock.elapsedTime * 2) * 0.4; });
  return (
    <group position={[46.5, 0.15, 22.55]} rotation={[0, 0.6, 0]}>
      <Ball p={[0, 0.15, 0]} r={0.16} c="#f2a65a" s={[1.2, 0.9, 1]} /><Ball p={[0.16, 0.3, 0]} r={0.1} c="#f2a65a" />
      <mesh position={[0.17, 0.4, 0.05]}><coneGeometry args={[0.03, 0.06, 4]} /><meshStandardMaterial color="#f2a65a" /></mesh><mesh position={[0.17, 0.4, -0.05]}><coneGeometry args={[0.03, 0.06, 4]} /><meshStandardMaterial color="#f2a65a" /></mesh>
      <group ref={tail} position={[-0.18, 0.12, 0]}><Bx p={[-0.1, 0.02, 0]} s={[0.22, 0.05, 0.05]} c="#e88f3c" /></group>
    </group>
  );
}

function House({ n, visit }) {
  const { x, z, wall, roof } = n.house;
  return (
    <group position={[x, 0, z]} onClick={visit} onPointerOver={ptr(true)} onPointerOut={ptr(false)}>
      <Bx p={[1.5, 0.06, 1.5]} s={[3.6, 0.12, 3.6]} c="#d9c9a8" />
      <Bx p={[1.5, 1.0, 1.5]} s={[3, 1.9, 3]} c={wall} />
      <Bx p={[0.05, 1.0, 1.5]} s={[0.12, 1.9, 3.1]} c="#a8764c" /><Bx p={[2.95, 1.0, 1.5]} s={[0.12, 1.9, 3.1]} c="#a8764c" />
      <Bx p={[1.5, 1.95, 1.5]} s={[3.3, 0.14, 3.3]} c="#8a5e3c" />
      <mesh position={[1.5, 2.8, 1.5]} rotation={[0, Math.PI / 4, 0]} scale={[2.45, 1.7, 2.45]} castShadow><coneGeometry args={[1, 1, 4]} /><meshStandardMaterial color={roof} roughness={1} flatShading /></mesh>
      <Bx p={[2.4, 3.3, 0.9]} s={[0.5, 1.0, 0.5]} c="#b8a898" />
      <Bx p={[1.5, 0.75, 3.02]} s={[0.8, 1.4, 0.08]} c="#8a5e3c" /><mesh position={[1.75, 0.75, 3.08]}><sphereGeometry args={[0.05, 6, 5]} /><meshStandardMaterial color="#f2c94c" /></mesh>
      <Bx p={[1.5, 1.75, 3.05]} s={[0.9, 0.1, 0.1]} c="#6b4630" />
      {[0.5, 2.5].map((a) => <group key={a}><mesh position={[a, 1.2, 3.02]} material={winMat}><boxGeometry args={[0.7, 0.6, 0.06]} /></mesh><Bx p={[a, 1.2, 3.06]} s={[0.78, 0.07, 0.08]} c="#6b4630" /><Bx p={[a, 0.85, 3.1]} s={[0.8, 0.07, 0.14]} c="#6b4630" /><Bx p={[a, 0.5, 3.25]} s={[0.8, 0.3, 0.3]} c="#6aa85a" />{[-0.2, 0, 0.2].map((f, i) => <Ball key={i} p={[a + f, 0.72, 3.25]} r={0.07} c={['#f48aa8', '#ffe27a', '#ffffff'][i]} />)}</group>)}
      <mesh position={[-0.02, 1.3, 1.5]} material={winMat}><boxGeometry args={[0.06, 0.6, 0.7]} /></mesh>
      <Html position={[1.5, 4.4, 1.5]} center style={{ pointerEvents: 'none' }} zIndexRange={[3, 0]}><div className="fest-tag small">{n.emoji}</div></Html>
    </group>
  );
}

// Dónde está cada vecino según la hora: trabajando, o charlando en la plaza al mediodía y a la tarde
const WORK = {
  marta: { x: 42.4, z: 12.1, rot: 0, anim: 'water', icon: '🌱' },
  pablo: { x: 38.4, z: 17.5, rot: -Math.PI / 2, anim: 'fish', icon: '🎣' },
  luna: { x: 45.5, z: 20.9, rot: -2.3, anim: 'build', icon: '🎨' },
};
const SOCIAL = {
  marta: { x: PLAZA.x - 1.5, z: PLAZA.z + 0.3, rot: Math.PI / 2 },
  pablo: { x: PLAZA.x + 1.5, z: PLAZA.z + 0.1, rot: -Math.PI / 2 },
  luna: { x: PLAZA.x, z: PLAZA.z + 1.7, rot: Math.PI },
};
const social = (h) => (h >= 12 && h < 14) || (h >= 18 && h < 21);

function Neighbor({ n }) {
  const hour = useGame((s) => s.env.hour);
  if (hour < n.hours[0] || hour >= n.hours[1]) return null;
  const soc = social(hour), w = soc ? SOCIAL[n.id] : WORK[n.id];
  const anim = soc ? 'idle' : w.anim;
  const visit = (e) => { if (!can()) return; e.stopPropagation(); goAndDo(w.x, w.z, () => useGame.getState().set({ panel: 'explore', exploreTab: 'neighbors', neighborFocus: n.id }), 2.6); };
  return (
    <group position={[w.x, 0, w.z]} rotation={[0, w.rot, 0]} onClick={visit} onPointerOver={ptr(true)} onPointerOut={ptr(false)}>
      <Avatar avatar={n.look} getAnim={() => anim} name={n.name} showName />
      <Html position={[0, 2.05, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[3, 0]}><div className="fest-tag small">{soc ? '💬' : w.icon}</div></Html>
    </group>
  );
}

export default function Village() {
  const buildings = useGame((s) => s.buildings);
  const free = (id) => propFree(id, buildings);
  useFrame(() => {
    const n = Math.min(1, L.night * 1.3 + (L.weather === 'rain' || L.weather === 'storm' ? 0.4 : 0));
    winMat.emissiveIntensity = n * 1.6;
    lampMat.emissiveIntensity = 0.25 + n * 2.2;
  });
  const visit = (n) => (e) => { if (!can()) return; e.stopPropagation(); const { x, z } = n.house; goAndDo(x + 1.5, z + 3.6, () => useGame.getState().set({ panel: 'explore', exploreTab: 'neighbors', neighborFocus: n.id }), 2.4); };
  return (
    <group>
      {[[PLAZA.x, PLAZA.z, 2.4, 2.4], [41.2, 19.6, 0.6, 1.3], [45.8, 18.6, 0.6, 1.3], [40.6, 20.6, 2.0, 1.2], [44.9, 20.2, 1.0, 0.7], [46.5, 22.55, 0.5, 0.5], [42.2, 11.4, 4.4, 2.7], [39.0, 17.6, 2.4, 1.4], [44.6, 11.6, 2.0, 0.5], [49.2, 10.5, 1.3, 1.3], [39.8, 10.2, 1.1, 1.1], [48.8, 17.6, 1.0, 1.0], ...VILLAGE_LIGHTS.map((q) => [q.x, q.z, 0.5, 0.5]), ...NEIGHBORS.map((n) => [n.house.x + 1.5, n.house.z + 1.5, 4.2, 4.2])].map(([x, z, w, d], i) => <group key={'sh' + i} position={[x, 0, z]}><ContactShadow w={w} d={d} k={1.25} y={0.02} /></group>)}
      {free('cobbles') && <Cobbles />}{free('fountain') && <Fountain />}
      {VILLAGE_LIGHTS.map((q) => <Lantern key={q.x + '' + q.z} x={q.x} z={q.z} />)}
      {free('benchA') && <Bench x={41.2} z={19.6} r={Math.PI / 2} />}{free('benchB') && <Bench x={45.8} z={18.6} r={-Math.PI / 2} />}
      {free('stall') && <Stall x={40.6} z={20.6} r={0.35} />}
      <Garden /><Laundry /><Pier /><PabloLine /><DryRack /><Easel /><Cat /><Arch />
      <Tree x={49.2} z={10.5} s={1.2} /><Tree x={39.8} z={10.2} s={1} c="#7ab865" /><Tree x={48.8} z={17.6} s={0.9} c="#f4a6c0" />
      {NEIGHBORS.map((n) => <House key={n.id} n={n} visit={visit(n)} />)}
      {NEIGHBORS.map((n) => <Neighbor key={n.id} n={n} />)}
    </group>
  );
}
