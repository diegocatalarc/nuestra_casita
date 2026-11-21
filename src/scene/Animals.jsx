import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { animalPos, animalStats } from '../game/logic';
import { serverNow } from '../game/time';
import { animalInteract } from '../game/actions';
import { P, geo, toonMat } from './toon';

const M = ({ c }) => <primitive object={toonMat(c)} attach="material" />;
const S = ({ p, r = 0.1, c, s = [1, 1, 1] }) => <P g={geo('Sphere', r, 16, 12)} color={c} p={p} s={s} out={0.09} />;

const eyes = (y, z, dx = 0.045, r = 0.018) => [-1, 1].map((k) => (
  <group key={k}><mesh position={[k * dx, y, z]}><sphereGeometry args={[r, 8, 6]} /><meshBasicMaterial color="#2a1f24" /></mesh><mesh position={[k * dx + 0.006, y + 0.007, z + 0.012]}><sphereGeometry args={[r * 0.35, 6, 4]} /><meshBasicMaterial color="#fff" /></mesh></group>
));

function Model({ type, t }) {
  const body = useRef(), head = useRef(), tail = useRef(), earL = useRef(), earR = useRef(), wingL = useRef(), wingR = useRef();
  useFrame((s) => {
    const k = s.clock.elapsedTime + t;
    if (type === 'chicken') {
      const peck = Math.max(0, Math.sin(k * 3.2)) ** 6;
      if (head.current) head.current.rotation.x = peck * 0.9;
      if (body.current) body.current.rotation.x = peck * 0.25;
      if (wingL.current) { wingL.current.rotation.z = 0.15 + Math.sin(k * 2) * 0.05; wingR.current.rotation.z = -0.15 - Math.sin(k * 2) * 0.05; }
    } else if (type === 'rabbit') {
      if (earL.current) { earL.current.rotation.z = 0.1 + Math.max(0, Math.sin(k * 1.3)) ** 10 * 0.5; earR.current.rotation.z = -0.1 - Math.max(0, Math.sin(k * 1.1 + 1)) ** 10 * 0.5; }
      if (head.current) head.current.position.y = 0.36 + Math.sin(k * 4) * 0.005;
    } else if (type === 'cat') {
      if (tail.current) { tail.current.rotation.z = Math.sin(k * 2.4) * 0.5; tail.current.rotation.x = 0.9 + Math.sin(k * 1.7) * 0.15; }
      if (earL.current) earL.current.rotation.z = Math.max(0, Math.sin(k * 0.9)) ** 12 * 0.4;
    } else if (type === 'sheep' || type === 'cow') {
      if (head.current) head.current.rotation.x = Math.max(0, Math.sin(k * 1.1)) ** 4 * 0.6;
      if (earL.current) earL.current.rotation.z = (type === 'cow' ? 0.3 : 0) + Math.sin(k * 2.2) * 0.1;
      if (type === 'cow' && tail.current) tail.current.rotation.z = Math.sin(k * 2) * 0.35;
    } else if (type === 'dog') {
      if (tail.current) tail.current.rotation.z = Math.sin(k * 14) * 0.6;
      if (earL.current) { earL.current.rotation.z = 0.5 + Math.sin(k * 3) * 0.05; earR.current.rotation.z = -0.5 - Math.sin(k * 3 + 1) * 0.05; }
      if (head.current) head.current.rotation.x = Math.sin(k * 1.5) * 0.05;
    }
  });
  switch (type) {
    case 'chicken': return (<group>
      <group ref={body}>
        <S p={[0, 0.2, 0]} r={0.18} c="#fffaf0" s={[1, 0.92, 1.2]} />
        <group ref={wingL} position={[-0.17, 0.22, 0]}><S p={[0, 0, 0]} r={0.09} c="#f2e9d8" s={[0.35, 0.8, 1.1]} /></group>
        <group ref={wingR} position={[0.17, 0.22, 0]}><S p={[0, 0, 0]} r={0.09} c="#f2e9d8" s={[0.35, 0.8, 1.1]} /></group>
        {[[0, 0.34, -0.2, 0], [-0.05, 0.32, -0.2, 0.4], [0.05, 0.32, -0.2, -0.4]].map(([x, y, z, rz], i) => <P key={i} g={geo('Cone', 0.05, 0.22, 6)} color="#f4ede0" p={[x, y, z]} r={[-2.2, 0, rz]} out={0.1} />)}
        <group ref={head} position={[0, 0.36, 0.14]}>
          <S p={[0, 0.02, 0.02]} r={0.105} c="#fffaf0" />
          {[0, 1, 2].map((i) => <S key={i} p={[0, 0.12 + (i === 1 ? 0.02 : 0), 0.02 + (i - 1) * 0.04]} r={0.03} c="#e8473f" s={[0.6, 1.1, 0.8]} />)}
          <P g={geo('Cone', 0.035, 0.09, 5)} color="#f2a23c" p={[0, 0.0, 0.14]} r={[Math.PI / 2, 0, 0]} out={0.1} />
          <S p={[0, -0.07, 0.1]} r={0.025} c="#e8473f" />
          {eyes(0.04, 0.09, 0.062, 0.016)}
        </group>
      </group>
      {[-0.06, 0.06].map((x) => <group key={x} position={[x, 0.06, 0.02]}><P g={geo('Cylinder', 0.012, 0.012, 0.12, 5)} color="#f2a23c" out={0} /><P g={geo('Box', 0.06, 0.012, 0.07)} color="#f2a23c" p={[0, -0.05, 0.02]} out={0} /></group>)}
    </group>);
    case 'rabbit': return (<group>
      <S p={[0, 0.2, 0]} r={0.2} c="#f1eadf" s={[1, 0.95, 1.2]} />
      <S p={[0, 0.12, 0.17]} r={0.06} c="#f1eadf" s={[1.4, 0.8, 1.2]} />
      <S p={[0, 0.2, -0.25]} r={0.08} c="#ffffff" />
      <group ref={head} position={[0, 0.36, 0.17]}>
        <S p={[0, 0, 0.02]} r={0.125} c="#f1eadf" s={[1.05, 1, 1]} />
        <S p={[-0.07, -0.03, 0.1]} r={0.05} c="#f7f0e6" /><S p={[0.07, -0.03, 0.1]} r={0.05} c="#f7f0e6" />
        <S p={[0, 0.0, 0.14]} r={0.02} c="#f4a0a0" />
        {eyes(0.04, 0.1, 0.06, 0.017)}
        <group ref={earL} position={[-0.05, 0.1, -0.01]}><P g={geo('Capsule', 0.035, 0.2, 4, 8)} color="#f1eadf" p={[0, 0.12, 0]} out={0.1} /><P g={geo('Capsule', 0.018, 0.16, 4, 6)} color="#f4b0b8" p={[0, 0.12, 0.02]} out={0} /></group>
        <group ref={earR} position={[0.05, 0.1, -0.01]}><P g={geo('Capsule', 0.035, 0.2, 4, 8)} color="#f1eadf" p={[0, 0.12, 0]} out={0.1} /><P g={geo('Capsule', 0.018, 0.16, 4, 6)} color="#f4b0b8" p={[0, 0.12, 0.02]} out={0} /></group>
      </group>
      {[-0.1, 0.1].map((x) => <S key={x} p={[x, 0.04, 0.1]} r={0.045} c="#f1eadf" s={[0.9, 0.6, 1.5]} />)}
    </group>);
    case 'cat': return (<group>
      <S p={[0, 0.22, 0]} r={0.16} c="#e8a25c" s={[0.9, 0.9, 1.55]} />
      {[-0.07, 0, 0.07].map((x) => <P key={x} g={geo('Box', 0.025, 0.012, 0.16)} color="#c9803c" p={[x, 0.37, -0.02]} out={0} />)}
      <S p={[0, 0.2, 0.2]} r={0.1} c="#f7ead8" s={[0.9, 1, 0.8]} />
      <group ref={head} position={[0, 0.35, 0.22]}>
        <S p={[0, 0, 0]} r={0.125} c="#e8a25c" s={[1.1, 0.95, 1]} />
        <S p={[0, -0.03, 0.09]} r={0.06} c="#f7ead8" s={[1.2, 0.8, 0.8]} />
        <S p={[0, -0.02, 0.15]} r={0.014} c="#f09aa0" />
        {eyes(0.03, 0.1, 0.055, 0.019)}
        {[-1, 1].map((k) => <group key={k}>{[0.02, -0.01].map((y, i) => <P key={i} g={geo('Box', 0.12, 0.004, 0.004)} color="#fffaf0" p={[k * 0.1, -0.03 + y, 0.12]} r={[0, 0, k * (0.1 + i * 0.25)]} out={0} />)}</group>)}
        <group ref={earL} position={[-0.08, 0.1, 0]}><P g={geo('Cone', 0.05, 0.1, 4)} color="#e8a25c" out={0.1} /></group>
        <P g={geo('Cone', 0.05, 0.1, 4)} color="#e8a25c" p={[0.08, 0.1, 0]} out={0.1} />
      </group>
      <group ref={tail} position={[0, 0.25, -0.26]}><P g={geo('Capsule', 0.03, 0.3, 4, 8)} color="#c9803c" p={[0, 0.15, 0]} out={0.1} /></group>
      {[[-0.07, 0.1], [0.07, 0.1], [-0.07, -0.12], [0.07, -0.12]].map(([x, z], i) => <S key={i} p={[x, 0.05, z]} r={0.05} c={i < 2 ? '#f7ead8' : '#e8a25c'} s={[0.9, 0.9, 1.3]} />)}
    </group>);
    case 'dog': return (<group>
      <S p={[0, 0.27, 0]} r={0.2} c="#b98254" s={[0.9, 0.9, 1.55]} />
      <S p={[0, 0.22, 0.05]} r={0.17} c="#e8d3b0" s={[0.8, 0.5, 1]} />
      <P g={geo('Torus', 0.13, 0.025, 6, 14)} color="#d9453f" p={[0, 0.33, 0.27]} r={[Math.PI / 2 - 0.3, 0, 0]} out={0} />
      <S p={[0, 0.27, 0.3]} r={0.02} c="#ffd24a" />
      <group ref={head} position={[0, 0.42, 0.3]}>
        <S p={[0, 0, 0]} r={0.14} c="#b98254" />
        <S p={[0, -0.04, 0.1]} r={0.075} c="#e8d3b0" s={[1, 0.8, 1.1]} />
        <S p={[0, -0.01, 0.17]} r={0.025} c="#2a1f24" />
        <P g={geo('Capsule', 0.015, 0.05, 4, 6)} color="#f08a90" p={[0, -0.1, 0.14]} out={0} />
        {eyes(0.05, 0.11, 0.06, 0.02)}
        <group ref={earL} position={[-0.11, 0.07, 0]}><P g={geo('Box', 0.07, 0.16, 0.09)} color="#8a5e3c" p={[0, -0.06, 0]} out={0.1} /></group>
        <group ref={earR} position={[0.11, 0.07, 0]}><P g={geo('Box', 0.07, 0.16, 0.09)} color="#8a5e3c" p={[0, -0.06, 0]} out={0.1} /></group>
      </group>
      <group ref={tail} position={[0, 0.34, -0.3]}><P g={geo('Capsule', 0.03, 0.22, 4, 8)} color="#8a5e3c" p={[0, 0.1, -0.04]} r={[-0.6, 0, 0]} out={0.1} /></group>
      {[[-0.1, 0.18], [0.1, 0.18], [-0.1, -0.18], [0.1, -0.18]].map(([x, z], i) => <group key={i} position={[x, 0.1, z]}><P g={geo('Cylinder', 0.045, 0.04, 0.16, 6)} color="#a8714a" out={0.1} /><S p={[0, -0.08, 0.015]} r={0.045} c="#f1e4cc" s={[1, 0.6, 1.3]} /></group>)}
    </group>);
    case 'sheep': return (<group>
      <S p={[0, 0.3, 0]} r={0.26} c="#fbf6ee" s={[1, 0.9, 1.25]} />
      {[[-0.15, 0.42, 0.1], [0.15, 0.42, 0.1], [0, 0.46, -0.1], [-0.16, 0.36, -0.18], [0.16, 0.36, -0.18], [0, 0.34, 0.22]].map(([x, y, z], i) => <S key={i} p={[x, y, z]} r={0.13} c="#fffaf3" />)}
      <group ref={head} position={[0, 0.38, 0.3]}>
        <S p={[0, 0, 0]} r={0.12} c="#5a4a46" s={[0.9, 1, 1.1]} />
        <S p={[0, 0.1, -0.02]} r={0.09} c="#fffaf3" />
        {eyes(0.03, 0.1, 0.055, 0.017)}
        <group ref={earL} position={[-0.12, 0.02, 0]}><P g={geo('Capsule', 0.03, 0.08, 4, 6)} color="#5a4a46" r={[0, 0, Math.PI / 2 - 0.4]} out={0.1} /></group>
        <group ref={earR} position={[0.12, 0.02, 0]}><P g={geo('Capsule', 0.03, 0.08, 4, 6)} color="#5a4a46" r={[0, 0, -Math.PI / 2 + 0.4]} out={0.1} /></group>
      </group>
      {[[-0.1, 0.12], [0.1, 0.12], [-0.1, -0.14], [0.1, -0.14]].map(([x, z], i) => <P key={i} g={geo('Cylinder', 0.025, 0.025, 0.2, 6)} color="#5a4a46" p={[x, 0.1, z]} out={0.1} />)}
    </group>);
    case 'cow': return (<group>
      <S p={[0, 0.4, 0]} r={0.3} c="#fffaf3" s={[0.95, 0.95, 1.55]} />
      {[[0.12, 0.55, 0.1, 0.13], [-0.14, 0.45, -0.18, 0.12], [0.2, 0.4, -0.2, 0.1]].map(([x, y, z, r], i) => <S key={i} p={[x, y, z]} r={r} c="#3a3034" s={[1, 0.5, 1]} />)}
      <S p={[0, 0.3, 0.3]} r={0.15} c="#f7c9c0" s={[1, 0.6, 0.6]} />
      <group ref={head} position={[0, 0.55, 0.42]}>
        <S p={[0, 0, 0]} r={0.16} c="#fffaf3" s={[1, 1, 1.1]} />
        <S p={[0, -0.06, 0.13]} r={0.1} c="#f7c9c0" s={[1.1, 0.8, 0.9]} />
        <S p={[-0.04, -0.04, 0.2]} r={0.015} c="#7a4a4a" /><S p={[0.04, -0.04, 0.2]} r={0.015} c="#7a4a4a" />
        <S p={[0.1, 0.04, 0.02]} r={0.07} c="#3a3034" s={[1, 1, 1.3]} />
        {eyes(0.05, 0.14, 0.085, 0.02)}
        <group ref={earL} position={[-0.17, 0.08, 0]}><P g={geo('Box', 0.1, 0.04, 0.06)} color="#fffaf3" r={[0, 0, 0.3]} out={0.1} /></group>
        <group ref={earR} position={[0.17, 0.08, 0]}><P g={geo('Box', 0.1, 0.04, 0.06)} color="#fffaf3" r={[0, 0, -0.3]} out={0.1} /></group>
        {[-1, 1].map((k) => <P key={k} g={geo('Cone', 0.03, 0.1, 5)} color="#f2e6c9" p={[k * 0.1, 0.17, 0]} r={[0, 0, -k * 0.4]} out={0.1} />)}
      </group>
      <group ref={tail} position={[0, 0.55, -0.45]}><P g={geo('Capsule', 0.015, 0.3, 4, 6)} color="#fffaf3" p={[0, -0.15, 0]} out={0.1} /><S p={[0, -0.34, 0]} r={0.045} c="#3a3034" /></group>
      {[[-0.14, 0.2], [0.14, 0.2], [-0.14, -0.25], [0.14, -0.25]].map(([x, z], i) => <group key={i} position={[x, 0.17, z]}><P g={geo('Cylinder', 0.05, 0.045, 0.34, 8)} color="#fffaf3" out={0.1} /><P g={geo('Cylinder', 0.05, 0.05, 0.06, 8)} color="#3a3034" p={[0, -0.18, 0]} out={0.1} /></group>)}
    </group>);
    default: return null;
  }
}

