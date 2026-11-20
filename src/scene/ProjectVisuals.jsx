// Estado ROTO/ARREGLADO de los proyectos del pueblo, visible en el mundo (ver game/story/projects.js).
// Reutiliza los modelos de piezas del pueblo (worldParts.js) y los materiales nocturnos compartidos (nightmats.js):
// sin mallas nuevas en bucle, solo listas de piezas memorizadas.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { TOWN_PARTS, PLAZA_PARTS } from '../game/worldParts';
import { PROJECTS, PROJECT_BY_SITE, projectDone } from '../game/story/projects';
import { goAndDo } from '../game/actions';
import { PartsList } from './Decor';
import ContactShadow from './shadow';
import { t } from '../i18n';

const PI = Math.PI, W2 = '#8a5e3c', W3 = '#d9b384', WH = '#f6efe6';

/** ¿Está arreglado este proyecto? (sin estado = descuidado) */
export const useProjectDone = (id) => useGame((s) => !!id && projectDone(s.couple, id));

export const openProject = (id) => useGame.getState().set({ panel: 'project', projectId: id });

// ---------- piezas «descuidadas» ----------
const DRY_PLANT = '#9a8a52', DRY_FLOWER = '#a08c6e', DARK_GLASS = '#56606a';
const FLOWER_COLORS = new Set(['#f48aa8', '#ffe27a', '#fff', '#ffffff']);
const web = (x, y, z, s = 0.5, ry = 0) => [
  ['b', [x, y, z], [s, 0.015, s], '#e9e9f0', { r: [0, ry + PI / 4, 0] }],
  ['b', [x, y, z], [s * 1.5, 0.012, 0.012], '#e9e9f0', { r: [0, ry, 0] }],
  ['b', [x, y, z], [0.012, 0.012, s * 1.5], '#e9e9f0', { r: [0, ry, 0] }],
];

/** Convierte las piezas de un edificio en su versión cerrada y desvencijada */
export function neglect(parts, q) {
  const fz = q.d / 2;
  const out = [];
  const boards = [];
  for (const pt of parts) {
    const [k, p, sz, col, o = {}] = pt;
    if (o.win) {
      out.push([k, p, sz, DARK_GLASS, { r: o.r }]);
      if (k === 'b' && sz[2] <= 0.1 && p[2] > 0) boards.push(['b', [p[0], p[1], p[2] + 0.06], [sz[0] + 0.2, 0.08, 0.05], W2, { r: [0, 0, 0.45] }], ['b', [p[0], p[1], p[2] + 0.07], [sz[0] + 0.2, 0.08, 0.05], '#a8764c', { r: [0, 0, -0.45] }]);
    } else if (o.lamp) out.push([k, p, sz, '#6a6a72']);
    else if (col === '#6aa85a') out.push([k, p, sz, DRY_PLANT, o]);
    else if (FLOWER_COLORS.has(col) && k === 'o') out.push([k, p, sz, DRY_FLOWER, o]);
    else if (k === 'k' && sz[0] === 0.7 && o.seg === 8) out.push([k, [p[0], 1.0, p[2]], [0.1, 1.5], '#a99a8a', { seg: 6 }]); // sombrillas cerradas
    else out.push(pt);
  }
  // cartel de «cerrado» colgado, telarañas y una macetita seca junto a la puerta
  out.push(...boards,
    ['b', [0, 1.25, fz + 0.16], [0.72, 0.4, 0.04], WH], ['b', [0, 1.25, fz + 0.19], [0.58, 0.08, 0.02], '#c9443a'], ['b', [0, 1.55, fz + 0.14], [0.03, 0.3, 0.02], W2],
    ...web(-q.w / 2 + 0.35, 2.0, fz + 0.12, 0.5), ...web(q.w / 2 - 0.3, 0.9, fz + 0.62, 0.3, 1),
    ['c', [-q.w / 2 + 0.2, 0.15, fz + 0.9], [0.17, 0.3, 0.13], '#b86a55'], ['b', [-q.w / 2 + 0.2, 0.42, fz + 0.9], [0.04, 0.3, 0.04], DRY_PLANT, { r: [0, 0, 0.35] }], ['o', [-q.w / 2 + 0.3, 0.6, fz + 0.9], [0.06], '#8a7a62']);
  return out;
}

