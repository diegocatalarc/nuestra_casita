import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { L } from '../game/lighting';
import { rbGeo } from './rb';
import { useGame } from '../store/gameStore';
import ContactShadow from './shadow';

const Bx = ({ p, s, c, r }) => <mesh position={p} rotation={r} geometry={rbGeo(s[0], s[1], s[2])} castShadow receiveShadow><meshStandardMaterial vertexColors color={c} roughness={0.95} /></mesh>;
const Cyl = ({ p, a, h, c, r }) => <mesh position={p} rotation={r} castShadow receiveShadow><cylinderGeometry args={[a[0], a[1] ?? a[0], h, 12]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>;

export const LANTERNS = [[14.2, 22.35], [20.2, 22.35], [26.2, 22.35]];
/** Luces de las farolas (las toma el LightPool). */
export const PROP_LIGHTS = LANTERNS.map(([x, z]) => ({ x, y: 1.45, z, c: '#ffcf8a', base: 0.8, dayMul: 0 }));

function LanternPost({ x, z }) {
  const m = useRef(), halo = useRef();
  useFrame(() => {
    const n = L.night * 1.3 + (L.weather === 'rain' || L.weather === 'storm' ? 0.4 : 0);
    if (m.current) m.current.emissiveIntensity = 0.25 + Math.min(1, n) * 2.4;
    if (halo.current) halo.current.material.opacity = Math.min(1, n) * 0.2;
  });
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.05, 0]} a={[0.13, 0.16]} h={0.1} c="#5a4a52" />
      <Cyl p={[0, 0.78, 0]} a={[0.03, 0.045]} h={1.5} c="#4a3e48" />
      <Bx p={[0, 1.38, 0]} s={[0.3, 0.04, 0.3]} c="#4a3e48" />
      <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[0.22, 0.26, 0.22]} /><meshStandardMaterial ref={m} color="#fff1c8" emissive="#ffb84a" emissiveIntensity={0.3} /></mesh>
      <mesh position={[0, 1.7, 0]} castShadow><coneGeometry args={[0.2, 0.16, 4]} /><meshStandardMaterial color="#4a3e48" /></mesh>
      <mesh position={[0, 1.8, 0]}><sphereGeometry args={[0.035, 8, 6]} /><meshStandardMaterial color="#c9a46a" /></mesh>
      <mesh ref={halo} position={[0, 1.5, 0]}><sphereGeometry args={[0.42, 14, 10]} /><meshBasicMaterial color="#ffcf8a" transparent opacity={0} depthWrite={false} toneMapped={false} /></mesh>
    </group>
  );
}

function Mailbox({ x, z }) {
  const unread = useGame((s) => Object.values(s.mailbox).filter((m) => m.to === s.user?.uid && !m.readAt).length);
  const flag = useRef();
  useFrame((st) => { if (flag.current) { flag.current.rotation.z += ((unread ? 0 : -1.4) - flag.current.rotation.z) * 0.15; flag.current.position.y = 1.08 + (unread ? Math.sin(st.clock.elapsedTime * 4) * 0.01 : 0); } });
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); useGame.getState().set({ panel: 'mailbox' }); }}
      onPointerOver={() => { if (useGame.getState().tool === 'interact') document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <Bx p={[0, 0.45, 0]} s={[0.08, 0.9, 0.08]} c="#8a5e3c" />
      <mesh position={[0, 0.98, 0]} castShadow><boxGeometry args={[0.34, 0.24, 0.26]} /><meshStandardMaterial color="#e86a5a" roughness={0.8} /></mesh>
      <mesh position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.13, 0.13, 0.34, 10, 1, false, 0, Math.PI]} /><meshStandardMaterial color="#e86a5a" roughness={0.8} /></mesh>
      <group ref={flag} position={[0.17, 1.08, 0]}><Bx p={[0, 0.1, 0]} s={[0.02, 0.22, 0.06]} c="#f2d04a" /></group>
      {unread > 0 && <mesh position={[0, 1.3, 0]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#ff5a6a" toneMapped={false} /></mesh>}
      <mesh position={[0, 0.98, 0.14]}><planeGeometry args={[0.18, 0.04]} /><meshBasicMaterial color="#fff" /></mesh>
    </group>
  );
}

