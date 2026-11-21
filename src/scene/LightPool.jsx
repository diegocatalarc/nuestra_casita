import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../store/gameStore';
import { BUILDINGS, DECOR } from '../game/constants';
import { L } from '../game/lighting';
import { me } from '../game/runtime';
import { clamp } from '../game/rng';
import { PROP_LIGHTS } from './Props';
import { VILLAGE_LIGHTS } from './Village';
import { TOWN_LIGHTS } from './Discover';

const POOL = 6; // número FIJO de luces: cambiarlo en caliente recompilaría los shaders

/** Fuentes de luz del mundo (lámparas, hogueras, edificios, farolas del pueblo). La usan LightPool y Halos. */
export function useLightSources() {
  const decor = useGame((s) => s.decor);
  const buildings = useGame((s) => s.buildings);
  return useMemo(() => {
    const out = [];
    for (const o of Object.values(decor)) {
      const def = DECOR[o.type];
      if (!def.light) continue;
      if (o.type === 'lamp') out.push({ x: o.x, y: 1.2, z: o.z, c: def.colors[(o.variant || 0) % 3], base: 1, dayMul: 0.0 });
      else out.push({ x: o.x, y: 0.8, z: o.z, c: '#ff9a4c', base: 1.3, dayMul: 0.45, flick: true });
    }
    for (const b of Object.values(buildings)) {
      const cx = b.x + b.w / 2, cz = b.z + b.d / 2;
      if (b.type === 'observatory') out.push({ x: cx, y: 1.4, z: cz, c: '#9fb4ff', base: 0.9, dayMul: 0, noHalo: true });
      else if (b.type === 'terrace' || b.type === 'garden') out.push({ x: cx, y: 1.2, z: cz, c: '#ffd98a', base: 0.8, dayMul: 0, noHalo: true });
      else if (b.type !== 'greenhouse') out.push({ x: cx, y: 1.7, z: cz, c: '#ffcf8a', base: 1.1, dayMul: 0, noHalo: true });
    }
    return [...out, ...PROP_LIGHTS, ...VILLAGE_LIGHTS, ...TOWN_LIGHTS];
  }, [decor, buildings]);
}

/** Asigna las 6 PointLights a las fuentes más cercanas (lámparas, chimeneas, edificios). */
export default function LightPool() {
  const sources = useLightSources();
  const refs = useRef([]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const dark = clamp(L.night * 1.3 + (L.weather === 'rain' || L.weather === 'storm' ? 0.3 : L.weather === 'fog' ? 0.15 : 0), 0, 1);
    const sorted = sources
      .map((q) => ({ q, d: (q.x - me.x) ** 2 + (q.z - me.z) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, POOL);
    for (let i = 0; i < POOL; i++) {
      const l = refs.current[i];
      if (!l) continue;
      const it = sorted[i];
      if (!it) { l.intensity = 0; continue; }
      const q = it.q;
      l.position.set(q.x, q.y, q.z);
      l.color.set(q.c);
      const f = q.dayMul + (1 - q.dayMul) * dark;
      l.intensity = q.base * 16 * f * (q.flick ? 1 + Math.sin(t * 9 + i) * 0.1 : 1);
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <pointLight key={i} ref={(el) => (refs.current[i] = el)} intensity={0} distance={11} decay={2} />
      ))}
    </>
  );
}
