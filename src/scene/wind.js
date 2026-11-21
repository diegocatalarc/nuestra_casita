import * as THREE from 'three';

/**
 * Viento compartido por toda la vegetación (árboles, matas, flores, juncos): un único par de uniformes
 * (tiempo y fuerza) que se actualiza UNA vez por fotograma desde Nature.jsx. El balanceo se calcula en el vertex shader
 * de cada material (onBeforeCompile), en espacio MUNDO y por instancia: la altura sobre el suelo da la amplitud (la base
 * no se mueve) y el desplazamiento se devuelve al espacio local de la instancia, así funciona con cualquier escala o giro.
 * Para ajustar: `amp` de cada material (en Nature.jsx/Details.jsx) y WIND_BY_WEATHER.
 */
export const WIND = { uTime: { value: 0 }, uWind: { value: 1 } };
export const WIND_BY_WEATHER = { clear: 1, snow: 0.7, rain: 1.8, storm: 3.6 };

/** Parchea un material estándar para que se mueva con el viento. amp = metros de balanceo por metro de altura (con viento 1). */
export function applyWind(mat, amp) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = WIND.uTime; sh.uniforms.uWind = WIND.uWind;
    sh.vertexShader = 'uniform float uTime;\nuniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  {
    vec4 wp = instanceMatrix * vec4(transformed, 1.0);
    float hgt = max(wp.y, 0.0);
    float ph = instanceMatrix[3].x * 0.6 + instanceMatrix[3].z * 0.8;
    float gust = 0.65 + 0.35 * sin(uTime * 0.45 + instanceMatrix[3].x * 0.11 + instanceMatrix[3].z * 0.07);
    float a = ${amp.toFixed(4)} * uWind * gust * hgt;
    vec3 d = vec3(sin(uTime * 1.6 + ph) + 0.3 * sin(uTime * 3.1 + ph * 2.0) + 0.35 * uWind, 0.0, 0.7 * cos(uTime * 1.3 + ph * 1.1)) * a;
    transformed += vec3(
      dot(instanceMatrix[0].xyz, d) / max(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), 1e-6),
      dot(instanceMatrix[1].xyz, d) / max(dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz), 1e-6),
      dot(instanceMatrix[2].xyz, d) / max(dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz), 1e-6));
  }
#endif`);
  };
  mat.customProgramCacheKey = () => 'wind' + amp;
  return mat;
}

export const windMaterial = (amp, params = {}) => applyWind(new THREE.MeshStandardMaterial({ roughness: 1, ...params }), amp);
