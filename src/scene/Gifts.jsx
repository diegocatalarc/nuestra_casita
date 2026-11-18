import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { me } from '../game/runtime';
import { GIFT, DATES } from '../game/constants';

/** Tus regalos escondidos (translúcidos) y destellos cuando pasas cerca de los de tu pareja. */
function Spot({ g, mine }) {
  const ref = useRef(), tag = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    const d = Math.hypot(me.x - g.x, me.z - g.z), t = s.clock.elapsedTime;
    const show = mine || d < GIFT.sparkleDist;
    ref.current.visible = show;
    if (show) { ref.current.position.y = 0.25 + Math.sin(t * 3 + g.x) * 0.06; ref.current.rotation.y = t; }
    if (tag.current) tag.current.style.opacity = show ? (mine ? 0.8 : Math.max(0.2, 1 - d / GIFT.sparkleDist)) : 0;
  });
  return (
    <group position={[g.x, 0, g.z]}>
      <group ref={ref} visible={false}>
        {mine ? (<>
          <mesh castShadow><boxGeometry args={[0.36, 0.3, 0.36]} /><meshStandardMaterial color="#ff8aa8" transparent opacity={0.65} /></mesh>
          <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.4, 0.06, 0.08]} /><meshStandardMaterial color="#ffd23a" /></mesh>
        </>) : (<mesh><octahedronGeometry args={[0.12, 0]} /><meshBasicMaterial color="#fff2a8" toneMapped={false} /></mesh>)}
      </group>
      <Html position={[0, 0.9, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[3, 0]}><div ref={tag} className="gift-tag" style={{ opacity: 0 }}>{mine ? '🎁' : '✨'}</div></Html>
    </group>
  );
}

/** Manta de picnic / estrellas mientras dura la cita */
function DateSpot({ d }) {
  if (!d.spot || !DATES[d.kind].spot) return null;
  const night = d.kind === 'stars';
  return (
    <group position={[d.spot.x, 0.04, d.spot.z]} rotation={[0, 0.4, 0]}>
      <mesh receiveShadow><boxGeometry args={[1.8, 0.04, 1.4]} /><meshStandardMaterial color={night ? '#5b6bb0' : '#e86a6a'} /></mesh>
      {[-0.6, 0, 0.6].map((x) => [-0.45, 0.45].map((z, j) => <mesh key={x + '' + j} position={[x, 0.025, z]}><boxGeometry args={[0.3, 0.02, 0.3]} /><meshStandardMaterial color="#fffaf0" /></mesh>))}
      <mesh position={[0.5, 0.15, 0.1]} castShadow><boxGeometry args={[0.4, 0.24, 0.3]} /><meshStandardMaterial color="#b9814f" /></mesh>
      <Html position={[0, 1.1, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="fest-tag small">{DATES[d.kind].emoji}</div></Html>
    </group>
  );
}

export default function Gifts() {
  const gifts = useGame((s) => s.gifts);
  const uid = useGame((s) => s.user?.uid);
  const date = useGame((s) => s.couple?.date);
  return (
    <group>
      {Object.values(gifts).filter((g) => !g.foundBy).map((g) => <Spot key={g.id} g={g} mine={g.from === uid} />)}
      {date && date.state !== undefined && <DateSpot d={date} />}
    </group>
  );
}
