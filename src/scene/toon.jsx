import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

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
// Contorno de «casco invertido» con GROSOR CONSTANTE EN PANTALLA: el casco (cara trasera) se empuja a lo largo de la normal
// en el espacio de recorte, así el trazo mide siempre ~1,6 px (ajustado al zoom) en vez de crecer con el tamaño de la pieza.
// Color marrón cálido oscuro (no negro). Un material compartido por (grosor, cajas) y UN uniforme de píxeles: sin coste por pieza.
// Ajuste: OUTLINE_PX (grosor base), OUTLINE_COLOR; `out` de cada <P> escala el grosor (0 = sin contorno).
export const OUTLINE_PX = 1.6;
export const OUTLINE_COLOR = '#4a2f26';
const OUT_U = { uThick: { value: new THREE.Vector2(0.002, 0.003) } };
const OUTLINES = new Map();
function outlineMat(out, radial) {
  const k = Math.round(Math.min(1.6, Math.max(0.5, out / 0.07)) * 4) / 4 + (radial ? 'r' : '');
  if (!OUTLINES.has(k)) {
    const mul = parseFloat(k);
    const m = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide, toneMapped: false });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uThick = OUT_U.uThick;
      sh.vertexShader = 'uniform vec2 uThick;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
  vec3 on = ${radial ? 'normalize(position + 1e-5)' : 'normal'};
  vec2 od = normalize((normalMatrix * on).xy + 1e-5);
  gl_Position.xy += od * uThick * ${mul.toFixed(2)} * gl_Position.w;`);
    };
    m.customProgramCacheKey = () => 'outline' + k;
    m.visible = HULL_ON;
    OUTLINES.set(k, m);
  }
  return OUTLINES.get(k);
}
/** Enciende/apaga los cascos invertidos (se apagan cuando el contorno global de postproceso ya dibuja las siluetas). */
export function setHullOutlines(on) { HULL_ON = on; for (const m of OUTLINES.values()) m.visible = on; }
let HULL_ON = true;
/** Mantiene el grosor del contorno en píxeles reales (cambia con el tamaño del lienzo y algo con el zoom). Montar una vez dentro del Canvas. */
export function OutlineSync() {
  useFrame((s) => {
    const px = OUTLINE_PX * Math.min(1.5, Math.max(0.7, s.camera.zoom / 46));
    OUT_U.uThick.value.set((2 * px) / s.size.width, (2 * px) / s.size.height);
  });
  return null;
}
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
      {out > 0 && <mesh geometry={g} material={outlineMat(out, g.type === 'BoxGeometry')} scale={s} />}
      {children}
    </group>
  );
}