/** Extras de «abierto»: cartel verde, luz en la puerta y un detalle propio de cada sitio */
const OPEN_EXTRA = {
  bakery: (q) => [['o', [q.w * 0.24, 3.95, -q.d * 0.15], [0.16, 1, 1.1, 1], '#fff', { glow: true, anim: 'bob', amp: 0.35, op: 0.45 }], ['o', [q.w * 0.24 + 0.1, 4.5, -q.d * 0.15], [0.22, 1, 1.1, 1], '#fff', { glow: true, anim: 'bob', amp: 0.4, op: 0.3 }]],
  store: (q) => [['b', [-0.6, 2.7, q.d / 2 + 0.55], [0.6, 0.3, 0.05], '#f2c94c', { anim: 'sway', amp: 0.05 }]],
  cafe: (q) => [...[-1.5, -0.5, 0.5, 1.5].map((x, i) => ['o', [x, 2.55 - (i % 2) * 0.1, q.d / 2 + 0.55], [0.07], ['#ffd98a', '#f7a8c4', '#8fd0f0', '#ffd98a'][i], { glow: true, anim: 'glow' }]),
    ['b', [-1.2, 0.8, q.d / 2 + 1.55], [0.7, 0.9, 0.05], '#fff7e6', { r: [-0.2, 0.3, 0] }], ['o', [-1.3, 0.95, q.d / 2 + 1.6], [0.07], '#e86a8a'], ['o', [-1.1, 0.8, q.d / 2 + 1.6], [0.07], '#6a9bd9']],
};
const openSign = (q) => [['b', [0, 1.25, q.d / 2 + 0.16], [0.72, 0.4, 0.04], WH], ['b', [0, 1.25, q.d / 2 + 0.19], [0.58, 0.08, 0.02], '#4f9a4a'], ['b', [-0.5, 1.7, q.d / 2 + 0.18], [0.1, 0.1, 0.1], '#fff1c8', { lamp: true }]];

const useBuildingParts = (q, done) => useMemo(() => {
  const base = TOWN_PARTS[q.style](q);
  if (q.style === 'clock') return base.filter((p) => !(p[3] === '#2b2024' && p[1][1] === 3.7)); // las manecillas las dibuja ClockHands
  return done ? [...base, ...openSign(q), ...(OPEN_EXTRA[q.id]?.(q) || [])] : neglect(base, q);
}, [q, done]);

// ---------- el reloj: manecillas ----------
const STOP_HOUR = 4 + 20 / 60; // hora a la que se paró (la del invierno que lo detuvo)
function ClockHands({ q, done }) {
  const hr = useRef([]), mn = useRef([]);
  useFrame(() => {
    const h = done ? useGame.getState().env.hour % 12 : STOP_HOUR;
    const a = -(h / 12) * 2 * PI, b = -((h * 60) % 60) / 60 * 2 * PI;
    hr.current.forEach((g) => g && (g.rotation.z = a));
    mn.current.forEach((g) => g && (g.rotation.z = b));
  });
  const face = (x, z, ry, i) => (
    <group key={i} position={[x, 3.7, z]} rotation={[0, ry, 0]}>
      <group ref={(r) => (hr.current[i] = r)}><mesh position={[0, 0.1, 0.02]}><boxGeometry args={[0.07, 0.22, 0.03]} /><meshStandardMaterial color="#2b2024" /></mesh></group>
      <group ref={(r) => (mn.current[i] = r)}><mesh position={[0, 0.16, 0.04]}><boxGeometry args={[0.04, 0.34, 0.03]} /><meshStandardMaterial color="#2b2024" /></mesh></group>
    </group>
  );
  return <group>{face(0, q.d / 2 + 0.06, 0, 0)}{face(q.w / 2 + 0.06, 0, PI / 2, 1)}</group>;
}
const CLOCK_DONE = [['o', [0, 6.95, 0], [0.18], '#fff6c2', { glow: true, anim: 'glow' }], ['b', [0, 2.3, 1.05], [0.5, 0.35, 0.05], '#fff1c8', { lamp: true }]];
const CLOCK_BROKEN = (q) => [...web(-0.55, 4.55, q.d / 2 + 0.1, 0.5), ['b', [0, 3.7, q.d / 2 + 0.09], [0.66, 0.05, 0.04], W2, { r: [0, 0, 0.7] }], ['b', [0, 3.7, q.d / 2 + 0.09], [0.66, 0.05, 0.04], '#a8764c', { r: [0, 0, -0.7] }], ['b', [0, 1.35, q.d / 2 + 0.14], [0.55, 0.3, 0.04], WH], ['b', [0, 1.35, q.d / 2 + 0.17], [0.42, 0.07, 0.02], '#c9443a']];

