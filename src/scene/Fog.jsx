import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EXPLORE } from '../game/constants';
import { fog, CH, markCircle } from '../game/fog';
import { me } from '../game/runtime';
import { useGame } from '../store/gameStore';
import { L } from '../game/lighting';

const PER = 3; // nubes por celda
const ease = (k) => k * k * (3 - 2 * k);
const DAY = new THREE.Color('#ffffff'), NIGHT = new THREE.Color('#8794b4');

/** Geometría de nube con el sombreado horneado en los vértices (arriba claro, abajo azulado): así el material no necesita luces. */
function puffGeo() {
  const g = new THREE.IcosahedronGeometry(1, 1).toNonIndexed();
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  const top = new THREE.Color('#ffffff'), bot = new THREE.Color('#b9c6da');
  const pos = g.attributes.position, c = new THREE.Color();
  for (let i = 0; i < n; i += 3) {
    // un tono por cara (aspecto facetado low-poly)
    const ny = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    c.copy(bot).lerp(top, Math.min(1, Math.max(0, 0.5 + ny * 0.6)));
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/**
 * Niebla del mapa: nubes que cubren lo no descubierto y se disipan al acercarte.
 * Rendimiento: material sin luces, solo se dibujan las nubes visibles por la cámara (instancias compactadas)
 * y la descubierta se marca ~5 veces por segundo para que la niebla se abra de forma continua, no a saltos.
 */
export default function Fog() {
  const ref = useRef();
  const mat = useRef();
  const geo = useMemo(puffGeo, []);
  const seeds = useMemo(() => {
    const o = [];
    const h = (a) => { const x = Math.sin(a * 127.1) * 43758.5453; return x - Math.floor(x); };
    const c = EXPLORE.chunk;
    for (let cz = 0; cz < CH; cz++) for (let cx = 0; cx < CH; cx++) for (let k = 0; k < PER; k++) {
      const a = cz * 131 + cx * 17 + k * 7;
      o.push({ i: cz * CH + cx, x: cx * c + c / 2 + (h(a) - 0.5) * c * 0.9, z: cz * c + c / 2 + (h(a + 1) - 0.5) * c * 0.9, y: k === 2 ? 2.6 : 0.55 + h(a + 2) * 0.9, r: (k === 2 ? 2.7 : 3.0) + h(a + 3) * 0.9, ph: h(a + 4) * 6.28 });
    }
    return o;
  }, []);
  const st = useRef({ first: true, frame: 0, mark: 0, fr: new THREE.Frustum(), pm: new THREE.Matrix4(), sph: new THREE.Sphere() });

  useFrame((s, dt) => {
    const m = ref.current, S = st.current; if (!m) return;
    S.frame++;
    const t = s.clock.elapsedTime;
    // 1) descubrir andando, a ~5 Hz (la escritura a la nube sigue en exploreTick, cada 3,5 s)
    S.mark += dt;
    if (S.mark > 0.2) {
      S.mark = 0;
      if (markCircle(me.x, me.z, me.boat ? EXPLORE.radius + 1 : EXPLORE.radius)) useGame.setState({ fogVer: fog.ver });
    }
    // 2) animar la apertura de las celdas
    let touched = false;
    for (let i = 0; i < fog.reveal.length; i++) {
      const target = fog.bits[i] ? 0 : 1;
      if (S.first) fog.reveal[i] = target;
      else if (fog.reveal[i] !== target) { const d = target - fog.reveal[i]; fog.reveal[i] += Math.sign(d) * Math.min(Math.abs(d), dt * 0.9); touched = true; }
    }
    S.first = false;
    // 3) material según la luz del día
    if (mat.current) mat.current.color.copy(DAY).lerp(NIGHT, L.night);
    // 4) recolocar instancias: cada 4.º frame (cada frame mientras se abre una celda)
    if (!touched && S.frame % 4) return;
    S.pm.multiplyMatrices(s.camera.projectionMatrix, s.camera.matrixWorldInverse);
    S.fr.setFromProjectionMatrix(S.pm);
    const arr = m.instanceMatrix.array;
    let n = 0;
    for (let q = 0; q < seeds.length; q++) {
      const p = seeds[q], f = fog.reveal[p.i];
      if (f <= 0.002) continue; // celda ya descubierta: ni se dibuja
      S.sph.center.set(p.x, p.y, p.z); S.sph.radius = p.r + 1;
      if (!S.fr.intersectsSphere(S.sph)) continue; // fuera de cámara
      const e = ease(f), o = n * 16, sx = p.r * e + 0.001, sy = p.r * 0.62 * e + 0.001;
      arr[o] = sx; arr[o + 1] = 0; arr[o + 2] = 0; arr[o + 3] = 0;
      arr[o + 4] = 0; arr[o + 5] = sy; arr[o + 6] = 0; arr[o + 7] = 0;
      arr[o + 8] = 0; arr[o + 9] = 0; arr[o + 10] = sx; arr[o + 11] = 0;
      arr[o + 12] = p.x + Math.sin(t * 0.2 + p.ph) * 0.25; arr[o + 13] = p.y + (1 - e) * -0.5; arr[o + 14] = p.z + Math.cos(t * 0.17 + p.ph) * 0.25; arr[o + 15] = 1;
      n++;
    }
    m.count = n;
    m.visible = n > 0;
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, null, seeds.length]} frustumCulled={false}>
      <meshBasicMaterial ref={mat} vertexColors />
    </instancedMesh>
  );
}
