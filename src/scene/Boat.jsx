import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame, partnerUid } from '../store/gameStore';
import { me, others } from '../game/runtime';
import { boardBoat } from '../game/actions';
import { geo } from './toon';

export const WATER_Y = -0.26;
const wood = (c, extra = {}) => <meshStandardMaterial color={c} roughness={0.85} flatShading {...extra} />;

/** Casco del bote, centrado en el origen y apuntando a +Z. getRow() → true si se está remando. */
export function BoatBody({ getRow }) {
  const g = useRef(), oL = useRef(), oR = useRef(), ph = useRef(Math.random() * 6);
  useFrame((s) => {
    const t = s.clock.elapsedTime + ph.current;
    if (g.current) {
      g.current.position.y = WATER_Y + 0.27 + Math.sin(t * 1.7) * 0.022;
      g.current.rotation.z = Math.sin(t * 1.3) * 0.025;
      g.current.rotation.x = Math.sin(t * 1.1) * 0.015;
    }
    const sw = getRow && getRow() ? Math.sin(t * 6) * 0.55 : Math.sin(t * 1.5) * 0.06;
    if (oL.current) oL.current.rotation.y = -sw;
    if (oR.current) oR.current.rotation.y = sw;
  });
  const oar = (side, ref) => (
    <group ref={ref} position={[side * 0.6, 0.06, 0.4]}>
      <group rotation={[0, 0, -side * (Math.PI / 2 - 0.25)]} position={[side * 0.3, 0.1, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.025, 0.025, 1.5, 6]} />{wood('#8a5e3c')}</mesh>
        <mesh position={[0, 0.72, 0]} castShadow><boxGeometry args={[0.07, 0.34, 0.2]} />{wood('#d9b384')}</mesh>
      </group>
    </group>
  );
  return (
    <group ref={g}>
      <mesh geometry={geo('Sphere', 1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)} scale={[0.62, 0.5, 1.4]} castShadow receiveShadow>
        <meshStandardMaterial color="#b9814f" roughness={0.9} flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.5, 1.2, 1]}><circleGeometry args={[1, 18]} />{wood('#e0c9a0')}</mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.62, 1.4, 1]} castShadow><torusGeometry args={[1, 0.045, 6, 28]} />{wood('#8a5e3c')}</mesh>
      <mesh position={[0, 0.0, 1.5]} rotation={[Math.PI / 2, 0, 0]} castShadow><coneGeometry args={[0.2, 0.5, 6]} />{wood('#b9814f')}</mesh>
      <mesh position={[0, 0.05, 1.35]} castShadow><boxGeometry args={[0.5, 0.05, 0.12]} />{wood('#e86a5a')}</mesh>
      {[0.4, -0.5].map((z) => <mesh key={z} position={[0, -0.1, z]} castShadow><boxGeometry args={[1.0, 0.06, 0.3]} />{wood('#d9b384')}</mesh>)}
      <mesh position={[0, 0.18, -1.2]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />{wood('#6b4630')}</mesh>
      <mesh position={[0, 0.5, -1.2]}><sphereGeometry args={[0.09, 8, 6]} /><meshStandardMaterial color="#fff1c8" emissive="#ffb84a" emissiveIntensity={0.9} /></mesh>
      {oar(-1, oL)}{oar(1, oR)}
    </group>
  );
}

/** Bote amarrado en el río (se oculta mientras alguien navega con él). */
export function MooredBoat() {
  const boat = useGame((s) => s.couple?.boat);
  const g = useRef(), tag = useRef();
  useFrame(() => {
    if (!g.current) return;
    const used = (me.boat && !me.passenger) || Object.values(others).some((o) => o.online && o.boat === 1);
    g.current.visible = !used;
    if (tag.current) tag.current.style.display = used ? 'none' : '';
  });
  if (!boat) return null;
  const can = () => { const tl = useGame.getState().tool; return tl === 'interact' || tl === 'fish'; };
  return (
    <group
      ref={g} position={[boat.x, 0, boat.z]} rotation={[0, boat.rot || 0, 0]}
      onClick={(e) => { if (!can()) return; e.stopPropagation(); boardBoat(); }}
      onPointerOver={() => { if (can()) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <BoatBody />
      <Html position={[0, 1.15, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="boat-tag" ref={tag}>⛵</div></Html>
    </group>
  );
}

/** Hilo y flotador de quien pesca (tú y tu pareja). */
function Cast({ get }) {
  const grp = useRef(), bob = useRef(), ring = useRef();
  const geom = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)); return g; }, []);
  const line = useMemo(() => new THREE.Line(geom, new THREE.LineBasicMaterial({ color: '#f6efe6' })), [geom]);
  useFrame((s) => {
    const c = get();
    if (grp.current) grp.current.visible = !!c;
    if (!c) return;
    const t = s.clock.elapsedTime;
    const by = WATER_Y + 0.05 + Math.sin(t * 3) * 0.012 - (c.bite ? 0.08 + Math.abs(Math.sin(t * 24)) * 0.07 : 0);
    bob.current.position.set(c.x, by, c.z);
    const k = (t * (c.bite ? 2.6 : 0.8)) % 1;
    ring.current.position.set(c.x, WATER_Y + 0.03, c.z);
    ring.current.scale.setScalar(0.15 + k * (c.bite ? 0.9 : 0.5));
    ring.current.material.opacity = (1 - k) * 0.7;
    const p = geom.attributes.position;
    p.setXYZ(0, c.tx, c.ty, c.tz);
    p.setXYZ(1, (c.tx + c.x) / 2, Math.min(c.ty, by) - 0.15, (c.tz + c.z) / 2);
    p.setXYZ(2, c.x, by + 0.04, c.z);
    p.needsUpdate = true; geom.computeBoundingSphere();
  });
  return (
    <group ref={grp} visible={false}>
      <primitive object={line} />
      <group ref={bob}>
        <mesh><sphereGeometry args={[0.07, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshBasicMaterial color="#e0524a" toneMapped={false} /></mesh>
        <mesh rotation={[Math.PI, 0, 0]}><sphereGeometry args={[0.07, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
      </group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.8, 1, 24]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} /></mesh>
    </group>
  );
}

/** Punta de la caña en el mundo, según posición y orientación. */
const tip = (x, z, rot, seat) => {
  const f = 1.5 + seat;
  return { tx: x + Math.sin(rot) * f + Math.cos(rot) * 0.25, ty: 1.35, tz: z + Math.cos(rot) * f - Math.sin(rot) * 0.25 };
};

export function FishingGear() {
  const pu = useGame(partnerUid);
  const mine = () => {
    const f = me.fish;
    if (!f) return null;
    return { x: f.x, z: f.z, bite: f.state === 'bite', ...tip(me.x, me.z, me.rot, me.boat && !me.passenger ? 0.4 : 0) };
  };
  const theirs = () => {
    const o = pu && others[pu];
    if (!o || !o.online || o.fx == null) return null;
    return { x: o.fx, z: o.fz, bite: false, ...tip(o.x, o.z, o.rot, o.boat === 1 ? 0.4 : 0) };
  };
  return (<><Cast get={mine} /><Cast get={theirs} /></>);
}

/** Aviso ❗ sobre el flotador cuando pica. */
export function BiteMark() {
  const st = useGame((s) => s.fishState);
  if (st !== 'bite' || !me.fish) return null;
  return <Html position={[me.fish.x, 1.1, me.fish.z]} center style={{ pointerEvents: 'none' }} zIndexRange={[6, 0]}><div className="bite-mark">❗</div></Html>;
}
