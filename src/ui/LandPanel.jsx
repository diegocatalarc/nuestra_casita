import { useGame } from '../store/gameStore';
import { ZONES, ITEMS, MAP } from '../game/constants';
import { canAfford } from '../game/logic';
import { buyZone, zoneOwned, zoneAvailable } from '../game/actions';
import Modal, { Cost } from './Modal';
import { t } from '../i18n';

/** Ampliaciones de terreno: mapa de zonas y compra. */
export default function LandPanel() {
  const couple = useGame((s) => s.couple);
  const inv = couple.inventory || {};
  const coins = couple.coins || 0;
  const zones = Object.values(ZONES);
  const total = 50 * 50 + zones.filter((z) => zoneOwned(couple, z.id)).reduce((a, z) => a + (z.rect[2] - z.rect[0]) * (z.rect[3] - z.rect[1]), 0);
  return (
    <Modal title={t("🗺️ Terreno")} wide>
      <p className="sub">{t("Vuestro territorio tiene {0} casillas. La Pradera del Este y el Valle del Sur ya forman parte de él; las ampliaciones que faltan se compran con monedas.", [total])}</p>
      <div className="landmap">
        <div className="lm base">{t("🏡 Terreno inicial")}</div>
        {zones.map((z) => <div key={z.id} className={`lm ${z.id} ${zoneOwned(couple, z.id) ? 'own' : ''}`}>{zoneOwned(couple, z.id) ? '✅' : '🔒'} {z.emoji}</div>)}
      </div>
      <div className="grid">
        {zones.map((z) => {
          const own = zoneOwned(couple, z.id), ok = zoneAvailable(couple, z.id);
          const afford = coins >= z.coins && canAfford(inv, z.items);
          return (
            <div className="item" key={z.id}>
              <div className="emoji">{z.emoji}</div>
              <h3>{z.label}</h3>
              <p>{z.desc}</p>
              {own ? <div className="done-tag">{t("✅ Es vuestra")}</div> : (<>
                <div className="costs"><span className={`chip ${coins >= z.coins ? '' : 'lack'}`}>🪙 {z.coins}</span><Cost cost={z.items} inv={inv} /></div>
                <button className="btn primary" disabled={!ok || !afford} onClick={() => buyZone(z.id)}>{!ok ? t("Primero una vecina") : afford ? t("Comprar terreno") : t("Faltan recursos")}</button>
              </>)}
            </div>
          );
        })}
      </div>
      <p className="hint">{t("🟫 Consejo: con 🌱 Plantar → «Arar» podéis convertir hierba y pradera en tierra de cultivo en cualquier sitio.")}</p>
    </Modal>
  );
}