/** Tablón de pedidos: toca para abrirlo. */
function NoticeBoard({ x, z }) {
  const done = useGame((s) => Object.keys(s.couple?.orders?.[new Date(s.now).toISOString().slice(0, 10)] || {}).length);
  return (
    <group position={[x, 0, z]} rotation={[0, -0.5, 0]}
      onClick={(e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); useGame.getState().set({ panel: 'orders' }); }}
      onPointerOver={() => { if (useGame.getState().tool === 'interact') document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}>
      {[-0.5, 0.5].map((px) => <Bx key={px} p={[px, 0.75, 0]} s={[0.1, 1.5, 0.1]} c="#8a5e3c" />)}
      <Bx p={[0, 1.2, 0]} s={[1.3, 0.8, 0.08]} c="#d9b384" />
      <Bx p={[0, 1.66, 0]} s={[1.5, 0.1, 0.16]} c="#8a5e3c" />
      {[[-0.4, 1.35, '#fff6d8'], [0.05, 1.28, '#ffd9e0'], [0.42, 1.38, '#d8ecff'], [-0.2, 1.02, '#e7f6d4'], [0.3, 1.0, '#fff6d8']].map(([px, py, c], i) => (
        <mesh key={i} position={[px, py, 0.06]} rotation={[0, 0, (i - 2) * 0.08]}><boxGeometry args={[0.28, 0.3, 0.01]} /><meshStandardMaterial color={c} /></mesh>
      ))}
      <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.09, 8, 6]} /><meshBasicMaterial color={done >= 4 ? '#7fd18a' : '#ffb84a'} toneMapped={false} /></mesh>
    </group>
  );
}

function Signpost({ x, z }) {
  return (
    <group position={[x, 0, z]} rotation={[0, 0.5, 0]}>
      <Bx p={[0, 0.65, 0]} s={[0.1, 1.3, 0.1]} c="#8a5e3c" />
      <Bx p={[0.18, 1.05, 0]} s={[0.7, 0.24, 0.05]} c="#d9b384" r={[0, 0, 0.05]} />
      <Bx p={[0.55, 1.05, 0]} s={[0.12, 0.2, 0.05]} c="#d9b384" r={[0, 0, 0.8]} />
      <Bx p={[-0.15, 0.78, 0]} s={[0.6, 0.22, 0.05]} c="#e8c987" r={[0, 0, -0.04]} />
      {[0.1, 0.22, 0.34].map((o) => <Bx key={o} p={[o, 1.05, 0.03]} s={[0.07, 0.03, 0.01]} c="#6b4630" />)}
    </group>
  );
}

function Barrel({ x, z, s = 1 }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow><cylinderGeometry args={[0.24, 0.24, 0.6, 14]} /><meshStandardMaterial color="#a8764c" roughness={0.9} /></mesh>
      <mesh position={[0, 0.3, 0]} scale={[1.06, 1, 1.06]}><cylinderGeometry args={[0.24, 0.24, 0.5, 14]} /><meshStandardMaterial color="#b98254" roughness={0.9} /></mesh>
      {[0.12, 0.48].map((y) => <mesh key={y} position={[0, y, 0]}><torusGeometry args={[0.245, 0.018, 6, 16]} /><meshStandardMaterial color="#4a3e48" /></mesh>)}
    </group>
  );
}
function Crate({ x, z, r = 0, y = 0 }) {
  return (
    <group position={[x, y, z]} rotation={[0, r, 0]}>
      <Bx p={[0, 0.2, 0]} s={[0.4, 0.4, 0.4]} c="#c9a070" />
      {[-0.19, 0.19].map((o) => <Bx key={o} p={[o, 0.2, 0]} s={[0.04, 0.42, 0.42]} c="#8a5e3c" />)}
      {[-0.19, 0.19].map((o) => <Bx key={'z' + o} p={[0, 0.2, o]} s={[0.42, 0.42, 0.04]} c="#8a5e3c" />)}
      <Bx p={[0, 0.41, 0]} s={[0.36, 0.03, 0.36]} c="#b98254" />
    </group>
  );
}
function Hay({ x, z, r = 0 }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow><cylinderGeometry args={[0.28, 0.28, 0.6, 14]} /><meshStandardMaterial color="#e8c46a" roughness={1} /></mesh>
      {[-0.15, 0.15].map((o) => <mesh key={o} position={[o, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.285, 0.012, 5, 16]} /><meshStandardMaterial color="#b98254" /></mesh>)}
      {[-0.3, 0.3].map((o) => <mesh key={'e' + o} position={[o, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}><circleGeometry args={[0.28, 14]} /><meshStandardMaterial color="#f0d484" side={2} /></mesh>)}
    </group>
  );
}

