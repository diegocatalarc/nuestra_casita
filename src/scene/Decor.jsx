import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../store/gameStore';
import { DECOR } from '../game/constants';
import { useKGeo } from '../game/models';
import { rbGeo } from './rb';
import { sleepAt } from '../game/actions';
import ContactShadow from './shadow';

const B = ({ p, s, c, r, rough = 0.95, meshRef, ...rest }) => (
  <mesh ref={meshRef} position={p} rotation={r} geometry={rbGeo(s[0], s[1], s[2])} castShadow receiveShadow {...rest}>
    <meshStandardMaterial vertexColors color={c} roughness={rough} />
  </mesh>
);
const Ball = ({ p, r = 0.1, c, s = [1, 1, 1], d = 1 }) => (
  <mesh position={p} scale={s} castShadow><icosahedronGeometry args={[r, d]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>
);

/** Balanceo suave (hojas, telas) */
function Sway({ children, amp = 0.04, speed = 1.4, pivot = [0, 0, 0] }) {
  const g = useRef();
  useFrame((s) => { if (g.current) { const t = s.clock.elapsedTime; g.current.rotation.z = Math.sin(t * speed + pivot[0] * 3) * amp; g.current.rotation.x = Math.cos(t * speed * 0.8) * amp * 0.6; } });
  return <group ref={g} position={pivot}>{children}</group>;
}

const kmap = (() => { const t = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}models/Textures/colormap.png`); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t; })();
const kmat = new THREE.MeshStandardMaterial({ map: kmap, roughness: 0.9 });
/** Modelos de Kenney (CC0) */
function KModel({ name, scale = 1 }) {
  const geo = useKGeo(name);
  return <mesh geometry={geo} material={kmat} scale={scale} castShadow receiveShadow />;
}

const lighten = (c, k) => '#' + new THREE.Color(c).offsetHSL(0, 0, k).getHexString();
const darken = (c, k) => lighten(c, -k);

/** Modelos low-poly con bordes suavizados. Frente hacia +z, huella w×d centrada en el origen. */
/**
 * Objetos fabricados: se dibujan a partir de la lista de piezas de su definición.
 * Pieza = [forma, posición, tamaño, color, opciones]
 *  formas: b caja · c cilindro · o elipsoide (r,sx,sy,sz) · k cono (r,h) · t toro (R,tubo) · g cristal (caja translúcida) · d octaedro (r)
 *  color: '#hex' · 'v' color elegido · 'v+' más claro · 'v-' más oscuro
 *  opciones: r:[rx,ry,rz] giro · anim:'sway'|'spin'|'bob'|'flutter'|'glow'|'swim'|'pulse' · glow:true (brilla) · op:opacidad
 */
const GLASS = new THREE.MeshStandardMaterial({ color: '#d6f1fa', transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.15, depthWrite: false });
import { WINMAT, LAMPMAT } from './nightmats';
const tints = new Map();
const tint = (c, op) => { const k = c + op; if (!tints.has(k)) tints.set(k, new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: op, roughness: 0.1, depthWrite: false })); return tints.get(k); };
function Part({ part, c }) {
  const [k, p, sz, col, o = {}] = part;
  const ref = useRef();
  const cc = col === 'v' ? c : col === 'v+' ? lighten(c, 0.1) : col === 'v-' ? darken(c, 0.12) : col;
  useFrame((s) => {
    const g = ref.current; if (!g || !o.anim) return;
    const t = s.clock.elapsedTime, ph = (p[0] * 3.1 + p[2] * 1.7);
    if (o.anim === 'sway') g.rotation.z = (o.r?.[2] || 0) + Math.sin(t * 1.6 + ph) * (o.amp ?? 0.06);
    else if (o.anim === 'spin') g.rotation.y = t * (o.amp ?? 0.6);
    else if (o.anim === 'spinz') g.rotation.z = (o.r?.[2] || 0) + t * (o.amp ?? 0.5);
    else if (o.anim === 'bob') g.position.y = p[1] + Math.sin(t * 2 + ph) * (o.amp ?? 0.04);
    else if (o.anim === 'flutter') { g.rotation.y = (o.r?.[1] || 0) + Math.sin(t * 2.6 + ph) * (o.amp ?? 0.18); g.rotation.x = (o.r?.[0] || 0) + Math.sin(t * 1.9 + ph) * 0.05; }
    else if (o.anim === 'swim') { g.position.x = p[0] + Math.sin(t * (o.speed ?? 0.9) + ph) * (o.amp ?? 0.4); g.rotation.y = Math.cos(t * (o.speed ?? 0.9) + ph) > 0 ? 0 : Math.PI; }
    else if (o.anim === 'pulse') g.scale.setScalar(1 + Math.sin(t * 3 + ph) * (o.amp ?? 0.06));
    else if (o.anim === 'glow' && g.material) g.material.opacity = 0.55 + Math.sin(t * 2.4 + ph) * 0.2;
  });
  const rot = o.r;
  if (o.win || o.lamp) return <mesh ref={ref} position={p} rotation={rot} material={o.win ? WINMAT : LAMPMAT} geometry={k === 'c' ? new THREE.CylinderGeometry(sz[0], sz[0], sz[1], 14) : rbGeo(sz[0], sz[1], sz[2])} />;
  if (k === 'b') return <B p={p} s={sz} c={cc} r={rot} meshRef={ref} />;
  if (k === 'g') return <mesh ref={ref} position={p} rotation={rot} geometry={rbGeo(sz[0], sz[1], sz[2])} material={col ? tint(col, o.op ?? 0.3) : GLASS} renderOrder={2} />;
  if (o.glow) {
    const geo = k === 'o' ? <icosahedronGeometry args={[sz[0], 1]} /> : k === 'd' ? <octahedronGeometry args={[sz[0], 0]} /> : <sphereGeometry args={[sz[0], 8, 6]} />;
    return <mesh ref={ref} position={p} rotation={rot} scale={[sz[1] ?? 1, sz[2] ?? 1, sz[3] ?? 1]}>{geo}<meshBasicMaterial color={cc} transparent opacity={o.op ?? 0.85} toneMapped={false} depthWrite={false} /></mesh>;
  }
  const mat = <meshStandardMaterial color={cc} roughness={o.rough ?? 0.85} metalness={o.metal ?? 0} flatShading={k === 'd'} />;
  if (k === 'c') return <mesh ref={ref} position={p} rotation={rot} castShadow receiveShadow><cylinderGeometry args={[sz[0], sz[2] ?? sz[0], sz[1], o.seg ?? 14]} />{mat}</mesh>;
  if (k === 'k') return <mesh ref={ref} position={p} rotation={rot} castShadow><coneGeometry args={[sz[0], sz[1], o.seg ?? 10]} />{mat}</mesh>;
  if (k === 't') return <mesh ref={ref} position={p} rotation={rot} castShadow><torusGeometry args={[sz[0], sz[1], 8, 20, sz[2] ?? Math.PI * 2]} />{mat}</mesh>;
  if (k === 'd') return <mesh ref={ref} position={p} rotation={rot} scale={[sz[1] ?? 1, sz[2] ?? 1, sz[3] ?? 1]} castShadow><octahedronGeometry args={[sz[0], 0]} />{mat}</mesh>;
  return <mesh ref={ref} position={p} rotation={rot} scale={[sz[1] ?? 1, sz[2] ?? 1, sz[3] ?? 1]} castShadow><icosahedronGeometry args={[sz[0], 1]} />{mat}</mesh>;
}
/** Lista de piezas suelta (descubrimientos y pueblo) */
export function PartsList({ parts, c = '#b98254' }) {
  return <group>{parts.map((pt, i) => <Part key={i} part={pt} c={c} />)}</group>;
}
function PartsModel({ def, variant }) {
  const c = def.colors[variant % def.colors.length];
  return <group>{def.parts.map((pt, i) => <Part key={i} part={pt} c={c} />)}</group>;
}

export function DecorModel({ type, variant = 0 }) {
  const c = DECOR[type].colors[variant % 3];
  const fire = useRef(), ember = useRef();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (fire.current) { fire.current.scale.y = 1 + Math.sin(t * 11) * 0.15 + Math.sin(t * 7) * 0.1; fire.current.rotation.z = Math.sin(t * 5) * 0.06; }
    if (ember.current) ember.current.material.opacity = 0.6 + Math.sin(t * 9) * 0.3;
  });
  if (DECOR[type].model) return <KModel name={DECOR[type].model} scale={DECOR[type].scale} />;
  if (DECOR[type].parts) return <PartsModel key={type} def={DECOR[type]} variant={variant} />;
  switch (type) {
    case 'sofa': return (
      <group>
        {[[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.32], [0.8, 0.32]].map(([x, z], i) => <B key={i} p={[x, 0.06, z]} s={[0.1, 0.12, 0.1]} c="#6b5040" />)}
        <B p={[0, 0.25, 0]} s={[1.9, 0.26, 0.82]} c={darken(c, 0.04)} />
        <B p={[0, 0.62, -0.31]} s={[1.9, 0.56, 0.24]} c={c} />
        <B p={[-0.9, 0.42, 0]} s={[0.22, 0.46, 0.82]} c={c} />
        <B p={[0.9, 0.42, 0]} s={[0.22, 0.46, 0.82]} c={c} />
        <B p={[-0.38, 0.45, 0.06]} s={[0.72, 0.16, 0.6]} c={lighten(c, 0.1)} />
        <B p={[0.38, 0.45, 0.06]} s={[0.72, 0.16, 0.6]} c={lighten(c, 0.1)} />
        <B p={[-0.38, 0.72, -0.14]} s={[0.7, 0.3, 0.1]} c={lighten(c, 0.06)} r={[-0.18, 0, 0]} />
        <B p={[0.38, 0.72, -0.14]} s={[0.7, 0.3, 0.1]} c={lighten(c, 0.06)} r={[-0.18, 0, 0]} />
        <B p={[-0.68, 0.66, 0.06]} s={[0.28, 0.28, 0.12]} c="#ffd98a" r={[0, 0.4, 0.25]} />
        <B p={[0.7, 0.62, 0.08]} s={[0.26, 0.26, 0.12]} c="#f4a6c0" r={[0, -0.4, -0.2]} />
        <B p={[0.5, 0.58, 0.18]} s={[0.55, 0.05, 0.42]} c="#fff4e6" r={[0, 0.15, 0]} />
      </group>
    );
    case 'table': return (
      <group>
        <B p={[0, 0.72, 0]} s={[1.4, 0.08, 0.9]} c={c} />
        <B p={[0, 0.66, 0]} s={[1.2, 0.06, 0.7]} c={darken(c, 0.08)} />
        {[[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].map(([x, z], i) => <B key={i} p={[x, 0.34, z]} s={[0.08, 0.68, 0.08]} c={darken(c, 0.06)} />)}
        <B p={[0, 0.765, 0]} s={[1.1, 0.012, 0.32]} c="#e8a0a8" />
        <mesh position={[-0.3, 0.8, 0.1]} castShadow><cylinderGeometry args={[0.12, 0.09, 0.025, 14]} /><meshStandardMaterial color="#fffaf0" /></mesh>
        <mesh position={[0.35, 0.8, -0.1]} castShadow><cylinderGeometry args={[0.045, 0.04, 0.08, 10]} /><meshStandardMaterial color="#9ab8d8" /></mesh>
        <mesh position={[0.05, 0.87, 0]} castShadow><cylinderGeometry args={[0.08, 0.06, 0.16, 10]} /><meshStandardMaterial color="#e8e0d0" /></mesh>
        {[[0, 0.99, 0], [0.05, 0.97, 0.05], [-0.05, 0.96, -0.02]].map(([x, y, z], i) => <Ball key={i} p={[0.05 + x, y, z]} r={0.055} c={['#f48aa8', '#ffe27a', '#ffffff'][i]} d={0} />)}
      </group>
    );
    case 'lamp': return (
      <group>
        <mesh position={[0, 0.03, 0]} castShadow><cylinderGeometry args={[0.16, 0.19, 0.06, 12]} /><meshStandardMaterial color="#6b5040" roughness={0.8} /></mesh>
        <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.06, 0.1, 0.06, 10]} /><meshStandardMaterial color="#8a6a50" /></mesh>
        <mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[0.018, 0.022, 1.0, 6]} /><meshStandardMaterial color="#6b5040" /></mesh>
        <mesh position={[0, 1.13, 0]} castShadow><cylinderGeometry args={[0.15, 0.26, 0.32, 14, 1, true]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} side={2} /></mesh>
        <mesh position={[0, 1.3, 0]}><sphereGeometry args={[0.035, 8, 6]} /><meshStandardMaterial color="#c9a46a" /></mesh>
        <mesh position={[0, 1.08, 0]}><icosahedronGeometry args={[0.075, 1]} /><meshBasicMaterial color="#fff2c0" toneMapped={false} /></mesh>
      </group>
    );
    case 'plant': return (
      <group>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.2, 0.2, 0.04, 14]} /><meshStandardMaterial color={darken(c, 0.1)} /></mesh>
        <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.14, 0.32, 14]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>
        <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.215, 0.215, 0.05, 14]} /><meshStandardMaterial color={lighten(c, 0.05)} /></mesh>
        <mesh position={[0, 0.375, 0]}><cylinderGeometry args={[0.17, 0.17, 0.03, 12]} /><meshStandardMaterial color="#5a3b27" /></mesh>
        <Sway amp={0.035} pivot={[0, 0.38, 0]}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = i * 2.4, r = 0.05 + (i % 3) * 0.055, h = 0.45 + (i % 4) * 0.13;
            return <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55]}>
              <Ball p={[0, h * 0.7, 0]} r={0.12 + (i % 2) * 0.03} c={['#5fae55', '#76c262', '#4f9a4a', '#8fd16a'][i % 4]} s={[0.7, 1.4, 0.35]} d={1} />
              <B p={[0, h * 0.32, 0]} s={[0.018, h * 0.7, 0.018]} c="#4f9a4a" />
            </group>;
          })}
          {[[0.08, 0.57, 0.06], [-0.1, 0.47, -0.05], [0.0, 0.66, -0.1]].map(([x, y, z], i) => <Ball key={i} p={[x, y, z]} r={0.065} c={['#f48aa8', '#ffe27a', '#ffffff'][i]} d={1} />)}
        </Sway>
      </group>
    );
    case 'painting': return (
      <group>
        <B p={[-0.3, 0.45, -0.1]} s={[0.05, 0.9, 0.05]} c="#8a5e3c" r={[0.15, 0, 0]} />
        <B p={[0.3, 0.45, -0.1]} s={[0.05, 0.9, 0.05]} c="#8a5e3c" r={[0.15, 0, 0]} />
        <B p={[0, 0.2, 0.06]} s={[0.7, 0.04, 0.12]} c="#8a5e3c" />
        <B p={[0, 0.78, 0]} s={[0.92, 0.72, 0.06]} c="#8a5e3c" />
        <B p={[0, 0.78, 0.02]} s={[0.82, 0.62, 0.04]} c="#e8c987" />
        <mesh position={[0, 0.78, 0.045]}><planeGeometry args={[0.74, 0.54]} /><meshStandardMaterial color="#cfe8f5" /></mesh>
        <mesh position={[0, 0.65, 0.047]}><planeGeometry args={[0.74, 0.26]} /><meshStandardMaterial color={c} /></mesh>
        <mesh position={[-0.12, 0.74, 0.05]}><coneGeometry args={[0.2, 0.22, 3]} /><meshStandardMaterial color={darken(c, 0.12)} /></mesh>
        <mesh position={[0.2, 0.92, 0.052]}><circleGeometry args={[0.09, 14]} /><meshBasicMaterial color="#ffe27a" /></mesh>
      </group>
    );
    case 'rug': return (
      <group>
        <B p={[0, 0.02, 0]} s={[2, 0.035, 1.4]} c={c} />
        <B p={[0, 0.045, 0]} s={[1.76, 0.035, 1.16]} c="#fff4e6" />
        <B p={[0, 0.065, 0]} s={[1.5, 0.035, 0.9]} c={c} />
        <B p={[0, 0.085, 0]} s={[1.2, 0.03, 0.62]} c={lighten(c, 0.1)} />
        {Array.from({ length: 9 }, (_, i) => [<B key={'a' + i} p={[-1.03, 0.02, -0.56 + i * 0.14]} s={[0.1, 0.02, 0.05]} c="#fff4e6" />, <B key={'b' + i} p={[1.03, 0.02, -0.56 + i * 0.14]} s={[0.1, 0.02, 0.05]} c="#fff4e6" />])}
        {[-0.45, 0, 0.45].map((x, i) => <Ball key={i} p={[x, 0.1, 0]} r={0.07} c="#fff4e6" s={[1, 0.25, 1]} d={0} />)}
      </group>
    );
    case 'bed': return (
      <group>
        {[[-0.55, -0.9], [0.55, -0.9], [-0.55, 0.9], [0.55, 0.9]].map(([x, z], i) => <B key={i} p={[x, 0.07, z]} s={[0.1, 0.14, 0.1]} c="#8a5e3c" />)}
        <B p={[0, 0.24, 0]} s={[1.3, 0.22, 2]} c="#b98254" />
        <B p={[0, 0.62, -0.96]} s={[1.3, 0.82, 0.1]} c="#a8714a" />
        <B p={[0, 1.06, -0.96]} s={[1.34, 0.08, 0.14]} c="#8a5e3c" />
        <B p={[0, 0.2, 0.96]} s={[1.3, 0.3, 0.08]} c="#a8714a" />
        <B p={[0, 0.45, 0.03]} s={[1.18, 0.22, 1.82]} c="#fff4e6" />
        <B p={[0, 0.58, 0.4]} s={[1.22, 0.14, 1.24]} c={c} />
        <B p={[0, 0.66, 0.3]} s={[1.22, 0.06, 0.22]} c={lighten(c, 0.12)} />
        <B p={[-0.3, 0.62, -0.68]} s={[0.5, 0.16, 0.34]} c="#ffffff" r={[0.1, 0.05, 0]} />
        <B p={[0.3, 0.62, -0.68]} s={[0.5, 0.16, 0.34]} c="#fdf1f4" r={[0.1, -0.05, 0]} />
        <Ball p={[0, 0.74, 0.7]} r={0.1} c="#ffd98a" s={[1.4, 0.8, 1]} d={1} />
      </group>
    );
    case 'crib': return (
      <group>
        {[[-0.45, -0.7], [0.45, -0.7], [-0.45, 0.7], [0.45, 0.7]].map(([x, z], i) => <B key={i} p={[x, 0.4, z]} s={[0.07, 0.8, 0.07]} c="#e8d3b0" />)}
        <B p={[0, 0.3, 0]} s={[0.95, 0.06, 1.45]} c="#e8d3b0" />
        <B p={[0, 0.36, 0]} s={[0.85, 0.1, 1.35]} c="#fff4e6" />
        <B p={[0, 0.43, 0.25]} s={[0.86, 0.06, 0.8]} c={c} />
        {[-0.45, 0.45].map((x) => <B key={x} p={[x, 0.58, 0]} s={[0.04, 0.05, 1.4]} c="#e8d3b0" />)}
        {Array.from({ length: 7 }, (_, i) => [-0.45, 0.45].map((x) => <B key={x + '-' + i} p={[x, 0.5, -0.62 + i * 0.2]} s={[0.025, 0.3, 0.025]} c="#e8d3b0" />))}
        <B p={[0, 0.65, -0.72]} s={[0.95, 0.5, 0.05]} c="#e8d3b0" />
        <B p={[0, 0.5, 0.72]} s={[0.95, 0.3, 0.05]} c="#e8d3b0" />
        <group position={[0, 1.2, 0]}>
          <B p={[0, 0, 0]} s={[0.6, 0.03, 0.03]} c="#e8d3b0" />
          {[-0.22, 0, 0.22].map((x, i) => <group key={i} position={[x, -0.15 - (i % 2) * 0.05, 0]}><B p={[0, 0.1, 0]} s={[0.01, 0.2, 0.01]} c="#fff" /><Ball p={[0, 0, 0]} r={0.06} c={['#ffd98a', '#f4a6c0', '#bcd7ee'][i]} d={0} /></group>)}
        </group>
        <B p={[0.2, 0.56, -0.4]} s={[0.3, 0.12, 0.22]} c="#ffffff" />
      </group>
    );
    case 'fireplace': return (
      <group>
        <B p={[0, 0.55, 0]} s={[1.6, 1.1, 0.8]} c={c} rough={1} />
        {[0.16, 0.4, 0.64, 0.88].map((y, i) => <B key={i} p={[0, y, 0.405]} s={[1.58, 0.02, 0.01]} c={darken(c, 0.14)} />)}
        {[-0.6, -0.35, 0.4, 0.62].map((x, i) => [0.28, 0.52, 0.76].map((y, j) => <B key={i + '-' + j} p={[x + (j % 2) * 0.1, y, 0.406]} s={[0.012, 0.2, 0.01]} c={darken(c, 0.14)} />))}
        <B p={[0, 1.14, 0.05]} s={[1.84, 0.1, 0.94]} c="#8a5e3c" />
        <B p={[0, 0.4, 0.36]} s={[0.92, 0.62, 0.2]} c="#2b2024" />
        <B p={[-0.2, 0.12, 0.42]} s={[0.46, 0.09, 0.09]} c="#6b4630" r={[0, 0.2, 0]} />
        <B p={[0.15, 0.13, 0.44]} s={[0.4, 0.08, 0.09]} c="#7a5238" r={[0, -0.25, 0]} />
        <mesh ref={ember} position={[0, 0.17, 0.42]}><boxGeometry args={[0.6, 0.04, 0.12]} /><meshBasicMaterial color="#ff7a3c" transparent opacity={0.8} toneMapped={false} /></mesh>
        <group ref={fire} position={[0, 0.2, 0.4]}>
          <mesh position={[0, 0.18, 0]}><coneGeometry args={[0.2, 0.46, 6]} /><meshBasicMaterial color="#ff9a3c" toneMapped={false} /></mesh>
          <mesh position={[0.1, 0.12, 0]}><coneGeometry args={[0.1, 0.3, 6]} /><meshBasicMaterial color="#ffd36a" toneMapped={false} /></mesh>
          <mesh position={[-0.12, 0.1, 0]}><coneGeometry args={[0.08, 0.24, 6]} /><meshBasicMaterial color="#ffb347" toneMapped={false} /></mesh>
        </group>
        <Ball p={[-0.55, 1.28, 0]} r={0.08} c="#e8e0d0" d={1} /><B p={[0.5, 1.26, 0]} s={[0.16, 0.14, 0.12]} c="#c9d8e8" />
      </group>
    );
    default: return null;
  }
}

function DecorItem({ o }) {
  const tool = useGame((s) => s.tool);
  const sel = useGame((s) => s.decorSel);
  const editing = tool === 'decor' && !sel;
  return (
    <group
      position={[o.x, 0.0, o.z]} rotation={[0, (o.rot || 0) * Math.PI / 2, 0]}
      onClick={(e) => { if (editing) { e.stopPropagation(); return; } const st = DECOR[o.type].station; if (useGame.getState().tool !== 'interact') return; if (st) { e.stopPropagation(); useGame.getState().set({ panel: 'craft', craftTab: st }); } else if (o.type === 'bed') { e.stopPropagation(); sleepAt({ id: o.id, x: o.x, z: o.z, rot: o.rot || 0 }); } }}
      onPointerDown={(e) => { if (editing) { e.stopPropagation(); useGame.getState().set({ selId: o.id, dragId: o.id, moveMode: false, dragStart: { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }, decorRot: o.rot || 0, decorVariant: o.variant || 0 }); } }}
      onPointerOver={() => { if (editing) document.body.style.cursor = 'grab'; else if ((DECOR[o.type].station || o.type === 'bed') && useGame.getState().tool === 'interact') document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      {!DECOR[o.type].flat && <ContactShadow w={DECOR[o.type].w} d={DECOR[o.type].d} />}
      <DecorModel type={o.type} variant={o.variant || 0} />
    </group>
  );
}

/** Anillo pulsante bajo el objeto seleccionado */
function SelectRing({ o }) {
  const g = useRef();
  const size = Math.max(DECOR[o.type]?.w || 1, DECOR[o.type]?.d || 1) * 0.75 + 0.25;
  useFrame((s) => { if (g.current) g.current.scale.setScalar(size * (1 + Math.sin(s.clock.elapsedTime * 5) * 0.05)); });
  return (
    <group position={[o.x, 0.05, o.z]}>
      <mesh ref={g} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.9, 1, 32]} /><meshBasicMaterial color="#ffd23a" transparent opacity={0.9} depthWrite={false} toneMapped={false} /></mesh>
    </group>
  );
}

export default function DecorLayer() {
  const decor = useGame((s) => s.decor);
  const dragId = useGame((s) => s.dragId);
  const selId = useGame((s) => s.selId);
  const sel = selId && decor[selId];
  return (
    <group>
      {Object.values(decor).filter((o) => o.id !== dragId).map((o) => <DecorItem key={o.id} o={o} />)}
      {sel && sel.id !== dragId && <SelectRing o={sel} />}
    </group>
  );
}

/** Fantasma translúcido (verde válido / rojo inválido). */
export function Ghost({ type, variant, rot, x, z, valid }) {
  const g = useRef();
  useEffect(() => {
    g.current.traverse((o) => {
      if (!o.isMesh) return;
      if (!o.userData.orig) o.userData.orig = o.material;
      o.material = o.userData.orig.clone();
      o.material.transparent = true; o.material.opacity = 0.62; o.material.depthWrite = false;
      if (o.material.emissive) { o.material.emissive.set(valid ? '#38d66b' : '#ff4a4a'); o.material.emissiveIntensity = 0.5; }
    });
  }, [type, variant, valid]);
  return <group ref={g} position={[x, 0.01, z]} rotation={[0, rot * Math.PI / 2, 0]}><DecorModel type={type} variant={variant} /></group>;
}
