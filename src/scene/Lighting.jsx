import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../store/gameStore';
import { computeEnv, serverNow } from '../game/time';
import { updateLighting, L, flash } from '../game/lighting';
import { thunder } from '../game/audio';
import * as THREE from 'three';

const WHITE = new THREE.Color('#dfe8ff');
import { me } from '../game/runtime';
import { camFocus } from './CameraRig';

// Mapa de sombras: tamaño según dispositivo y cobertura ajustada a lo que se ve (zoom y tamaño de pantalla).
const COARSE = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
const SHADOW_PX = COARSE ? 1024 : 1536;
const SHADOW_MIN = 12, SHADOW_MAX = 26; // semilado (unidades del mundo) del volumen de sombras
const SIN_PITCH = 0.613; // sin(0.66), la inclinación de la cámara

/** Sol/luna con sombras suaves + ambiente + color de cielo y niebla según hora y clima. */
export default function Lighting() {
  const sun = useRef(), hemi = useRef();
  const shR = useRef(0);
  useFrame((state, dt) => {
    const s = useGame.getState();
    const env = computeEnv(serverNow(), s.couple?.startedAt, s.couple?.seed);
    updateLighting(env);
    // relámpagos en tormenta: doble destello y trueno retrasado
    const nowS = state.clock.elapsedTime;
    if (env.weather === 'storm' && nowS > flash.next) {
      flash.v = 1; flash.next = nowS + 7 + Math.random() * 14; flash.again = nowS + 0.18;
      thunder(0.4 + Math.random() * 1.8);
    }
    if (flash.again && nowS > flash.again) { flash.v = 0.8; flash.again = 0; }
    flash.v = Math.max(0, flash.v - dt * 3.2);
    const k = Math.min(1, dt * 2.5);
    const l = sun.current;
    l.color.copy(L.sun);
    l.intensity += (L.sunI - l.intensity) * k;
    // el volumen de sombras sigue el centro de la vista (no al personaje, que puede estar fuera al arrastrar el mapa)
    // y solo cubre lo visible más un margen por la longitud de las sombras (sol bajo = sombras largas).
    const fx = camFocus.x, fz = camFocus.z;
    l.position.set(fx + L.dir.x * 60, Math.max(14, L.dir.y * 60), fz + L.dir.z * 60);
    l.target.position.set(fx, 0, fz);
    l.target.updateMatrixWorld();
    const hw = state.size.width / 2 / state.camera.zoom, hh = state.size.height / 2 / state.camera.zoom / SIN_PITCH;
    const tanEl = Math.max(0.25, Math.max(14, L.dir.y * 60) / (Math.hypot(L.dir.x, L.dir.z) * 60 || 1));
    const R = Math.min(SHADOW_MAX, Math.max(SHADOW_MIN, Math.ceil(Math.hypot(hw, hh) + 3 + Math.min(9, 3.5 / tanEl))));
    if (R !== shR.current) {
      shR.current = R;
      const sc = l.shadow.camera; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.updateProjectionMatrix();
    }
    hemi.current.color.copy(L.amb);
    hemi.current.intensity += (L.ambI + flash.v * 3.5 - hemi.current.intensity) * Math.min(1, dt * 12);
    const sc = state.scene;
    if (sc.background) { sc.background.lerp(L.sky, k); if (flash.v > 0.05) sc.background.lerp(WHITE, flash.v * 0.5); }
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffffff', '#e2c9cf', 0.7]} />
      <directionalLight
        ref={sun} castShadow intensity={1.5}
        shadow-mapSize={[SHADOW_PX, SHADOW_PX]} shadow-bias={-0.0004} shadow-normalBias={0.04} shadow-radius={4}
        shadow-camera-left={-26} shadow-camera-right={26} shadow-camera-top={26} shadow-camera-bottom={-26}
        shadow-camera-near={1} shadow-camera-far={220}
      />
    </>
  );
}
