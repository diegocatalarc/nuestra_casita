import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAP } from '../game/constants';
import { fog, CH, markCircle } from '../game/fog';
import { me } from '../game/runtime';
import { useGame } from '../store/gameStore';
import { L } from '../game/lighting';
import { EXPLORE } from '../game/constants';

/**
 * Niebla del mapa en 1-2 planos con shader (en vez de cientos de nubes 3D):
 * - una textura diminuta (CH×CH) guarda qué celdas están sin descubrir; se sube solo cuando cambia,
 * - el contorno se deforma con ruido y se suaviza en el shader → bordes orgánicos y volumen falso,
 * - cada plano muestrea la máscara en el punto del suelo que tapa (corrige la perspectiva isométrica),
 * - coste fijo: 1-2 pasadas de píxeles, ningún objeto 3D, ninguna actualización por instancia.
 */

function noiseTexture(size = 128) {
  // ruido de valor con 3 octavas, que se repite sin costuras
  const lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = Math.random(); return a; };
  const layers = [[4, 0.55, lat(4)], [8, 0.3, lat(8)], [16, 0.15, lat(16)]];
  const sm = (t) => t * t * (3 - 2 * t);
  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const [n, w, a] of layers) {
      const fx = (x / size) * n, fy = (y / size) * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy);
      const g = (i, j) => a[((j % n) * n) + (i % n)];
      v += w * ((g(ix, iy) * (1 - tx) + g(ix + 1, iy) * tx) * (1 - ty) + (g(ix, iy + 1) * (1 - tx) + g(ix + 1, iy + 1) * tx) * ty);
    }
    data[y * size + x] = Math.min(255, Math.max(0, Math.round(v * 255)));
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}

const VERT = `
varying vec3 vP;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vP = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG = `
uniform sampler2D uMask, uNoise;
uniform float uTime, uMap, uH, uSeed, uAlpha, uNight;
uniform vec3 uF;
varying vec3 vP;
void main() {
  // punto del suelo que queda detrás de este fragmento (rayos paralelos de la cámara ortográfica)
  vec2 g = vP.xz + uF.xz * (uH / max(0.2, -uF.y));
  float m = texture2D(uMask, g / uMap).r;
  if (m < 0.01) discard;
  vec2 p = vP.xz * 0.05;
  float n1 = texture2D(uNoise, p + vec2(uTime * 0.0035, uTime * 0.002) + uSeed).r;
  float n2 = texture2D(uNoise, p * 2.7 - vec2(uTime * 0.005, uTime * 0.001) + uSeed * 2.3).r;
  float n = n1 * 0.62 + n2 * 0.38;
  float edge = m * 1.25 + (n - 0.5) * 0.7 - 0.12;
  float a = smoothstep(0.38, 0.66, edge);
  if (a < 0.015) discard;
  // luz de nube: crestas claras, valles azulados
  vec3 lo = vec3(0.60, 0.67, 0.80), hi = vec3(0.80, 0.85, 0.92);
  vec3 col = mix(lo, hi, smoothstep(0.30, 0.72, n));
  col = mix(col, col * vec3(0.55, 0.6, 0.85), uNight);
  gl_FragColor = vec4(col, a * uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export default function Fog() {
  const quality = useGame((s) => s.quality);
  const S = useRef({ first: true, mark: 0, ver: -1 });
  const maskData = useMemo(() => new Uint8Array(CH * CH), []);
  const mask = useMemo(() => { const t = new THREE.DataTexture(maskData, CH, CH, THREE.RedFormat, THREE.UnsignedByteType); t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t; }, [maskData]);
  const noise = useMemo(() => noiseTexture(), []);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(MAP + 90, MAP + 90); g.rotateX(-Math.PI / 2); g.translate(MAP / 2, 0, MAP / 2); return g; }, []);
  const layers = quality ? [{ h: 1.5, seed: 0.0, alpha: 0.96 }, { h: 3.0, seed: 0.43, alpha: 0.82 }] : [{ h: 2.2, seed: 0.0, alpha: 0.97 }];
  const mats = useMemo(() => layers.map((l) => new THREE.ShaderMaterial({
    uniforms: { uMask: { value: mask }, uNoise: { value: noise }, uTime: { value: 0 }, uMap: { value: MAP }, uH: { value: l.h }, uSeed: { value: l.seed }, uAlpha: { value: l.alpha }, uNight: { value: 0 }, uF: { value: new THREE.Vector3(0, -1, 0) } },
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
  })), [quality]);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const grp = useRef();

  useFrame((s, dt) => {
    const Z = S.current;
    // descubrir andando a ~5 Hz (la escritura a la nube sigue en exploreTick cada 3,5 s)
    Z.mark += dt;
    if (Z.mark > 0.2) {
      Z.mark = 0;
      if (markCircle(me.x, me.z, me.boat ? EXPLORE.radius + 1 : EXPLORE.radius)) useGame.setState({ fogVer: fog.ver });
    }
    // apertura animada de cada celda; la textura solo se sube si algo cambió
    let touched = Z.first, covered = 0;
    for (let i = 0; i < fog.reveal.length; i++) {
      const target = fog.bits[i] ? 0 : 1;
      if (Z.first) fog.reveal[i] = target;
      else if (fog.reveal[i] !== target) { const d = target - fog.reveal[i]; fog.reveal[i] += Math.sign(d) * Math.min(Math.abs(d), dt * 0.9); touched = true; }
    }
    Z.first = false;
    for (let i = 0; i < fog.reveal.length; i++) if (fog.reveal[i] > 0) { covered++; break; }
    if (grp.current) grp.current.visible = covered > 0; // todo descubierto: ni se dibuja
    if (touched) { for (let i = 0; i < maskData.length; i++) maskData[i] = Math.round(fog.reveal[i] * 255); mask.needsUpdate = true; }
    s.camera.getWorldDirection(fwd);
    for (const m of mats) { m.uniforms.uTime.value = s.clock.elapsedTime; m.uniforms.uNight.value = L.night; m.uniforms.uF.value.copy(fwd); }
  });

  return (
    <group ref={grp}>
      {mats.map((m, i) => <mesh key={i} geometry={geo} material={m} renderOrder={900 + i} frustumCulled={false} />)}
    </group>
  );
}
