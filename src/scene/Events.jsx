import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { eventsFor, meteorActive } from '../game/logic';
import { VISITOR_HOURS } from '../game/constants';
import { rbGeo } from './rb';
import Avatar from './Avatar';

const Bx = ({ p, s, c, r }) => <mesh position={p} rotation={r} geometry={rbGeo(s[0], s[1], s[2])} castShadow receiveShadow><meshStandardMaterial vertexColors color={c} roughness={0.9} /></mesh>;
const openEvents = (e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); useGame.getState().set({ panel: 'events' }); };
const hover = (on) => () => { if (useGame.getState().tool === 'interact') document.body.style.cursor = on ? 'pointer' : ''; };

/** Puesto del festival: aparece en la plaza los días de fiesta. */
function FestivalStand({ fest }) {
  const g = useRef();
  useFrame((s) => { if (g.current) g.current.position.y = 2.6 + Math.sin(s.clock.elapsedTime * 2) * 0.08; });
  const flags = Array.from({ length: 9 }, (_, i) => i);
  return (
    <group position={[24.2, 0, 17.2]} rotation={[0, -0.4, 0]} onClick={openEvents} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      {[[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]].map(([x, z], i) => <Bx key={i} p={[x, 0.9, z]} s={[0.12, 1.8, 0.12]} c="#8a5e3c" />)}
      <Bx p={[0, 0.5, 0]} s={[2.4, 0.6, 1.6]} c="#d9b384" />
      {[0, 1, 2, 3, 4, 5].map((i) => <Bx key={i} p={[-1.0 + i * 0.4, 1.95, 0]} s={[0.4, 0.1, 1.9]} c={i % 2 ? '#ffffff' : fest.color} />)}
      {flags.map((i) => <mesh key={i} position={[-2.0 + i * 0.5, 2.2 - Math.sin((i / 8) * Math.PI) * 0.35, 1.0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.13, 0.28, 3]} /><meshBasicMaterial color={['#f7a8c4', '#ffd98a', '#8fd0f0', '#b8e0a0'][i % 4]} toneMapped={false} /></mesh>)}
      <group ref={g} position={[0, 2.6, 0]}><Html center style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="fest-tag">{fest.emoji}</div></Html></group>
    </group>
  );
}

/** Visitante sorpresa en la plaza (de día). */
function Visitor({ v }) {
  const hour = useGame((s) => Math.floor(s.env.hour * 20) / 20); // el valor exacto cambia cada segundo
  const taken = useGame((s) => !!s.couple?.events?.[eventsFor(s.couple.seed, s.now, s.env.season).day]?.gift);
  if (hour < VISITOR_HOURS[0] || hour >= VISITOR_HOURS[1]) return null;
  return (
    <group position={[21.6, 0, 19.6]} rotation={[0, 0.6, 0]} onClick={openEvents} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      <Avatar avatar={v.look} getAnim={() => 'idle'} name={v.name} showName />
      {!taken && <Html position={[0, 2.0, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="fest-tag small">🎁</div></Html>}
    </group>
  );
}

/** Estrellas fugaces: rayas luminosas que cruzan el cielo durante la lluvia de estrellas. */
function Meteors() {
  const N = 7;
  const refs = useRef([]);
  const st = useMemo(() => Array.from({ length: N }, () => ({ t: -Math.random() * 3, x: 0, z: 0, life: 1, dx: 0, dz: 0 })), []);
  const geom = useMemo(() => new THREE.PlaneGeometry(0.06, 3), []);
  useFrame((_, dt) => {
    st.forEach((m, i) => {
      const o = refs.current[i]; if (!o) return;
      m.t += dt;
      if (m.t > m.life) { m.t = -Math.random() * 2.5; m.x = 6 + Math.random() * 38; m.z = 4 + Math.random() * 30; m.life = 0.9 + Math.random() * 0.6; }
      const k = m.t / m.life;
      o.visible = k >= 0 && k <= 1;
      if (!o.visible) return;
      const y = 26 - k * 22;
      o.position.set(m.x - k * 14, y, m.z + k * 8);
      o.rotation.set(0.9, 0, 0.75); o.scale.set(1, 1, 1);
      o.material.opacity = Math.sin(k * Math.PI);
    });
  });
  return <group>{st.map((_, i) => <mesh key={i} ref={(r) => (refs.current[i] = r)} geometry={geom} visible={false}><meshBasicMaterial color="#e8f4ff" transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} /></mesh>)}</group>;
}

export default function Events() {
  const seed = useGame((s) => s.couple?.seed);
  const now = useGame((s) => Math.floor(s.now / 60000) * 60000);
  const season = useGame((s) => s.env.season);
  const hour = useGame((s) => Math.round(s.env.hour * 20) / 20); // el reloj entero de `env` cambia cada segundo
  const ev = eventsFor(seed, now, season);
  return (
    <group>
      {ev.festival && <FestivalStand fest={ev.festival} />}
      {ev.visitor && <Visitor v={ev.visitor} />}
      {meteorActive(ev, hour) && <Meteors />}
    </group>
  );
}
