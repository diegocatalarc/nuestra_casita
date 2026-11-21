// Guía siempre visible: qué toca hacer ahora, a quién ir a ver y hacia dónde (flecha según la cámara). Sustituye a «abrir el diario».
import { useEffect, useMemo, useRef } from 'react';
import { useGame } from '../store/gameStore';
import { objectiveFor, objectivePos, arrowAngle, useScene } from '../game/story/director';
import { castById } from '../game/story/characters';
import { me, cam, npcPos, goal } from '../game/runtime';
import { t } from '../i18n';

export default function Objective() {
  const couple = useGame((s) => s.couple);
  const obj = useMemo(() => objectiveFor({ couple }), [couple]);
  const cinematic = useScene((s) => !!s.cur);
  const arrow = useRef(), dist = useRef();
  useEffect(() => { goal.npc = obj?.npc || null; return () => { goal.npc = null; }; }, [obj?.npc]);
  useEffect(() => {
    if (!obj) return;
    const id = setInterval(() => {
      const p = objectivePos(obj, npcPos);
      if (!arrow.current || !p || p.x == null) { if (arrow.current) arrow.current.style.display = 'none'; if (dist.current) dist.current.textContent = ''; return; }
      const dx = p.x - me.x, dz = p.z - me.z, d = Math.hypot(dx, dz);
      arrow.current.style.display = d < 4 ? 'none' : 'inline-block';
      arrow.current.style.transform = `rotate(${arrowAngle(dx, dz, cam.yaw)}rad)`;
      if (dist.current) dist.current.textContent = d < 4 ? t("¡Aquí!") : `${Math.round(d)} m`;
    }, 150);
    return () => clearInterval(id);
  }, [obj?.npc, obj?.place, obj?.text]);
  if (!obj || cinematic) return null;
  const who = obj.npc && castById[obj.npc];
  const open = () => useGame.getState().set({ panel: 'story' });
  return (
    <button className={`objective ${obj.ready ? 'ready' : ''}`} onClick={open} title={t("Abrir el diario")}>
      <span className="ob-arrow" ref={arrow} style={{ display: 'none' }}>➤</span>
      <span className="ob-main">
        <small>{t("Capítulo {0}", [obj.num])} · {obj.chapter.title}</small>
        <b>{obj.text}</b>
        {obj.target > 1 && !obj.ready && <em className="ob-bar"><i style={{ width: `${(obj.progress / obj.target) * 100}%` }} /></em>}
      </span>
      <span className="ob-side">{who ? <span className="ob-face">{who.emoji}</span> : <span className="ob-face">🎯</span>}<small ref={dist} /></span>
    </button>
  );
}
