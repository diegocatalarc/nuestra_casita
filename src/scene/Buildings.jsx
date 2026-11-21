import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../store/gameStore';
import { BUILDINGS } from '../game/constants';
import { occupied } from '../game/runtime';
import { serverNow } from '../game/time';
import { WIND } from './wind';
import { L } from '../game/lighting';
import { hashStr, mulberry32, clamp } from '../game/rng';
import { DecorModel } from './Decor';
import { rbGeo } from './rb';
import { sleepAt } from '../game/actions';

const Bx = ({ p, s, c, o, ...r }) => (
  <mesh position={p} geometry={rbGeo(s[0], s[1], s[2])} castShadow receiveShadow {...r}>
    <meshStandardMaterial vertexColors color={c} roughness={0.95} flatShading transparent={o != null} opacity={o ?? 1} />
  </mesh>
);

function Window({ p, rot = 0 }) {
  const m = useRef();
  useFrame(() => { if (m.current) m.current.emissiveIntensity = 0.15 + L.night * 1.6; });
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Bx p={[0, 0, 0]} s={[0.86, 0.86, 0.04]} c="#fff4e6" />
      {[-1, 1].map((k) => <Bx key={k} p={[k * 0.58, 0, 0.02]} s={[0.26, 0.86, 0.05]} c="#7aa6c8" />)}
      <Bx p={[0, -0.52, 0.1]} s={[0.9, 0.12, 0.2]} c="#8a5e3c" />
      {[-0.28, 0, 0.28].map((x, i) => <mesh key={i} position={[x, -0.4, 0.12]} castShadow><icosahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color={['#f48aa8', '#ffe27a', '#ffffff'][i]} flatShading /></mesh>)}
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[0.7, 0.7]} /><meshStandardMaterial ref={m} color="#ffe9b0" emissive="#ffc96a" emissiveIntensity={0.3} /></mesh>
      <Bx p={[0, 0, 0.04]} s={[0.04, 0.7, 0.02]} c="#fff4e6" />
      <Bx p={[0, 0, 0.04]} s={[0.7, 0.04, 0.02]} c="#fff4e6" />
    </group>
  );
}

function WallArt({ p, c1 }) {
  return (
    <group position={p}>
      <Bx p={[0, 0, 0]} s={[0.8, 0.6, 0.05]} c="#8a5e3c" />
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[0.68, 0.48]} /><meshStandardMaterial color="#cfe8f5" /></mesh>
      <mesh position={[0, -0.1, 0.032]}><planeGeometry args={[0.68, 0.22]} /><meshStandardMaterial color="#8fc07a" /></mesh>
      <mesh position={[0.18, 0.1, 0.034]}><circleGeometry args={[0.07, 12]} /><meshBasicMaterial color="#ffe27a" /></mesh>
      <mesh position={[-0.1, -0.02, 0.034]} rotation={[0, 0, 0]}><coneGeometry args={[0.16, 0.2, 3]} /><meshStandardMaterial color="#6fae5c" /></mesh>
    </group>
  );
}

function Lantern({ p }) {
  const m = useRef();
  useFrame(() => { if (m.current) m.current.emissiveIntensity = 0.3 + L.night * 2.2; });
  return (
    <group position={p}>
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.012, 0.012, 0.3, 4]} /><meshStandardMaterial color="#3a3a46" /></mesh>
      <mesh castShadow><boxGeometry args={[0.12, 0.16, 0.12]} /><meshStandardMaterial ref={m} color="#ffe9b0" emissive="#ffb84a" emissiveIntensity={0.3} /></mesh>
      <mesh position={[0, 0.11, 0]}><coneGeometry args={[0.1, 0.07, 4]} /><meshStandardMaterial color="#3a3a46" /></mesh>
    </group>
  );
}

