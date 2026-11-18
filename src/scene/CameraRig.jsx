import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { me, cam } from '../game/runtime';
import { keys } from '../game/input';
import { clamp } from '../game/rng';

const BASE_YAW = Math.PI / 4;
const MAX_OFF = Math.PI / 6; // ±30°
const PITCH = 0.66;
const DIST = 70;
const focus = new THREE.Vector3(me.x, 0, me.z);

export default function CameraRig() {
  const { gl } = useThree();
  const target = useRef({ zoom: 46, off: 0 });
  if (typeof window !== 'undefined' && location.search.includes('debug')) window.__camTarget = target.current;

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e) => {
      e.preventDefault();
      target.current.zoom = clamp(target.current.zoom * Math.exp(-e.deltaY * 0.0012), 24, 90);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
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
