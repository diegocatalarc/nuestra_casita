import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ToneMapping, HueSaturation, BrightnessContrast } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useGame } from '../store/gameStore';
import { OutlineEffect } from './OutlineEffect';
import { setHullOutlines } from './toon';

const COARSE = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

/**
 * Postproceso por escalón de calidad (store.qualityTier; «normal» no monta nada):
 *  · «alta»: contorno global completo + nitidez, bloom, color cálido, viñeta, ACES y MSAA x4 (en táctil: un solo pase barato).
 *  · «media»: contorno ligero (la mitad de lecturas), ACES y MSAA x2; sin bloom ni viñeta. Pensada para equipos que con «alta» van a tirones.
 * El regulador automático (QualityGovernor) baja de escalón si el juego va a tirones. Con el contorno global activo se apagan los
 * cascos invertidos de los personajes (no se ven dobles).
 */
export default function Effects() {
  const tier = useGame((s) => s.qualityTier);
  const lite = tier === 'media';
  const outline = useMemo(() => new OutlineEffect({ ...(COARSE ? { sharp: 0.2 } : {}), lite }), [lite]);
  useEffect(() => { setHullOutlines(false); return () => setHullOutlines(true); }, []);
  // @react-three/postprocessing no libera el composer al desmontarlo: se hace a mano (búferes a pantalla completa, MSAA, pases)
  const comp = useRef(null);
  useEffect(() => () => { try { comp.current?.dispose?.(); } catch { /* ya liberado */ } comp.current = null; }, [tier]);
  useFrame((s) => {
    const dpr = s.gl.getPixelRatio();
    outline.setView(Math.max(1, 1.7 * dpr * (COARSE ? 0.8 : 1))); // ≈1,5-2 px de pantalla
  });
  if (tier === 'normal') return null;
  if (COARSE) {
    return (
      <EffectComposer ref={comp} key={tier} multisampling={0} disableNormalPass>
        <primitive object={outline} dispose={null} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }
  if (lite) {
    return (
      <EffectComposer ref={comp} key={tier} multisampling={2} disableNormalPass>
        <primitive object={outline} dispose={null} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer ref={comp} key={tier} multisampling={4} disableNormalPass>
      {/* el contorno va PRIMERO: solo el primer pase ve la profundidad de la escena (después los búferes se intercambian) */}
      <primitive object={outline} dispose={null} />
      <Bloom intensity={0.55} luminanceThreshold={0.82} luminanceSmoothing={0.25} mipmapBlur />
      <HueSaturation saturation={0.06} hue={0} />
      <BrightnessContrast brightness={0.07} contrast={0.04} />
      <Vignette offset={0.28} darkness={0.42} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
