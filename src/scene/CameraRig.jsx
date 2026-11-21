import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { me, cam } from '../game/runtime';
import { keys } from '../game/input';
import { clamp } from '../game/rng';
import { camTarget, gesture, MAX_OFF, PAN_MAX, clampZoom } from '../game/cameraControl';
import { useGame } from '../store/gameStore';

const BASE_YAW = Math.PI / 4;
const PITCH = 0.66;
const DIST = 70;
const focus = new THREE.Vector3(me.x, 0, me.z);
/** Punto del suelo al que mira la cámara (lo usa la luz para centrar el mapa de sombras en lo que se ve). */
export const camFocus = focus;

export default function CameraRig() {
  const { gl } = useThree();
  const target = useRef(camTarget);
  if (typeof window !== 'undefined' && location.search.includes('debug')) window.__camTarget = target.current;

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e) => {
      e.preventDefault();
      target.current.zoom = clampZoom(target.current.zoom * Math.exp(-e.deltaY * 0.0012));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    // Táctil (eventos touch: `e.touches` siempre refleja los dedos reales, así no quedan dedos «fantasma»).
    // Un dedo arrastrando = mover la cámara por el mapa; dos dedos = pellizco (zoom), giro y arrastre.
    const T = { two: false, panning: false, sx: 0, sy: 0, lx: 0, ly: 0, d0: 1, a0: 0, z0: 46, o0: 0, cx: 0, cy: 0 };
    const info = (ts) => { const a = ts[0], b = ts[1]; return { d: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) || 1, ang: Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX), x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }; };
    const hold = (ms) => { gesture.until = performance.now() + ms; };
    const pan = (dx, dy) => {
      const k = 1 / Math.max(1, camTarget.zoom), y = cam.yaw;
      // la pantalla «arrastra» el mapa: el desplazamiento de la cámara va en sentido contrario
      camTarget.px += -dx * k * Math.cos(y) + dy * k / Math.sin(PITCH) * -Math.sin(y);
      camTarget.pz += dx * k * Math.sin(y) + dy * k / Math.sin(PITCH) * -Math.cos(y);
      const r = Math.hypot(camTarget.px, camTarget.pz);
      if (r > PAN_MAX) { camTarget.px *= PAN_MAX / r; camTarget.pz *= PAN_MAX / r; }
    };
    const canPan1 = () => { const g = useGame.getState(); return (g.tool === 'interact' || g.tool === 'plant' || g.tool === 'fish') && !g.dragId && !g.moveMode; };
    const ts = (e) => {
      if (e.touches.length >= 2) { const i = info(e.touches); T.two = true; T.panning = false; T.d0 = i.d; T.a0 = i.ang; T.z0 = camTarget.zoom; T.o0 = camTarget.off; T.cx = i.x; T.cy = i.y; hold(400); }
      else if (e.touches.length === 1) { const t0 = e.touches[0]; T.sx = T.lx = t0.clientX; T.sy = T.ly = t0.clientY; if (!T.two) T.panning = false; }
    };
    const tm = (e) => {
      if (e.touches.length >= 2) {
        const i = info(e.touches);
        let da = i.ang - T.a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        camTarget.zoom = clampZoom(T.z0 * (i.d / T.d0));
        camTarget.off = clamp(T.o0 + da, -MAX_OFF, MAX_OFF);
        pan(i.x - T.cx, i.y - T.cy); T.cx = i.x; T.cy = i.y; hold(400);
      } else if (e.touches.length === 1 && !T.two) {
        const t0 = e.touches[0];
        if (!T.panning && canPan1() && Math.hypot(t0.clientX - T.sx, t0.clientY - T.sy) > 12) { T.panning = true; T.lx = t0.clientX; T.ly = t0.clientY; }
        if (T.panning) { pan(t0.clientX - T.lx, t0.clientY - T.ly); T.lx = t0.clientX; T.ly = t0.clientY; hold(400); }
      }
    };
    const te = (e) => {
      if (e.touches.length === 0) { if (T.two || T.panning) hold(350); T.two = false; T.panning = false; }
      else if (e.touches.length === 1) { const t0 = e.touches[0]; T.lx = t0.clientX; T.ly = t0.clientY; T.sx = t0.clientX; T.sy = t0.clientY; hold(350); }
    };
    el.addEventListener('touchstart', ts, { passive: true }); el.addEventListener('touchmove', tm, { passive: true });
    el.addEventListener('touchend', te, { passive: true }); el.addEventListener('touchcancel', te, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', te); el.removeEventListener('touchcancel', te);
    };
  }, [gl]);

  useFrame((state, dt) => {
    const t = target.current;
    if (keys.KeyQ) t.off = clamp(t.off + dt * 1.0, -MAX_OFF, MAX_OFF);
    if (keys.KeyE) t.off = clamp(t.off - dt * 1.0, -MAX_OFF, MAX_OFF);
    const k = Math.min(1, dt * 5);
    cam.yaw += (BASE_YAW + t.off - cam.yaw) * k;
    cam.zoom += (t.zoom - cam.zoom) * k;
    if (me.moving && (camTarget.px || camTarget.pz)) { const d = Math.min(1, dt * 1.2); camTarget.px -= camTarget.px * d; camTarget.pz -= camTarget.pz * d; } // al caminar, la cámara vuelve al personaje
    focus.x += (me.x + camTarget.px - focus.x) * Math.min(1, dt * 4);
    focus.z += (me.z + camTarget.pz - focus.z) * Math.min(1, dt * 4);
    const c = state.camera;
    c.position.set(
      focus.x + Math.sin(cam.yaw) * Math.cos(PITCH) * DIST,
      Math.sin(PITCH) * DIST,
      focus.z + Math.cos(cam.yaw) * Math.cos(PITCH) * DIST,
    );
    c.zoom = cam.zoom;
    c.lookAt(focus.x, 0, focus.z);
    c.updateProjectionMatrix();
  });
  return null;
}
