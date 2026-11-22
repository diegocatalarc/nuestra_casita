import { Suspense, useMemo, useState } from 'react';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { memorySlots } from '../game/logic';
import { t } from '../i18n';

const Bx = ({ p, s, c, r }) => (
  <mesh position={p} scale={s} rotation={r} castShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={c} roughness={0.9} flatShading /></mesh>
);

function PhotoPlane({ url }) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ar = tex.image ? tex.image.width / tex.image.height : 1;
  const w = ar >= 1 ? 0.4 : 0.4 * ar, h = ar >= 1 ? 0.4 / ar : 0.4;
  return <mesh position={[0, 0.3, 0.036]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>;
}

function Shape({ m }) {
  switch (m.kind) {
    case 'photo': return (
      <group>
        <Bx p={[0, 0.3, 0]} s={[0.52, 0.52, 0.05]} c="#b98254" />
        <Bx p={[0, 0.12, -0.08]} s={[0.04, 0.3, 0.04]} c="#8a5e3c" r={[0.5, 0, 0]} />
        {m.image && <Suspense fallback={null}><PhotoPlane url={m.image} /></Suspense>}
      </group>
    );
    case 'message': return (
      <group position={[0, 0.03, 0]}>
        <Bx p={[0, 0, 0]} s={[0.36, 0.05, 0.25]} c="#fffaf0" />
        <mesh position={[0, 0.03, -0.0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.05, 3]} /><meshBasicMaterial color="#e8456a" /></mesh>
        <Bx p={[0, 0.026, -0.06]} s={[0.36, 0.01, 0.12]} c="#f3e6d2" />
      </group>
    );
    case 'date': return (
      <group>
        <Bx p={[0, 0.14, 0]} s={[0.3, 0.28, 0.08]} c="#fffaf0" />
        <Bx p={[0, 0.25, 0.01]} s={[0.3, 0.06, 0.09]} c="#e8456a" />
        {[-0.08, 0, 0.08].map((x) => [0.15, 0.08].map((y) => <mesh key={x + ':' + y} position={[x, y, 0.045]}><circleGeometry args={[0.018, 6]} /><meshBasicMaterial color="#8a7a70" /></mesh>))}
      </group>
    );
    case 'audio': return (
      <group position={[0, 0.04, 0]}>
        <Bx p={[0, 0, 0]} s={[0.36, 0.07, 0.24]} c="#3d3a52" />
        {[-0.08, 0.08].map((x) => <mesh key={x} position={[x, 0.04, 0]}><cylinderGeometry args={[0.045, 0.045, 0.01, 10]} /><meshStandardMaterial color="#f2e6c9" /></mesh>)}
        <Bx p={[0, 0.036, 0.08]} s={[0.24, 0.005, 0.05]} c="#e8c36a" />
      </group>
    );
    default: return (
      <group rotation={[0, 0.2, 0]}>
        <Bx p={[0, 0.015, 0]} s={[0.24, 0.03, 0.24]} c="#ffe27a" />
        <Bx p={[0, 0.032, -0.09]} s={[0.24, 0.005, 0.05]} c="#f2c94a" />
      </group>
    );
  }
}

function MemoryObject({ m, slot }) {
  const [hov, setHov] = useState(false);
  return (
    <group
      position={[slot.x, slot.y, slot.z]} rotation={[0, slot.rot, 0]}
      onClick={(e) => { e.stopPropagation(); useGame.getState().set({ viewMemory: m.id }); }}
      onPointerOver={(e) => { e.stopPropagation(); setHov(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHov(false); document.body.style.cursor = ''; }}
    >
      <Shape m={m} />
      {hov && <Html position={[0, 0.75, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="bubble wide">{m.title || t("Recuerdo")}</div></Html>}
    </group>
  );
}

export default function Memories() {
  const memories = useGame((s) => s.memories);
  const buildings = useGame((s) => s.buildings);
  const list = useMemo(() => Object.values(memories).sort((a, b) => (a.at || 0) - (b.at || 0)), [memories]);
  const slots = useMemo(() => memorySlots(buildings, list.length), [buildings, list.length]);
  return <group>{list.map((m, i) => <MemoryObject key={m.id} m={m} slot={slots[i]} />)}</group>;
}
