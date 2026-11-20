// Vecinos vivos del Valle: los 8 de CAST siguen su agenda por horas (game/story/routines.js), caminan por rutas válidas,
// charlan entre ellos y se les puede hablar tocándolos (táctil primero). Un solo useFrame mueve a los 8 con refs:
// ningún componente React se re-renderiza por fotograma.
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGame } from '../store/gameStore';
import { CAST } from '../game/story/characters';
import { NEIGHBORS } from '../game/constants';
import { me } from '../game/runtime';
import { ctx, findPath, tileBlocked } from '../game/movement';
import { DEBUG, serverNow } from '../game/time';
import { goAndDo } from '../game/actions';
import { buildRoutines, positionAt, hasNews, isRaining, CHAT_DIST } from '../game/story/routines';
import DialogueModal, { openDialogue, useDialogue } from '../ui/DialogueModal';
import Avatar from './Avatar';
import ContactShadow from './shadow';

const NEAR = 5; // el nombre solo se ve cerca
const LOOKS = Object.fromEntries(NEIGHBORS.map((n) => [n.id, n.look]));
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const IDS = CAST.map((c) => c.id);
const look = (c) => c.look || LOOKS[c.id];
const hourNow = (env) => {
  if (typeof window !== 'undefined' && typeof window.__npcHour === 'number') return window.__npcHour; // hook de pruebas (Playwright)
  if (DEBUG.hour != null) return DEBUG.hour;
  return env.hour + Math.max(0, serverNow() - env.now) / 60000; // env se refresca cada segundo: se afina a fotograma
};

