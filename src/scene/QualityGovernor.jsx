// Regulador automático de calidad gráfica: si el juego va a tirones, baja un escalón (alta → media → normal) y avisa.
// La resolución máxima por escalón se fija en la prop `dpr` del <Canvas> (GameCanvas.jsx), no aquí: R3F la reaplica al redimensionar.
// Solo mide unas pocas ventanas tras entrar o cambiar de escalón, y exige DOS ventanas lentas seguidas antes de bajar (un parón
// puntual no cuenta). No actúa si la persona eligió la calidad a mano (también en sesiones anteriores), con ?debug ni con nc_nogov=1.
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame, setQualityTier, qualityChosenByUser } from '../store/gameStore';
import { useBoot } from '../game/boot';
import { SETTLE_MS, MIN_SAMPLES, MAX_WINDOWS, decide } from '../game/quality';
import { t } from '../i18n';

const off = () => { try { return location.search.includes('debug') || localStorage.getItem('nc_nogov') === '1'; } catch { return false; } };

export default function QualityGovernor() {
  const tier = useGame((s) => s.qualityTier);
  const entered = useBoot((s) => s.entered);
  const st = useRef({ samples: [], from: 0, slow: 0, windows: 0, size: '' });
  // al entrar en el juego o cambiar de escalón: empezar de cero y dejar que se asiente
  useEffect(() => { st.current = { samples: [], from: performance.now() + SETTLE_MS, slow: 0, windows: 0, size: `${innerWidth}x${innerHeight}` }; }, [tier, entered]);
  useFrame((_, dt) => {
    const s = st.current;
    if (!entered || off() || useGame.getState().qualityManual || qualityChosenByUser() || s.windows >= MAX_WINDOWS) return;
    const now = performance.now();
    if (document.hidden) { s.samples = []; s.from = now + SETTLE_MS; return; }
    if (now < s.from) return;
    const size = `${innerWidth}x${innerHeight}`;
    if (size !== s.size) { s.size = size; s.samples = []; s.from = now + SETTLE_MS; return; } // redimensionar o cambiar de monitor: no medir
    s.samples.push(dt * 1000);
    if (s.samples.length < MIN_SAMPLES) return;
    const d = decide({ samples: s.samples, tier });
    s.samples = []; s.windows++;
    if (d.action === 'down') {
      s.slow++;
      if (s.slow >= 2) {
        setQualityTier(d.to, { auto: true });
        useGame.getState().toast(t("Hemos bajado la calidad gráfica para que vaya fluido. Puedes cambiarla en ⚙️ Ajustes."));
      }
    } else s.slow = 0;
  });
  return null;
}
