import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../store/gameStore';
import { computeEnv, serverNow } from '../game/time';
import { updateLighting, L, flash } from '../game/lighting';
import { thunder } from '../game/audio';
import * as THREE from 'three';

const WHITE = new THREE.Color('#dfe8ff');
import { me } from '../game/runtime';

/** Sol/luna con sombras suaves + ambiente + color de cielo y niebla según hora y clima. */
export default function Lighting() {
  const sun = useRef(), hemi = useRef();
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
    l.position.set(me.x + L.dir.x * 60, Math.max(14, L.dir.y * 60), me.z + L.dir.z * 60);
    l.target.position.set(me.x, 0, me.z);
    l.target.updateMatrixWorld();
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
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.04} shadow-radius={4}
        shadow-camera-left={-26} shadow-camera-right={26} shadow-camera-top={26} shadow-camera-bottom={-26}
        shadow-camera-near={1} shadow-camera-far={220}
      />
    </>
  );
}
