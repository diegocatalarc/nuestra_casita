// «Para Bri 💗»: en iPad (Safari) pide instalar el juego como app (Añadir a pantalla de inicio), porque Safari no lo ofrece solo.
// Aparece una vez dentro del juego, sin tapar escenas ni paneles; se pospone 14 días con «Entendido» o se silencia con «No volver a mostrar».
import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { useBoot } from '../game/boot';
import { useScene } from '../game/story/director';
import { isIpad, isStandalone, shouldOffer, loadInstallState, saveInstallState } from '../game/install';
import { t } from '../i18n';

export default function InstallPrompt() {
  const entered = useBoot((s) => s.entered);
  const busy = useGame((s) => !!s.panel || !!s.chatOpen);
  const scene = useScene((s) => !!s.cur || s.queue.length > 0);
  const forced = useGame((s) => !!s.installOpen);
  const [show, setShow] = useState(false);
  const ready = entered && !busy && !scene;
  useEffect(() => {
    if (!ready || show) return;
    if (forced) { setShow(true); return; }
    if (!shouldOffer({ ipad: isIpad(), standalone: isStandalone(), state: loadInstallState() })) return;
    const id = setTimeout(() => setShow(true), 5000); // un respiro tras entrar
    return () => clearTimeout(id);
  }, [ready, show, forced]);
  if (!show) return null;
  const close = (patch) => { saveInstallState(patch); useGame.setState({ installOpen: false }); setShow(false); };
  return (
    <div className="install-prompt" role="dialog" aria-label={t("Instalar como app")}>
      <div className="ip-head"><span className="ip-ico">📲</span><b>{t("Para Bri 💗")}</b></div>
      <p>{t("Instala el juego como una app y ábrelo con un solo toque desde tu pantalla de inicio.")}</p>
      <ol>
        <li>{t("Toca Compartir ⬆️ (junto a la barra de direcciones de Safari).")}</li>
        <li>{t("Elige «Añadir a pantalla de inicio» ➕.")}</li>
        <li>{t("Pulsa «Añadir». ¡Listo!")}</li>
      </ol>
      <div className="ip-btns">
        <button className="btn primary" onClick={() => close({ dismissedAt: Date.now() })}>{t("Entendido")}</button>
        <button className="btn ghost" onClick={() => close({ never: true })}>{t("No volver a mostrar")}</button>
      </div>
    </div>
  );
}
