import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
const cache = new Map();

/** Sombreado horneado: más claro arriba y más oscuro abajo (oclusión ambiental falsa). Se multiplica por el color del material (vertexColors). */
function bakeAO(geo, h) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = h > 0 ? (pos.getY(i) + h / 2) / h : 0.5;
    const f = Math.min(1.12, Math.max(0.62, 0.78 + 0.24 * t + 0.07 * nor.getY(i)));
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = f;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** Caja con bordes suavizados (compartida por tamaño), con degradado de luz horneado. */
export function rbGeo(w, h, d) {
  const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  if (!cache.has(k)) cache.set(k, bakeAO(new RoundedBoxGeometry(w, h, d, 2, Math.max(0.006, Math.min(0.06, Math.min(w, h, d) / 3))), h));
  return cache.get(k);
}