/** Humo de chimenea: 4 bocanadas que suben y se desvanecen. */
function Smoke({ p }) {
  const refs = useRef([]);
  const N = 7;
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const w = WIND.uWind.value; // el humo se inclina con el viento y se ensancha al subir
    const tint = L.night * 0.3 + (L.season === 3 ? 0.4 : 0);
    refs.current.forEach((m, i) => {
      if (!m) return;
      const k = ((t * 0.3 + i / N) % 1);
      m.position.set(Math.sin(t * 1.1 + i * 2.1) * 0.12 * (0.4 + k) + k * (0.45 + 0.35 * w), k * 2.0, Math.cos(t * 0.8 + i * 1.7) * 0.12 * (0.4 + k));
      m.scale.setScalar(0.09 + k * 0.4 + Math.sin(t * 2 + i) * 0.015);
      m.material.opacity = Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.55 * (0.5 + tint);
    });
  });
  return (
    <group position={p}>
      {Array.from({ length: N }, (_, i) => <mesh key={i} ref={(el) => (refs.current[i] = el)}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color="#efe9e2" transparent opacity={0.4} depthWrite={false} /></mesh>)}
    </group>
  );
}

function Props({ items, glass }) {
  return items.map(([type, x, z, rot, variant], i) => (
    <group key={i} position={[x, 0.12, z]} rotation={[0, (rot || 0) * Math.PI / 2, 0]}><DecorModel type={type} variant={variant || 0} /></group>
  ));
}

