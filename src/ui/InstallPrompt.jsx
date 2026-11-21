// «Para Bri 💗»: en iPad (Safari) pide instalar el juego como app (Añadir a pantalla de inicio), porque Safari no lo ofrece solo.
// Aparece una vez dentro del juego, solo cuando no hay nada más en pantalla (escenas, paneles, diálogos, novedades, avatar…)
// y se oculta si algo se abre después. «Entendido» la pospone 14 días; «No volver a mostrar» la silencia.
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { useBoot } from '../game/boot';
import { useScene } from '../game/story/director';
import { isIpad, isStandalone, shouldOffer, loadInstallState, saveInstallState } from '../game/install';
import { newsSeen, NEWS_VERSION } from './news';
import { dialogueNpc } from './DialogueModal';
import { t } from '../i18n';

/** ¿Hay la calma suficiente para mostrar la tarjeta? (nada más abierto, avatar creado, novedades vistas, sin escena). */
function calm() {
  const g = useGame.getState(), sc = useScene.getState();
  return !!useBoot.getState().entered && !!g.couple && !!g.couple.players?.[g.user?.uid]?.avatar
    && !g.panel && !g.chatOpen && !g.newsOpen && !g.away && g.fishState === 'idle' && !dialogueNpc()
    && !sc.cur && sc.queue.length === 0 && newsSeen() >= NEWS_VERSION;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);   // ya le toca verse
  const [ok, setOk] = useState(false);       // y ahora mismo hay calma
  const quiet = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      const c = calm();
      setOk(c);
      quiet.current = c ? quiet.current + 1 : 0;
      const g = useGame.getState();
      if (!show && c && (g.installOpen || (quiet.current >= 5 && shouldOffer({ ipad: isIpad(), standalone: isStandalone(), state: loadInstallState() })))) setShow(true);
    }, 1000);
    return () => clearInterval(id);
  }, [show]);
  if (!show || !ok) return null;
  const close = (patch) => { saveInstallState(patch); useGame.setState({ installOpen: false }); setShow(false); };
  return (
    <div className="install-prompt" role="dialog" aria-label={t("Instalar como app")}>
      <div className="ip-head"><span className="ip-ico">📲</span><b>{t("Para Bri 💗")}</b></div>
      <p>{t("Instala el juego como una app y ábrelo con un solo toque desde tu pantalla de inicio.")}</p>
      <ol>
        <li>{t("Toca Compartir ⬆️ (arriba a la derecha, junto a la barra de direcciones).")}</li>
        <li>{t("Elige «Añadir a pantalla de inicio» ➕ (si no la ves, búscala en «Más»).")}</li>
        <li>{t("Pulsa «Añadir». ¡Listo!")}</li>
      </ol>
      <div className="ip-btns">
        <button className="btn primary" onClick={() => close({ dismissedAt: Date.now() })}>{t("Entendido")}</button>
        <button className="btn ghost" onClick={() => close({ never: true })}>{t("No volver a mostrar")}</button>
      </div>
    </div>
  );
}
