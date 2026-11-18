import { useEffect, useRef, useState } from 'react';
import { useGame, partnerUid } from '../store/gameStore';
import { sendChat, markChatSeen } from '../game/actions';
import { t } from '../i18n';

const QUICK = ['❤️', '😘', '🤗', '😂', '🥺', '👍', '🌙', '☀️'];
const hhmm = (ms) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const dayKey = (ms) => new Date(ms).toDateString();
const dayLabel = (ms) => {
  const d = new Date(ms), n = new Date();
  if (d.toDateString() === n.toDateString()) return t("Hoy");
  const y = new Date(n); y.setDate(n.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return t("Ayer");
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};
const onlyEmoji = (s) => /^\p{Extended_Pictographic}{1,3}$/u.test(s.replace(/️/g, ''));

/** Chat en vivo con tu pareja: ventana flotante que no tapa el juego. */
export default function ChatPanel() {
  const uid = useGame((s) => s.user.uid);
  const chat = useGame((s) => s.chat);
  const players = useGame((s) => s.couple.players) || {};
  const other = useGame(partnerUid);
  const online = useGame((s) => s.partner.online);
  const [text, setText] = useState('');
  const list = useRef();
  const msgs = Object.values(chat).sort((a, b) => a.at - b.at);
  const lastMine = [...msgs].reverse().find((m) => m.from === uid);
  const seen = other ? players[other]?.chatSeen || 0 : 0;

  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; markChatSeen(); }, [msgs.length]);

  const send = (v = text) => { if (!v.trim()) return; sendChat(v); if (v === text) setText(''); };
  const name = players[other]?.name || t("Tu pareja");

  return (
    <div className="chatdock">
      <div className="chat-head">
        <span className={`dot ${online ? 'on' : 'off'}`} /> <b>{other ? name : t("Chat")}</b>
        <small>{online ? t("en línea") : t("desconectada/o")}</small>
        <button className="x" onClick={() => useGame.getState().set({ chatOpen: false })} aria-label={t("Cerrar")}>✕</button>
      </div>
      <div className="chat-list" ref={list}>
        {!other && <p className="hint center">{t("Cuando tu pareja se una, podréis hablar aquí en tiempo real 💬")}</p>}
        {other && !msgs.length && <p className="hint center">{t("Aún no hay mensajes. ¡Di hola! 👋")}</p>}
        {msgs.map((m, i) => {
          const mine = m.from === uid;
          const newDay = i === 0 || dayKey(msgs[i - 1].at) !== dayKey(m.at);
          return (
            <div key={m.id}>
              {newDay && <div className="chat-day">{dayLabel(m.at)}</div>}
              <div className={`msg ${mine ? 'mine' : ''} ${onlyEmoji(m.text) ? 'emoji' : ''}`}>
                <span className="bubble-t">{m.text}</span>
                <small>{hhmm(m.at)}{mine && m === lastMine && seen >= m.at ? ' ✓✓' : ''}</small>
              </div>
            </div>
          );
        })}
      </div>
      <div className="chat-quick">{QUICK.map((e) => <button key={e} onClick={() => send(e)} disabled={!other}>{e}</button>)}</div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input value={text} maxLength={400} placeholder={other ? t("Escribe un mensaje…") : t("Esperando a tu pareja…")} disabled={!other} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        <button className="btn primary" disabled={!other || !text.trim()}>➤</button>
      </form>
    </div>
  );
}
