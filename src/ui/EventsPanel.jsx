import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { FESTIVAL, FESTIVAL_TIERS, FESTIVALS, WISH, AVATAR_OPTS } from '../game/constants';
import { eventsFor, daysToFestival, visitorGift, meteorActive, dayUTC } from '../game/logic';
import { claimFestival, claimVisitorGift, makeWish, submitFestivalScore, festivalTotal } from '../game/actions';
import CatchGame from './CatchGame';
import Modal from './Modal';
import { t } from '../i18n';

const DAYS = [t("Dom"), t("Lun"), t("Mar"), t("Mié"), t("Jue"), t("Vie"), t("Sáb")];
const cosName = (k) => { const [c, i] = k.split(':'); return AVATAR_OPTS[{ hat: 'hats', neck: 'neck', back: 'back' }[c]][+i]; };

/** Calendario y eventos: festival de temporada, visitante sorpresa y lluvia de estrellas. */
export default function EventsPanel() {
  const couple = useGame((s) => s.couple);
  const uid = useGame((s) => s.user.uid);
  const now = useGame((s) => s.now);
  const env = useGame((s) => s.env);
  const players = couple.players || {};
  const [playing, setPlaying] = useState(false);
  const [last, setLast] = useState(null);
  const ev = eventsFor(couple.seed, now, env.season);
  const data = couple.events?.[ev.day] || {};
  const total = festivalTotal(couple, ev.day);
  const myTries = data.tries?.[uid] || 0;
  const got = data.claimed?.[uid] || 0;
  const reached = FESTIVAL_TIERS.filter((tr) => total >= tr.score).length;
  const night = meteorActive(ev, env.hour);

  if (playing && ev.festival) {
    return (
      <Modal title={`${ev.festival.emoji} ${ev.festival.name}`} onClose={() => setPlaying(false)}>
        <CatchGame fest={ev.festival} onDone={(sc) => { submitFestivalScore(sc); setLast(sc); setPlaying(false); }} />
      </Modal>
    );
  }

  const week = Array.from({ length: 7 }, (_, i) => { const d = now + i * 86400000; return { d, e: eventsFor(couple.seed, d, env.season) }; });

  return (
    <Modal title={t("🎪 Eventos")} wide>
      {/* Festival */}
      {ev.festival ? (
        <div className="evcard fest" style={{ borderColor: ev.festival.color }}>
          <div className="ev-head"><span className="npc">{ev.festival.emoji}</span><div><b>{ev.festival.name}</b><small>{t("¡Hoy es el festival! Plaza junto a la casita.")}</small></div></div>
          <p>{ev.festival.desc}</p>
          <div className="tiers">
            {FESTIVAL_TIERS.map((tr, i) => (
              <div key={i} className={`tier ${total >= tr.score ? 'on' : ''}`}>
                <b>{tr.score} {t("pts")}</b>
                <span>🪙 {tr.coins} · 💗 {tr.hearts}</span>
                {tr.prize && <span className="chip rare">👗 {cosName(ev.festival.prize)}</span>}
              </div>
            ))}
          </div>
          <div className="vbar wide"><div><i style={{ width: `${Math.min(100, (total / FESTIVAL_TIERS[2].score) * 100)}%`, background: ev.festival.color }} /></div></div>
          <p className="hint">{t("Entre los dos: {0} pts", [total])} · {Object.entries(data.score || {}).map(([u, s]) => `${players[u]?.name || '?'}: ${s}`).join(' · ') || t("nadie ha jugado aún")}</p>
          <div className="row">
            <button className="btn primary" disabled={myTries >= FESTIVAL.tries} onClick={() => setPlaying(true)}>{t("🎮 Jugar")} ({FESTIVAL.tries - myTries}/{FESTIVAL.tries})</button>
            <button className="btn ghost" disabled={reached <= got} onClick={claimFestival}>{t("🎁 Reclamar premios")}</button>
          </div>
          {last != null && <p className="hint">{t("Tu último resultado: {0} pts", [last])}</p>}
        </div>
      ) : (
        <div className="evcard">
          <div className="ev-head"><span className="npc">{FESTIVALS[env.season].emoji}</span><div><b>{t("Próximo festival")}</b><small>{FESTIVALS[env.season].name} · {t("sábado")} ({daysToFestival(now)} {t("días")})</small></div></div>
          <p className="hint">{t("Cada sábado hay festival con minijuego y premios; el tema cambia con la estación.")}</p>
        </div>
      )}

      {/* Visitante */}
      {ev.visitor ? (
        <div className="evcard">
          <div className="ev-head"><span className="npc">{ev.visitor.emoji}</span><div><b>{ev.visitor.name}</b><small>{t("Visita la plaza de 7:00 a 21:00")}</small></div></div>
          <p className="say">“{t("¡Qué casita tan bonita! Os he traído un detalle.")}”</p>
          {data.gift ? <div className="done-tag">{t("✅ Regalo recogido por {0}", [players[data.gift]?.name || t("tu pareja")])}</div>
            : <button className="btn primary" onClick={claimVisitorGift}>{t("🎁 Aceptar el regalo")}</button>}
        </div>
      ) : null}

      {/* Estrellas */}
      {ev.meteor && (
        <div className="evcard">
          <div className="ev-head"><span className="npc">🌠</span><div><b>{t("Lluvia de estrellas")}</b><small>{t("De 21:00 a 5:00")}</small></div></div>
          <p>{t("Pedid un deseo a la vez (con menos de 10 min de diferencia) y ganaréis un bonus de {0} 💗.", [WISH.bonus])}</p>
          {data.wish?.[uid] ? <div className="done-tag">{t("✨ Ya has pedido tu deseo")}</div>
            : <button className="btn primary" disabled={!night} onClick={makeWish}>{night ? t("🌠 Pedir un deseo") : t("Disponible por la noche")}</button>}
          {data.wishBonus && <div className="done-tag">{t("💞 ¡Pedisteis el deseo juntos!")}</div>}
        </div>
      )}

      {!ev.festival && !ev.visitor && !ev.meteor && <p className="hint">{t("Hoy es un día tranquilo en la casita… pero mirad la semana:")}</p>}

      <h3 className="fish-h">{t("📅 Esta semana")}</h3>
      <div className="week">
        {week.map(({ d, e }, i) => (
          <div key={i} className={`wday ${i === 0 ? 'today' : ''}`}>
            <small>{i === 0 ? t("Hoy") : DAYS[new Date(d).getUTCDay()]}</small>
            <span>{e.festival ? e.festival.emoji : ''}{e.visitor ? e.visitor.emoji : ''}{e.meteor ? '🌠' : ''}{!e.festival && !e.visitor && !e.meteor ? '·' : ''}</span>
          </div>
        ))}
      </div>
      <p className="hint">{t("🎪 festival · visitante · 🌠 estrellas fugaces. Los eventos son iguales para los dos.")}</p>
    </Modal>
  );
}
