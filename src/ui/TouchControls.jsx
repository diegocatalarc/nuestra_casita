import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { keys } from '../game/input';
import { zoomBy } from '../game/cameraControl';
import { t } from '../i18n';

export const isTouchDevice = () => { try { return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; } catch { return false; } };

/** Controles de cámara en pantalla para táctil (iPad): zoom y giro. Aparecen solos en pantallas táctiles. */
export default function TouchControls() {
  const chatOpen = useGame((s) => s.chatOpen);
  const [touch, setTouch] = useState(isTouchDevice);
  useEffect(() => {
    const on = (e) => { if (e.pointerType === 'touch') setTouch(true); };
    window.addEventListener('pointerdown', on, { passive: true });
    return () => window.removeEventListener('pointerdown', on);
  }, []);
  if (!touch || chatOpen) return null;
  const hold = (code) => ({
    onPointerDown: (e) => { e.preventDefault(); keys[code] = true; },
    onPointerUp: () => { keys[code] = false; }, onPointerLeave: () => { keys[code] = false; }, onPointerCancel: () => { keys[code] = false; },
  });
  return (
    <div className="touchctl" aria-label={t("Cámara")}>
      <button onClick={() => zoomBy(1.25)} aria-label={t("Acercar")}>＋</button>
      <button onClick={() => zoomBy(0.8)} aria-label={t("Alejar")}>－</button>
      <button {...hold('KeyQ')} aria-label={t("Girar a la izquierda")}>↺</button>
      <button {...hold('KeyE')} aria-label={t("Girar a la derecha")}>↻</button>
    </div>
  );
}
