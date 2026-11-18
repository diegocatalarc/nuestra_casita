import { useState } from 'react';
import { useGame, partnerUid } from '../store/gameStore';
import { dailyQuests, weeklyGoals, weekKey } from '../game/logic';
import { dateKey, serverNow } from '../game/time';
import { submitQuest, cookDinner, hug, claimGoal, goalProgress } from '../game/actions';
import { QUEST_HEARTS, QUEST_BOTH_BONUS } from '../game/constants';
import { PhotoPicker, AudioRecorder } from './media';
import Modal from './Modal';
import { t } from '../i18n';

function Answer({ a, quest }) {
  if (!a) return null;
  return (
    <div className="answer">
      {a.text && <p>“{a.text}”</p>}
      {a.image && <img src={a.image} alt="" className="preview" />}
      {a.audio && <audio src={a.audio} controls className="audio" />}
    </div>
  );
}

function QuestCard({ quest }) {
  const s = useGame();
  const uid = s.user.uid, other = partnerUid(s);
  const log = s.questLog[`${dateKey()}_${quest.id}`];
  const mine = log?.answers?.[uid], theirs = other && log?.answers?.[other];
  const names = s.couple.players || {};
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [save, setSave] = useState(true);
  const ready = quest.kind === 'text' ? text.trim().length > 1 : quest.kind === 'image' ? !!image : !!audio;

  return (
    <div className={`quest ${mine ? 'done' : ''}`}>
      <div className="q-head">
        <h3>{quest.kind === 'text' ? '✍️' : quest.kind === 'image' ? '📷' : '🎙️'} {quest.title}</h3>
        <span className="chip">+{QUEST_HEARTS} 💗</span>
      </div>
      <p className="hint">{quest.hint}</p>
      {mine ? (
        <>
          <div className="who">{t("Tu respuesta ✅")}</div><Answer a={mine} quest={quest} />
        </>
      ) : (
        <div className="form">
          {quest.kind === 'text' && <textarea rows={3} maxLength={600} placeholder={t("Escribe aquí…")} value={text} onChange={(e) => setText(e.target.value)} />}
          {quest.kind === 'image' && <PhotoPicker value={image} onChange={setImage} />}
          {quest.kind === 'audio' && <AudioRecorder value={audio} onChange={setAudio} />}
          <label className="check"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> {t("Guardar como recuerdo")}</label>
          <button className="btn primary" disabled={!ready}
            onClick={() => submitQuest(quest, { text: text.trim() || null, image, audio, saveMemory: save })}>{t("Enviar")}</button>
        </div>
      )}
      <div className="who">{other ? `${names[other]?.name || t("Tu pareja")}` : t("Tu pareja")}</div>
      {theirs
        ? (mine ? <Answer a={theirs} quest={quest} /> : <div className="hint">{t("Ya respondió 💗 — responde tú para ver su respuesta (+")}{QUEST_BOTH_BONUS} {t("💗 extra).")}</div>)
        : <div className="hint">{t("Todavía no ha respondido.")}</div>}
    </div>
  );
}

function Goals() {
  const s = useGame();
  const goals = weeklyGoals(serverNow());
  const wk = weekKey(serverNow());
  return (
    <div className="goals">
      <p className="sub">{t("Metas de esta semana (se renuevan cada lunes). Se cuentan los avances de las dos personas.")}</p>
      {goals.map((g) => {
        const p = Math.min(goalProgress(s, g), g.target);
        const claimed = !!s.couple.goalsClaimed?.[wk]?.[g.id];
        return (
          <div key={g.id} className={`goal ${claimed ? 'done' : ''}`}>
            <div className="g-top"><b>{g.text}</b><span className="chip">+{g.reward} 💗</span></div>
            <div className="bar"><div style={{ width: `${(p / g.target) * 100}%`, background: claimed ? '#8fd16a' : '#f48aa8' }} /></div>
            <div className="g-bot"><small>{p}/{g.target}</small>
              {claimed ? <span className="chip">{t("✅ Reclamada")}</span> : <button className="btn primary" disabled={p < g.target} onClick={() => claimGoal(g)}>{t("Reclamar")}</button>}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function QuestsPanel() {
  const [tab, setTab] = useState('quests');
  const couple = useGame((s) => s.couple);
  const buildings = useGame((s) => s.buildings);
  const quests = dailyQuests(dateKey());
  const has = (t) => Object.values(buildings).some((b) => b.type === t);
  const date = dateKey();
  return (
    <Modal title={t("💌 Misiones y actividades de pareja")} wide>
      <div className="tabs">
        <button className={tab === 'quests' ? 'on' : ''} onClick={() => setTab('quests')}>{t("Misiones de hoy")}</button>
        <button className={tab === 'goals' ? 'on' : ''} onClick={() => setTab('goals')}>{t("🎯 Metas semanales")}</button>
        <button className={tab === 'acts' ? 'on' : ''} onClick={() => setTab('acts')}>{t("Actividades juntos")}</button>
      </div>
      {tab === 'quests' && <div className="quests">{quests.map((q) => <QuestCard key={q.id} quest={q} />)}</div>}
      {tab === 'goals' && <Goals />}
      {tab === 'acts' && (
        <div className="grid">
          <div className="item"><div className="emoji">🤗</div><h3>{t("Abrazo")}</h3><p>{t("Acercaos a menos de 2,5 casillas y pulsa")} <b>H</b>{t(". Cada 30 minutos.")}</p><button className="btn primary" onClick={hug}>{t("Abrazar · +3 💗")}</button></div>
          <div className="item"><div className="emoji">🍝</div><h3>{t("Cena romántica")}</h3><p>{t("Cocinad con 3 cultivos de vuestra cosecha. Una vez al día.")}</p>
            <button className="btn primary" disabled={!has('kitchen') || couple.lastDinner === date} onClick={cookDinner}>{has('kitchen') ? (couple.lastDinner === date ? t("Ya cenasteis hoy") : t("Cocinar · +20 💗")) : t("Necesita Cocina")}</button></div>
          <div className="item"><div className="emoji">🔭</div><h3>{t("Ver las estrellas")}</h3><p>{t("Entrad los dos al Observatorio de noche. Se premia solo.")}</p>
            <div className="hint">{has('observatory') ? (couple.lastStars === date ? t("Ya visteis las estrellas hoy ✨") : t("+15 💗 al estar los dos dentro")) : t("Necesita Observatorio")}</div></div>
        </div>
      )}
    </Modal>
  );
}