function Animal({ a }) {
  const g = useRef(), body = useRef();
  const now = useGame((s) => Math.floor(s.now / 3000) * 3000);
  const stats = animalStats(a, now);
  useFrame((s) => {
    const t = serverNow();
    const p = animalPos(a, t);
    g.current.position.set(p.x, 0, p.z);
    g.current.rotation.y = p.rot;
    const hop = p.moving ? Math.abs(Math.sin(s.clock.elapsedTime * (a.type === 'rabbit' ? 9 : 7))) * (a.type === 'rabbit' ? 0.18 : 0.07) : 0;
    body.current.position.y = hop;
    if (!p.moving && a.type === 'dog') body.current.rotation.z = Math.sin(s.clock.elapsedTime * 8) * 0.03;
  });
  const icon = stats.ready ? '✨' : stats.hunger > 0.6 ? '🍎' : null;
  return (
    <group
      ref={g}
      onClick={(e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); animalInteract(a.id); }}
      onPointerOver={() => { if (useGame.getState().tool === 'interact') document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <group ref={body}><Model type={a.type} t={a.id.length * 1.7} /></group>
      {icon && <Html position={[0, 0.95, 0]} center style={{ pointerEvents: 'none' }}><div className="bubble">{icon}</div></Html>}
    </group>
  );
}

export default function Animals() {
  const animals = useGame((s) => s.animals);
  return <group>{Object.values(animals).map((a) => <Animal key={a.id} a={a} />)}</group>;
}
