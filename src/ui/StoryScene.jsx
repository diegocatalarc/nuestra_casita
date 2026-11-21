// Escenas narradas de la historia: pantalla completa con retrato, texto que se escribe solo y toque para seguir.
// También hace de «director»: cada segundo mira si toca alguna escena (director.js) y la encola cuando no estorba.
import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import { SCENES, NARRATOR } from '../game/story/scenes';
import { CHAPTERS } from '../game/story/chapters';
import { castById } from '../game/story/characters';
import { dueScenes, loadSeen, addSeen, enqueueScenes, nextScene, useScene, objectiveFor } from '../game/story/director';
import { claimStoryChapter } from '../game/actions';
import { dialogueNpc } from './DialogueModal';
import { rewardChips } from './StoryPanel';
import { sfx } from '../game/audio';
import { t } from '../i18n';

const MOODS = {
  dawn: 'linear-gradient(180deg, rgba(255,214,170,.96), rgba(176,120,120,.97))',
  day: 'linear-gradient(180deg, rgba(190,226,240,.96), rgba(236,214,170,.97))',
  dusk: 'linear-gradient(180deg, rgba(120,92,140,.96), rgba(240,150,120,.97))',
  night: 'linear-gradient(180deg, rgba(30,36,70,.95), rgba(70,60,110,.95))',
};
const DARK = new Set(['dusk', 'night']);

const noScenes = () => { try { return localStorage.getItem('nc_noscenes') === '1'; } catch { return false; } };

/** Páginas que se muestran de una escena: tarjeta de título, diálogos y, en un cierre, la tarjeta de recompensa. */
export function buildPages(id, replay = false) {
  const sc = SCENES[id];
  if (!sc) return [];
  const [chId, part] = id.split('.');
  const ch = CHAPTERS.find((c) => c.id === chId);
  const pages = [];
  if (id === 'prologue') pages.push({ kind: 'card', kicker: t("Libro I"), title: t("Despertar el valle") });
  else if (part === 'intro' && ch) pages.push({ kind: 'card', kicker: t("Capítulo {0}", [CHAPTERS.indexOf(ch) + 1]), title: ch.title });
  for (const p of sc.pages) pages.push({ kind: 'say', ...p });
  if (id === 'c7.outro') pages.push({ kind: 'card', kicker: t("Fin del Libro I"), title: t("Despertar el valle") });
  if (part === 'outro' && ch && !replay) pages.push({ kind: 'reward', ch });
  return pages;
}

function Typewriter({ text, shown }) {
  return <span>{text.slice(0, shown)}<span style={{ opacity: 0 }}>{text.slice(shown)}</span></span>;
}

function Scene({ id, replay }) {
  const pages = useMemo(() => buildPages(id, replay), [id, replay]);
  const sc = SCENES[id];
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const page = pages[i];
  const len = page?.kind === 'say' ? page.text.length : 0;
  useEffect(() => { setShown(0); }, [i, id]);
  useEffect(() => {
    if (!len || shown >= len) return;
    const h = setTimeout(() => setShown((n) => Math.min(len, n + 2)), 22);
    return () => clearTimeout(h);
  }, [shown, len]);
  const last = i >= pages.length - 1;
  const finish = () => nextScene();
  const advance = () => {
    if (!page) return finish();
    if (page.kind === 'reward') return; // el botón de recompensa cierra
    if (shown < len) { setShown(len); return; }
    sfx('pop');
    if (last) finish(); else setI(i + 1);
  };
  const skip = (e) => {
    e.stopPropagation();
    const r = pages.findIndex((p) => p.kind === 'reward');
    if (r >= 0) setI(r); else finish();
  };
  useEffect(() => {
    const k = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const couple = useGame((s) => s.couple);
  const obj = useMemo(() => objectiveFor({ couple }), [couple]);
  if (!page) return null;
  const c = page.kind === 'say' && page.who !== NARRATOR ? castById[page.who] : null;
  const mood = sc.mood || 'day';
  const ink = DARK.has(mood) ? '#fff7ec' : '#4a3828';
  const showGuide = page.kind === 'say' && last && !id.endsWith('.outro') && id !== 'prologue' && obj;
  return (
    <div className="story-scene" role="dialog" aria-label={t("Escena de la historia")} onClick={advance} style={{ background: MOODS[mood] || MOODS.day, color: ink }}>
      <div className="ss-bar top" /><div className="ss-bar bottom" />
      <button className="ss-skip" onClick={skip}>{t("Saltar ⏭")}</button>
      <div className="ss-body" key={`${id}-${i}`}>
        {page.kind === 'card' && (
          <div className="ss-card">
            <small>{page.kicker}</small>
            <h1>{page.title}</h1>
            <p>{t("Toca para continuar")}</p>
          </div>
        )}
        {page.kind === 'say' && (
          <div className={`ss-say ${c ? 'npc' : 'narr'}`}>
            {c && (
              <div className="ss-who">
                <div className="ss-face">{c.emoji}</div>
                <div><b>{c.name}</b><small>{c.role}</small></div>
              </div>
            )}
            <p className={c ? '' : 'narr-text'}>{!c && <span className="ss-ico">📜</span>}<Typewriter text={page.text} shown={shown} /></p>
            {showGuide && shown >= len && (
              <div className="ss-guide">🎯 <b>{t("Ahora")}:</b> {obj.text}</div>
            )}
            <div className="ss-next">{shown >= len ? (last ? t("Toca para empezar ▶") : '▶') : ''}</div>
          </div>
        )}
        {page.kind === 'reward' && (
          <div className="ss-card reward" onClick={(e) => e.stopPropagation()}>
            <small>{t("Capítulo completado")}</small>
            <h1>💌 {page.ch.title}</h1>
            <div className="costs">{rewardChips(page.ch.reward).map((x) => <span key={x} className="chip">{x}</span>)}</div>
            <button className="btn primary big" onClick={() => { claimStoryChapter(page.ch.id); finish(); }}>{t("💌 Recibir")}</button>
          </div>
        )}
      </div>
      <div className="ss-dots">{pages.map((p, k) => <i key={k} className={k === i ? 'cur' : k < i ? 'done' : ''} />)}</div>
    </div>
  );
}

export default function StoryScene() {
  const cur = useScene((s) => s.cur);
  const replay = useScene((s) => s.replay);
  const uid = useGame((s) => s.user?.uid);
  const coupleId = useGame((s) => s.coupleId);
  const ready = useGame((s) => !!s.couple?.players?.[s.user?.uid]?.avatar);
  useEffect(() => {
    if (!ready || !uid || !coupleId) return;
    const id = setInterval(() => {
      const s = useGame.getState(), sc = useScene.getState();
      if (noScenes() || s.panel || dialogueNpc() || sc.cur || sc.queue.length) return;
      const { play, mark } = dueScenes(s, loadSeen(coupleId, uid));
      if (!play.length && !mark.length) return;
      addSeen(coupleId, uid, [...play, ...mark]);
      if (play.length) enqueueScenes(play);
    }, 1000);
    return () => clearInterval(id);
  }, [ready, uid, coupleId]);
  if (!cur) return null;
  return <Scene key={cur} id={cur} replay={replay} />;
}
