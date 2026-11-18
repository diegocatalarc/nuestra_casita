import { useGame } from '../store/gameStore';

export default function Modal({ title, children, wide, onClose }) {
  const close = onClose || (() => useGame.getState().set({ panel: null }));
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="x" onClick={close} aria-label={t("Cerrar")}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export const Cost = ({ cost, inv }) => (
  <div className="costs">
    {Object.entries(cost).map(([k, v]) => {
      const ok = (inv?.[k] || 0) >= v;
      return <span key={k} className={`chip ${ok ? '' : 'lack'}`}>{ITEM_EMOJI[k]} {v}</span>;
    })}
  </div>
);

import { ITEMS } from '../game/constants';
import { t } from '../i18n';
const ITEM_EMOJI = Object.fromEntries(Object.entries(ITEMS).map(([k, v]) => [k, v.emoji]));
