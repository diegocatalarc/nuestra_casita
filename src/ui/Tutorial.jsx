import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { me } from '../game/runtime';
import { SPAWN } from '../game/constants';
import { isTouchDevice } from './TouchControls';
import { t } from '../i18n';

/** Pasos del tutorial. `done` se calcula del estado del mundo: no escribe nada. */
const STEPS = [
  { id: 'move', hl: null, title: t("Muévete"), text: isTouchDevice() ? t("Toca el suelo para caminar. Pellizca para acercar o alejar, y gira dos dedos para mover la cámara.") : t("Usa WASD o haz clic en el suelo para caminar. Q/E giran la cámara y la rueda hace zoom."), done: (s, ctx) => ctx.moved },
  { id: 'plant', hl: 'plant', title: t("Siembra algo"), text: t("Pulsa 🌱 Plantar, elige una semilla y haz clic en la tierra marrón del huerto."), done: (s) => Object.values(s.crops).some((c) => c.by === s.user.uid) },
  { id: 'water', hl: 'hand', title: t("Riega tu cultivo"), text: t("Vuelve a ✋ Mano y haz clic en la planta para regarla. ¡Ganas corazones!"), done: (s) => Object.values(s.crops).some((c) => c.wateredAt) },
  { id: 'gather', hl: 'hand', title: t("Recoge recursos"), text: t("Haz clic en un árbol o una roca: tu personaje irá solo y los recogerá."), done: (s) => Object.keys(s.nodes).length > 0 },
  { id: 'build', hl: 'build', title: t("Construye"), text: t("Pulsa 🔨 Construir y levanta tu primera habitación (la Terraza es barata)."), done: (s) => Object.values(s.buildings).some((b) => b.type !== 'house') },
  { id: 'quest', hl: 'quests', title: t("Primera misión de pareja"), text: t("Abre 💞 Pareja → 💌 Misiones y responde una. Vuestra pareja verá tu respuesta."), done: (s) => Object.values(s.questLog).some((q) => q.answers?.[s.user.uid]) },
  // Pasos de economía: se completan con los datos que ya guarda el juego (couple.orders, couple.fishLog, couple.stats…).
  { id: 'sell', hl: 'market', title: t("Vende tu cosecha"), text: t("En 🏪 Mercado (Comercio) vende tu cosecha. Las 🪙 monedas compran semillas, mejoras y terreno."), done: (s) => Object.values(s.couple?.stats || {}).some((w) => (w?.sell || 0) > 0) },
  { id: 'order', hl: 'orders', title: t("Completa un pedido"), text: t("Entrega lo que piden los vecinos en 📋 Pedidos (Comercio): da 🪙 y 💗."), done: (s) => Object.values(s.couple?.orders || {}).some((day) => Object.values(day || {}).includes(s.user.uid)) },
  { id: 'fish', hl: 'fish', title: t("Pesca un pez"), text: t("En 🎣 Pescar (Mundo) pesca en el agua. Cada especie queda anotada en el diario."), done: (s) => Object.keys(s.couple?.fishLog || {}).length > 0 },
  { id: 'eat', hl: 'food', title: t("Come algo"), text: t("Come en 🍽️ Comer (Hogar). Con hambre, la ⚡ energía se gasta el doble; con poca, andas más lento."), done: (s) => !!s.couple?.players?.[s.user.uid]?.lastEatAt },
  { id: 'hearts', hl: null, title: t("Tus 💗 corazones"), text: t("Se ganan con casi todo y se gastan en decoración del corazón, animales e hijos. Al llegar a 50 💗 se desbloquean más animales."), done: (s) => (s.couple?.heartsTotal || 0) >= 50 },
];
export const currentTutorialStep = (s, moved) => STEPS.find((st) => !st.done(s, { moved }));

export default function Tutorial() {
  const s = useGame();
  const uid = s.user.uid;
  const [moved, setMoved] = useState(false);
  const [skip, setSkip] = useState(() => { try { return localStorage.getItem(`nc_tut_${uid}`) === '1'; } catch { return false; } });
  const closing = useRef(false);

  useEffect(() => {
    const id = setInterval(() => { if (Math.hypot(me.x - SPAWN.x, me.z - SPAWN.z) > 4) setMoved(true); }, 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { if (!s.tutorialSkip) return; setSkip(false); }, [s.tutorialSkip]);

  const step = useMemo(() => currentTutorialStep(s, moved), [s.crops, s.nodes, s.buildings, s.questLog, s.couple, moved]);
  const idx = step ? STEPS.indexOf(step) : STEPS.length;
  useEffect(() => { useGame.setState({ tutorialHl: skip ? null : step?.hl || null }); }, [step, skip]);
  useEffect(() => { if (!step && !skip && !closing.current) { closing.current = true; setTimeout(() => { try { localStorage.setItem(`nc_tut_${uid}`, '1'); } catch { /* noop */ } setSkip(true); }, 6000); } }, [step, skip, uid]);

  if (skip || !s.couple?.players?.[uid]?.avatar) return null;
  const close = () => { try { localStorage.setItem(`nc_tut_${uid}`, '1'); } catch { /* noop */ } setSkip(true); };
  return (
    <div className="tutorial">
      <div className="t-dots">{STEPS.map((st, i) => <i key={st.id} className={i < idx ? 'done' : i === idx ? 'cur' : ''} />)}</div>
      {step ? (<><h4>{idx + 1}/{STEPS.length} · {step.title}</h4><p>{step.text}</p></>) : (<><h4>{t("🎉 ¡Ya sabes lo básico!")}</h4><p>{t("Mira las metas de la semana en 💌 Misiones y dejad cartas en el 📬 buzón.")}</p></>)}
      <button className="link" onClick={close}>{step ? t("Saltar tutorial") : t("Cerrar")}</button>
    </div>
  );
}
