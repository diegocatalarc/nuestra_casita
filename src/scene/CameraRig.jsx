import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { me, cam } from '../game/runtime';
import { keys } from '../game/input';
import { clamp } from '../game/rng';
import { camTarget, gesture, MAX_OFF, clampZoom } from '../game/cameraControl';

const BASE_YAW = Math.PI / 4;
const PITCH = 0.66;
const DIST = 70;
const focus = new THREE.Vector3(me.x, 0, me.z);

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
    // Táctil: pellizco = zoom, girar los dos dedos = girar la cámara
    const pts = new Map();
    let d0 = 1, z0 = 46, a0 = 0, o0 = 0;
    const pair = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(b.x - a.x, b.y - a.y) || 1, ang: Math.atan2(b.y - a.y, b.x - a.x) }; };
    const down = (e) => {
      if (e.pointerType !== 'touch') return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { const p = pair(); d0 = p.d; a0 = p.ang; z0 = camTarget.zoom; o0 = camTarget.off; }
      if (pts.size >= 2) gesture.until = performance.now() + 60000;
    };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size !== 2) return;
      const p = pair();
      let da = p.ang - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      camTarget.zoom = clampZoom(z0 * (p.d / d0));
      camTarget.off = clamp(o0 + da, -MAX_OFF, MAX_OFF);
    };
    const up = (e) => { if (pts.delete(e.pointerId) && pts.size < 2) gesture.until = performance.now() + 350; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
    };
  }, [gl]);

  useFrame((state, dt) => {
    const t = target.current;
    if (keys.KeyQ) t.off = clamp(t.off + dt * 1.0, -MAX_OFF, MAX_OFF);
    if (keys.KeyE) t.off = clamp(t.off - dt * 1.0, -MAX_OFF, MAX_OFF);
    const k = Math.min(1, dt * 5);
    cam.yaw += (BASE_YAW + t.off - cam.yaw) * k;
    cam.zoom += (t.zoom - cam.zoom) * k;
    focus.x += (me.x - focus.x) * Math.min(1, dt * 4);
    focus.z += (me.z - focus.z) * Math.min(1, dt * 4);
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
