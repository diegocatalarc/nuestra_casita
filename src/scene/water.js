import * as THREE from 'three';

/**
 * Agua con carácter, todo en el shader del plano de agua (sin render targets de reflexión):
 *  · color somero→profundo según la distancia al lecho (textura de alturas del terreno, 201² de 8 bits, se hornea con el mapa),
 *  · espuma animada en la orilla (línea que va y viene + un segundo frente fino),
 *  · reflejo «falso»: mezcla con el color del horizonte del cielo (`L.horizon`, cambia con la hora y el clima),
 *  · ondas suaves (normal perturbada para el brillo del sol) y destellos que parpadean con el color del sol/luna.
 * En táctil (`pointer: coarse`) la versión simple: sin ondas de normal y sin el segundo frente de espuma ni segundo destello.
 * Ajuste: constantes FOAM_*, REFLECT y GLINT de abajo (en el GLSL).
 */
export const WATER_Y = -0.26;
export const WATER_U = {
  uTime: { value: 0 }, uSky: { value: new THREE.Color('#cfe8ee') }, uSunCol: { value: new THREE.Color('#fff0cc') },
  uGlint: { value: 0.4 }, uShore: { value: null }, uMap: { value: 50 }, uN: { value: 200 },
};

/** Alturas del terreno (R8: de -0,5 a 0,2) para saber qué profundidad tiene el agua en cada punto. */
export function shoreTexture(geo, N) {
  const pos = geo.attributes.position, S = N + 1, data = new Uint8Array(S * S);
  for (let k = 0; k < S * S; k++) data[k] = Math.round(Math.min(1, Math.max(0, (pos.getY(k) + 0.5) / 0.7)) * 255);
  const t = new THREE.DataTexture(data, S, S, THREE.RedFormat);
  t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
  return t;
}

export function makeWaterMaterial(coarse) {
  const m = new THREE.MeshStandardMaterial({ color: '#6cc3d8', roughness: 0.22, metalness: 0.1, transparent: true, opacity: 0.8 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, WATER_U);
    sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `varying vec3 vWp;
uniform float uTime, uGlint, uMap, uN;
uniform vec3 uSky, uSunCol;
uniform sampler2D uShore;
${sh.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
  vec2 suv = (vWp.xz / uMap * uN + 0.5) / (uN + 1.0);
  float bed = texture2D(uShore, suv).r * 0.7 - 0.5;
  float dep = max(0.0, ${WATER_Y.toFixed(2)} - bed);               // profundidad sobre el lecho
  vec3 shallow = diffuseColor.rgb * vec3(1.18, 1.14, 1.0) + vec3(0.03, 0.05, 0.0);
  vec3 deep = diffuseColor.rgb * vec3(0.7, 0.82, 1.0);
  vec3 wcol = mix(shallow, deep, smoothstep(0.0, 0.22, dep));
  wcol = mix(wcol, uSky * 0.95, 0.3);                               // REFLECT: reflejo falso del cielo
  float wave = 0.5 + 0.5 * sin(uTime * 1.3 + (vWp.x + vWp.z) * 2.5 + sin(vWp.x * 3.1) * 1.5);
  float brk = smoothstep(-0.6, 0.25, sin(vWp.x * 13.0 + uTime * 0.6) * sin(vWp.z * 11.0 - uTime * 0.5)); // espuma rota
  float edge = 0.035 + 0.035 * wave;                                // FOAM: ancho de la franja que va y viene
  float foam = (1.0 - smoothstep(edge * 0.5, edge, dep)) * (0.55 + 0.45 * brk);
  #ifndef WATER_SIMPLE
  foam += (1.0 - smoothstep(0.0, 0.012, abs(dep - 0.1 - 0.035 * wave))) * 0.45 * brk * step(0.03, dep);
  #endif
  foam = clamp(foam, 0.0, 1.0);
  diffuseColor.rgb = mix(wcol, vec3(0.97, 0.96, 0.92), foam);
  diffuseColor.a = mix(mix(0.55, opacity, smoothstep(0.0, 0.14, dep)), 1.0, foam);`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  #ifndef WATER_SIMPLE
  vec3 rip = vec3(sin(vWp.x * 5.0 + uTime * 1.1) * cos(vWp.z * 4.0 + uTime * 0.8), 0.0, cos(vWp.x * 3.5 - uTime * 0.9) * sin(vWp.z * 5.5 + uTime * 1.2)) * 0.05;
  normal = normalize(normal + (viewMatrix * vec4(rip, 0.0)).xyz);
  #endif`)
    .replace('#include <opaque_fragment>', `  float s1 = sin(vWp.x * 6.0 + uTime * 1.7 + sin(vWp.z * 3.0 + uTime * 0.7) * 1.5);
  float s2 = sin(vWp.z * 7.0 - uTime * 1.3 + sin(vWp.x * 4.0 - uTime * 0.9) * 1.3);
  float glint = pow(clamp(s1 * s2, 0.0, 1.0), 10.0);               // GLINT: destellos del sol/luna
  #ifndef WATER_SIMPLE
  glint += pow(clamp(sin(vWp.x * 11.0 - uTime * 2.1) * sin(vWp.z * 9.0 + uTime * 1.6), 0.0, 1.0), 14.0) * 0.6;
  #endif
  outgoingLight += uSunCol * glint * uGlint * (1.0 - foam);
  #include <opaque_fragment>`)}`;
    if (coarse) sh.fragmentShader = '#define WATER_SIMPLE\n' + sh.fragmentShader;
  };
  m.customProgramCacheKey = () => 'water' + (coarse ? 's' : 'f');
  return m;
}
