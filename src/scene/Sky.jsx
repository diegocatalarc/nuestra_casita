import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { L, isWet } from '../game/lighting';
import { clamp } from '../game/rng';

// ---- Cielo: degradado por hora + nubes lejanas pintadas ------------------------------------------------------------
// UN cuadro a pantalla completa dibujado al FINAL de los opacos con prueba de profundidad en el plano lejano (z = w):
// la GPU descarta de antemano los píxeles tapados por el terreno, así solo se sombrea el cielo visible. Los colores
// (cenit, horizonte, nubes) son uniformes que se copian de `L` cada fotograma (unos pocos números); las nubes salen de una
// textura de ruido de 128² horneada UNA vez. Sin render targets, sin transparencias, sin coste por píxel fuera del cielo.
const SKY_VS = `varying vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
const SKY_FS = `uniform vec3 uZen, uHor, uCloud, uGlowCol;
uniform float uCover, uTime, uNight, uAspect, uGlow, uZoom;
uniform vec2 uSun;
uniform sampler2D uNoise;
varying vec2 vUv;
void main() {
  float v = vUv.y;
  // degradado: horizonte claro abajo, cenit arriba (curva suave para que el cielo no sea una rampa lineal)
  float k = smoothstep(0.02, 0.98, v);
  vec3 col = mix(uHor, uZen, pow(k, 0.85));
  // resplandor cálido alrededor del sol (amanecer/atardecer)
  vec2 d = (vUv - uSun) * vec2(uAspect, 1.0);
  float g = exp(-dot(d, d) * 5.0) * uGlow;
  col += uGlowCol * g;
  // nubes: dos capas de ruido (lejana y fina) con borde duro-suave «pintado» y luz por arriba
  vec2 p = vec2(vUv.x * uAspect, vUv.y) * (0.9 / max(0.55, uZoom / 46.0)) + vec2(uTime * 0.006, 0.0);
  float n = texture2D(uNoise, p * 0.7).r * 0.65 + texture2D(uNoise, p * 1.9 + 0.37).r * 0.35;
  float lit = texture2D(uNoise, p * 0.7 + vec2(0.0, 0.012)).r * 0.65 + texture2D(uNoise, p * 1.9 + vec2(0.37, 0.025)).r * 0.35;
  float th = 1.0 - uCover;
  float a = smoothstep(th, th + 0.07, n) * smoothstep(0.0, 0.3, 1.0 - abs(v - 0.42) * 1.3);
  float shade = clamp((n - lit) * 9.0 + 0.5, 0.0, 1.0);
  vec3 cc = mix(uCloud * 0.8, uCloud * 1.08, shade);
  col = mix(col, cc, a * (0.88 - 0.25 * uNight));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function makeNoise(S = 128) {
  // ruido de valor periódico (se repite sin costuras) en 4 octavas
  const data = new Uint8Array(S * S);
  let a = 7;
  const rnd = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const oct = [8, 16, 32, 64].map((f) => { const g = new Float32Array(f * f); for (let i = 0; i < g.length; i++) g[i] = rnd(); return [f, g]; });
  const sm = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let v = 0, amp = 0.5, tot = 0;
    for (const [f, g] of oct) {
      const u = (x / S) * f, w = (y / S) * f, ix = Math.floor(u), iy = Math.floor(w), fx = sm(u - ix), fy = sm(w - iy);
      const i0 = ix % f, i1 = (ix + 1) % f, j0 = iy % f, j1 = (iy + 1) % f;
      const top = g[j0 * f + i0] * (1 - fx) + g[j0 * f + i1] * fx, bot = g[j1 * f + i0] * (1 - fx) + g[j1 * f + i1] * fx;
      v += (top * (1 - fy) + bot * fy) * amp; tot += amp; amp *= 0.5;
    }
    data[y * S + x] = Math.round((v / tot) * 255);
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RedFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}

/** Sol: disco con degradado suave y corona (textura de 128² pintada una vez; mezcla aditiva). */
function sunTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,252,226,1)'); gr.addColorStop(0.16, 'rgba(255,240,190,1)'); gr.addColorStop(0.3, 'rgba(255,214,130,0.85)');
  gr.addColorStop(0.5, 'rgba(255,176,88,0.35)'); gr.addColorStop(0.75, 'rgba(255,160,90,0.1)'); gr.addColorStop(1, 'rgba(255,150,80,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function SkyDome() {
  const m = useRef();
  const noise = useMemo(() => makeNoise(), []);
  const uni = useMemo(() => ({
    uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uCloud: { value: new THREE.Color() }, uGlowCol: { value: new THREE.Color() },
    uCover: { value: 0.4 }, uTime: { value: 0 }, uNight: { value: 0 }, uAspect: { value: 1.6 }, uGlow: { value: 0 }, uZoom: { value: 46 },
    uSun: { value: new THREE.Vector2(0.3, 0.6) }, uNoise: { value: noise },
  }), [noise]);
  useEffect(() => () => noise.dispose(), [noise]);
  useFrame((s) => {
    const u = uni;
    u.uZen.value.copy(L.zenith); u.uHor.value.copy(L.horizon); u.uCloud.value.copy(L.cloudCol);
    u.uTime.value = s.clock.elapsedTime; u.uNight.value = L.night;
    u.uAspect.value = s.size.width / s.size.height; u.uZoom.value = s.camera.zoom;
    // cobertura de nubes: despejado = nubes sueltas; lluvia/tormenta = cielo cubierto
    const wet = isWet(L.weather);
    const cover = wet ? 0.92 : L.weather === 'snow' ? 0.8 : 0.42;
    u.uCover.value += (cover - u.uCover.value) * 0.05;
    // el sol (mismo punto que el disco de Backdrop) y su resplandor: fuerte a primera y última hora
    const f = clamp((L.hour - 6) / 12, 0, 1);
    const sx = -14 + f * 28, sy = 1.5 + Math.sin(f * Math.PI) * 5.5;
    u.uSun.value.set(0.5 + (sx * s.camera.zoom) / s.size.width, 0.5 + (sy * s.camera.zoom) / s.size.height);
    const low = 1 - Math.sin(f * Math.PI); // 1 con el sol bajo
    u.uGlow.value = (wet ? 0.05 : 0.18 + low * 0.5) * clamp(1 - L.night * 1.5, 0, 1);
    u.uGlowCol.value.copy(L.sun).multiplyScalar(0.55);
  });
  return (
    <mesh frustumCulled={false} renderOrder={1000}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={m} vertexShader={SKY_VS} fragmentShader={SKY_FS} uniforms={uni} depthWrite={false} depthTest toneMapped={false} />
    </mesh>
  );
}

