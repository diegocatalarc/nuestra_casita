import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../store/gameStore';
import { cropInfo } from '../game/logic';
import { cropInteract } from '../game/actions';

const G = ({ r = 0.1, p, c, s = [1, 1, 1], d = 0 }) => (
  <mesh position={p} scale={s} castShadow><icosahedronGeometry args={[r, d]} /><meshStandardMaterial color={c} roughness={0.9} flatShading /></mesh>
);
const Ball = ({ d = 1, ...p }) => <G d={d} {...p} />;
const ring = (n, rad, fn) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return fn(Math.cos(a) * rad, Math.sin(a) * rad, i); });

const Leaf = ({ p, r = [0, 0, 0], s = [0.07, 0.025, 0.14], c = '#6cbf4a' }) => (
  <mesh position={p} rotation={r} scale={s} castShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>
);
const Stem = ({ p, h = 0.4, r = 0.025, c = '#5f9a4a', rot = [0, 0, 0] }) => (
  <mesh position={p} rotation={rot} castShadow><cylinderGeometry args={[r * 0.7, r, h, 6]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>
);

function Plant({ type, stage, p }) {
  const g = stage === 1 ? 0.16 : stage === 2 ? 0.28 + p * 1.0 : stage === 3 ? 0.4 + p * 0.5 : 1;
  const ripe = stage === 4, unripe = stage === 3 && p > 0.6;
  return (
    <group scale={g}>
      {(type === 'mushroom' || type === 'shiitake' || type === 'pinkshroom') && (() => {
        const cap = type === 'mushroom' ? '#f1e6d2' : type === 'shiitake' ? '#9a6a46' : '#f4a6c0';
        const spot = type === 'shiitake' ? '#c9a07a' : '#ffffff';
        const glow = type === 'pinkshroom' ? 0.45 : 0;
        const n = ripe ? 5 : stage >= 3 ? 3 : 1;
        return Array.from({ length: n }, (_, i) => {
          const a = i * 2.3, r = i === 0 ? 0 : 0.13 + (i % 2) * 0.05, k = i === 0 ? 1 : 0.55 + (i % 3) * 0.12;
          return (
            <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} scale={k * (ripe ? 1 : 0.8)} rotation={[Math.sin(a) * 0.15, 0, Math.cos(a) * 0.15]}>
              <mesh position={[0, 0.12, 0]} castShadow><cylinderGeometry args={[0.045, 0.065, 0.24, 10]} /><meshStandardMaterial color="#f7f0e0" roughness={0.9} /></mesh>
              <mesh position={[0, 0.24, 0]} castShadow><sphereGeometry args={[0.17, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={cap} roughness={0.8} emissive={cap} emissiveIntensity={glow} /></mesh>
              <mesh position={[0, 0.235, 0]}><cylinderGeometry args={[0.165, 0.165, 0.015, 14]} /><meshStandardMaterial color="#d9c9a8" /></mesh>
              {(type !== 'mushroom') && [[0.06, 0.34, 0.05], [-0.07, 0.31, 0.08], [0.02, 0.3, -0.1]].map(([x, y, z], j) => <mesh key={j} position={[x, y, z]} scale={[1, 0.4, 1]}><sphereGeometry args={[0.025, 6, 4]} /><meshStandardMaterial color={spot} /></mesh>)}
            </group>
          );
        });
      })()}
      {type === 'lettuce' && (<>
        {[[6, 0.2, 0.1, '#7cc95c'], [6, 0.13, 0.2, '#8fd16a'], [5, 0.07, 0.3, '#a4de7c']].map(([n, r, y, c], k) => ring(n, r, (x, z, i) => (
          <Leaf key={k + '-' + i} p={[x, y, z]} r={[0.5 + k * 0.2, -Math.atan2(z, x), 0]} s={[0.12 - k * 0.015, 0.03, 0.16 - k * 0.02]} c={i % 2 ? c : '#9bdc78'} />)))}
        <Ball r={0.07} p={[0, 0.3, 0]} c="#cdf0a8" />
      </>)}
      {type === 'carrot' && (<>
        {ring(8, 0.06, (x, z, i) => <Leaf key={i} p={[x * 1.2, 0.28, z * 1.2]} r={[z * 4, 0, -x * 4]} s={[0.025, 0.2, 0.025]} c={i % 2 ? '#6cbf4a' : '#82d05a'} />)}
        {(ripe || unripe) && <>
          <mesh position={[0, 0.03, 0]} castShadow><sphereGeometry args={[0.095, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#f08a2c" roughness={0.8} /></mesh>
          <mesh position={[0, -0.02, 0]} rotation={[Math.PI, 0, 0]} castShadow><coneGeometry args={[0.07, 0.18, 8]} /><meshStandardMaterial color="#f4922e" roughness={0.8} /></mesh>
        </>}
      </>)}
      {type === 'tomato' && (<>
        {[[-0.14, -0.1], [0.14, -0.1], [0, 0.15]].map(([x, z], i) => <Stem key={i} p={[x, 0.3, z]} h={0.62} r={0.012} c="#b98254" />)}
        <Stem p={[0, 0.3, 0]} h={0.62} r={0.03} />
        {Array.from({ length: 8 }, (_, i) => <Leaf key={i} p={[Math.cos(i * 2.2) * 0.14, 0.18 + i * 0.07, Math.sin(i * 2.2) * 0.14]} r={[0.3, i * 2.2, 0.2]} s={[0.15, 0.025, 0.09]} c={i % 2 ? '#5fae55' : '#76c262'} />)}
        {(ripe || unripe) && ring(5, 0.16, (x, z, i) => <Ball key={i} r={ripe ? 0.095 : 0.06} p={[x, 0.2 + (i % 3) * 0.12, z]} c={ripe ? ['#e5533d', '#ee5f45'][i % 2] : '#9ccc6a'} />)}
        {stage >= 3 && !ripe && ring(3, 0.12, (x, z, i) => <Ball key={'f' + i} r={0.03} p={[x, 0.5, z]} c="#ffe27a" d={0} />)}
      </>)}
      {type === 'strawberry' && (<>
        {ring(7, 0.15, (x, z, i) => <group key={i} position={[x, 0.09, z]} rotation={[0, -Math.atan2(z, x), 0]}>
          <Leaf p={[0, 0, 0]} r={[0.4, 0, 0]} s={[0.07, 0.02, 0.1]} c="#4f9a4a" /><Leaf p={[0.06, 0.01, 0.02]} r={[0.4, 0.5, 0]} s={[0.06, 0.02, 0.09]} c="#5fae55" /><Leaf p={[-0.06, 0.01, 0.02]} r={[0.4, -0.5, 0]} s={[0.06, 0.02, 0.09]} c="#5fae55" />
        </group>)}
        {stage >= 3 && ring(5, 0.2, (x, z, i) => (ripe
          ? <group key={i} position={[x, 0.07, z]}><mesh rotation={[Math.PI, 0, 0]} castShadow><coneGeometry args={[0.065, 0.13, 8]} /><meshStandardMaterial color="#e8374f" roughness={0.6} /></mesh><Ball r={0.04} p={[0, 0.02, 0]} c="#4f9a4a" s={[1.4, 0.4, 1.4]} d={0} /></group>
          : <group key={i} position={[x, 0.14, z]}>{ring(5, 0.035, (a, b, k) => <Ball key={k} r={0.022} p={[a, 0, b]} c="#ffffff" d={0} />)}<Ball r={0.02} p={[0, 0.005, 0]} c="#ffd24a" d={0} /></group>))}
      </>)}
      {type === 'rose' && (<>
        {[0, 1.5, 3, 4.5].map((a, i) => <Stem key={i} p={[Math.cos(a) * 0.1, 0.25, Math.sin(a) * 0.1]} h={0.5} r={0.02} c="#4f7a3a" rot={[Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2]} />)}
        <Ball r={0.22} p={[0, 0.25, 0]} s={[1, 0.9, 1]} c="#4f9a4a" d={1} />
        {Array.from({ length: 7 }, (_, i) => <Leaf key={i} p={[Math.cos(i * 1.1) * 0.2, 0.2 + (i % 3) * 0.1, Math.sin(i * 1.1) * 0.2]} r={[0.3, i, 0.3]} s={[0.1, 0.02, 0.06]} c="#5fae55" />)}
        {stage >= 3 && ring(3, 0.17, (x, z, i) => (ripe
          ? <group key={i} position={[x, 0.44 + (i % 2) * 0.08, z]}>{[0.1, 0.075, 0.05].map((r, k) => <Ball key={k} r={r} p={[0, k * 0.02, 0]} s={[1, 0.7, 1]} c={['#e8456a', '#f2799a', '#ff9bb3'][(i + k) % 3]} d={1} />)}</group>
          : <Ball key={i} r={0.05} p={[x, 0.42 + (i % 2) * 0.08, z]} c="#8fc07a" s={[0.8, 1.3, 0.8]} d={1} />))}
      </>)}
      {type === 'sunflower' && (<>
        {ring(4, 0.2, (x, z, i) => <Leaf key={i} p={[x, 0.08, z]} r={[0.2, -Math.atan2(z, x), 0]} s={[0.15, 0.025, 0.12]} c="#5fae55" />)}
        {stage >= 2 && <Stem p={[0, 0.3 + (stage >= 3 ? 0.25 : 0), 0]} h={0.6 + (stage >= 3 ? 0.5 : 0)} r={0.04} />}
        {stage >= 3 && (<group position={[0, ripe ? 1.1 : 0.85, 0.05]} rotation={[0.35, 0, 0]}>
          {ring(10, 0.17, (x, z, i) => <Ball key={i} r={0.07} p={[x, z, 0]} s={[1, 1, 0.3]} c={ripe ? '#ffd23a' : '#c9d86a'} d={1} />)}
          <Ball r={0.13} p={[0, 0, 0.02]} s={[1, 1, 0.5]} c={ripe ? '#6b4423' : '#7a8a3a'} d={1} />
        </group>)}
      </>)}
      {type === 'lavender' && (<>
        {[[-0.12, 0.05], [0.1, -0.08], [0.02, 0.12], [-0.05, -0.12], [0.14, 0.1]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Stem p={[0, 0.25, 0]} h={0.5} r={0.02} c="#6f9a5a" />
            {stage >= 3 && [0.42, 0.52, 0.62].map((y, k) => <Ball key={k} r={0.05 - k * 0.008} p={[0, y, 0]} s={[0.8, 1.3, 0.8]} c={ripe ? '#a67be0' : '#b8c98a'} d={1} />)}
          </group>
        ))}
      </>)}
      {type === 'melon' && (<>
        {ring(5, 0.22, (x, z, i) => <Leaf key={i} p={[x, 0.06, z]} r={[0.2, -Math.atan2(z, x), 0]} s={[0.16, 0.025, 0.13]} c="#5fae55" />)}
        {stage >= 3 && <Ball r={ripe ? 0.22 : 0.1} p={[0, ripe ? 0.2 : 0.1, 0]} s={[1.15, 0.95, 1]} c={ripe ? '#7fc45a' : '#a4c96a'} d={1} />}
        {ripe && [0.06, 0.18, -0.08, -0.2].map((o, i) => <Ball key={i} r={0.045} p={[o, 0.34, 0.02]} s={[0.35, 0.12, 0.9]} c="#4f9a3d" d={0} />)}
      </>)}
      {type === 'pumpkin' && (<>
        {ring(5, 0.22, (x, z, i) => <Leaf key={i} p={[x, 0.06, z]} r={[0.2, -Math.atan2(z, x), 0]} s={[0.15, 0.025, 0.12]} c={i % 2 ? '#5fae55' : '#6fbf5a'} />)}
        {stage >= 3 && ring(6, ripe ? 0.1 : 0.05, (x, z, i) => <Ball key={i} r={ripe ? 0.17 : 0.09} p={[x, ripe ? 0.2 : 0.1, z]} s={[0.8, ripe ? 0.85 : 0.8, 0.8]} c={ripe ? '#f08a2c' : '#a4c96a'} d={1} />)}
        {stage >= 3 && <Ball r={ripe ? 0.14 : 0.07} p={[0, ripe ? 0.2 : 0.1, 0]} s={[1, 0.85, 1]} c={ripe ? '#f3902f' : '#a4c96a'} d={1} />}
        {ripe && <><Stem p={[0, 0.42, 0]} h={0.12} r={0.035} c="#6b8a3a" /><mesh position={[0.07, 0.46, 0]} rotation={[0, 0, -0.9]}><torusGeometry args={[0.05, 0.012, 5, 10, 4]} /><meshStandardMaterial color="#7fb04a" /></mesh></>}
      </>)}
    </group>
  );
}

const Crop = memo(function Crop({ crop, now }) {
  const info = cropInfo(crop, now);
  const spark = useRef(), sway = useRef();
  useFrame((s) => {
    if (sway.current) { const t = s.clock.elapsedTime, a = 0.012 + info.stage * 0.012; sway.current.rotation.z = Math.sin(t * 1.5 + crop.x * 0.7 + crop.z) * a; sway.current.rotation.x = Math.cos(t * 1.2 + crop.z * 0.9) * a * 0.7; }
    if (spark.current) { const t = s.clock.elapsedTime; spark.current.position.y = 1.15 + Math.sin(t * 3) * 0.08; spark.current.rotation.y = t * 2; }
  });
  const wet = crop.wateredAt && !crop.harvested;
  return (
    <group
      position={[crop.x + 0.5, 0.02, crop.z + 0.5]}
      onClick={(e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); cropInteract(crop.id); }}
      onPointerOver={() => { if (useGame.getState().tool === 'interact') document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      {[-0.2, 0, 0.2].map((x) => <mesh key={x} position={[x, 0.07, 0]} castShadow><boxGeometry args={[0.07, 0.05, 0.62]} /><meshStandardMaterial color={crop.harvested ? '#6b4630' : wet ? '#4a2f1b' : '#7a5238'} roughness={1} /></mesh>)}
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.4, 0.44, 0.08, 8]} />
        <meshStandardMaterial color={crop.harvested ? '#6b4630' : wet ? '#52361f' : '#8a5e3c'} roughness={1} flatShading />
      </mesh>
      {!crop.harvested && <group ref={sway} position={[0, 0.06, 0]}><Plant type={crop.type} stage={info.stage} p={info.p} /></group>}
      {info.stage === 4 && (
        <mesh ref={spark} position={[0, 1.15, 0]}><octahedronGeometry args={[0.07, 0]} /><meshBasicMaterial color="#ffe27a" toneMapped={false} /></mesh>
      )}
      {info.stage === 1 && <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.03, 6, 4]} /><meshBasicMaterial color="#8ad0ff" /></mesh>}
    </group>
  );
});

export default function Crops() {
  const crops = useGame((s) => s.crops);
// Reloj grueso: el aspecto solo cambia cada varios segundos; con `s.now` se re-renderizaba todo cada segundo.
  const now = useGame((s) => Math.floor(s.now / 3000) * 3000);
  return <group>{Object.values(crops).map((c) => <Crop key={c.id} crop={c} now={now} />)}</group>;
}
