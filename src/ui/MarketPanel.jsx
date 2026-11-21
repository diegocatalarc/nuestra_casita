import { useUnlocked } from './useUnlocked';
import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { ITEMS, PRICES, CROPS, AVATAR_LOCKS, AVATAR_OPTS, UPGRADES, SKILLS, lockKey, skillLevel, skillNext } from '../game/constants';
import { dayUTC, demandItem, priceOf, tierOf } from '../game/logic';
import { sellItem, buyUnlock, buyUpgrade } from '../game/actions';
import Modal from './Modal';
import { t } from '../i18n';

const MAP = { hat: 'hats', glasses: 'glasses', neck: 'neck', back: 'back', topStyle: 'topStyles' };
const CAT = { hat: '🎩', glasses: '👓', neck: '🧣', back: '🎒', topStyle: '👕' };

/** Mercado: vender, comprar semillas raras y ropa, y mejorar herramientas y habilidades. */
export default function MarketPanel() {
  const [tab, setTab] = useState('sell');
  const unlocked = useUnlocked();
  const couple = useGame((s) => s.couple);
  const now = useGame((s) => s.now);
  const inv = couple.inventory || {};
  const coins = couple.coins || 0;
  const day = dayUTC(now);
  const hot = demandItem(couple.seed, day);
  const sellable = Object.keys(PRICES).filter((k) => (inv[k] || 0) > 0).sort((a, b) => (a === hot ? -1 : b === hot ? 1 : 0));
  const owned = (k) => !!couple.unlocks?.[k];

  return (
    <Modal title={t("🏪 Mercado")} wide>
      <div className="vitals-line"><span>🪙 <b>{coins}</b></span><span>🔥 {t("Hoy se paga más:")} <b>{ITEMS[hot].emoji} {ITEMS[hot].label}</b></span></div>
      <div className="tabs">
        {[['sell', t("💰 Vender")], ['shop', t("🛍️ Tienda")], ['up', t("⬆️ Mejoras")]].filter(([id]) => id === 'sell' || unlocked('market_' + id)).map(([id, l]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}</button>)}
      </div>

      {tab === 'sell' && (<>
        <p className="sub">{t("Vended lo que os sobre. Los edificios y la decoración siguen necesitando madera, piedra, etc., así que esos no se venden.")}</p>
        <div className="grid">
          {sellable.map((k) => (
            <div className={`item ${k === hot ? 'hot' : ''}`} key={k}>
              <div className="emoji">{ITEMS[k].emoji}</div>
              <h3>{ITEMS[k].label} <small>×{inv[k]}</small></h3>
              <p>🪙 {priceOf(k, couple.seed, day)} {t("c/u")} {k === hot ? '🔥' : ''}</p>
              <div className="row">
                <button className="btn primary" onClick={() => sellItem(k, 1)}>{t("Vender 1")}</button>
                {inv[k] > 1 && <button className="btn ghost" onClick={() => sellItem(k, inv[k])}>{t("Todo")}</button>}
              </div>
            </div>
          ))}
        </div>
        {!sellable.length && <p className="hint">{t("No tenéis nada que vender. Cosechad, pescad o cocinad algo.")}</p>}
      </>)}

      {tab === 'shop' && (<>
        <h3>{t("🌱 Semillas raras")}</h3>
        <div className="grid">
          {Object.entries(CROPS).filter(([, c]) => c.rare).map(([id, c]) => (
            <div className="item" key={id}>
              <div className="emoji">{c.emoji}</div><h3>{c.label}</h3>
              <p>{t("{0} min · vale 🪙 {1}", [c.growMin, PRICES[id]])}</p>
              {owned('crop_' + id) ? <div className="done-tag">{t("✅ Desbloqueada")}</div>
                : <button className="btn primary" disabled={coins < c.price} onClick={() => buyUnlock('crop:' + id)}>🪙 {c.price}</button>}
            </div>
          ))}
        </div>
        <h3>{t("👗 Ropa para el Vestidor")}</h3>
        <div className="grid">
          {Object.entries(AVATAR_LOCKS).map(([key, l]) => {
            const [cat, i] = key.split(':');
            const name = AVATAR_OPTS[MAP[cat]][+i];
            return (
              <div className="item" key={key}>
                <div className="emoji">{CAT[cat]}</div><h3>{name}</h3>
                {owned(lockKey(key)) ? <div className="done-tag">{t("✅ Es vuestra")}</div>
                  : l.visitor ? <p className="hint">{t("Exclusiva: la traen los visitantes del Tablón o los vecinos")}</p>
                  : <button className="btn primary" disabled={coins < l.coins} onClick={() => buyUnlock(key)}>🪙 {l.coins}</button>}
              </div>
            );
          })}
        </div>
      </>)}

      {tab === 'up' && (<>
        <h3>{t("🔧 Herramientas")}</h3>
        <div className="grid">
          {Object.entries(UPGRADES).map(([k, u]) => {
            const lv = tierOf(couple, k), max = u.costs.length;
            return (
              <div className="item" key={k}>
                <div className="emoji">{u.emoji}</div><h3>{u.label} <small>{t("nivel {0}/{1}", [lv, max])}</small></h3>
                <p>{u.desc}</p>
                {lv >= max ? <div className="done-tag">{t("✅ Al máximo")}</div>
                  : <button className="btn primary" disabled={coins < u.costs[lv]} onClick={() => buyUpgrade(k)}>{t("Mejorar")} · 🪙 {u.costs[lv]}</button>}
              </div>
            );
          })}
        </div>
        <h3>{t("📈 Habilidades")}</h3>
        <p className="sub">{t("Suben solas con el uso: pescar, cosechar y cocinar da experiencia a los dos.")}</p>
        <div className="skills">
          {Object.entries(SKILLS).map(([k, sk]) => {
            const xp = couple.skills?.[k] || 0, lv = skillLevel(xp);
            const lo = lv === 1 ? 0 : skillNext(lv - 1), hi = skillNext(lv);
            const pct = lv >= 10 ? 100 : Math.round(((xp - lo) / (hi - lo)) * 100);
            return (
              <div className="skill" key={k}>
                <b>{sk.emoji} {sk.label} <small>{t("nivel {0}", [lv])}</small></b>
                <div className="vbar"><div><i style={{ width: `${pct}%` }} /></div></div>
                <small className="hint">{sk.desc}</small>
              </div>
            );
          })}
        </div>
      </>)}
    </Modal>
  );
}