function Npc({ c, reg }) {
  const st = useRef({ anim: 'idle' }).current;
  const g = useRef(), tag = useRef(), nameEl = useRef(), bubbleEl = useRef(), newsEl = useRef();
  useEffect(() => { reg(c.id, { st, g, nameEl, bubbleEl, newsEl, tag }); return () => reg(c.id, null); }, [c.id, reg, st]);
  const can = () => useGame.getState().tool === 'interact';
  const hover = (on) => () => { if (can() && !st.hidden) document.body.style.cursor = on ? 'pointer' : ''; };
  const talk = (e) => {
    if (!can() || st.hidden) return;
    e.stopPropagation();
    goAndDo(st.x, st.z, () => openDialogue(c.id), 2.0);
  };
  return (
    <group ref={g} visible={false}>
      <ContactShadow w={0.8} d={0.8} k={1.3} />
      <Avatar avatar={look(c)} getAnim={() => st.anim} />
      {/* zona de toque generosa para dedos (invisible) */}
      <mesh position={[0, 0.95, 0]} onClick={talk} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <cylinderGeometry args={[0.6, 0.6, 2.0, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 2.15, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[3, 0]}>
        <div ref={tag} style={{ display: 'none', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
          <span ref={nameEl} style={{ display: 'none', background: 'rgba(255,255,255,.92)', border: '2px solid #e8d5b8', borderRadius: 10, padding: '0 8px', fontSize: 12, fontWeight: 800, color: '#5a4636' }}>{c.name}</span>
          <span ref={bubbleEl} style={{ display: 'none', fontSize: 22 }}>💬</span>
          <span ref={newsEl} className="gift-tag" style={{ display: 'none', fontSize: 22 }}>❗</span>
        </div>
      </Html>
    </group>
  );
}

export default function Npcs() {
  const regs = useRef({});
  const R = useRef({ tiles: null, data: null });
  const tgt = useRef(Object.fromEntries(IDS.map((id) => [id, {}]))).current;
  const news = useRef({ t: 0, v: {} }).current;
  const reg = useRef((id, v) => { if (v) regs.current[id] = v; else delete regs.current[id]; }).current;
  if (typeof window !== 'undefined' && window.location.search.includes('debug')) window.__npcs = { regs: regs.current, tgt }; // solo con ?debug (pruebas)

  // El diálogo es DOM puro: se monta en su propia raíz para no tocar HUD.jsx ni GameCanvas.jsx
  useEffect(() => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);
    root.render(<DialogueModal />);
    return () => { root.unmount(); el.remove(); useDialogue.setState({ npc: null, n: 0 }); };
  }, []);

  useFrame((_, rawDt) => {
    if (!ctx.ready) return;
    if (R.current.tiles !== ctx.tiles) R.current = { tiles: ctx.tiles, data: buildRoutines(findPath, tileBlocked) }; // una vez por mundo
    const { npcs } = R.current.data;
    const s = useGame.getState(), dt = Math.min(rawDt, 0.1);
    const hour = hourNow(s.env), rain = isRaining(s.env.weather);
    const talking = useDialogue.getState().npc;
    const doNews = s.now - news.t > 700;
    if (doNews) news.t = s.now;
    // 1) objetivo de cada uno según la hora
    for (const id of IDS) positionAt(npcs[id], hour, rain, tgt[id]);
    // 2) aplicar
    for (const id of IDS) {
      const r = regs.current[id];
      if (!r) continue;
      const { st, g } = r, T = tgt[id];
      const hold = talking === id && st.init && !st.hidden;
      if (!hold) {
        if (!st.init || T.hidden || st.hidden) { st.x = T.x; st.z = T.z; st.rot = T.rot; st.mv = 0; }
        else {
          const dx = T.x - st.x, dz = T.z - st.z, d = Math.hypot(dx, dz);
          if (d > 3.2) { st.x = T.x; st.z = T.z; st.mv = 0; } // salto grande (cambio de clima, de hora…): aparece directamente
          else { const k = Math.min(1, dt * 9); st.x += dx * k; st.z += dz * k; st.mv = (d * k) / Math.max(dt, 1e-3); }
        }
        st.init = true;
        st.hidden = T.hidden;
        st.anim = st.mv > 0.5 || T.walking ? 'walk' : T.anim;
        st.rot += angDiff(st.rot, T.rot) * Math.min(1, dt * 10);
        st.chat = T.chat;
      } else { // hablando con la persona: se queda quieto y la mira
        st.anim = 'idle'; st.rot = Math.atan2(me.x - st.x, me.z - st.z);
      }
      g.current.visible = !st.hidden;
      g.current.position.set(st.x, 0, st.z);
      g.current.rotation.y = st.rot;
      // etiquetas (solo se toca el DOM cuando algo cambia). Html monta su contenido de forma asíncrona: puede no existir aún.
      if (!r.tag.current || !r.nameEl.current) continue;
      if (st.hidden) { if (st.tagOn !== false && r.tag.current) { r.tag.current.style.display = 'none'; st.tagOn = false; } continue; }
      let bubble = false;
      if (T.chat) { const o = tgt[T.chat]; bubble = !!o && !o.hidden && !T.walking && !o.walking && Math.hypot(o.x - T.x, o.z - T.z) < CHAT_DIST; }
      if (bubble && !hold) st.rot = Math.atan2(tgt[T.chat].x - st.x, tgt[T.chat].z - st.z);
      const near = Math.hypot(me.x - st.x, me.z - st.z) < NEAR || talking === id;
      if (doNews) news.v[id] = hasNews(id, s);
      const flags = (near ? 1 : 0) | (bubble ? 2 : 0) | (news.v[id] ? 4 : 0);
      if (flags !== st.flags || st.tagOn !== true) {
        st.flags = flags; st.tagOn = true;
        r.tag.current.style.display = flags ? 'flex' : 'none';
        r.nameEl.current.style.display = flags & 1 ? 'inline' : 'none';
        r.bubbleEl.current.style.display = flags & 2 ? 'inline' : 'none';
        r.newsEl.current.style.display = flags & 4 ? 'inline' : 'none';
      }
    }
  });
  return <group>{CAST.map((c) => <Npc key={c.id} c={c} reg={reg} />)}</group>;
}