/** Un edificio del pueblo: si tiene proyecto, cambia con su estado; si no, es el de siempre. */
export function SiteBuilding({ q }) {
  const id = PROJECT_BY_SITE[q.id];
  const done = useProjectDone(id);
  const parts = useBuildingParts(q, !id || done);
  const click = (e) => {
    if (!id || done || useGame.getState().tool !== 'interact') return;
    e.stopPropagation();
    goAndDo(q.x + q.w / 2, q.z + q.d + 1.8, () => openProject(id), 2.6);
  };
  return (
    <group onClick={click}>
      <PartsList parts={parts} />
      {q.style === 'clock' && <>
        <ClockHands q={q} done={done} />
        <PartsList parts={done ? CLOCK_DONE : CLOCK_BROKEN(q)} />
      </>}
      {id && !done && <ConstructionSign id={id} y={q.style === 'clock' ? 2.3 : 2.35} z={q.d / 2 + 0.8} />}
    </group>
  );
}

/** Cartel de obra ✋ tocable: abre el panel del proyecto */
function ConstructionSign({ id, y, z = 0 }) {
  return (
    <Html position={[0, y, z]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <button className="btn primary" style={{ pointerEvents: 'auto', padding: '4px 10px', fontSize: 13, borderRadius: 12, whiteSpace: 'nowrap' }} onClick={(e) => { e.stopPropagation(); openProject(id); }}>
        ✋ {t("Cerrado")}
      </button>
    </Html>
  );
}

// ---------- la fuente de la plaza ----------
const FOUNTAIN_DRY = [
  ['c', [0, 0.2, 0], [1.4, 0.4, 1.5], '#cfc9bd'], ['t', [0, 0.42, 0], [1.4, 0.08], '#b8b4a8', { r: [PI / 2, 0, 0] }], ['c', [0, 0.37, 0], [1.2, 0.05], '#9a9488'],
  ['c', [0.35, 0.395, 0.25], [0.32, 0.02], '#7f948b'],
  ['c', [0, 0.95, 0], [0.22, 1.0, 0.3], '#cfc9bd'], ['c', [0, 1.5, 0], [0.7, 0.12, 0.4], '#cfc9bd'], ['c', [0, 1.7, 0], [0.12, 0.4], '#cfc9bd'], ['o', [0, 1.95, 0], [0.16], '#b8b4a8'],
  ...[[0.55, 0.5], [-0.7, 0.3], [0.1, -0.75], [-0.35, -0.55], [0.75, -0.2], [-0.3, 0.7]].map(([x, z], i) => ['o', [x, 0.43, z], [0.11, 1, 0.7 + (i % 3) * 0.25, 1], i % 2 ? '#8a9a4a' : '#6cae4a']),
  ...[[0.2, 0.1], [-0.5, -0.1], [0.5, -0.45], [-0.1, 0.55]].map(([x, z], i) => ['b', [x, 0.385, z], [0.12, 0.012, 0.08], i % 2 ? '#c28a3a' : '#b0693a', { r: [0, i * 1.3, 0] }]),
  ['b', [0.95, 0.28, 0.55], [0.03, 0.3, 0.03], '#6a665c', { r: [0, 0, 0.3] }],
  ['c', [-0.9, 0.62, 0.55], [0.13, 0.2, 0.1], W2], ['b', [-0.9, 0.55, 0.55], [0.3, 0.04, 0.04], '#a8764c'],
  ['o', [-0.4, 0.44, 0.5], [0.07, 1, 0.7, 1.1], '#6cae4a'], ['o', [-0.43, 0.5, 0.55], [0.02], '#fff'], ['o', [-0.37, 0.5, 0.55], [0.02], '#fff'], // una ranita
  ...web(0.3, 1.45, 0.3, 0.4),
];
const FESTIVAL_LIGHTS = [
  ...Array.from({ length: 13 }, (_, i) => { const u = i / 12, x = -4 + 8 * u; return ['o', [x, 3.1 - Math.sin(u * PI) * 0.7 + 0.5, -2.4], [0.1], ['#ffd98a', '#f7a8c4', '#8fd0f0', '#b8e0a0'][i % 4], { glow: true, anim: 'glow' }]; }),
  ...Array.from({ length: 13 }, (_, i) => { const u = i / 12, x = -4 + 8 * u; return ['o', [x, 3.1 - Math.sin(u * PI) * 0.7 + 0.5, 2.4], [0.1], ['#f7a8c4', '#ffd98a', '#b8e0a0', '#8fd0f0'][i % 4], { glow: true, anim: 'glow' }]; }),
  ['b', [-4, 1.6, -2.4], [0.1, 3.2, 0.1], W2], ['b', [4, 1.6, -2.4], [0.1, 3.2, 0.1], W2], ['b', [-4, 1.6, 2.4], [0.1, 3.2, 0.1], W2], ['b', [4, 1.6, 2.4], [0.1, 3.2, 0.1], W2],
];

/** Plaza Mayor: fuente (seca o con agua) y, si hay festival, los farolillos */
export function PlazaProject() {
  const fountain = useProjectDone('fountain');
  const festival = useProjectDone('festival');
  return (
    <>
      <ContactShadow w={3} d={3} />
      <PartsList parts={fountain ? PLAZA_PARTS : FOUNTAIN_DRY} />
      {festival && <PartsList parts={FESTIVAL_LIGHTS} />}
      {!fountain && <ConstructionSign id="fountain" y={2.5} />}
      {fountain && !festival && <FestivalSign />}
    </>
  );
}
/** Con el reloj arreglado, la plaza invita a preparar el festival */
function FestivalSign() {
  const clock = useProjectDone('clock');
  if (!clock) return null;
  return (
    <Html position={[0, 2.6, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <button className="btn primary" style={{ pointerEvents: 'auto', padding: '4px 10px', fontSize: 13, borderRadius: 12, whiteSpace: 'nowrap' }} onClick={() => openProject('festival')}>🏮 {t("Festival")}</button>
    </Html>
  );
}

// ---------- huerto de la escuela ----------
const beds = (x0) => [0, 1, 2].map((i) => ['b', [x0 + i * 1.25, 0.1, 0], [1.0, 0.2, 1.6], '#6a4630']);
const GARDEN_BROKEN = [
  ...beds(-1.25), ['b', [-2.0, 0.3, 0], [0.08, 0.6, 2.0], W2], ['b', [2.0, 0.3, 0], [0.08, 0.6, 2.0], W2], ['b', [2.0, 0.55, 0], [0.08, 0.08, 2.0], '#a8764c', { r: [0, 0, 0.4] }],
  ...[[-1.2, 0.3], [-0.2, -0.5], [0.9, 0.2], [1.5, -0.4], [0.3, 0.6]].map(([x, z], i) => ['o', [x, 0.25, z], [0.08, 1, 1.3, 1], i % 2 ? '#8a9a4a' : '#7a9a4a']),
  ['c', [-1.3, 0.5, 1.2], [0.14, 0.26, 0.11], '#b86a55', { r: [0, 0, PI / 2] }], ['c', [1.4, 0.15, 1.1], [0.12, 0.22, 0.09], '#b86a55'], ['o', [1.4, 0.34, 1.1], [0.07], '#8a7a62'],
  ['b', [0, 0.55, 1.3], [1.0, 0.3, 0.05], WH, { r: [0, 0, 0.05] }], ['b', [0, 0.3, 1.3], [0.05, 0.6, 0.05], W2],
  ...web(-1.9, 0.62, 0.9, 0.35),
];
const GARDEN_DONE = [
  ...beds(-1.25), ['b', [-2.0, 0.3, 0], [0.08, 0.6, 2.0], W2], ['b', [2.0, 0.3, 0], [0.08, 0.6, 2.0], W2],
  ...[0, 1, 2].flatMap((i) => [-0.55, 0, 0.55].map((z, k) => ['o', [-1.25 + i * 1.25, 0.36, z], [0.15, 1, 0.9, 1], ['#6fbf4a', '#e8793a', '#d96a8a'][(i + k) % 3], { anim: 'sway', amp: 0.08 }])),
  ...[0, 1, 2].flatMap((i) => [-0.55, 0, 0.55].map((z) => ['o', [-1.25 + i * 1.25 + 0.15, 0.3, z + 0.1], [0.09], '#5fae55'])),
  ['b', [0, 0.55, 1.3], [1.0, 0.3, 0.05], WH], ['b', [0, 0.3, 1.3], [0.05, 0.6, 0.05], W2], ['b', [0, 0.57, 1.33], [0.7, 0.07, 0.02], '#4f9a4a'],
  ['c', [1.4, 0.2, 1.2], [0.14, 0.4, 0.11], '#8fb8de'],
  ...[[-0.6, 1.4, '#ffe27a'], [0, 1.5, '#f48aa8'], [0.6, 1.4, '#ffffff']].map(([x, z, c]) => ['o', [x, 0.12, z], [0.07], c]),
];
export function SchoolGarden() {
  const done = useProjectDone('school_garden');
  const parts = done ? GARDEN_DONE : GARDEN_BROKEN;
  return (
    <group position={[67.6, 0, 20.9]}>
      <PartsList parts={parts} />
      {!done && <ConstructionSign id="school_garden" y={1.7} />}
    </group>
  );
}
