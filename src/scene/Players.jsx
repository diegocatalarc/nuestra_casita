import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame, partnerUid } from '../store/gameStore';
import { me, others, occupied, cam, currentAnim } from '../game/runtime';
import { keys } from '../game/input';
import { blockedPoint, boatBlockedPoint } from '../game/movement';
import { wake, updateFishing, leaveBoat, boatSpeedMult } from '../game/actions';
import { buildingAt } from '../game/logic';
import { getBackend } from '../services/backend';
import { defaultAvatar, BOAT } from '../game/constants';
import { serverNow } from '../game/time';
import Avatar from './Avatar';
import EmoteBubble from './EmoteBubble';
import { BoatBody } from './Boat';
import { Html } from '@react-three/drei';
import { step, sfx } from '../game/audio';
import { t } from '../i18n';

const SPEED = 4.3;
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

function tryMove(nx, nz) {
  const bp = me.boat ? boatBlockedPoint : blockedPoint;
  const stuck = bp(me.x, me.z); // si ya estás atrapado, deja moverte para salir
  let moved = false;
  if (stuck || !bp(nx, me.z)) { if (nx !== me.x) moved = true; me.x = nx; }
  if (stuck || !bp(me.x, nz)) { if (nz !== me.z) moved = true; me.z = nz; }
  return moved;
}

/** Globo de texto sobre la cabeza durante unos segundos tras escribir en el chat. */
function ChatBubble({ uid, y = 2.1 }) {
  const msg = useGame((s) => { let b = null; for (const m of Object.values(s.chat)) if (m.from === uid && (!b || m.at > b.at)) b = m; return b; });
  const now = useGame((s) => s.now);
  if (!msg || now - msg.at > 7000 || now - msg.at < -4000) return null;
  const txt = msg.text.length > 70 ? msg.text.slice(0, 68) + '…' : msg.text;
  const big = /^\p{Extended_Pictographic}{1,3}$/u.test(msg.text.replace(/\uFE0F/g, ''));
  return <Html position={[0, y, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[7, 0]}><div className={`speech ${big ? 'big' : ''}`}>{txt}</div></Html>;
}

function LocalPlayer() {
  const g = useRef();
  const boatRef = useRef(), seat = useRef();
  const stepT = useRef(0);
  const user = useGame((s) => s.user);
  const avatar = useGame((s) => s.couple?.players?.[s.user.uid]?.avatar) || defaultAvatar(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { yaw } = cam;
    const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const rgt = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    // visuales del bote
    const driver = me.boat && !me.passenger;
    if (boatRef.current) boatRef.current.visible = driver;
    if (seat.current) seat.current.position.z = driver ? 0.4 : 0;
    updateFishing();
    if (me.boat && me.passenger) {
      // pasajera/o: se mueve con el bote de su pareja
      const o = others[me.passenger];
      if (!o || !o.online || o.boat !== 1) { leaveBoat(true); if (me.boat) { me.boat = false; me.passenger = null; useGame.setState({ boating: 0 }); } }
      else {
        const k = Math.min(1, dt * 10);
        me.x += (o.x - Math.sin(o.rot) * 0.5 - me.x) * k; me.z += (o.z - Math.cos(o.rot) * 0.5 - me.z) * k;
        me.rot = o.rot; me.moving = false;
      }
      if (g.current) { g.current.position.set(me.x, 0, me.z); g.current.rotation.y = me.rot; }
      return;
    }
    if (me.sleeping) {
      // dormido: no hay movimiento; cualquier tecla de movimiento despierta
      me.moving = false;
      if (fwd || rgt || keys.Space || keys.Enter) wake();
      if (g.current) { g.current.position.set(me.x, 0, me.z); g.current.rotation.y = me.rot; }
      return;
    }
    // El movimiento se calcula con el tiempo real (hasta 250 ms) en pasos de ≤ 50 ms: con pocos fotogramas
    // por segundo (iPad, móviles) el personaje no se ralentiza, y las colisiones siguen funcionando.
    const total = Math.min(rawDt, 0.5), nSteps = Math.max(1, Math.ceil(total / 0.05)), h = total / nSteps;
    me.moving = false;
    for (let i = 0; i < nSteps; i++) {
      let dx = 0, dz = 0;
      if (fwd || rgt) {
        dx = -Math.sin(yaw) * fwd + Math.cos(yaw) * rgt;
        dz = -Math.cos(yaw) * fwd - Math.sin(yaw) * rgt;
        me.path = []; me.pending = null;
      } else if (me.path.length) {
        const t = me.path[0];
        const vx = t.x - me.x, vz = t.z - me.z, d = Math.hypot(vx, vz);
        if (d < 0.12) me.path.shift();
        else { dx = vx / d; dz = vz / d; }
      }
      const len = Math.hypot(dx, dz);
      if (len <= 0.01) break;
      me.moving = true;
      dx /= len; dz /= len;
      const sp = me.boat ? BOAT.speed * boatSpeedMult(useGame.getState().couple) : me.tired ? SPEED * 0.6 : SPEED;
      const moved = tryMove(me.x + dx * sp * h, me.z + dz * sp * h);
      if (!moved) { me.path = []; me.pending = null; me.moving = false; break; }
      me.rot += angDiff(me.rot, Math.atan2(dx, dz)) * Math.min(1, h * 14);
    }
    // llegada → ejecutar acción pendiente
    if (!me.path.length && me.pending && !(fwd || rgt)) {
      const p = me.pending; me.pending = null;
      if (Math.hypot(p.tx - me.x, p.tz - me.z) <= p.reach + 0.4) { me.rot = Math.atan2(p.tx - me.x, p.tz - me.z); p.fn(); }
    }
    if (me.moving) { stepT.current += dt; if (stepT.current > 0.3) { stepT.current = 0; step(); } } else stepT.current = 0.2;
    const b = me.boat ? null : buildingAt(useGame.getState().buildings, me.x, me.z);
    me.insideId = b && b.type !== 'terrace' && b.type !== 'garden' ? b.id : null;

    // quién está dentro de qué edificio (para techos)
    occupied.clear();
    if (me.insideId) occupied.add(me.insideId);
    for (const o of Object.values(others)) if (o.online && o.inside) occupied.add(o.inside);

    if (g.current) { g.current.position.set(me.x, 0, me.z); g.current.rotation.y = me.rot; }
  });

  return (
    <group ref={g}>
      <group ref={boatRef} visible={false}><BoatBody getRow={() => me.moving} /></group>
      <group ref={seat}><Avatar avatar={avatar} getAnim={currentAnim} name={user?.name} /></group>
      <ChatBubble uid={user.uid} />
      <EmoteBubble getAnim={currentAnim} />
    </group>
  );
}

