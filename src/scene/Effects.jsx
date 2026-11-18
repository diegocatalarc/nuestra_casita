import { EffectComposer, Bloom, Vignette, TiltShift2, ToneMapping, HueSaturation, BrightnessContrast } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useGame } from '../store/gameStore';

/** Postproceso: brillo en luces, efecto maqueta (tilt-shift), color cálido y viñeta. Se puede desactivar. */
export default function Effects() {
  const on = useGame((s) => s.quality);
  if (!on) return null;
  return (
    <EffectComposer multisampling={4} disableNormalPass>
      <Bloom intensity={0.55} luminanceThreshold={0.82} luminanceSmoothing={0.25} mipmapBlur />
      <TiltShift2 blur={0.1} />
      <HueSaturation saturation={0.06} hue={0} />
      <BrightnessContrast brightness={0.07} contrast={0.04} />
      <Vignette offset={0.28} darkness={0.42} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
