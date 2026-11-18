import { useEffect, useRef, useState } from 'react';
import { FESTIVAL } from '../game/constants';
import { sfx } from '../game/audio';
import { t } from '../i18n';

/** Minijuego del festival: atrapa lo que cae antes de que desaparezca. Lo normal vale 1, lo dorado vale 3. */
export default function CatchGame({ fest, onDone }) {
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(FESTIVAL.seconds);
  const [started, setStarted] = useState(false);
  const area = useRef();
  const id = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    if (!started) return;
    const t0 = performance.now();
    const tick = setInterval(() => {
      const el = (performance.now() - t0) / 1000;
      const rem = Math.max(0, FESTIVAL.seconds - el);
      setLeft(rem);
      if (rem <= 0 && !done.current) { done.current = true; clearInterval(tick); clearInterval(spawn); setItems([]); setScoreAndFinish(); return; }
      setItems((list) => list.filter((i) => performance.now() - i.born < i.life));
    }, 100);
    const spawn = setInterval(() => {
      const el = (performance.now() - t0) / 1000;
      const golden = Math.random() < 0.14;
      setItems((list) => [...list.slice(-9), { id: ++id.current, x: 6 + Math.random() * 84, y: 8 + Math.random() * 78, born: performance.now(), life: Math.max(900, 1700 - el * 28), golden, rot: Math.random() * 40 - 20 }]);
    }, 520);
    const setScoreAndFinish = () => setScore((sc) => { setTimeout(() => onDone(sc), 0); return sc; });
    return () => { clearInterval(tick); clearInterval(spawn); };
  }, [started]); // eslint-disable-line

  const hit = (it) => {
    setItems((l) => l.filter((i) => i.id !== it.id));
    setScore((s) => s + (it.golden ? 3 : 1));
    sfx(it.golden ? 'catch' : 'pop');
  };

  if (!started) return (
    <div className="catch intro" style={{ background: `${fest.color}33` }}>
      <div className="big-emoji">{fest.emoji}</div>
      <h3>{fest.name}</h3>
      <p>{fest.desc}</p>
      <p className="hint">{t("Tienes {0} segundos. ¡Pulsa todo lo que puedas!", [FESTIVAL.seconds])}</p>
      <button className="btn primary big" onClick={() => setStarted(true)}>{t("¡Empezar!")}</button>
    </div>
  );
  return (
    <div className="catch" style={{ background: `${fest.color}33` }}>
      <div className="catch-hud"><b>{fest.item} {score}</b><span>⏱️ {Math.ceil(left)}</span></div>
      <div className="catch-bar"><i style={{ width: `${(left / FESTIVAL.seconds) * 100}%`, background: fest.color }} /></div>
      <div className="catch-area" ref={area}>
        {items.map((it) => (
          <button key={it.id} className={`catch-item ${it.golden ? 'gold' : ''}`} style={{ left: `${it.x}%`, top: `${it.y}%`, transform: `rotate(${it.rot}deg)` }} onPointerDown={() => hit(it)}>
            {it.golden ? fest.golden : fest.item}
          </button>
        ))}
      </div>
    </div>
  );
}
