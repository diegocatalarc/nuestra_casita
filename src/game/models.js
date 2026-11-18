// Modelos 3D de Kenney (CC0). Siempre incrustados en el código (data URI) y decodificados en local,
// sin peticiones de red: así funcionan en cualquier alojamiento. Si algo falla se usa una forma de reserva
// y el juego sigue funcionando.
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const urls = import.meta.glob('../assets/models/*.glb', { query: '?url', import: 'default', eager: true });
const cache = new Map();

const fallback = (name) => (name === 'tree' ? new THREE.ConeGeometry(0.4, 1.8, 7).translate(0, 0.9, 0) : new THREE.BoxGeometry(0.5, 1, 0.5).translate(0, 0.5, 0));

function toBuffer(url) {
  if (url.startsWith('data:')) {
    const bin = atob(url.slice(url.indexOf(',') + 1));
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return Promise.resolve(u8.buffer);
  }
  return fetch(url).then((r) => r.arrayBuffer());
}

export function loadKGeo(name) {
  if (cache.has(name)) return cache.get(name);
  const url = urls[`../assets/models/${name}.glb`];
  const p = toBuffer(url).then((buf) => new Promise((resolve, reject) => {
    new GLTFLoader().parse(buf, '', (gltf) => {
      let g = null;
      gltf.scene.traverse((o) => { if (o.isMesh && !g) g = o.geometry; });
      g ? resolve(g) : reject(new Error('sin malla'));
    }, reject);
  })).catch((e) => { console.warn('Modelo no disponible, se usa una forma de reserva:', name, e); return fallback(name); });
  cache.set(name, p);
  return p;
}

/** Geometría del modelo. Devuelve una forma de reserva mientras carga (o si falla). */
export function useKGeo(name) {
  const [g, setG] = useState(() => fallback(name));
  useEffect(() => {
    let alive = true;
    loadKGeo(name).then((geo) => alive && setG(geo));
    return () => { alive = false; };
  }, [name]);
  return g;
}
