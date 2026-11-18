import * as THREE from 'three';
import { clamp, smooth } from './rng';

// hora, cielo, sol, intensidad sol, ambiente, intensidad ambiente
const KEYS = [
  [0, '#0e1530', '#7f95ff', 0.35, '#3a4a8a', 0.55],
  [5, '#1c2550', '#8fa0ff', 0.3, '#4a5a9a', 0.55],
  [6.5, '#f6b79a', '#ffb27a', 0.9, '#f3c1b0', 0.55],
  [8.5, '#bfe3f2', '#fff0d0', 1.7, '#e0e4f6', 0.9],
  [12, '#a9dcf5', '#fff6e5', 2.0, '#e6e8fa', 1.0],
  [16.5, '#bfe0ef', '#ffe9bf', 1.9, '#f2e6e2', 0.95],
  [18.5, '#f7a78a', '#ffb88f', 1.35, '#ffd2c6', 1.05],
  [20, '#7a5ca0', '#c4a2ee', 0.7, '#a89ad0', 0.85],
  [21.5, '#1c2550', '#7f95ff', 0.35, '#3a4a8a', 0.55],
  [24, '#0e1530', '#7f95ff', 0.35, '#3a4a8a', 0.55],
].map(([h, sky, sun, sunI, amb, ambI]) => ({
  h, sky: new THREE.Color(sky), sun: new THREE.Color(sun), sunI, amb: new THREE.Color(amb), ambI,
}));

export const isWet = (w) => w === 'rain' || w === 'storm';
export const flash = { v: 0, next: 0 };
const GREY = new THREE.Color('#8d99a6');
const FOGC = new THREE.Color('#e6e0d8');
const SNOWC = new THREE.Color('#cfd8e0');

// Objeto compartido y reutilizado (sin asignaciones por frame)
export const L = {
  sky: new THREE.Color(), sun: new THREE.Color(), amb: new THREE.Color(), fog: new THREE.Color(),
  sunI: 1, ambI: 0.7, night: 0, hour: 12, weather: 'clear', season: 0,
  dir: new THREE.Vector3(), fogNear: 120, fogFar: 420, cloud: 0.4,
};
const sunPos = new THREE.Vector3();
const moonPos = new THREE.Vector3(-18, 34, -12);

export function updateLighting(env) {
  const h = env.hour;
  let i = 0;
  while (i < KEYS.length - 2 && h >= KEYS[i + 1].h) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = clamp((h - a.h) / (b.h - a.h), 0, 1);
  L.sky.copy(a.sky).lerp(b.sky, t);
  L.sun.copy(a.sun).lerp(b.sun, t);
  L.amb.copy(a.amb).lerp(b.amb, t);
  L.sunI = a.sunI + (b.sunI - a.sunI) * t;
  L.ambI = a.ambI + (b.ambI - a.ambI) * t;

  const night = h < 5 ? 1 : h < 6.5 ? 1 - (h - 5) / 1.5 : h < 19.5 ? 0 : h < 21.5 ? (h - 19.5) / 2 : 1;
  L.night = clamp(night, 0, 1);
  L.hour = h; L.weather = env.weather; L.season = env.season;

  // Posición del sol (arco 06–18) mezclada con la luna
  const ang = clamp((h - 6) / 12, 0, 1) * Math.PI;
  sunPos.set(-Math.cos(ang) * 40, Math.sin(ang) * 34 + 20, 14);
  L.dir.copy(sunPos).lerp(moonPos, smooth(0, 1, L.night)).normalize();

  // Clima
  let fogNear = 120, fogFar = 420, cloud = 0.35;
  L.fog.copy(L.sky);
  if (env.weather === 'rain' || env.weather === 'storm') {
    const st = env.weather === 'storm';
    L.sky.lerp(GREY, st ? 0.78 : 0.6).multiplyScalar(st ? 0.7 : 1); L.amb.lerp(GREY, 0.4); L.sunI *= st ? 0.5 : 0.55; L.ambI *= 1.25; L.fog.copy(L.sky);
    fogNear = st ? 55 : 62; fogFar = st ? 140 : 170; cloud = 1;
  } else if (env.weather === 'snow') {
    L.sky.lerp(SNOWC, 0.5); L.amb.lerp(SNOWC, 0.3); L.sunI *= 0.65; L.fog.copy(L.sky);
    fogNear = 56; fogFar = 150; cloud = 0.8;
  } else if (env.weather === 'fog') {
    L.sky.lerp(FOGC, 0.65); L.sunI *= 0.8; L.fog.copy(L.sky);
    fogNear = 60; fogFar = 150; cloud = 0.6;
  }
  L.fogNear = fogNear; L.fogFar = fogFar; L.cloud = cloud;
  return L;
}

// Colores por estación
export const SEASON_COLORS = {
  grass: ['#9ccc7a', '#82c262', '#bdb04e', '#e9f1f3'],
  leaves: [['#f3b4c8', '#8fd072', '#f7c7d6'], ['#5fae55', '#4f9e4c', '#6fba5a'], ['#e08a3c', '#c8553a', '#e8b24a'], ['#e1ebef', '#cfdde4', '#eef4f6']],
  pine: ['#4f9a68', '#3f8a5c', '#d7e6e0', '#dbe8ee'],
};
