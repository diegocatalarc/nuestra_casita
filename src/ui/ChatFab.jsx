import { useEffect } from 'react';
import { useGame, partnerUid } from '../store/gameStore';
import { isTyping } from '../game/input';
import { t } from '../i18n';

/** Acceso permanente al chat: botón flotante con contador, vista previa del último mensaje y atajo Enter. */
export default function ChatFab() {
  const open = useGame((s) => s.chatOpen);
  const online = useGame((s) => s.partner.online);
  const hasPartner = useGame((s) => !!partnerUid(s));
  const name = useGame((s) => s.partner.name);
  const unread = useGame((s) => {
    const seen = s.couple?.players?.[s.user.uid]?.chatSeen || 0;
    return Object.values(s.chat).filter((m) => m.from !== s.user.uid && m.at > seen);
  }, (a, b) => a.length === b.length && a[a.length - 1]?.id === b[b.length - 1]?.id);
  const last = unread.length ? unread.reduce((a, b) => (a.at > b.at ? a : b)) : null;
  const toggle = () => useGame.getState().set({ chatOpen: !open });

  useEffect(() => {
    const k = (e) => {
      if (e.code !== 'Enter' || e.repeat || isTyping() || useGame.getState().chatOpen) return;
      if (document.querySelector('.modal, .overlay')) return; // no robar el Enter a un diálogo abierto
      e.preventDefault();
      useGame.getState().set({ chatOpen: true });
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  return (
    <div className="chatfab-wrap">
      {!open && last && (
        <button className="chatfab-preview" onClick={toggle}>
          <b>{name}</b><span>{last.text.slice(0, 70)}</span>
        </button>
      )}
      <button className={`chatfab ${open ? 'on' : ''} ${unread.length && !open ? 'ring' : ''}`} onClick={toggle}
        title={t("Chat con tu pareja (Enter)")} aria-label={t("Chat con tu pareja")}>
        <span className="emo">{open ? '✕' : '💬'}</span>
        {hasPartner && <i className={`dot ${online ? 'on' : 'off'}`} />}
        {!open && unread.length > 0 && <em className="badge">{unread.length > 9 ? '9+' : unread.length}</em>}
        {!open && <small>{t("Chat")}</small>}
      </button>
    </div>
  );
}
