import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ToneMapping, HueSaturation, BrightnessContrast } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useGame } from '../store/gameStore';
import { OutlineEffect } from './OutlineEffect';
import { setHullOutlines } from './toon';

const COARSE = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

/**
 * Postproceso. Calidad «Alta» (store.quality): contorno global por profundidad + nitidez + color.
 *  · Escritorio: bloom, color cálido, viñeta, ACES, MSAA x4 (el efecto maqueta TiltShift se quitó: desenfocaba los bordes).
 *  · Táctil (iPad): versión barata, UN pase (contorno + nitidez + ACES), sin bloom/viñeta y sin multisampling.
 * Con el contorno global activo se apagan los cascos invertidos de los personajes (no se ven dobles).
 */
export default function Effects() {
  const on = useGame((s) => s.quality);
  const outline = useMemo(() => new OutlineEffect(COARSE ? { sharp: 0.2 } : {}), []);
  useEffect(() => { setHullOutlines(false); return () => setHullOutlines(true); }, []);
  useFrame((s) => {
    const dpr = s.gl.getPixelRatio();
    outline.setView(Math.max(1, 1.7 * dpr * (COARSE ? 0.8 : 1))); // ≈1,5-2 px de pantalla
  });
  if (!on) return null;
  if (COARSE) {
    return (
      <EffectComposer multisampling={0} disableNormalPass>
        <primitive object={outline} dispose={null} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={4} disableNormalPass>
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
