import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { NEWS, newsSeen, markNewsSeen } from './news';
import Modal from './Modal';
import { t } from '../i18n';

/** Aviso de novedades: aparece una vez tras cada actualización (y desde ⚙️ Ayuda → Novedades). */
export default function NewsModal() {
  const first = useGame((s) => !s.couple?.players?.[s.user.uid]?.avatar);
  const away = useGame((s) => s.away);
  const force = useGame((s) => s.newsOpen);
  const [dismissed, setDismissed] = useState(false);
  const seen = newsSeen();
  const fresh = NEWS.filter((n) => n.v > seen);
  const auto = !dismissed && !first && !away && fresh.length > 0;
  if (!force && !auto) return null;
  const list = force ? NEWS : fresh;
  const close = () => { markNewsSeen(); setDismissed(true); useGame.getState().set({ newsOpen: false }); };
  return (
    <Modal title={t("🆕 ¡Novedades en la casita!")} onClose={close}>
      {[...list].reverse().map((n) => (
        <div key={n.v} className="news-block">
          <h3>{n.title}</h3>
          <ul className="news-list">{n.items.map((i, k) => <li key={k}><span>{i.emoji}</span> {i.text}</li>)}</ul>
        </div>
      ))}
      <p className="hint">{t("Lo nuevo está en la barra de abajo, marcado con 🆕.")}</p>
      <button className="btn primary big" onClick={close}>{t("¡Genial!")}</button>
    </Modal>
  );
}