function RemotePlayer({ uid }) {
  const g = useRef(), boatRef = useRef(), seat = useRef();
  const avatar = useGame((s) => s.couple?.players?.[uid]?.avatar) || defaultAvatar(3);
  const name = useGame((s) => s.couple?.players?.[uid]?.name) || t("Tu pareja");
  useFrame((_, dt) => {
    const p = others[uid];
    if (!p || !g.current) return;
    const k = Math.min(1, dt * 12);
    p.x += (p.tx - p.x) * k; p.z += (p.tz - p.z) * k;
    p.rot += angDiff(p.rot, p.trot) * k;
    g.current.visible = !!p.online;
    g.current.position.set(p.x, 0, p.z);
    g.current.rotation.y = p.rot;
    if (boatRef.current) boatRef.current.visible = p.boat === 1;
    if (seat.current) seat.current.position.z = p.boat === 1 ? 0.4 : 0;
  });
  return (
    <group ref={g}>
      <group ref={boatRef} visible={false}><BoatBody getRow={() => others[uid]?.anim === 'row'} /></group>
      <group ref={seat}><Avatar avatar={avatar} getAnim={() => others[uid]?.anim || 'idle'} name={name} showName /></group>
      <ChatBubble uid={uid} y={2.4} />
      <EmoteBubble getAnim={() => others[uid]?.anim} />
    </group>
  );
}

/** Emite y recibe presencia (RTDB / BroadcastChannel). Los remotos se interpolan fuera de React. */
function PresenceSync() {
  const pUid = useGame(partnerUid);
  const user = useGame((s) => s.user);
  const coupleId = useGame((s) => s.coupleId);

  useEffect(() => {
    const be = getBackend();
    be.presence.connect(coupleId, user.uid);
    const unsub = be.presence.subscribe((uid, d) => {
      if (!d) return;
      let p = others[uid];
      if (!p) { p = others[uid] = { x: d.x ?? 0, z: d.z ?? 0, rot: d.rot || 0 }; }
      if (p.anim !== d.anim && ['water', 'harvest', 'dig', 'build', 'love', 'wave'].includes(d.anim)) sfx(d.anim, 0.35);
      p.tx = d.x ?? p.x; p.tz = d.z ?? p.z; p.trot = d.rot || 0;
      p.anim = d.anim || 'idle'; p.inside = d.inside || null; p.flag = d.online !== false; p.t = d.t || 0; p.lastSeen = d.lastSeen || d.t || 0;
      p.boat = d.boat || 0; p.fx = d.fx ?? null; p.fz = d.fz ?? null;
      p.online = p.flag && serverNow() - p.t < 20000;
    });
    let last = null, lastAt = 0;
    const id = setInterval(() => {
      const now = performance.now();
      const data = { x: +me.x.toFixed(2), z: +me.z.toFixed(2), rot: +me.rot.toFixed(2), anim: currentAnim(), inside: me.insideId || null, name: user.name, boat: me.boat ? (me.passenger ? 2 : 1) : null, fx: me.fish ? +me.fish.x.toFixed(2) : null, fz: me.fish ? +me.fish.z.toFixed(2) : null };
      const changed = !last || Math.abs(last.x - data.x) > 0.02 || Math.abs(last.z - data.z) > 0.02 || Math.abs(last.rot - data.rot) > 0.05 || last.anim !== data.anim || last.inside !== data.inside || last.boat !== data.boat || last.fx !== data.fx;
      if (changed || now - lastAt > 4000) { be.presence.publish(data); last = data; lastAt = now; }
    }, 100);
    return () => { clearInterval(id); unsub && unsub(); be.presence.disconnect(); for (const k in others) delete others[k]; };
  }, [coupleId, user.uid, user.name]);

  return pUid ? <RemotePlayer uid={pUid} /> : null;
}

export default function Players() {
  return (<><LocalPlayer /><PresenceSync /></>);
}
