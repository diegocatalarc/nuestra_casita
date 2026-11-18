import * as THREE from 'three';

// Sombreado "dibujo animado": 3 tonos de luz + contorno oscuro suave (casco invertido).
const grad = (() => {
  const t = new THREE.DataTexture(new Uint8Array([105, 185, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const mats = new Map();
export const toonMat = (c) => {
  if (!mats.has(c)) mats.set(c, new THREE.MeshToonMaterial({ color: c, gradientMap: grad }));
  return mats.get(c);
};
const OUTLINE = new THREE.MeshBasicMaterial({ color: '#4a3036', side: THREE.BackSide });
const BASIC = new Map();
export const basicMat = (c, extra = {}) => {
  const k = c + JSON.stringify(extra);
  if (!BASIC.has(k)) BASIC.set(k, new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...extra }));
  return BASIC.get(k);
};

const gc = new Map();
/** Geometrías compartidas: geo('Sphere', 0.3, 20, 14) */
export const geo = (kind, ...a) => {
  const k = kind + a.join(',');
  if (!gc.has(k)) gc.set(k, new THREE[`${kind}Geometry`](...a));
  return gc.get(k);
};

/** Pieza con contorno. out = grosor relativo del contorno (0 = sin contorno). */
export function P({ g, color, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], out = 0.07, cast = true, material, children }) {
  return (
    <group position={p} rotation={r}>
      <mesh geometry={g} material={material || toonMat(color)} scale={s} castShadow={cast} />
      {out > 0 && <mesh geometry={g} material={OUTLINE} scale={[s[0] * (1 + out), s[1] * (1 + out), s[2] * (1 + out)]} />}
      {children}
    </group>
  );
}
