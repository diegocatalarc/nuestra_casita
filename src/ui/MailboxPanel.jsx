import { useState } from 'react';
import { useGame, partnerUid } from '../store/gameStore';
import { QUICK_NOTES } from '../game/constants';
import { sendLetter, readLetter } from '../game/actions';
import { PhotoPicker } from './media';
import Modal from './Modal';
import { t } from '../i18n';

const fmt = (t) => new Date(t).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MailboxPanel() {
  const [tab, setTab] = useState('in');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const uid = useGame((s) => s.user.uid);
  const mailbox = useGame((s) => s.mailbox);
  const players = useGame((s) => s.couple.players) || {};
  const other = useGame(partnerUid);
  const all = Object.values(mailbox).sort((a, b) => b.at - a.at);
  const inbox = all.filter((m) => m.to === uid), sent = all.filter((m) => m.from === uid);
  const unread = inbox.filter((m) => !m.readAt).length;

  const Letter = ({ m, mine }) => (
    <div className={`letter ${!mine && !m.readAt ? 'new' : ''}`} onClick={() => !mine && readLetter(m.id)}>
      <div className="l-head"><b>{mine ? t("Para {0}", [players[m.to]?.name || t('tu pareja')]) : t("De {0}", [players[m.from]?.name || t('tu pareja')])}</b><small>{fmt(m.at)}{mine && m.readAt ? t(" · leída ✓") : ''}</small></div>
      {m.text && <p>{m.text}</p>}
      {m.image && <img src={m.image} alt="" className="preview" />}
      {!mine && !m.readAt && <span className="chip">{t("Toca para abrir · +2 💗")}</span>}
    </div>
  );

  return (
    <Modal title={t("📬 Buzón")} wide>
      <div className="tabs">
        <button className={tab === 'in' ? 'on' : ''} onClick={() => setTab('in')}>{t("Recibidas")}{unread ? ` (${unread})` : ''}</button>
        <button className={tab === 'out' ? 'on' : ''} onClick={() => setTab('out')}>{t("Enviadas")}</button>
        <button className={tab === 'new' ? 'on' : ''} onClick={() => setTab('new')}>{t("✍️ Escribir")}</button>
      </div>
      {tab === 'in' && (inbox.length ? <div className="letters">{inbox.map((m) => <Letter key={m.id} m={m} />)}</div> : <p className="hint">{t("Aún no tienes cartas. Tu pareja puede dejarte una cuando quiera 💌")}</p>)}
      {tab === 'out' && (sent.length ? <div className="letters">{sent.map((m) => <Letter key={m.id} m={m} mine />)}</div> : <p className="hint">{t("No has enviado nada todavía.")}</p>)}
      {tab === 'new' && (
        <div className="form">
          <p className="sub">{t("Una nota rápida para alegrarle el día:")}</p>
          <div className="quick">{QUICK_NOTES.map((q) => <button key={q.text} className="pill" disabled={!other} onClick={() => sendLetter({ text: `${q.emoji} ${q.text}`, quick: true })}>{q.emoji} {q.text}</button>)}</div>
          <p className="sub" style={{ marginTop: 10 }}>{t("O escribe una carta:")}</p>
          <textarea rows={4} maxLength={800} placeholder={t("Querida/o…")} value={text} onChange={(e) => setText(e.target.value)} />
          <PhotoPicker value={image} onChange={setImage} />
          <button className="btn primary" disabled={!other || (!text.trim() && !image)} onClick={() => { sendLetter({ text, image }); setText(''); setImage(null); setTab('out'); }}>{t("Enviar carta 💌")}</button>
          {!other && <p className="hint">{t("Tu pareja todavía no se ha unido.")}</p>}
        </div>
      )}
    </Modal>
  );
}