/** Estrellas, sol y luna pegados a la cámara: se ven en el vacío que rodea el diorama. */
export function Backdrop() {
  const g = useRef(), stars = useRef(), sun = useRef(), moon = useRef();
  const sunTex = useMemo(sunTexture, []);
  useEffect(() => () => sunTex.dispose(), [sunTex]);
  const geo = useMemo(() => {
    const n = 700;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = (Math.random() - 0.5) * 140; a[i * 3 + 1] = (Math.random() - 0.5) * 80; a[i * 3 + 2] = -400; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
    return geo;
  }, []);
  useFrame((s) => {
    g.current.position.copy(s.camera.position);
    g.current.quaternion.copy(s.camera.quaternion);
    const t = s.clock.elapsedTime;
    const dark = isWet(L.weather) ? 0.25 : 1;
    stars.current.material.opacity = clamp(L.night * 1.2 - 0.1, 0, 1) * dark * (0.8 + Math.sin(t * 1.7) * 0.2);
    stars.current.visible = stars.current.material.opacity > 0.02;
    const day = clamp(1 - L.night * 1.4, 0, 1);
    const f = clamp((L.hour - 6) / 12, 0, 1);
    sun.current.position.set(-14 + f * 28, 1.5 + Math.sin(f * Math.PI) * 5.5, -400);
    sun.current.visible = day > 0.05 && !isWet(L.weather);
    moon.current.visible = L.night > 0.3 && !isWet(L.weather);
  });
  return (
    <>
    <SkyDome />
    <group ref={g}>
      <points ref={stars} geometry={geo} frustumCulled={false}>
        <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} transparent depthWrite={false} fog={false} toneMapped={false} />
      </points>
      <mesh ref={sun} frustumCulled={false} renderOrder={2}><planeGeometry args={[11, 11]} /><meshBasicMaterial map={sunTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} /></mesh>
      <mesh ref={moon} position={[11, 8, -400]} frustumCulled={false}><circleGeometry args={[4, 24]} /><meshBasicMaterial color="#f4f1ff" depthWrite={false} fog={false} toneMapped={false} /></mesh>
    </group>
    </>
  );
}

/** Nubes "solo sombra": no se ven, pero proyectan sombras suaves que cruzan el terreno. */
export function CloudShadows() {
  const refs = useRef([]);
  const clouds = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ x: i * 11, z: 4 + ((i * 17) % 44), s: 3.5 + (i % 3) * 1.6, v: 0.25 + (i % 4) * 0.08 })), []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const size = 0.22 + L.cloud * 0.3;
    clouds.forEach((c, i) => {
      const el = refs.current[i];
      if (!el) return;
      el.position.x = ((c.x + t * c.v) % 100) - 25;
      el.scale.setScalar(size);
    });
  });
  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={[c.x, 16, c.z]}>
          {[[0, 0, 0, 1], [1.4, 0.1, 0.4, 0.8], [-1.3, 0, -0.3, 0.75]].map(([x, y, z, k], j) => (
            <mesh key={j} position={[x * c.s * 0.5, y, z * c.s * 0.5]} scale={[c.s * k, c.s * 0.35, c.s * k * 0.8]} castShadow>
              <icosahedronGeometry args={[1, 1]} />
              <meshBasicMaterial colorWrite={false} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
