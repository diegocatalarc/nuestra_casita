import { useState } from 'react';
import { MINE, ITEMS } from '../game/constants';
import { mineFloor } from '../game/logic';
import { mineStart, mineFinish, mineSwings } from '../game/actions';
import { useGame as useG } from '../store/gameStore';
import { sfx } from '../game/audio';
import Modal from './Modal';
import { t } from '../i18n';

/** La mina: cuadrícula de rocas, golpes limitados, escaleras para bajar de piso y minerales. */
export default function MinePanel() {
  const [phase, setPhase] = useState('intro'); // intro | play | done
  const [floor, setFloor] = useState(1);
  const [cells, setCells] = useState([]);
  const [swings, setSwings] = useState(MINE.swings);
  const [got, setGot] = useState({});
  const [msg, setMsg] = useState('');

  const start = () => { if (!mineStart()) return; setFloor(1); setCells(mineFloor(1)); setSwings(mineSwings(useG.getState().couple)); setGot({}); setPhase('play'); setMsg(''); };
  const finish = (g = got, f = floor) => { mineFinish(g, f); setPhase('done'); };

  const hit = (i) => {
    if (phase !== 'play' || cells[i].open || swings < 1) return;
    const c = cells[i], nc = cells.map((x, j) => (j === i ? { ...x, open: true } : x));
    let g = got, f = floor, left = swings - 1, m = '';
    if (c.kind === 'stairs') { f = floor + 1; m = t("⬇️ ¡Escaleras! Piso {0}", [f]); sfx('pop'); }
    else if (c.kind === 'rock') { m = '💨'; sfx('dig'); }
    else { const id = c.kind.startsWith('min:') ? c.kind.slice(4) : c.kind; g = { ...got, [id]: (got[id] || 0) + (id === 'stone' || id === 'clay' ? 2 : 1) }; m = `${ITEMS[id].emoji} ${ITEMS[id].label}`; sfx('harvest'); }
    setGot(g); setSwings(left); setMsg(m);
    if (c.kind === 'stairs' && f <= MINE.floors) { setFloor(f); setCells(mineFloor(f)); return; }
    setCells(nc);
    if (left < 1 || (c.kind === 'stairs' && f > MINE.floors)) setTimeout(() => finish(g, Math.min(f, MINE.floors)), 600);
  };

  const sym = (c) => (!c.open ? '🪨' : c.kind === 'rock' ? '·' : c.kind === 'stairs' ? '⬇️' : ITEMS[c.kind.startsWith('min:') ? c.kind.slice(4) : c.kind].emoji);
  return (
    <Modal title={t("⛏️ La mina")} onClose={() => { if (phase === 'play') finish(); useGame0(); }}>
      {phase === 'intro' && (<div className="center"><div className="big-emoji">⛏️</div><p>{t("Tienes {0} golpes por visita y {1} pisos. Busca ⬇️ escaleras para bajar: abajo hay minerales mejores. Cuesta ⚡ {2} de energía.", [MINE.swings, MINE.floors, MINE.energy])}</p><button className="btn primary big" onClick={start}>{t("Entrar a la mina")}</button></div>)}
      {phase === 'play' && (<>
        <div className="catch-hud"><b>{t("Piso {0}", [floor])}</b><span>⛏️ {swings}</span></div>
        <div className="mine-grid" style={{ gridTemplateColumns: `repeat(${MINE.cols}, 1fr)` }}>
          {cells.map((c, i) => <button key={i} className={`mine-cell ${c.open ? 'open' : ''}`} onClick={() => hit(i)}>{sym(c)}</button>)}
        </div>
        <p className="hint center">{msg || t("Toca una roca para picar")} · {Object.entries(got).map(([k, n]) => `${ITEMS[k].emoji}${n}`).join(' ')}</p>
        <button className="btn ghost" onClick={() => finish()}>{t("Salir con lo recogido")}</button>
      </>)}
      {phase === 'done' && (<div className="center"><div className="big-emoji">🎒</div><p>{Object.keys(got).length ? t("Has sacado: {0}", [Object.entries(got).map(([k, n]) => `${ITEMS[k].emoji} ×${n}`).join('  ')]) : t("Esta vez no ha salido nada. ¡Otra vez será!")}</p><button className="btn primary" onClick={useGame0}>{t("Cerrar")}</button></div>)}
    </Modal>
  );
}
import { useGame } from '../store/gameStore';
function useGame0() { useGame.getState().set({ panel: null }); }