/** Armario del vestidor: toca para cambiarte de ropa. */
function Wardrobe({ p }) {
  const go = (e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); useGame.getState().set({ panel: 'avatar' }); };
  return (
    <group position={p} rotation={[0, Math.PI / 2, 0]}
      onClick={go}
      onPointerOver={() => { if (useGame.getState().tool === 'interact') document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}>
      <Bx p={[0, 0.97, 0]} s={[1.1, 1.7, 0.5]} c="#c9a070" />
      <Bx p={[0, 1.86, 0]} s={[1.2, 0.1, 0.58]} c="#8a5e3c" />
      {[-0.27, 0.27].map((x) => <Bx key={x} p={[x, 0.95, 0.26]} s={[0.49, 1.5, 0.04]} c="#e9c9a0" />)}
      {[-0.06, 0.06].map((x) => <mesh key={x} position={[x, 0.95, 0.3]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#f2c94c" /></mesh>)}
      <mesh position={[-0.27, 1.4, 0.29]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#ff8aa8" toneMapped={false} /></mesh>
      <Bx p={[0, 0.07, 0.05]} s={[1.14, 0.12, 0.54]} c="#8a5e3c" />
    </group>
  );
}

function Bookshelf({ p, s, seed }) {
  const books = useMemo(() => {
    const r = mulberry32(hashStr(seed));
    const out = [];
    const rows = 4, cols = Math.floor(s[0] / 0.12);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (r() < 0.2) continue;
      out.push({ x: -s[0] / 2 + 0.1 + x * 0.12, y: 0.15 + y * ((s[1] - 0.2) / rows) , h: 0.28 + r() * 0.12, c: ['#d96a6a', '#6a9bd9', '#e8c36a', '#7ab87a', '#b07ad9', '#f2f0e6'][Math.floor(r() * 6)] });
    }
    return out;
  }, [seed, s]);
  return (
    <group position={p}>
      <Bx p={[0, 0, 0]} s={s} c="#8a6446" />
      {books.map((b, i) => <Bx key={i} p={[b.x, b.y - s[1] / 2 + 0.2 + b.h / 2 - 0.05, s[2] / 2 - 0.04]} s={[0.09, b.h, 0.2]} c={b.c} />)}
    </group>
  );
}

function interiorFor(type, w, d) {
  switch (type) {
    case 'house': return (<>
      <Props items={[['bed', 0.95, 1.3, 0, 0], ['table', 3.6, 2.8, 0, 0], ['rug', 2.7, 2.3, 0, 1], ['lamp', 4.5, 0.6, 0, 0], ['plant', 4.5, 3.4, 0, 0], ['fireplace', 3.0, 0.55, 0, 0]]} />
    </>);
    case 'bedroom': return <Props items={[['bed', 1.0, 1.4, 0, 0], ['bed', 2.95, 1.4, 0, 1], ['lamp', 1.97, 0.6, 0, 1], ['rug', 2.0, 3.0, 0, 0], ['plant', 3.5, 3.5, 0, 1]]} />;
    case 'kitchen': return (<>
      <Bx p={[1.6, 0.55, 0.45]} s={[2.8, 0.9, 0.6]} c="#f4efe6" />
      <Bx p={[1.6, 1.02, 0.45]} s={[2.9, 0.06, 0.66]} c="#b98254" />
      <Bx p={[2.35, 1.07, 0.45]} s={[0.6, 0.05, 0.45]} c="#2b2b30" />
      <mesh position={[2.35, 1.2, 0.45]} castShadow><cylinderGeometry args={[0.14, 0.14, 0.16, 8]} /><meshStandardMaterial color="#c9ccd4" flatShading /></mesh>
      <Bx p={[0.9, 1.05, 0.45]} s={[0.55, 0.05, 0.4]} c="#9ab8c9" />
      <Bx p={[3.55, 0.95, 0.45]} s={[0.7, 1.7, 0.6]} c="#e9eef2" />
      <Props items={[['table', 1.9, 2.0, 0, 0], ['plant', 0.45, 2.55, 0, 2]]} />
      {[1.2, 2.6].map((x) => <mesh key={x} position={[x, 0.35, 2.7]} castShadow><cylinderGeometry args={[0.16, 0.16, 0.26, 8]} /><meshStandardMaterial color="#d9825b" flatShading /></mesh>)}
      {[0.9, 1.4, 1.9].map((x, i) => <mesh key={i} position={[x, 1.8, 0.2]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.12, 8]} /><meshStandardMaterial color={['#c9ccd4', '#d9825b', '#c9ccd4'][i]} flatShading /></mesh>)}
    </>);
    case 'library': return (<>
      <Bookshelf p={[2.05, 1.12, 0.4]} s={[3.5, 2.0, 0.4]} seed="lib-n" />
      <Bookshelf p={[0.4, 1.12, 2.3]} s={[0.4, 2.0, 2.6]} seed="lib-w" />
      <Props items={[['rug', 2.3, 2.8, 0, 2], ['sofa', 2.3, 2.7, 0, 1], ['lamp', 3.5, 2.6, 0, 0], ['plant', 3.5, 3.5, 0, 0]]} />
    </>);
    case 'terrace': return (<>
      <Props items={[['table', 2.0, 1.4, 0, 0], ['plant', 0.6, 2.5, 0, 0], ['plant', 3.4, 2.5, 0, 1]]} />
      {[[1.2, 2.0], [2.8, 2.0]].map(([x, z], i) => <Bx key={i} p={[x, 0.45, z]} s={[0.45, 0.06, 0.45]} c="#e9c9a0" />)}
      <mesh position={[2.0, 1.35, 1.4]} castShadow><cylinderGeometry args={[0.03, 0.03, 2.4, 5]} /><meshStandardMaterial color="#8a5e3c" flatShading /></mesh>
      <mesh position={[2.0, 2.45, 1.4]} castShadow><coneGeometry args={[1.3, 0.5, 8]} /><meshStandardMaterial color="#f2a6a0" flatShading /></mesh>
      {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[0.3 + i * 0.4, 1.0 + Math.sin(i) * 0.05, 0.25]}><sphereGeometry args={[0.05, 6, 4]} /><meshBasicMaterial color={['#ffd98a', '#ffb5c2', '#b8e0ff'][i % 3]} toneMapped={false} /></mesh>)}
    </>);
    case 'garden': return (<>
      <mesh position={[2.5, 0.35, 2.5]} castShadow receiveShadow><cylinderGeometry args={[0.95, 1.05, 0.5, 10]} /><meshStandardMaterial color="#cfc9bd" flatShading /></mesh>
      <mesh position={[2.5, 0.6, 2.5]}><cylinderGeometry args={[0.8, 0.8, 0.05, 10]} /><meshStandardMaterial color="#6cc3d8" roughness={0.2} /></mesh>
      <mesh position={[2.5, 0.9, 2.5]} castShadow><cylinderGeometry args={[0.1, 0.14, 0.7, 6]} /><meshStandardMaterial color="#cfc9bd" flatShading /></mesh>
      <mesh position={[2.5, 1.3, 2.5]}><icosahedronGeometry args={[0.14, 0]} /><meshStandardMaterial color="#9fe0f0" emissive="#9fe0f0" emissiveIntensity={0.3} flatShading /></mesh>
      {[[0.9, 0.9], [4.1, 0.9], [0.9, 4.1], [4.1, 4.1]].map(([x, z], i) => (
        <group key={i} position={[x, 0.12, z]}>
          <Bx p={[0, 0.1, 0]} s={[1.0, 0.2, 1.0]} c="#7a5238" />
          {Array.from({ length: 6 }, (_, k) => <mesh key={k} position={[Math.cos(k) * 0.3, 0.3, Math.sin(k * 1.7) * 0.3]} castShadow><icosahedronGeometry args={[0.11, 0]} /><meshStandardMaterial color={['#f48aa8', '#ffe27a', '#ffffff', '#c9a6f0', '#ff9a6a', '#f7a8c4'][(k + i) % 6]} flatShading /></mesh>)}
        </group>
      ))}
    </>);
    case 'greenhouse': return (<>
      {[0.5, 1.5, 2.5, 3.5, 4.5].map((x) => <Bx key={x} p={[x, 0.14, 2]} s={[0.04, 0.02, 3.8]} c="#a8764c" />)}
    </>);
    case 'memory': return (<>
      <Bx p={[2.0, 0.88, 0.5]} s={[3.4, 0.06, 0.5]} c="#b98254" />
      <Bx p={[0.5, 0.88, 2.0]} s={[0.5, 0.06, 2.8]} c="#b98254" />
      {[0.5, 2.0, 3.5].map((x) => <Bx key={x} p={[x, 0.55, 0.45]} s={[0.06, 0.7, 0.4]} c="#8a5e3c" />)}
      <Bx p={[2.4, 0.5, 2.8]} s={[2.9, 0.06, 1.9]} c="#d9b384" />
      {[[1.1, 2.0], [3.7, 2.0], [1.1, 3.6], [3.7, 3.6]].map(([x, z], i) => <Bx key={i} p={[x, 0.25, z]} s={[0.08, 0.5, 0.08]} c="#8a5e3c" />)}
      <Props items={[['lamp', 3.65, 3.55, 0, 0], ['plant', 0.5, 3.5, 0, 1]]} />
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[0.3 + i * 0.3, 2.05 - Math.sin(i * 0.52) * 0.18, 0.25]}><sphereGeometry args={[0.04, 6, 4]} /><meshBasicMaterial color="#ffd98a" toneMapped={false} /></mesh>)}
    </>);
    case 'barn': return (<>
      {[[0.9, 0.75, 0], [1.9, 0.7, 0.1], [1.35, 0.75, 1.1, 1]].map(([x, z, r, up], i) => (
        <group key={i} position={[x, 0.12 + (up ? 0.52 : 0), z]}>
          <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.7, 14]} /><meshStandardMaterial color="#e8c46a" roughness={1} /></mesh>
          {[-0.18, 0.18].map((o) => <mesh key={o} position={[o, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.305, 0.012, 5, 16]} /><meshStandardMaterial color="#b98254" /></mesh>)}
        </group>
      ))}
      {[3.0, 4.5].map((x) => <Bx key={x} p={[x, 0.55, 1.5]} s={[0.1, 0.9, 2.6]} c="#a8764c" />)}
      {[3.75, 5.25].map((x) => <Bx key={x} p={[x, 0.3, 0.55]} s={[1.0, 0.3, 0.4]} c="#8a5e3c" />)}
      {[3.75, 5.25].map((x) => <Bx key={'w' + x} p={[x, 0.36, 0.55]} s={[0.86, 0.06, 0.28]} c="#6cc3d8" />)}
      <mesh position={[5.3, 0.4, 3.9]} castShadow><cylinderGeometry args={[0.26, 0.3, 0.6, 12]} /><meshStandardMaterial color="#c9ccd4" roughness={0.5} metalness={0.4} /></mesh>
      <mesh position={[5.3, 0.74, 3.9]}><cylinderGeometry args={[0.2, 0.26, 0.1, 12]} /><meshStandardMaterial color="#c9ccd4" metalness={0.4} /></mesh>
      <mesh position={[1.0, 0.18, 3.8]} castShadow><cylinderGeometry args={[0.16, 0.12, 0.2, 10]} /><meshStandardMaterial color="#8a5e3c" /></mesh>
      <Bx p={[0.45, 0.9, 2.8]} s={[0.06, 1.7, 0.06]} c="#8a5e3c" /><Bx p={[0.45, 1.72, 2.8]} s={[0.4, 0.05, 0.05]} c="#b8bcc4" />
      <Props items={[['plant', 5.4, 2.8, 0, 0]]} />
    </>);
    case 'shroomhouse': return (<>
      <Bx p={[2.0, 0.75, 0.5]} s={[3.5, 0.07, 0.55]} c="#8a5e3c" />
      <Bx p={[2.0, 1.35, 0.45]} s={[3.5, 0.07, 0.45]} c="#8a5e3c" />
      {[0.4, 2.0, 3.6].map((x) => <Bx key={x} p={[x, 0.7, 0.45]} s={[0.06, 1.3, 0.4]} c="#6b4630" />)}
      {[[0.7, 0.8], [1.4, 0.8], [2.3, 0.8], [3.1, 0.8], [0.9, 1.4], [1.9, 1.4], [2.9, 1.4]].map(([x, y], i) => (
        <group key={i} position={[x, y, 0.5]}>
          <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.04, 0.05, 0.16, 8]} /><meshStandardMaterial color="#f4ecd8" /></mesh>
          <mesh position={[0, 0.18, 0]} castShadow><sphereGeometry args={[0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={['#e0524a', '#c9a070', '#f4a6c0', '#bcd7ee'][i % 4]} emissive={['#e0524a', '#c9a070', '#f4a6c0', '#6ad8c0'][i % 4]} emissiveIntensity={0.35} /></mesh>
        </group>
      ))}
      <mesh position={[3.4, 0.4, 2.4]} castShadow><cylinderGeometry args={[0.26, 0.26, 0.6, 12]} /><meshStandardMaterial color="#a8764c" /></mesh>
      <mesh position={[0.5, 0.2, 2.4]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.8, 10]} /><meshStandardMaterial color="#8a5e3c" /></mesh>
    </>);
    case 'observatory': return (<>
      <mesh position={[1.5, 0.2, 1.5]} receiveShadow><cylinderGeometry args={[1.3, 1.3, 0.1, 14]} /><meshStandardMaterial color="#6f6a86" flatShading /></mesh>
      {[0, 2.1, 4.2].map((a, i) => <Bx key={i} p={[1.5 + Math.cos(a) * 0.35, 0.65, 1.5 + Math.sin(a) * 0.35]} s={[0.05, 1.0, 0.05]} c="#4a4658" rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]} />)}
      <mesh position={[1.5, 1.25, 1.5]} rotation={[0.2, 0.6, 1.2]} castShadow><cylinderGeometry args={[0.1, 0.14, 1.2, 8]} /><meshStandardMaterial color="#e9e6f2" flatShading /></mesh>
      <mesh position={[1.95, 1.4, 1.2]} rotation={[0.2, 0.6, 1.2]}><cylinderGeometry args={[0.05, 0.05, 0.06, 8]} /><meshStandardMaterial color="#6a8cff" emissive="#6a8cff" emissiveIntensity={0.8} /></mesh>
    </>);
    default: return null;
  }
}

