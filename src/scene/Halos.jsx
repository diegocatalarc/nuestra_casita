import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { L } from '../game/lighting';
import { clamp } from '../game/rng';
import { useLightSources } from './LightPool';

/**
 * Halo suave alrededor de farolas, hogueras y faroles cuando oscurece: SIN postproceso (sirve también en táctil).
 * Todas las fuentes en UNA malla instanciada (1 llamada de dibujo) con un cuadro orientado a la cámara en el vertex shader y
 * mezcla aditiva. No cambia nada por fotograma salvo un uniforme (`uDark`); solo es visible con `L.night`/lluvia.
 * Ajuste: HALO_MAX (intensidad), el radio `0.9 + base * 0.5` en el useLayoutEffect y la caída `exp(-r*r*3.4)` del shader.
 * (Las ventanas encendidas y los farolillos del festival ya brillan por su material emisivo y, en escritorio, por el bloom.)
 */
const CAP = 96, HALO_MAX = 0.55;
const VS = `attribute float aDay; varying vec2 vUv; varying vec3 vCol; varying float vDay;
void main() {
  vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float sc = length(instanceMatrix[0].xyz);
  c.xy += position.xy * sc;
  c.z += 0.8;                       // un poco hacia la cámara: no lo recorta la propia farola
  vUv = position.xy * 2.0; vCol = instanceColor; vDay = aDay;
  gl_Position = projectionMatrix * c;
}`;
const FS = `uniform float uDark, uTime, uMax; varying vec2 vUv; varying vec3 vCol; varying float vDay;
void main() {
  float r = length(vUv);
  float k = exp(-r * r * 3.4) * smoothstep(1.0, 0.75, r);
  float amt = mix(vDay * 0.5, 1.0, uDark) * (0.93 + 0.07 * sin(uTime * 7.0 + vCol.r * 40.0));
  gl_FragColor = vec4(vCol, k * amt * uMax);
  #include <colorspace_fragment>
}`;

export default function Halos() {
  const sources = useLightSources();
  const ref = useRef();
  const list = useMemo(() => sources.filter((q) => !q.noHalo).slice(0, CAP), [sources]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.setAttribute('aDay', new THREE.InstancedBufferAttribute(new Float32Array(CAP), 1));
    return g;
  }, []);
  const uni = useMemo(() => ({ uDark: { value: 0 }, uTime: { value: 0 }, uMax: { value: HALO_MAX } }), []);
  const anyDay = useMemo(() => list.some((q) => q.dayMul > 0), [list]);
  useLayoutEffect(() => {
    const m = ref.current, mat4 = new THREE.Matrix4(), col = new THREE.Color();
    list.forEach((q, i) => {
      const r = 0.9 + q.base * 0.5;
      mat4.makeScale(r, r, r).setPosition(q.x, q.y, q.z);
      m.setMatrixAt(i, mat4); m.setColorAt(i, col.set(q.c));
      geo.attributes.aDay.array[i] = q.dayMul;
    });
    geo.attributes.aDay.needsUpdate = true;
    m.count = list.length;
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [list, geo]);
  useFrame((s) => {
    const dark = clamp(L.night * 1.3 + (L.weather === 'rain' || L.weather === 'storm' ? 0.3 : 0), 0, 1);
    uni.uDark.value = dark; uni.uTime.value = s.clock.elapsedTime;
    ref.current.visible = dark > 0.02 || anyDay;
  });
  return (
    <instancedMesh ref={ref} args={[geo, null, CAP]} frustumCulled={false} renderOrder={5}>
      <shaderMaterial vertexShader={VS} fragmentShader={FS} uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </instancedMesh>
  );
}
