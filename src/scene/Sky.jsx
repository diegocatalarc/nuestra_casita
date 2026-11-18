import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { L, isWet } from '../game/lighting';
import { clamp } from '../game/rng';

/** Estrellas, sol y luna pegados a la cámara: se ven en el vacío que rodea el diorama. */
export function Backdrop() {
  const g = useRef(), stars = useRef(), sun = useRef(), moon = useRef();
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
    <group ref={g}>
      <points ref={stars} geometry={geo} frustumCulled={false}>
        <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} transparent depthWrite={false} fog={false} toneMapped={false} />
      </points>
      <mesh ref={sun} frustumCulled={false}><circleGeometry args={[3.2, 24]} /><meshBasicMaterial color="#fff0c0" fog={false} toneMapped={false} /></mesh>
      <mesh ref={moon} position={[11, 8, -400]} frustumCulled={false}><circleGeometry args={[4, 24]} /><meshBasicMaterial color="#f4f1ff" fog={false} toneMapped={false} /></mesh>
    </group>
  );
}

/** Nubes "solo sombra": no se ven, pero proyectan sombras suaves que cruzan el terreno. */
export function CloudShadows() {
  const refs = useRef([]);
  const clouds = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ x: i * 11, z: 4 + ((i * 17) % 44), s: 3.5 + (i % 3) * 1.6, v: 0.25 + (i % 4) * 0.08 })), []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const size = 0.3 + L.cloud * 0.45;
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