function Roof({ b, def, hideRef }) {
  const g = useRef();
  const { w, d } = b;
  useFrame((_, dt) => {
    if (!g.current) return;
    const hide = occupied.has(b.id) || hideRef.current;
    const u = g.current.userData;
    u.o = u.o ?? 1;
    u.o += ((hide ? 0 : 1) - u.o) * Math.min(1, dt * 7);
    const vis = u.o > 0.03;
    g.current.visible = vis;
    if (vis) g.current.traverse((m) => { if (m.isMesh) { m.material.transparent = true; m.material.opacity = u.o * (m.userData.base ?? 1); } });
  });
  if (!def.roof) return null;
  const glass = def.roofType === 'glass';
  if (def.roofType === 'dome') {
    return (
      <group ref={g} position={[w / 2, def.H, d / 2]}>
        <mesh scale={[w / 2 + 0.15, 1.5, d / 2 + 0.15]} castShadow><sphereGeometry args={[1, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={def.roof} roughness={0.5} metalness={0.2} flatShading /></mesh>
        <mesh position={[0.4, 0.9, 0.5]} rotation={[0, 0.5, 0.7]}><boxGeometry args={[0.35, 1.1, 0.1]} /><meshStandardMaterial color="#2b2a40" /></mesh>
      </group>
    );
  }
  if (def.roofType === 'cap') {
    return (
      <group ref={g} position={[w / 2, def.H - 0.05, d / 2]}>
        <mesh scale={[w / 2 + 0.45, 1.25, d / 2 + 0.45]} castShadow><sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={def.roof} roughness={0.7} /></mesh>
        {[[0.3, 1.1, 0.2], [1.7, 0.95, 0.17], [3.3, 0.8, 0.15], [4.6, 1.0, 0.16], [5.6, 0.7, 0.14], [2.4, 0.55, 0.13], [0.9, 0.5, 0.15], [4.0, 0.45, 0.14]].map(([az, el, r], i) => {
          const rx = w / 2 + 0.45, rz = d / 2 + 0.45, e = el - 0.2;
          return <mesh key={i} position={[Math.cos(az) * Math.cos(e) * rx * 0.99, Math.sin(e) * 1.25 * 0.99, Math.sin(az) * Math.cos(e) * rz * 0.99]} rotation={[0, -az, 0]} scale={[r * 1.5, r * 1.1, r * 1.5]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#fffaf0" /></mesh>;
        })}
      </group>
    );
  }
  const rh = glass ? 1.0 : 1.25;
  const R = 1.14;
  return (
    <group ref={g}>
      {!glass && (<>
        <Bx p={[w / 2, def.H + 0.02, d / 2]} s={[w * R + 0.12, 0.1, d * R + 0.12]} c="#8a5e3c" />
        {[0.22, 0.45, 0.68].map((t, i) => (
          <mesh key={i} position={[w / 2, def.H + rh * t + 0.03, d / 2]} rotation={[0, Math.PI / 4, 0]} scale={[((w * R) / Math.SQRT2) * (1 - t) + 0.03, 0.09, ((d * R) / Math.SQRT2) * (1 - t) + 0.03]} castShadow>
            <coneGeometry args={[1, 1, 4]} /><meshStandardMaterial color={def.roof} roughness={1} flatShading side={2} />
          </mesh>
        ))}
        <mesh position={[w / 2, def.H + rh + 0.05, d / 2]} castShadow><icosahedronGeometry args={[0.12, 1]} /><meshStandardMaterial color="#c9a46a" flatShading /></mesh>
      </>)}
      <mesh position={[w / 2, def.H + rh / 2 - 0.02, d / 2]} rotation={[0, Math.PI / 4, 0]} scale={[(w * 1.14) / Math.SQRT2, rh, (d * 1.14) / Math.SQRT2]} castShadow userData={{ base: glass ? 0.42 : 1 }}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={def.roof} roughness={glass ? 0.1 : 0.95} flatShading side={2} />
      </mesh>
      {!glass && b.type !== 'barn' && (<>
        <Bx p={[w * 0.74, def.H + 0.85, d * 0.3]} s={[0.5, 1.1, 0.5]} c="#b8a898" />
        <Bx p={[w * 0.74, def.H + 1.45, d * 0.3]} s={[0.62, 0.12, 0.62]} c="#8f8174" />
      </>)}
      {glass && <Bx p={[w / 2, def.H + 0.02, d / 2]} s={[w * 1.02, 0.06, d * 1.02]} c="#a8764c" />}
    </group>
  );
}

function Building({ b }) {
  const def = BUILDINGS[b.type];
  const root = useRef();
  const hideRef = useRef(false);
  const { w, d } = b;
  const H = def.H;
  const glass = def.glass;
  useFrame(() => {
    const k = clamp((serverNow() - (b.builtAt || 0)) / 1800, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    if (root.current) root.current.scale.y = 0.04 + 0.96 * e;
    const s = useGame.getState();
    hideRef.current = s.tool === 'decor' || (s.tool === 'build' && !!s.buildSel);
  });
  const wallColor = def.wall;
  const wc = glass ? 0.38 : null;
  return (
    <group ref={root} position={[b.x, 0, b.z]}>
      {/* zócalo de piedra y arbustos que asientan el edificio en el terreno */}
      {!def.open && <Bx p={[w / 2, 0.03, d / 2]} s={[w + 0.34, 0.14, d + 0.34]} c="#bdb2a2" />}
      {!def.open && [[-0.28, d - 0.4], [-0.28, 0.5], [w + 0.28, 0.5], [w + 0.28, d - 0.3], [w * 0.5, d + 0.3]].map(([x, z], i) => (
        <group key={i} position={[x, 0.12, z]}>
          <mesh castShadow><icosahedronGeometry args={[0.3, 1]} /><meshStandardMaterial color={['#6fae5c', '#5fa152', '#7ab865'][i % 3]} roughness={1} flatShading /></mesh>
          <mesh position={[0.12, 0.18, 0.1]}><icosahedronGeometry args={[0.07, 0]} /><meshStandardMaterial color={['#f48aa8', '#ffe27a', '#ffffff', '#c9a6f0', '#ff9a6a'][i]} flatShading /></mesh>
        </group>
      ))}
      {/* suelo */}
      <Bx p={[w / 2, 0.06, d / 2]} s={[w, 0.12, d]} c={def.floor} />
      {/* muros traseros (oeste y norte): vista de casa de muñecas */}
      {!def.open && (<>
        <Bx p={[0.08, H / 2, d / 2]} s={[0.16, H, d]} c={wallColor} o={wc} />
        <Bx p={[w / 2, H / 2, 0.08]} s={[w, H, 0.16]} c={wallColor} o={wc} />
        <Bx p={[0.1, 0.15, d / 2]} s={[0.2, 0.3, d + 0.04]} c="#a8764c" />
        <Bx p={[w / 2, 0.15, 0.1]} s={[w + 0.04, 0.3, 0.2]} c="#a8764c" />
        {/* zócalo de color y entramado de madera */}
        <Bx p={[0.1, 0.42, d / 2]} s={[0.2, 0.5, d - 0.1]} c="#c9b8a0" />
        <Bx p={[w / 2, 0.42, 0.1]} s={[w - 0.1, 0.5, 0.2]} c="#c9b8a0" />
        <Bx p={[0.1, H - 0.18, d / 2]} s={[0.21, 0.1, d]} c="#8a5e3c" />
        <Bx p={[w / 2, H - 0.18, 0.1]} s={[w, 0.1, 0.21]} c="#8a5e3c" />
        {Array.from({ length: Math.max(2, Math.round(w / 1.4)) }, (_, i) => <Bx key={'bn' + i} p={[0.3 + (i * (w - 0.6)) / (Math.max(2, Math.round(w / 1.4)) - 1), H / 2, 0.1]} s={[0.1, H - 0.2, 0.21]} c="#8a5e3c" />)}
        {Array.from({ length: Math.max(2, Math.round(d / 1.4)) }, (_, i) => <Bx key={'bw' + i} p={[0.1, H / 2, 0.3 + (i * (d - 0.6)) / (Math.max(2, Math.round(d / 1.4)) - 1)]} s={[0.21, H - 0.2, 0.1]} c="#8a5e3c" />)}
        <WallArt p={[w * 0.5, 1.45, 0.18]} c1={wallColor} />
        {/* escalones y felpudo de entrada */}
        <Bx p={[w / 2, 0.05, d + 0.22]} s={[Math.min(1.6, w - 1), 0.1, 0.44]} c="#bdb2a2" />
        <Bx p={[w / 2, 0.09, d + 0.02]} s={[Math.min(1.2, w - 1.4), 0.04, 0.5]} c="#b86a55" />
        <Lantern p={[w - 0.08, 1.75, d - 0.08]} />
        {/* esquinas */}
        <Bx p={[0.1, H + 0.04, 0.1]} s={[0.26, 0.1, 0.26]} c="#a8764c" />
        {!glass && <Window p={[Math.min(w - 1, 1.5), 1.35, 0.18]} />}
        {!glass && w >= 4 && <Window p={[w - 1.0, 1.35, 0.18]} />}
        {!glass && <Window p={[0.18, 1.35, d - 1.1]} rot={Math.PI / 2} />}
        {/* esquinas delanteras */}
        {[[w - 0.08, d - 0.08], [w - 0.08, 0.08], [0.08, d - 0.08]].map(([x, z], i) => <Bx key={i} p={[x, H / 2, z]} s={[0.14, H, 0.14]} c={glass ? '#a8764c' : '#c99a68'} />)}
      </>)}
      {def.open && b.type === 'terrace' && (<>
        <Bx p={[0.06, 0.55, d / 2]} s={[0.1, 0.1, d]} c="#8a5e3c" />
        <Bx p={[w / 2, 0.55, 0.06]} s={[w, 0.1, 0.1]} c="#8a5e3c" />
        {Array.from({ length: 5 }, (_, i) => <Bx key={i} p={[0.1 + (i * (w - 0.2)) / 4, 0.3, 0.06]} s={[0.07, 0.6, 0.07]} c="#8a5e3c" />)}
        {Array.from({ length: 4 }, (_, i) => <Bx key={i} p={[0.06, 0.3, 0.3 + (i * (d - 0.4)) / 3]} s={[0.07, 0.6, 0.07]} c="#8a5e3c" />)}
      </>)}
      {def.open && b.type === 'garden' && (<>
        <Bx p={[0.3, 0.4, d / 2]} s={[0.6, 0.8, d]} c="#6aa85a" />
        <Bx p={[w / 2, 0.4, 0.3]} s={[w, 0.8, 0.6]} c="#6aa85a" />
        <Bx p={[w - 0.3, 0.3, d - 0.3]} s={[0.5, 0.6, 0.5]} c="#6aa85a" />
      </>)}
      {interiorFor(b.type, w, d)}
      {(b.type === 'house' || b.type === 'bedroom') && <Wardrobe p={[0.5, 0.12, 3.15]} />}
      {({ house: [[0.95, 1.3]], bedroom: [[1.0, 1.4], [2.95, 1.4]] }[b.type] || []).map(([lx, lz], i) => (
        <mesh key={'bed' + i} position={[lx, 0.5, lz]}
          onClick={(e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); sleepAt({ id: b.id + ':' + i, x: b.x + lx, z: b.z + lz, rot: 0 }); }}
          onPointerOver={() => { if (useGame.getState().tool === 'interact') document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = ''; }}>
          <boxGeometry args={[1.3, 0.9, 2]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {def.roofType === 'pyramid' && b.type !== 'barn' && <Smoke p={[w * 0.74, def.H + 1.6, d * 0.3]} />}
      <Roof b={b} def={def} hideRef={hideRef} />
    </group>
  );
}

export default function Buildings() {
  const buildings = useGame((s) => s.buildings);
  return <group>{Object.values(buildings).filter((b) => BUILDINGS[b.type]).map((b) => <Building key={b.id} b={b} />)}</group>;
}
