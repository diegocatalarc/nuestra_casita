// Resolución por escalón y regulador automático de calidad: si el juego va a tirones, baja un escalón (alta → media → normal)
// y avisa. No actúa si la persona eligió la calidad a mano en esta sesión, con ?debug (capturas/pruebas) ni con nc_nogov=1.
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGame, setQualityTier } from '../store/gameStore';
import { useBoot } from '../game/boot';
import { DPR_CAP, SETTLE_MS, decide } from '../game/quality';
import { t } from '../i18n';

const off = () => { try { return location.search.includes('debug') || localStorage.getItem('nc_nogov') === '1'; } catch { return false; } };

export default function QualityGovernor() {
  const setDpr = useThree((s) => s.setDpr);
  const tier = useGame((s) => s.qualityTier);
  const entered = useBoot((s) => s.entered);
  const samples = useRef([]);
  const since = useRef(0);
  // resolución máxima según el escalón (en Retina, 2× cuesta 4× los píxeles)
  useEffect(() => { setDpr(Math.min(window.devicePixelRatio || 1, DPR_CAP[tier] || 1.5)); }, [tier, setDpr]);
  // al entrar en el juego o cambiar de escalón, esperar a que se asiente antes de medir
  useEffect(() => { samples.current = []; since.current = performance.now() + SETTLE_MS; }, [tier, entered]);
  useFrame((_, dt) => {
    if (!entered || off() || useGame.getState().qualityManual || document.hidden) return;
    if (performance.now() < since.current) return;
    samples.current.push(dt * 1000);
    if (samples.current.length < 90) return;
    const d = decide({ samples: samples.current, tier });
    samples.current = [];
    if (d.action === 'down') {
      setQualityTier(d.to);
      useGame.getState().toast(t("Hemos bajado la calidad gráfica para que vaya fluido. Puedes cambiarla en ⚙️ Ajustes."));
    }
  });
  return null;
}
