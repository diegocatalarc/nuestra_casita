import { useMemo } from 'react';
import { useGame } from '../store/gameStore';

// Instancias repartidas en bloques espaciales. Un InstancedMesh con todo el mundo dentro tiene una esfera de
// descarte tan grande que se dibuja ENTERO en cada fotograma (y otra vez en el mapa de sombras) aunque en pantalla
// solo se vea una fracción. Con bloques de CH×CH unidades el motor descarta los que quedan fuera de la vista.
const CH = 10;

/** Plan de reparto: para cada punto [x, z] decide bloque y posición dentro del bloque. */
export function makeChunks(points) {
  const key = new Map(), chunkOf = new Int32Array(points.length), local = new Int32Array(points.length), counts = [], inv = [];
  points.forEach(([x, z], i) => {
    const k = `${Math.floor(x / CH)},${Math.floor(z / CH)}`;
    let c = key.get(k);
    if (c === undefined) { c = counts.length; key.set(k, c); counts.push(0); inv.push([]); }
    chunkOf[i] = c; local[i] = counts[c]++; inv[c].push(i);
  });
  return { chunkOf, local, counts, inv, n: points.length };
}

/** Imita lo mínimo de un InstancedMesh (setMatrixAt, setColorAt, instanceMatrix, instanceColor) repartiendo en los bloques. */
class ChunkSet {
  constructor(plan) { this.plan = plan; this.meshes = []; }
  setMatrixAt(i, m) { this.meshes[this.plan.chunkOf[i]]?.setMatrixAt(this.plan.local[i], m); }
  setColorAt(i, c) { this.meshes[this.plan.chunkOf[i]]?.setColorAt(this.plan.local[i], c); }
  get instanceMatrix() { const s = this; return { set needsUpdate(v) { for (const m of s.meshes) if (m) m.instanceMatrix.needsUpdate = v; } }; }
  get instanceColor() { const s = this; return { set needsUpdate(v) { for (const m of s.meshes) if (m?.instanceColor) m.instanceColor.needsUpdate = v; } }; }
  /** Las esferas de descarte se calculan al primer dibujo: se invalidan al cambiar las matrices. */
  refresh() { for (const m of this.meshes) if (m) { m.boundingSphere = null; m.boundingBox = null; } }
}

/** Como un ref: `.current` es el ChunkSet del plan (se recrea si el plan cambia). */
export function useChunkSet(plan) {
  return useMemo(() => ({ current: new ChunkSet(plan) }), [plan]);
}

/** Dibuja un InstancedMesh por bloque. `geo` y `mat` son OBJETOS de three compartidos por todos los bloques. */
export function ChunkLayer({ set, list, geo, mat, castShadow = false, receiveShadow = false, onPick, frustumCulled = true }) {
  const plan = set.current.plan;
  const refs = useMemo(() => plan.counts.map((_, c) => (m) => { set.current.meshes[c] = m; }), [plan, set]);
  const interactive = !!onPick;
  return plan.counts.map((cnt, c) => (
    <instancedMesh
      key={c} ref={refs[c]} args={[geo, mat, cnt]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={frustumCulled}
      {...(interactive ? {
        onClick: (e) => { if (useGame.getState().tool !== 'interact') return; e.stopPropagation(); const n = list[plan.inv[c][e.instanceId]]; if (n) onPick(n); },
        onPointerOver: (e) => { if (useGame.getState().tool === 'interact') { e.stopPropagation(); document.body.style.cursor = 'pointer'; } },
        onPointerOut: () => { document.body.style.cursor = ''; },
      } : {})}
    />
  ));
}
