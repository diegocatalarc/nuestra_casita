import * as THREE from 'three';
import { clamp, smooth } from './rng';

// hora, cenit, horizonte, sol, intensidad sol, ambiente (sombras), intensidad ambiente
// Paleta «hora dorada» (estilo Stardew): sol dorado, sombras ligeramente violetas/azuladas al amanecer y atardecer,
// mediodía cálido (no frío) y noche azul-violeta pero legible.
const KEYS = [
  [0, '#141a42', '#2d3a78', '#8fa2ff', 0.4, '#46509a', 0.62],
  [5, '#222a5c', '#5a5a96', '#9aa8ff', 0.34, '#5a62a6', 0.6],
  [6.5, '#9aa6d6', '#ffc3a0', '#ffb468', 1.0, '#d9a6c2', 0.62],
  [8.5, '#7fc0ea', '#d8ecef', '#ffe3b0', 1.7, '#e6dff0', 0.92],
  [12, '#6fbbea', '#cfe8ee', '#fff0cc', 2.0, '#f0e6e2', 1.0],
  [16.5, '#79b9e6', '#e4e6e0', '#ffe0a6', 1.9, '#f3e3df', 0.96],
  [18.5, '#8a8cc8', '#ffb07a', '#ffa45a', 1.4, '#cfa0d2', 1.05],
  [20, '#4c3f86', '#c98ab4', '#d0a0ee', 0.72, '#a496d2', 0.85],
  [21.5, '#1c2556', '#3b4488', '#8097ff', 0.4, '#46509a', 0.62],
  [24, '#141a42', '#2d3a78', '#8fa2ff', 0.4, '#46509a', 0.62],
].map(([h, zen, hor, sun, sunI, amb, ambI]) => ({
  h, zen: new THREE.Color(zen), hor: new THREE.Color(hor), sun: new THREE.Color(sun), sunI, amb: new THREE.Color(amb), ambI,
}));

export const isWet = (w) => w === 'rain' || w === 'storm';
export const flash = { v: 0, next: 0 };
const GREY = new THREE.Color('#8d99a6');
const SNOWC = new THREE.Color('#d9e0e6');
const WHITE = new THREE.Color('#ffffff');
const CLOUDDARK = new THREE.Color('#9aa3b4');
// Tinte del sol por estación (se multiplica): primavera fresca, verano dorado, otoño ámbar, invierno claro y algo frío
const SEASON_SUN = [new THREE.Color('#fffaf2'), new THREE.Color('#fff2d8'), new THREE.Color('#ffe2bc'), new THREE.Color('#f3f6fc')];

// Objeto compartido y reutilizado (sin asignaciones por frame)
export const L = {
  sky: new THREE.Color(), zenith: new THREE.Color(), horizon: new THREE.Color(), cloudCol: new THREE.Color(), sun: new THREE.Color(), amb: new THREE.Color(),
  sunI: 1, ambI: 0.7, night: 0, hour: 12, weather: 'clear', season: 0,
  dir: new THREE.Vector3(), cloud: 0.4,
};
const sunPos = new THREE.Vector3();
const moonPos = new THREE.Vector3(-18, 34, -12);

export function updateLighting(env) {
  const h = env.hour;
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1].h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = clamp((h - a.h) / (b.h - a.h), 0, 1);
  L.zenith.copy(a.zen).lerp(b.zen, t);
  L.horizon.copy(a.hor).lerp(b.hor, t);
  L.sun.copy(a.sun).lerp(b.sun, t);
  L.amb.copy(a.amb).lerp(b.amb, t);
  L.sunI = a.sunI + (b.sunI - a.sunI) * t;
  L.ambI = a.ambI + (b.ambI - a.ambI) * t;

  const night = h < 5 ? 1 : h < 6.5 ? 1 - (h - 5) / 1.5 : h < 19.5 ? 0 : h < 21.5 ? (h - 19.5) / 2 : 1;
  L.sun.multiply(SEASON_SUN[env.season] || WHITE);
  L.night = clamp(night, 0, 1);
  L.hour = h; L.weather = env.weather; L.season = env.season;

  // Posición del sol (arco 06–18) mezclada con la luna
  const ang = clamp((h - 6) / 12, 0, 1) * Math.PI;
  sunPos.set(-Math.cos(ang) * 40, Math.sin(ang) * 34 + 20, 14);
  L.dir.copy(sunPos).lerp(moonPos, smooth(0, 1, L.night)).normalize();

  // Clima: el cielo se apaga hacia un gris cálido y las nubes se espesan
  let cloud = 0.3;
  const dayK = 1 - L.night * 0.85; // de noche el gris no sube tanto
  L.cloudCol.copy(WHITE).lerp(L.sun, 0.35).lerp(L.horizon, 0.25 * L.night + 0.15);
  if (env.weather === 'rain' || env.weather === 'storm') {
    const st = env.weather === 'storm';
    const g = (st ? 0.78 : 0.6) * dayK, m = st ? 0.7 : 0.88;
    L.zenith.lerp(GREY, g).multiplyScalar(m); L.horizon.lerp(GREY, g * 0.9).multiplyScalar(st ? 0.78 : 0.95);
    L.amb.lerp(GREY, 0.4); L.sunI *= st ? 0.5 : 0.55; L.ambI *= 1.25;
    L.cloudCol.lerp(CLOUDDARK, (st ? 0.85 : 0.55) * dayK + 0.1).multiplyScalar(st ? 0.6 : 0.75);
    cloud = 1;
  } else if (env.weather === 'snow') {
    L.zenith.lerp(SNOWC, 0.45 * dayK); L.horizon.lerp(SNOWC, 0.5 * dayK); L.amb.lerp(SNOWC, 0.3); L.sunI *= 0.65;
    L.cloudCol.lerp(SNOWC, 0.5 * dayK);
    cloud = 0.8;
  }
  L.cloudCol.multiplyScalar(1 - 0.78 * L.night);
  L.sky.copy(L.zenith).lerp(L.horizon, 0.55); // color medio: fondo de la escena y base de otros elementos
  L.cloud = cloud;
  return L;
}

// Colores por estación
export const SEASON_COLORS = {
  grass: ['#98cf72', '#86c35a', '#c0a944', '#f1f6f8'],
  leaves: [['#f4b0c6', '#8ad46a', '#f9c4d4'], ['#5cb04e', '#4fa447', '#72be55'], ['#e5832f', '#cc4d32', '#eeaa38'], ['#eaf2f5', '#d6e4eb', '#f6fafb']],
  pine: ['#4f9a68', '#3f8a5c', '#d7e6e0', '#dbe8ee'],
};
