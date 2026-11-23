import { useGame } from '../store/gameStore';
import { BUILDINGS } from '../game/constants';
import Modal, { Cost } from './Modal';
import { canAfford } from '../game/logic';
import { t } from '../i18n';

export default function BuildPanel() {
  const inv = useGame((s) => s.couple?.inventory);
  const buildings = useGame((s) => s.buildings);
  const count = (t) => Object.values(buildings).filter((b) => b.type === t).length;
  const movable = Object.entries(buildings).filter(([id, b]) => id !== 'house' && BUILDINGS[b.type] && !BUILDINGS[b.type].fixed);
  return (
    <Modal title={t("🔨 Construir")} wide>
      <p className="sub">{t("Elige una construcción y colócala en el terreno. Verde = se puede, rojo = no.")}</p>
      <div className="grid">
        {Object.entries(BUILDINGS).filter(([, d]) => !d.fixed).map(([id, d]) => {
          const ok = canAfford(inv, d.cost);
          return (
            <div key={id} className="item">
              <div className="emoji">{d.emoji}</div>
              <h3>{d.label} <small>{d.w}×{d.d}</small></h3>
              <p>{d.desc}</p>
              <Cost cost={d.cost} inv={inv} />
              <button className="btn primary" disabled={!ok}
                onClick={() => useGame.getState().setTool('build', { buildSel: id, panel: null })}>
                {ok ? `${t("Construir")}${count(id) ? t(' (otra, ya hay {0})', [count(id)]) : ''}` : t("Faltan recursos")}
              </button>
            </div>
          );
        })}
      </div>
      {movable.length > 0 && (
        <>
          <h3 className="sub">{t("✋ Cambiar un edificio de sitio")}</h3>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {movable.map(([id, b]) => (
              <button key={id} className="btn ghost" onClick={() => useGame.getState().setTool('build', { buildSel: b.type, moveBuildId: id, panel: null })}>
                {BUILDINGS[b.type].emoji} {BUILDINGS[b.type].label}
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