function Scarecrow({ x, z }) {
  const arms = useRef();
  useFrame((s) => { if (arms.current) arms.current.rotation.z = Math.sin(s.clock.elapsedTime * 1.2) * 0.04; });
  return (
    <group position={[x, 0, z]} rotation={[0, -0.6, 0]}>
      <Bx p={[0, 0.7, 0]} s={[0.07, 1.4, 0.07]} c="#8a5e3c" />
      <group ref={arms} position={[0, 1.05, 0]}>
        <Bx p={[0, 0, 0]} s={[1.0, 0.07, 0.07]} c="#8a5e3c" />
        <Bx p={[0, -0.12, 0]} s={[0.46, 0.5, 0.2]} c="#6a8fc0" />
        <Bx p={[-0.35, -0.12, 0]} s={[0.3, 0.14, 0.14]} c="#6a8fc0" />
        <Bx p={[0.35, -0.12, 0]} s={[0.3, 0.14, 0.14]} c="#6a8fc0" />
        {[-0.46, 0.46].map((o) => <mesh key={o} position={[o, -0.04, 0]}><coneGeometry args={[0.05, 0.14, 5]} /><meshStandardMaterial color="#e8c46a" /></mesh>)}
      </group>
      <mesh position={[0, 1.42, 0]} castShadow><sphereGeometry args={[0.17, 14, 10]} /><meshStandardMaterial color="#e8c46a" roughness={1} /></mesh>
      {[-0.06, 0.06].map((o) => <mesh key={o} position={[o, 1.45, 0.15]}><sphereGeometry args={[0.02, 6, 4]} /><meshBasicMaterial color="#2a1f24" /></mesh>)}
      <mesh position={[0, 1.38, 0.16]} rotation={[0, 0, 0]}><torusGeometry args={[0.05, 0.01, 5, 10, Math.PI]} /><meshBasicMaterial color="#6b4630" /></mesh>
      <Cyl p={[0, 1.6, 0]} a={[0.3, 0.3]} h={0.03} c="#b98254" />
      <Cyl p={[0, 1.7, 0]} a={[0.15, 0.17]} h={0.2} c="#a8764c" />
      <Cyl p={[0, 1.63, 0]} a={[0.175, 0.175]} h={0.05} c="#d9695f" />
    </group>
  );
}

function Bench({ x, z, r = 0 }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <Bx p={[0, 0.38, 0]} s={[1.3, 0.07, 0.4]} c="#c9a070" />
      <Bx p={[0, 0.72, -0.18]} s={[1.3, 0.3, 0.06]} c="#c9a070" />
      {[-0.55, 0.55].map((o) => <group key={o}><Bx p={[o, 0.19, 0]} s={[0.07, 0.38, 0.36]} c="#8a5e3c" /><Bx p={[o, 0.55, -0.18]} s={[0.07, 0.4, 0.06]} c="#8a5e3c" /></group>)}
      <Bx p={[0.3, 0.45, 0]} s={[0.3, 0.08, 0.26]} c="#f4a6c0" r={[0, 0.2, 0]} />
    </group>
  );
}

function Planter({ x, z, c = '#d9825b' }) {
  return (
    <group position={[x, 0, z]}>
      <Bx p={[0, 0.14, 0]} s={[0.7, 0.28, 0.24]} c={c} />
      <Bx p={[0, 0.29, 0]} s={[0.62, 0.04, 0.18]} c="#5a3b27" />
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[-0.27 + i * 0.09, 0.32, 0]}>
          <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#5fae55" /></mesh>
          <mesh position={[0, 0.2, 0]}><icosahedronGeometry args={[0.05, 0]} /><meshStandardMaterial color={['#f48aa8', '#ffe27a', '#ffffff', '#c9a6f0'][i % 4]} flatShading /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Objetos de ambientación del terreno inicial (no bloquean el paso). */
export default function Props() {
  return (
    <group>
      {LANTERNS.map(([x, z]) => <LanternPost key={x} x={x} z={z} />)}
      <Mailbox x={19.9} z={21.4} />
      <Signpost x={22.3} z={22.3} />
      <NoticeBoard x={24.4} z={21.0} />
      <Barrel x={10.8} z={22.2} /><Barrel x={11.5} z={22.9} s={0.85} />
      <Crate x={10.7} z={23.7} r={0.3} /><Crate x={10.9} z={23.7} r={0.6} y={0.4} />
      <Hay x={23.0} z={31.2} r={0.4} /><Hay x={23.7} z={31.9} r={-0.3} />
      <Scarecrow x={22.9} z={25.1} />
      <Bench x={12.6} z={21.3} r={0} />
      <Planter x={15.3} z={21.5} /><Planter x={18.7} z={21.5} c="#c9a070" />
      {[...LANTERNS.map(([x, z]) => [x, z, 0.55, 0.55]), [19.9, 21.4, 0.6, 0.5], [22.3, 22.3, 0.9, 0.5], [10.8, 22.2, 0.9, 0.9], [11.5, 22.9, 0.75, 0.75], [10.7, 23.7, 0.8, 0.8], [10.9, 23.7, 0.8, 0.8], [23.0, 31.2, 1.5, 1.1], [23.7, 31.9, 1.3, 1.0], [22.9, 25.1, 0.7, 0.7], [12.6, 21.3, 1.5, 0.7], [15.3, 21.5, 1.1, 0.7], [18.7, 21.5, 1.1, 0.7], [24.4, 21.0, 1.5, 0.5]].map(([x, z, w, d], i) => <group key={i} position={[x, 0, z]}><ContactShadow w={w} d={d} k={1.5} /></group>)}
    </group>
  );
}
