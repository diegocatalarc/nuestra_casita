import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../store/gameStore';
import { rebuildCollision } from '../game/movement';
import { serverNow } from '../game/time';
import Lighting from './Lighting';
import { Backdrop, CloudShadows } from './Sky';
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
import Fog from './Fog';
import { TilledSoil, LockedZones } from './Land';
import { MooredBoat, FishingGear, BiteMark } from './Boat';
import CameraRig from './CameraRig';
import Interaction from './Interaction';
import FloatingFx from './FloatingFx';
import Ambient from './Ambient';
import Effects from './Effects';

/** Mantiene la rejilla de colisión sincronizada con nodos agotados y edificios. */
function CollisionSync() {
  const world = useGame((s) => s.world);
  const nodes = useGame((s) => s.nodes);
  const buildings = useGame((s) => s.buildings);
  const tick = useGame((s) => Math.floor(s.now / 4000));
  useEffect(() => { rebuildCollision(world, nodes, buildings, serverNow()); }, [world, nodes, buildings, tick]);
  return null;
}

export default function GameCanvas() {
  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      orthographic
      dpr={[1, 2]}
      camera={{ zoom: 46, position: [40, 40, 40], near: 0.1, far: 1000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ camera }) => { if (location.search.includes('debug')) window.__cam = camera; }}
    >
      <color attach="background" args={['#bfe3f2']} />
      <fog attach="fog" args={['#bfe3f2', 120, 420]} />
      <CollisionSync />
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
        <MooredBoat />
        <Players />
        <FishingGear />
        <BiteMark />
        <Interaction />
        <FloatingFx />
        {!location.search.includes('nofog') && <Fog />}
      </Suspense>
      <Weather />
      <Ambient />
      <CameraRig />
      <Effects />
    </Canvas>
  );
}
