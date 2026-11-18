import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { L, isWet } from '../game/lighting';
import { me } from '../game/runtime';

const RAIN = 900, SNOW = 600, AREA = 46, TOP = 20;

/** Lluvia (líneas) y nieve (puntos) alrededor del jugador. */
export default function Weather() {
  const rain = useRef(), snow = useRef();
  const d = useMemo(() => {
    const mk = (n) => ({ x: Float32Array.from({ length: n }, () => Math.random()), y: Float32Array.from({ length: n }, () => Math.random() * TOP), z: Float32Array.from({ length: n }, () => Math.random()), v: Float32Array.from({ length: n }, () => 0.7 + Math.random() * 0.6) });
    return { rain: mk(RAIN), snow: mk(SNOW) };
  }, []);
  const rainGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RAIN * 6), 3)); return g; }, []);
  const snowGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SNOW * 3), 3)); return g; }, []);

  useFrame((s, dt) => {
    dt = Math.min(dt, 0.05);
    const t = s.clock.elapsedTime;
    const storm = L.weather === 'storm', isRain = isWet(L.weather), isSnow = L.weather === 'snow';
    const rm = rain.current.material, sm = snow.current.material;
    rm.opacity += ((isRain ? (storm ? 0.7 : 0.5) : 0) - rm.opacity) * Math.min(1, dt * 2);
    sm.opacity += ((isSnow ? 0.9 : 0) - sm.opacity) * Math.min(1, dt * 2);
    rain.current.visible = rm.opacity > 0.02;
    snow.current.visible = sm.opacity > 0.02;
    if (rain.current.visible) {
      const p = rainGeo.attributes.position.array, r = d.rain;
      for (let i = 0; i < RAIN; i++) {
        r.y[i] -= (storm ? 34 : 24) * r.v[i] * dt;
        if (r.y[i] < 0) { r.y[i] = TOP + Math.random() * 4; r.x[i] = Math.random(); r.z[i] = Math.random(); }
        const x = me.x + (r.x[i] - 0.5) * AREA, z = me.z + (r.z[i] - 0.5) * AREA, y = r.y[i];
        p[i * 6] = x; p[i * 6 + 1] = y; p[i * 6 + 2] = z;
        const gust = 0.1 + (storm ? 0.25 : 0.05) * (1 + Math.sin(t * 0.7 + 1)); p[i * 6 + 3] = x - gust; p[i * 6 + 4] = y + (storm ? 1.0 : 0.7); p[i * 6 + 5] = z - gust * 0.5;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    if (snow.current.visible) {
      const p = snowGeo.attributes.position.array, r = d.snow;
      for (let i = 0; i < SNOW; i++) {
        r.y[i] -= 1.6 * r.v[i] * dt;
        if (r.y[i] < 0) { r.y[i] = TOP; r.x[i] = Math.random(); r.z[i] = Math.random(); }
        p[i * 3] = me.x + (r.x[i] - 0.5) * AREA + Math.sin(t + i) * 0.4;
        p[i * 3 + 1] = r.y[i];
        p[i * 3 + 2] = me.z + (r.z[i] - 0.5) * AREA + Math.cos(t * 0.8 + i) * 0.4;
      }
      snowGeo.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <lineSegments ref={rain} geometry={rainGeo} frustumCulled={false}>
        <lineBasicMaterial color="#cfe6ff" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      <points ref={snow} geometry={snowGeo} frustumCulled={false}>
        <pointsMaterial color="#ffffff" size={4} sizeAttenuation={false} transparent opacity={0} depthWrite={false} />
      </points>
    </>
  );
}
