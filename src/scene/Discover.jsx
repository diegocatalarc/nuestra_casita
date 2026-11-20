import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { TOWN_BUILDINGS, DECOR } from '../game/constants';
import { L } from '../game/lighting';
import { POI_PARTS, TOWN_PARTS, PLAZA_PARTS, LAMPPOST, tree } from '../game/worldParts';
import { PartsList } from './Decor';
import { updateNightMats } from './nightmats';
import { rbGeo } from './rb';
import ContactShadow from './shadow';
import Avatar from './Avatar';

/** Antes ocultaba lo no descubierto (niebla, retirada a petición de la persona usuaria). Ahora dibuja siempre; se conserva para no tocar a los llamadores. */
export function Reveal({ children }) {
  return children;
}

const hashRot = (x, z) => (((x * 12.9898 + z * 78.233) % 6.28) + 6.28) % 6.28;
const Cob = ({ x, z, c }) => <mesh position={[x + 0.5, 0.03, z + 0.5]} geometry={rbGeo(0.96, 0.06, 0.96)} receiveShadow><meshStandardMaterial vertexColors color={c} roughness={1} /></mesh>;

/** Luces de las farolas de la Calle Mayor */
export const TOWN_LIGHTS = [53, 59, 65, 71, 77].flatMap((x) => [[x, 22.4], [x, 25.7]]).map(([x, z]) => ({ x, y: 1.5, z, c: '#ffcf8a', base: 0.8, dayMul: 0 }));

function Pois() {
  const pois = useGame((s) => s.world?.pois) || [];
  const found = useGame((s) => s.couple?.discovered) || {};
  return (
    <group>
      {pois.map((p) => (
        <Reveal key={p.id} pts={[[p.x, p.z]]}>
          <group position={[p.x, 0, p.z]} rotation={[0, hashRot(p.x, p.z), 0]}>
            <ContactShadow w={3.2} d={3.2} k={1.2} />
            <PartsList parts={POI_PARTS[p.kind] || []} />
            {!found[p.id] && <Html position={[0, 2.4, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[3, 0]}><div className="gift-tag">❔</div></Html>}
          </group>
        </Reveal>
      ))}
    </group>
  );
}

function TownCobbles() {
  const tiles = useMemo(() => {
    const o = [];
    for (let z = 17; z <= 22; z++) for (let x = 55; x <= 65; x++) if (Math.hypot(x - 60, (z - 19.5) * 1.15) < 5.6) o.push([x, z]);
    for (const [x, z0, z1] of [[53, 20, 22], [54, 25, 25], [59, 25, 25], [70, 19, 22], [47, 22, 22]]) for (let z = z0; z <= z1; z++) o.push([x, z]);
    for (let x = 51; x <= 78; x++) { o.push([x, 22]); o.push([x, 25]); }
    return o;
  }, []);
  return <group>{tiles.map(([x, z], i) => <Cob key={i} x={x} z={z} c={['#d6cdbb', '#cfc5b0', '#dcd3c2'][(x * 3 + z) % 3]} />)}</group>;
}

function Orchard() {
  const parts = useMemo(() => {
    const o = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) o.push(...tree(52.5 + i * 1.9, 8.5 + j * 2.2, 0.95, '#6fae5c', '#e0524a'));
    return o;
  }, []);
  return <PartsList parts={parts} />;
}

function Playground() {
  return (
    <group position={[75.5, 0, 20]}>
      <group position={[-0.8, 0, 0]}><PartsList parts={DECOR.d_swing.parts} c="#b98254" /></group>
      <PartsList parts={[
        ['b', [1.4, 0.55, 0], [0.9, 0.08, 1.4], '#e86a6a', { r: [0, 0, 0.3] }], ['b', [1.4, 0.15, 0], [0.12, 0.3, 0.12], '#6a6a7a'],
        ['b', [0.3, 1.0, 1.0], [0.5, 0.06, 0.5], '#b98254'], ['b', [0.3, 0.5, 1.2], [0.07, 1.0, 0.07], '#8a5e3c'], ['b', [-0.1, 0.5, 1.2], [0.07, 1.0, 0.07], '#8a5e3c'],
        ['b', [1.2, 0.5, 1.15], [0.6, 0.06, 1.3], '#6a9bd9', { r: [0.25, 0, 0] }],
        ['c', [-1.8, 0.1, 1.4], [0.5, 0.2], '#e8d4a0'],
      ]} />
    </group>
  );
}

