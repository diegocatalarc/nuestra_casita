import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { DecorModel } from './scene/Decor';
import ContactShadow from './scene/shadow';
import { DECOR } from './game/constants';

/** Sala de pruebas visual (solo con ?showroom): un objeto sobre un suelo liso con la luz del juego. */
export default function Showroom() {
  const [st, setSt] = useState({ type: new URLSearchParams(location.search).get('obj') || 'sofa', variant: 0, rot: 0 });
  useEffect(() => { window.__show = (type, variant = 0, rot = 0) => setSt({ type, variant, rot }); }, []);
  const d = DECOR[st.type];
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#cfe8c4' }}>
      <Canvas shadows={{ type: THREE.PCFSoftShadowMap }} orthographic dpr={[1, 2]} camera={{ zoom: 135, position: [6, 6.4, 6], near: 0.1, far: 100 }} onCreated={({ camera }) => camera.lookAt(0, 0.75, 0)}>
        <color attach="background" args={['#cfe8c4']} />
        <hemisphereLight args={['#fff6e0', '#9fb88a', 0.9]} />
        <directionalLight position={[5, 9, 4]} intensity={2.1} color="#fff1d6" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0004} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#a9d58a" roughness={1} /></mesh>
        <Suspense fallback={null}>
          {d && <group key={st.type} rotation={[0, st.rot * Math.PI / 2, 0]}>{!d.flat && <ContactShadow w={d.w} d={d.d} />}<DecorModel type={st.type} variant={st.variant} /></group>}
          {st.type.startsWith('@') && null}
        </Suspense>
      </Canvas>
    </div>
  );
}
