import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { DIG } from '../game/constants';
import { ISLAND, CAVE } from '../game/worldGen';
import { digSpots, dayUTC, chestReady } from '../game/logic';
import { digAt, openChest, goAndDo, zoneOwned } from '../game/actions';
import { rbGeo } from './rb';
import Village from './Village';
import { Reveal } from './Discover';

const Bx = ({ p, s, c, r }) => <mesh position={p} rotation={r} geometry={rbGeo(s[0], s[1], s[2])} castShadow receiveShadow><meshStandardMaterial vertexColors color={c} roughness={0.9} /></mesh>;
const can = () => useGame.getState().tool === 'interact';
const ptr = (on) => () => { if (can()) document.body.style.cursor = on ? 'pointer' : ''; };

/** Destellos ✨ del día en la arena: pulsa uno para excavar. */
function DigSpots() {
  const world = useGame((s) => s.world);
  const seed = useGame((s) => s.couple?.seed);
  const now = useGame((s) => s.now);
  const digs = useGame((s) => s.couple?.digs);
  const day = dayUTC(now);
  const done = digs?.[day] || {};
  return (
    <group>
      {digSpots(world, seed, day).filter((sp) => !done[sp.i]).map((sp) => <Reveal key={day + sp.i} pts={[[sp.x, sp.z]]}><Spot sp={sp} /></Reveal>)}
    </group>
  );
}
function Spot({ sp }) {
  const g = useRef();
  useFrame((s) => { if (g.current) { g.current.position.y = 0.12 + Math.sin(s.clock.elapsedTime * 3 + sp.i) * 0.05; g.current.rotation.y = s.clock.elapsedTime * 1.5; } });
  return (
    <group position={[sp.x, 0, sp.z]} onClick={(e) => { if (!can()) return; e.stopPropagation(); digAt(sp); }} onPointerOver={ptr(true)} onPointerOut={ptr(false)}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.32, 10]} /><meshStandardMaterial color="#c9a96a" /></mesh>
      <mesh ref={g}><octahedronGeometry args={[0.13, 0]} /><meshBasicMaterial color="#fff2a8" toneMapped={false} /></mesh>
      <Html position={[0, 0.7, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[3, 0]}><div className="gift-tag">✨</div></Html>
    </group>
  );
}

/** Isla del tesoro: palmeras y cofre semanal. */
function Island() {
  const ready = useGame((s) => chestReady(s.couple, s.now));
  const lid = useRef();
  useFrame((s) => { if (lid.current) lid.current.rotation.x = ready ? -0.6 + Math.sin(s.clock.elapsedTime * 2) * 0.05 : 0; });
  const palm = (x, z, h, r) => (
    <group key={x + '' + z} position={[x, 0, z]} rotation={[0, r, 0]}>
      <mesh position={[0.1, h / 2, 0]} rotation={[0, 0, -0.15]} castShadow><cylinderGeometry args={[0.07, 0.11, h, 6]} /><meshStandardMaterial color="#9a7448" /></mesh>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[0.2 + Math.cos(i * 1.26) * 0.45, h + 0.05, Math.sin(i * 1.26) * 0.45]} rotation={[Math.sin(i * 1.26) * 0.7, 0, -Math.cos(i * 1.26) * 0.7]} castShadow><boxGeometry args={[0.9, 0.04, 0.22]} /><meshStandardMaterial color="#4fae5a" /></mesh>)}
    </group>
  );
  return (
    <group position={[ISLAND.x, 0, ISLAND.z]}>
      {palm(-1.1, -0.6, 1.5, 0.3)}{palm(1.0, 0.8, 1.2, 2)}{palm(-0.4, 1.2, 1.0, 4)}
      <group onClick={(e) => { if (!can()) return; e.stopPropagation(); openChest(); }} onPointerOver={ptr(true)} onPointerOut={ptr(false)}>
        <Bx p={[0, 0.2, 0]} s={[0.7, 0.4, 0.45]} c="#8a5e3c" />
        <Bx p={[0, 0.42, 0]} s={[0.74, 0.04, 0.5]} c="#f2c94c" />
        <group ref={lid} position={[0, 0.4, -0.22]}><Bx p={[0, 0.07, 0.22]} s={[0.72, 0.14, 0.46]} c="#a8764c" /></group>
        {ready && <mesh position={[0, 0.6, 0]}><sphereGeometry args={[0.45, 10, 8]} /><meshBasicMaterial color="#ffd23a" transparent opacity={0.22} depthWrite={false} toneMapped={false} /></mesh>}
        <Html position={[0, 1.1, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="fest-tag small">{ready ? '🏴‍☠️' : '💤'}</div></Html>
      </group>
    </group>
  );
}

/** Entrada de la mina en las Colinas del Sureste. */
function Cave() {
  return (
    <group position={[CAVE.x, 0, CAVE.z]} onClick={(e) => { if (!can()) return; e.stopPropagation(); goAndDo(CAVE.x, CAVE.z + 1.2, () => useGame.getState().set({ panel: 'mine' }), 2.4); }} onPointerOver={ptr(true)} onPointerOut={ptr(false)}>
      <Bx p={[0, 0.9, 0]} s={[2.6, 1.8, 1.8]} c="#8c8a9c" />
      <Bx p={[-1.2, 0.5, 0.3]} s={[0.9, 1.0, 1.2]} c="#a8a29a" r={[0, 0.3, 0]} />
      <Bx p={[1.2, 0.6, 0.2]} s={[0.9, 1.2, 1.2]} c="#a8a29a" r={[0, -0.3, 0]} />
      <Bx p={[0, 0.65, 0.92]} s={[1.1, 1.3, 0.1]} c="#1f1b26" />
      <Bx p={[-0.65, 0.7, 0.95]} s={[0.12, 1.4, 0.14]} c="#8a5e3c" /><Bx p={[0.65, 0.7, 0.95]} s={[0.12, 1.4, 0.14]} c="#8a5e3c" /><Bx p={[0, 1.42, 0.95]} s={[1.5, 0.14, 0.14]} c="#8a5e3c" />
      <mesh position={[0.9, 1.2, 1.0]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#fff1c8" emissive="#ffb84a" emissiveIntensity={1} /></mesh>
      <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="fest-tag small">⛏️</div></Html>
    </group>
  );
}

export default function Explore() {
  const couple = useGame((s) => s.couple);
  return (
    <group>
      <DigSpots />
      <Reveal pts={[[40, 12], [44, 17], [47, 21]]}><Village /></Reveal>
      {zoneOwned(couple, 'south') && <Reveal pts={[[35, 70]]}><Island /></Reveal>}
      {zoneOwned(couple, 'southeast') && <Reveal pts={[[62, 62]]}><Cave /></Reveal>}
    </group>
  );
}
