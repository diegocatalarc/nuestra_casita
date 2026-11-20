import { useGame } from '../store/gameStore';
import { CHAPTERS } from '../game/story/chapters';
import { currentChapter, chapterStatus, canClaim, claimedChapters, storyFinished, hasStory, storyOf } from '../game/story/engine';
import { completeStep, claimStoryChapter, startStory } from '../game/actions';
import { ITEMS } from '../game/constants';
import Modal from './Modal';
import { t } from '../i18n';

const rewardChips = (rw = {}) => [
  rw.coins && `+${rw.coins} 🪙`,
  rw.hearts && `+${rw.hearts} 💗`,
  ...Object.entries(rw.items || {}).map(([k, n]) => `${ITEMS[k]?.emoji || '🎁'} ×${n}`),
  rw.piece && t("🕰️ Pieza del reloj"),
  rw.unlock && '🔓 ' + t("Desbloqueo"),
].filter(Boolean);

function hintFor(cond) {
  switch (cond?.type) {
    case 'talk': return t("Habla con el vecino en el pueblo");
    case 'together': return t("Tenéis que estar las dos personas conectadas y juntas");
    case 'dusk': return t("Al atardecer (18-21 h del juego), con las dos personas conectadas");
    default: return '';
  }
}

function Step({ row, inv }) {
  const { step, done, progress, target, action } = row;
  const cond = step.cond || {};
  const have = cond.type === 'deliver' && (inv?.[cond.item] || 0) >= (cond.n || 1);
  return (
    <div className={`goal ${done ? 'done' : ''}`}>
      <div className="g-top"><b>{done ? '✅' : '⬜'} {step.text}</b></div>
      {target > 1 && <div className="bar"><div style={{ width: `${(progress / target) * 100}%`, background: done ? '#8fd16a' : '#f48aa8' }} /></div>}
      <div className="g-bot">
        {target > 1 ? <small>{progress}/{target}</small> : <small>{done ? t("¡Hecho!") : hintFor(cond)}</small>}
        {cond.type === 'deliver' && !done && (
          <button className="btn primary big" disabled={!have} onClick={() => completeStep(step.id)}>
            {t("Entregar")} {ITEMS[cond.item]?.emoji} {cond.n || 1}
          </button>
        )}
        {action && cond.type !== 'deliver' && !done && target > 1 && <small>{hintFor(cond)}</small>}
      </div>
    </div>
  );
}

export default function StoryPanel() {
  const s = useGame();
  const started = hasStory(s);
  const cur = currentChapter(s, CHAPTERS);
  const status = cur && chapterStatus(s, cur);
  const past = claimedChapters(s, CHAPTERS);
  const pieces = storyOf(s)?.pieces || 0;

  return (
    <Modal title={t("📖 Diario del Valle")} wide>
      <div className="goals">
        {!CHAPTERS.length && <p className="sub">{t("Las primeras cartas del valle están por llegar…")}</p>}
        {CHAPTERS.length > 0 && !started && (
          <>
            <p className="sub">{t("Un valle dormido espera a dos personas lejanas. ¿Empezamos?")}</p>
            <button className="btn primary big" onClick={startStory}>{t("Abrir el diario")}</button>
          </>
        )}
        {started && <p className="sub">{t("Piezas del reloj")}: {'🕰️'.repeat(pieces) || '—'} ({pieces})</p>}
        {started && cur && (
          <div className="quest">
            <div className="q-head">
              <h3>💌 {cur.title}</h3>
              <span className="chip">{status.doneCount}/{status.total}</span>
            </div>
            {cur.from && <div className="who">{t("De")}: {cur.from}</div>}
            {cur.letter && <p className="hint" style={{ whiteSpace: 'pre-line' }}>{cur.letter}</p>}
            {status.steps.map((row) => <Step key={row.step.id} row={row} inv={s.couple?.inventory} />)}
            <div className="costs">{rewardChips(cur.reward).map((c) => <span key={c} className="chip">{c}</span>)}</div>
            <button className="btn primary big" disabled={!canClaim(s, cur, CHAPTERS)} onClick={() => claimStoryChapter(cur.id)}>
              {canClaim(s, cur, CHAPTERS) ? t("Reclamar") : t("Completa los pasos para reclamar")}
            </button>
          </div>
        )}
        {started && storyFinished(s, CHAPTERS) && <p className="sub">{t("🌟 Habéis completado este libro. ¡Pronto más cartas!")}</p>}
        {past.length > 0 && (
          <div>
            <h3>{t("Capítulos anteriores")}</h3>
            {past.map((c) => (
              <details key={c.id} className="goal done" style={{ marginTop: 8 }}>
                <summary><b>✅ {c.title}</b></summary>
                {c.letter && <p className="hint" style={{ whiteSpace: 'pre-line' }}>{c.letter}</p>}
              </details>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
