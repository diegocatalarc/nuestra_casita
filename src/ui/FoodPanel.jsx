import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { DISHES, FOOD_VALUE, ITEMS } from '../game/constants';
import { eatItem, cook } from '../game/actions';
import { vitals, canAfford } from '../game/logic';
import Modal, { Cost } from './Modal';
import { t } from '../i18n';

export default function FoodPanel() {
  const [tab, setTab] = useState('eat');
  const inv = useGame((s) => s.couple?.inventory) || {};
  const buildings = useGame((s) => s.buildings);
  const me = useGame((s) => s.couple?.players?.[s.user.uid]);
  const now = useGame((s) => s.now);
  const v = vitals(me, now);
  const kitchen = Object.values(buildings).some((b) => b.type === 'kitchen');
  const raw = Object.keys(FOOD_VALUE).filter((k) => (inv[k] || 0) > 0);
  const dishes = Object.keys(DISHES).filter((k) => (inv[k] || 0) > 0);

  return (
    <Modal title={t("🍽️ Comer y cocinar")} wide>
      <div className="vitals-line">
        <span>{t("⚡ Energía")} <b>{Math.round(v.energy)}</b></span><span>{t("🍽️ Saciedad")} <b>{Math.round(v.full)}</b></span>
      </div>
      <div className="tabs">
        <button className={tab === 'eat' ? 'on' : ''} onClick={() => setTab('eat')}>{t("Comer")}</button>
        <button className={tab === 'cook' ? 'on' : ''} onClick={() => setTab('cook')}>{t("Cocinar")}</button>
      </div>
      {tab === 'eat' && (
        <>
          <p className="sub">{t("Si tu pareja come a menos de 4 casillas y casi a la vez, ¡ganáis corazones juntos! Los platos saben mejor sentado a una mesa o dentro de casa (+20 %).")}</p>
          <div className="grid">
            {[...dishes, ...raw].map((k) => {
              const dish = DISHES[k];
              return (
                <div className="item" key={k}>
                  <div className="emoji">{ITEMS[k].emoji}</div>
                  <h3>{ITEMS[k].label} <small>×{inv[k]}</small></h3>
                  <p>{dish ? t("+{0} saciedad · +{1} energía{2}", [dish.food, dish.energy, dish.hearts ? ` · +${dish.hearts} 💗` : '']) : `+${FOOD_VALUE[k]} saciedad`}</p>
                  <button className="btn primary" onClick={() => eatItem(k)}>{t("Comer")}</button>
                </div>
              );
            })}
          </div>
          {dishes.length + raw.length === 0 && <p className="hint">{t("No hay nada que comer. Cosechad, recoged huevos o cocinad algo.")}</p>}
        </>
      )}
      {tab === 'cook' && (
        <>
          <p className="sub">{kitchen ? t("Cocinad platos con vuestra cosecha. Se guardan en la mochila compartida.") : t("⚠️ Necesitáis construir la Cocina para cocinar.")}</p>
          <div className="grid">
            {Object.entries(DISHES).map(([k, d]) => (
              <div className="item" key={k}>
                <div className="emoji">{d.emoji}</div>
                <h3>{d.label}</h3>
                <Cost cost={d.need} inv={inv} />
                <p>+{d.food} {t("saciedad · +")}{d.energy} {t("energía")}{d.hearts ? ` · +${d.hearts} 💗` : ''}</p>
                <button className="btn primary" disabled={!kitchen || !canAfford(inv, d.need)} onClick={() => cook(k)}>{t("Cocinar")}</button>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