function Town() {
  const b = TOWN_BUILDINGS;
  return (
    <group>
      <Reveal pts={[[53, 23], [58, 21], [66, 22], [75, 23]]}>
        <TownCobbles />
        {TOWN_LIGHTS.map((q, i) => <group key={i} position={[q.x, 0, q.z]}><PartsList parts={LAMPPOST} /></group>)}
        <Reveal pts={[[60, 19.5]]}><group position={[60, 0, 19.5]}><ContactShadow w={3} d={3} /><PartsList parts={PLAZA_PARTS} /></group></Reveal>
        {[[57.2, 18.2, 0], [62.8, 18.2, 0], [57.2, 21.4, PI], [62.8, 21.4, PI]].map(([x, z, r], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}><PartsList parts={[['b', [0, 0.45, 0], [1.2, 0.08, 0.4], '#b98254'], ['b', [0, 0.75, -0.18], [1.2, 0.35, 0.06], '#a8764c'], ['b', [-0.5, 0.2, 0], [0.08, 0.4, 0.36], '#6b4630'], ['b', [0.5, 0.2, 0], [0.08, 0.4, 0.36], '#6b4630']]} /></group>
        ))}
      </Reveal>
      {b.map((q) => (
        <Reveal key={q.id} pts={[[q.x + q.w / 2, q.z + q.d / 2], [q.x + q.w / 2, q.z + q.d + 2]]}>
          <group position={[q.x + q.w / 2, 0, q.z + q.d / 2]}>
            <ContactShadow w={q.w + 1} d={q.d + 1} k={1.15} />
            <PartsList parts={TOWN_PARTS[q.style](q)} />
            {!q.plain && <Html position={[0, q.style === 'clock' ? 7.4 : q.style === 'windmill' ? 5.2 : 4.6, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[3, 0]}><div className="fest-tag small">{q.emoji}</div></Html>}
          </group>
        </Reveal>
      ))}
      <Reveal pts={[[54, 10]]}><Orchard /></Reveal>
      <Reveal pts={[[75, 20]]}><Playground /></Reveal>
      <Reveal pts={[[51, 24]]}>
        <group position={[51.5, 0, 24]}>
          <PartsList parts={[['b', [0, 1.4, -1.7], [0.22, 2.8, 0.22], '#8a5e3c'], ['b', [0, 1.4, 1.7], [0.22, 2.8, 0.22], '#8a5e3c'], ['b', [0, 2.85, 0], [0.3, 0.2, 4.0], '#a8764c'], ...[-1.2, -0.6, 0, 0.6, 1.2].map((z, i) => ['k', [0.05, 2.6, z], [0.14, 0.26], ['#f7a8c4', '#ffd98a', '#8fd0f0', '#b8e0a0', '#f7a8c4'][i], { r: [PI, 0, 0], seg: 3 }])]} />
          <Html position={[0, 3.4, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[2, 0]}><div className="zone-tag small" style={{ pointerEvents: 'none' }}>🏙️ Plaza Mayor</div></Html>
        </group>
      </Reveal>
    </group>
  );
}
const PI = Math.PI;

/** Vecinos que pasean por la Calle Mayor */
const LOOKS = [
  { skin: 1, hair: 3, hairColor: 3, topStyle: 1, top: 13, bottom: 2, shoes: 6, eyes: 1, mouth: 0 },
  { skin: 4, hair: 0, hairColor: 0, topStyle: 4, top: 6, bottom: 0, shoes: 3, eyes: 0, mouth: 0, hat: 6 },
  { skin: 2, hair: 6, hairColor: 8, topStyle: 0, top: 3, bottom: 8, shoes: 1, eyes: 2, mouth: 1 },
  { skin: 0, hair: 8, hairColor: 12, topStyle: 2, top: 10, bottom: 6, shoes: 2, eyes: 1, mouth: 2 },
  { skin: 3, hair: 9, hairColor: 5, topStyle: 1, top: 9, bottom: 1, shoes: 0, eyes: 3, mouth: 0, hat: 3 },
  { skin: 5, hair: 1, hairColor: 1, topStyle: 3, top: 15, bottom: 4, shoes: 5, eyes: 0, mouth: 0 },
];
const ROUTES = [[52, 76, 22.5, 0.7], [76, 52, 25.5, 0.55], [56, 70, 22.6, 0.45], [74, 55, 25.4, 0.65], [60, 66, 22.5, 0.4], [70, 58, 25.6, 0.5]];
function Walker({ i }) {
  const g = useRef();
  const hour = useGame((s) => s.env.hour);
  useFrame((s) => {
    if (!g.current) return;
    const [a, b, z, sp] = ROUTES[i], len = Math.abs(b - a), t = (s.clock.elapsedTime * sp + i * 3.7) % (2 * len);
    const fwd = t < len, d = fwd ? t : 2 * len - t;
    const dir = Math.sign(b - a) * (fwd ? 1 : -1);
    g.current.position.set(a + Math.sign(b - a) * d, 0, z);
    g.current.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  if (hour < 7 || hour >= 22) return null;
  return <group ref={g}><Avatar avatar={LOOKS[i]} getAnim={() => 'walk'} /></group>;
}

export default function Discover() {
  useFrame(() => { updateNightMats(Math.min(1, L.night * 1.3 + (L.weather === 'rain' || L.weather === 'storm' ? 0.4 : 0))); });
  return (
    <group>
      <Pois />
      <Town />
      {ROUTES.map((_, i) => <Walker key={i} i={i} />)}
    </group>
  );
}
