import { boot, useBoot } from '../game/boot';
import { lazy, memo, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { rebuildCollision } from '../game/movement';
import { serverNow } from '../game/time';
import Lighting from './Lighting';
import { Backdrop, CloudShadows } from './Sky';
import BootProbe from './BootProbe';
import Weather from './Weather';
import LightPool from './LightPool';
import Terrain from './Terrain';
import Nature from './Nature';
import Details from './Details';
import Props from './Props';
import Buildings from './Buildings';
import Crops from './Crops';
import DecorLayer from './Decor';
import Animals from './Animals';
import Children from './Children';
import Memories from './Memories';
import Players from './Players';
import Events from './Events';
import Gifts from './Gifts';
import Explore from './Explore';
import Discover from './Discover';
import Plaza from './Plaza';
import { TilledSoil, LockedZones } from './Land';
import { MooredBoat, FishingGear, BiteMark } from './Boat';
import CameraRig from './CameraRig';
import Interaction from './Interaction';
import FloatingFx from './FloatingFx';
import Ambient from './Ambient';
// El postproceso (bloom, tilt-shift…) es una librería grande: solo se descarga si los efectos están activos.
const Effects = lazy(() => import('./Effects'));

/** Mantiene la rejilla de colisión sincronizada con nodos agotados y edificios. */
function CollisionSync() {
  const world = useGame((s) => s.world);
  const nodes = useGame((s) => s.nodes);
  const buildings = useGame((s) => s.buildings);
  const tick = useGame((s) => Math.floor(s.now / 4000));
  useEffect(() => { rebuildCollision(world, nodes, buildings, serverNow()); }, [world, nodes, buildings, tick]);
  return null;
}

/**
 * Precalentamiento: sube a la GPU todas las geometrías y compila los shaders UNA vez (un dibujado sin descarte por
 * visibilidad) mientras la pantalla de carga sigue encima. Si no, cada objeto nuevo que entra en cámara al caminar
 * o hacer zoom provoca su subida y compilación en pleno juego: tirones.
 */
function Prewarm() {
  const { gl, scene, camera } = useThree();
  const n = useRef(0);
  useFrame(() => {
    n.current++;
    if ((n.current !== 60 && n.current !== 150) || useBoot.getState().entered) return; // solo mientras la pantalla de carga sigue encima
    const off = [];
    scene.traverse((o) => { if (o.frustumCulled && (o.isMesh || o.isPoints || o.isLine)) { o.frustumCulled = false; off.push(o); } });
    try { gl.compile(scene, camera); gl.render(scene, camera); } catch { /* sin precalentar: no pasa nada */ } finally { off.forEach((o) => { o.frustumCulled = true; }); boot.smoothRun = 0; } // el fotograma largo del precalentamiento no cuenta para medir la fluidez
  });
  return null;
}

// memo: App se vuelve a renderizar cada segundo (reloj); sin memo se reconciliaba toda la escena 3D cada vez.
export default memo(function GameCanvas() {
  const fx = useGame((s) => s.quality);
  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      orthographic
      dpr={typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches ? [1, 1.5] : [1, 2]}
      camera={{ zoom: 46, position: [40, 40, 40], near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={(state) => { if (location.search.includes('debug')) { window.__cam = state.camera; window.__gl = state.gl; window.__r3f = state; } }}
    >
      <color attach="background" args={['#bfe3f2']} />
      <CollisionSync />
      <BootProbe />
      <Prewarm />
      <Lighting />
      <LightPool />
      <Backdrop />
      <CloudShadows />
      <Suspense fallback={null}>
        <Terrain />
        <Nature />
        <Details />
        <Props />
        <Buildings />
        <TilledSoil />
        <LockedZones />
        <Crops />
        <DecorLayer />
        <Animals />
        <Children />
        <Memories />
        <Events />
        <Gifts />
        <Explore />
        <Discover />
        <Plaza />
        <MooredBoat />
        <Players />
        <FishingGear />
        <BiteMark />
        <Interaction />
        <FloatingFx />
      </Suspense>
      <Weather />
      <Ambient />
      <CameraRig />
      {fx && <Suspense fallback={null}><Effects /></Suspense>}
    </Canvas>
  );
});
