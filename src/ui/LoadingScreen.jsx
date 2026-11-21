// Pantalla de carga sobre el juego: se queda hasta que los modelos están cargados, el mundo listo y la imagen va fluida;
// entonces pide pulsar «Entrar» (que además activa el sonido, que el navegador no deja sin un toque).
import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useBoot, boot, bootStatus, SMOOTH_FRAMES, enterGame } from '../game/boot';
import { ctx } from '../game/movement';
import { startAudio } from '../game/audio';
import { t } from '../i18n';

export default function LoadingScreen() {
  const entered = useBoot((s) => s.entered);
  const { active, total, progress } = useProgress();
  const [tick, setTick] = useState(0);
  const [t0] = useState(() => Date.now());
  useEffect(() => { if (entered) return; const id = setInterval(() => setTick((n) => n + 1), 250); return () => clearInterval(id); }, [entered]);
  if (entered) return null;
  void tick;
  const assetsDone = boot.frames > 5 && !active && (total === 0 || progress >= 100);
  const st = bootStatus({ assetsDone, worldReady: ctx.ready, smooth: boot.smoothRun >= SMOOTH_FRAMES, elapsed: Date.now() - t0 });
  const labels = [t("Cargando modelos y texturas"), t("Preparando el mundo"), t("Afinando la fluidez")];
  const go = () => { startAudio(); enterGame(); };
  return (
    <div className="loading-screen" role="dialog" aria-label={t("Cargando")}>
      <div className="logo bob">🏡</div>
      <h1>{t("Nuestra Casita")}</h1>
      {!st.ready ? (
        <>
          <p>{t("Preparando el valle… un momento, que enseguida va todo fluido.")}</p>
          <div className="ls-bar"><i style={{ width: `${Math.max(8, st.pct)}%` }} /></div>
          <ul>{labels.map((l, i) => <li key={l} className={st.steps[i] ? 'ok' : ''}>{st.steps[i] ? '✅' : '⏳'} {l}</li>)}</ul>
        </>
      ) : (
        <>
          <p>{st.slow ? t("Listo. Si notas tirones, prueba a cerrar otras pestañas del navegador.") : t("¡Todo listo!")}</p>
          <button className="btn primary big" onClick={go}>{t("▶ Entrar al valle")}</button>
        </>
      )}
    </div>
  );
}
