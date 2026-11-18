import { useState } from 'react';
import { useGame, partnerUid } from '../store/gameStore';
import { DATES, DATE_LIMIT, DATE_REWARD, GIFT, ITEMS } from '../game/constants';
import { dayUTC, warmth } from '../game/logic';
import { inviteDate, respondDate, cancelDate, hideGift, retrieveGift } from '../game/actions';
import { me } from '../game/runtime';
import Modal from './Modal';
import { t } from '../i18n';

const GIFT_ITEMS = ['flower', 'rose', 'strawberry', 'egg', 'jam', 'pie', 'sushi', 'crystal', 'cloth', 'carp'];

/** Citas en pareja y regalos escondidos. */
export default function DatesPanel() {
  const [tab, setTab] = useState('dates');
  const couple = useGame((s) => s.couple);
  const uid = useGame((s) => s.user.uid);
  const now = useGame((s) => s.now);
  const partner = useGame((s) => s.partner);
  const gifts = useGame((s) => s.gifts);
  const inv = couple.inventory || {};
  const date = couple.date;
  const doneToday = couple.datesDone?.[dayUTC(now)] || 0;

  const [kind, setKind] = useState('coins');
  const [amount, setAmount] = useState(GIFT.coinOptions[1]);
  const [item, setItem] = useState('flower');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [hint, setHint] = useState('');
  const mine = Object.values(gifts).filter((g) => g.from === uid).sort((a, b) => b.at - a.at);
  const forMe = Object.values(gifts).filter((g) => g.from !== uid && !g.foundBy);
  const foundByMe = Object.values(gifts).filter((g) => g.foundBy === uid).length;
  const items = GIFT_ITEMS.filter((k) => (inv[k] || 0) > 0);

  return (
    <Modal title={t("💞 Citas y regalos")} wide>
      <div className="tabs">
        <button className={tab === 'dates' ? 'on' : ''} onClick={() => setTab('dates')}>{t("💞 Citas")}</button>
        <button className={tab === 'gifts' ? 'on' : ''} onClick={() => setTab('gifts')}>{t("🎁 Regalos escondidos")}{forMe.length ? ` (${forMe.length})` : ''}</button>
      </div>

      {tab === 'dates' && (<>
        <p className="sub">{t("Una cita se cumple estando juntos haciendo algo. Cada una da +{0} 💗 +{1} 🪙 y guarda un recuerdo automático. Hoy: {2}/{3}.", [DATE_REWARD.hearts, DATE_REWARD.coins, doneToday, DATE_LIMIT])}</p>
        {date && (
          <div className="evcard fest">
            <div className="ev-head"><span className="npc">{DATES[date.kind].emoji}</span><div><b>{DATES[date.kind].label}</b><small>{date.state === 'invited' ? (date.by === uid ? t("Esperando respuesta…") : t("¡{0} te invita!", [partner.name])) : t("En marcha: {0}/{1} s juntos", [Math.round(date.progress || 0), DATES[date.kind].goal])}</small></div></div>
            {date.state === 'active' && <div className="vbar wide"><div><i style={{ width: `${Math.min(100, ((date.progress || 0) / DATES[date.kind].goal) * 100)}%` }} /></div></div>}
            <p className="hint">{DATES[date.kind].desc}</p>
            <div className="row">
              {date.state === 'invited' && date.by !== uid && <><button className="btn primary" onClick={() => respondDate(true)}>{t("💞 Aceptar")}</button><button className="btn ghost" onClick={() => respondDate(false)}>{t("Ahora no")}</button></>}
              {(date.by === uid || date.state === 'active') && <button className="btn ghost" onClick={cancelDate}>{t("Cancelar cita")}</button>}
            </div>
          </div>
        )}
        <div className="grid">
          {Object.entries(DATES).map(([k, d]) => (
            <div className="item" key={k}>
              <div className="emoji">{d.emoji}</div><h3>{d.label} <small>{d.goal} s</small></h3>
              <p>{d.desc}</p>
              <button className="btn primary" disabled={!!date || !partner.online || doneToday >= DATE_LIMIT} onClick={() => inviteDate(k)}>{!partner.online ? t("Tu pareja no está en línea") : t("Invitar")}</button>
            </div>
          ))}
        </div>
      </>)}

      {tab === 'gifts' && (<>
        <p className="sub">{t("Esconde un regalo en el mapa donde estés ahora. Tu pareja recibirá pistas «frío / caliente» y lo encontrará al pasar por encima. Máximo {0} a la vez.", [GIFT.max])}</p>
        {forMe.length > 0 && (
          <div className="evcard">
            <b>{t("🔎 Regalos escondidos para ti")}</b>
            {forMe.map((g) => { const w = warmth(Math.hypot(me.x - g.x, me.z - g.z)); return <p key={g.id}>{w.icon} <b>{w.text}</b>{g.hint ? ` · “${g.hint}”` : ''}</p>; })}
          </div>
        )}
        <div className="form">
          <div className="tabs">
            <button className={kind === 'coins' ? 'on' : ''} onClick={() => setKind('coins')}>🪙 {t("Monedas")}</button>
            <button className={kind === 'item' ? 'on' : ''} onClick={() => setKind('item')}>🎒 {t("Objeto")}</button>
          </div>
          {kind === 'coins' ? (
            <div className="pills">{GIFT.coinOptions.map((c) => <button key={c} className={`pill ${amount === c ? 'on' : ''}`} onClick={() => setAmount(c)} disabled={(couple.coins || 0) < c}>🪙 {c}</button>)}</div>
          ) : items.length ? (
            <div className="row"><div className="pills">{items.map((k) => <button key={k} className={`pill ${item === k ? 'on' : ''}`} onClick={() => setItem(k)}>{ITEMS[k].emoji} {inv[k]}</button>)}</div>
              <input type="number" min={1} max={Math.min(5, inv[item] || 1)} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(5, +e.target.value || 1)))} style={{ width: 70 }} /></div>
          ) : <p className="hint">{t("No tenéis objetos de regalo en la mochila (flores, fresas, tartas…).")}</p>}
          <textarea rows={2} maxLength={GIFT.noteMax} placeholder={t("Una nota para cuando lo encuentre 💌")} value={note} onChange={(e) => setNote(e.target.value)} />
          <input maxLength={80} placeholder={t("Una pista (opcional): «cerca del agua»…")} value={hint} onChange={(e) => setHint(e.target.value)} />
          <button className="btn primary" disabled={!partnerUid(useGame.getState()) || (kind === 'item' && !items.length)} onClick={() => { hideGift(kind === 'coins' ? { kind, n: amount, note, hint } : { kind, item, n: Math.min(qty, inv[item] || 1), note, hint }); setNote(''); setHint(''); }}>{t("🎁 Esconder aquí")}</button>
        </div>
        {mine.length > 0 && (<>
          <h3 className="fish-h">{t("Tus regalos")} <small>{t("encontrados por tu pareja: {0}", [mine.filter((g) => g.foundBy).length])}</small></h3>
          {mine.map((g) => (
            <div className="evcard" key={g.id}>
              <div>{g.kind === 'coins' ? `🪙 ${g.n}` : `${ITEMS[g.item].emoji} ×${g.n}`} · {g.foundBy ? t("✅ ¡Encontrado!") : t("🕵️ Escondido en ({0}, {1})", [Math.round(g.x), Math.round(g.z)])}</div>
              {g.note && <small className="hint">“{g.note}”</small>}
              {!g.foundBy && <button className="btn ghost" onClick={() => retrieveGift(g.id)}>{t("Recogerlo de nuevo")}</button>}
            </div>
          ))}
        </>)}
        <p className="hint">{t("Regalos que has encontrado: {0}", [foundByMe])}</p>
      </>)}
    </Modal>
  );
}
