import { useGame } from '../store/gameStore';
import { DECOR } from '../game/constants';
import Modal, { Cost } from './Modal';
import { canAfford } from '../game/logic';
import { t } from '../i18n';

export default function DecorPanel() {
  const inv = useGame((s) => s.couple?.inventory);
  return (
    <Modal title={t("🛋️ Decorar")} wide>
      <p className="sub">{t("Elige un objeto y colócalo.")} <b>R</b> {t("rota,")} <b>C</b> {t("cambia el color,")} <b>Esc</b> {t("cancela.")}</p>
      <div className="grid">
        {Object.entries(DECOR).filter(([id, d]) => !d.craft || (inv?.[id] || 0) > 0).map(([id, d]) => {
          const ok = canAfford(inv, d.cost);
          return (
            <div key={id} className="item">
              <div className="emoji">{d.emoji}</div>
              <h3>{d.label}{d.craft ? <small> ×{inv?.[id]}</small> : null}</h3>
              {d.craft ? <small className="hint">{t("Fabricado en 🛠️ Taller")}</small> : <Cost cost={d.cost} inv={inv} />}
              <button className="btn primary" disabled={!ok}
                onClick={() => useGame.getState().setTool('decor', { decorSel: id, decorRot: 0, decorVariant: 0, panel: null })}>
                {ok ? t("Colocar") : t("Faltan recursos")}
              </button>
            </div>
          );
        })}
      </div>
      <p className="hint">{t("¿Quieres más objetos? Fabricadlos en 🛠️ Taller (Casita → Taller). Las estaciones de trabajo se colocan aquí.")}</p>
      <div className="row end">
        <button className="btn ghost" onClick={() => useGame.getState().setTool('decor', { panel: null })}>{t("✋ Mover o quitar objetos ya colocados")}</button>
      </div>
    </Modal>
  );
}
