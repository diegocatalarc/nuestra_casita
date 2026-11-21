// Conversación con un vecino: retrato emoji, nombre, rol, frase y botones grandes (pensado para el iPad, sin teclado).
// Texto: usa `lineFor` de src/game/story/dialogue.js (chat de contenido) si existe; si no, el provisional dialogueStub.js.
// Para forzar el provisional: FORCE_STUB = true. Para fijar el real a mano: cambiar la línea del import marcada abajo.
import { useEffect } from 'react';
import { create } from 'zustand';
import { useGame } from '../store/gameStore';
import { castById } from '../game/story/characters';
import { lineFor as stubLine } from '../game/story/dialogueStub'; // ← cambiar por '../game/story/dialogue' para fijar el diálogo real
import { NEIGHBORS, FRIEND_LEVELS } from '../game/constants';
import { friendLevel, friendPts, dayUTC } from '../game/logic';
import { serverNow } from '../game/time';
import { talkNeighbor, doAnim, storyTalk, completeStep } from '../game/actions';
import { objectiveFor, enqueueScenes } from '../game/story/director';
import { ITEMS } from '../game/constants';
import { sfx } from '../game/audio';
import { t } from '../i18n';

const FORCE_STUB = false;
// import.meta.glob no falla si dialogue.js aún no existe (queda vacío) y se activa solo cuando llegue.
const real = Object.values(import.meta.glob('../game/story/dialogue.js', { eager: true }))[0];
const lineSource = !FORCE_STUB && typeof real?.lineFor === 'function' ? real.lineFor : stubLine;
export const DIALOGUE_SOURCE = lineSource === stubLine ? 'stub' : 'real';

const useDialogue = create(() => ({ npc: null, n: 0 }));
export const openDialogue = (npc) => useDialogue.setState({ npc, n: 0 });
export const closeDialogue = () => useDialogue.setState({ npc: null, n: 0 });
export const dialogueNpc = () => useDialogue.getState().npc;
export { useDialogue };

function text(npc, n) {
  const s = useGame.getState();
  let r;
  try { r = lineSource(npc, { day: dayUTC(serverNow()), n, hour: s.env.hour, weather: s.env.weather, friendLevel: friendLevel(friendPts(s.couple, npc)), couple: s.couple }); } catch { r = stubLine(npc, { n }); }
  return typeof r === 'string' ? r : r?.text || r?.line || stubLine(npc, { n });
}

export default function DialogueModal() {
  const { npc, n } = useDialogue();
  const couple = useGame((s) => s.couple);
  const open = !!npc;
  // Charlar cuenta para la amistad una vez al día (misma lógica que el panel de vecinos, sin duplicarla)
  useEffect(() => {
    if (!npc) return;
    storyTalk(npc); // si toca hablar con este vecino en la historia, marca el paso
    const day = dayUTC(serverNow());
    if (useGame.getState().couple?.friends?.[npc]?.talkDay !== day) talkNeighbor(npc);
    else { sfx('pop'); doAnim('wave', 900); }
  }, [npc]);
  if (!open) return null;
  const c = castById[npc];
  const obj = objectiveFor({ couple });
  const mission = obj && !obj.ready && obj.npc === npc ? obj : null;
  const cond = mission?.step?.cond;
  const canDeliver = cond?.type === 'deliver' && (couple?.inventory?.[cond.item] || 0) >= (cond.n || 1);
  const deliver = () => { if (completeStep(mission.step.id)) closeDialogue(); };
  const claim = obj?.ready && obj.npc === npc;
  if (!c) return null;
  const pts = friendPts(couple, npc), lvl = friendLevel(pts);
  const canGift = NEIGHBORS.some((x) => x.id === npc); // el selector de regalos vive en el panel de vecinos
  const next = FRIEND_LEVELS[lvl];
  const gift = () => { closeDialogue(); useGame.getState().set({ panel: 'explore', exploreTab: 'neighbors', neighborFocus: npc }); };
  const again = () => { sfx('pop'); useDialogue.setState({ n: n + 1 }); };
  const big = { minHeight: 52, fontSize: 17, flex: '1 1 140px' };
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, display: 'flex', justifyContent: 'center', padding: '0 12px calc(env(safe-area-inset-bottom, 0px) + 14px)', pointerEvents: 'none' }}>
      <div role="dialog" style={{ pointerEvents: 'auto', width: 'min(560px, 100%)', background: 'var(--paper, #fffaf0)', border: '3px solid var(--line, #e8d5b8)', borderRadius: 22, boxShadow: 'var(--shadow, 0 8px 24px rgba(0,0,0,.25))', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 46, lineHeight: 1, width: 68, height: 68, borderRadius: 18, background: '#fff', border: '2px solid var(--line, #e8d5b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{c.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ fontSize: 20 }}>{c.name}</b>
            <div style={{ color: 'var(--ink-l, #8a6f5a)', fontSize: 14 }}>{c.role}</div>
            <small style={{ color: 'var(--ink-l, #8a6f5a)' }}>{t("Amistad nivel {0}/5", [lvl])} · {pts}{next ? `/${next}` : ''} ♥</small>
          </div>
        </div>
        <p className="say" style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontStyle: 'italic', minHeight: 48 }}>{text(npc, n)}</p>
        {mission && (
          <div style={{ background: '#fff3c9', border: '2px dashed #e0b84a', borderRadius: 14, padding: '8px 12px', fontSize: 15 }}>
            🎯 <b>{t("Ahora")}:</b> {mission.text}
            {cond?.type === 'deliver' && <button className="btn primary" style={{ ...big, marginTop: 8, width: '100%' }} disabled={!canDeliver} onClick={deliver}>{t("Entregar")} {ITEMS[cond.item]?.emoji} {cond.n || 1}{canDeliver ? '' : ' · ' + t("os falta")}</button>}
          </div>
        )}
        {claim && <button className="btn primary" style={big} onClick={() => { closeDialogue(); enqueueScenes([`${obj.chapter.id}.outro`]); }}>{t("💌 Recibir recompensa")}</button>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" style={big} onClick={again}>{t("💬 Hablar de nuevo")}</button>
          {canGift && <button className="btn" style={big} onClick={gift}>{t("🎁 Regalar")}</button>}
          <button className="btn ghost" style={big} onClick={closeDialogue}>{t("Cerrar")}</button>
        </div>
      </div>
    </div>
  );
}
