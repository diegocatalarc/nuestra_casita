import { useState } from 'react';
import { useGame, partnerUid } from '../store/gameStore';
import { RECIPES, SIMPLE_RECIPES, ALL_RECIPES, STATIONS, CRAFT, ITEMS, DECOR, SKILLS } from '../game/constants';
import { stationPlaced, recipeStatus, craftDur, jobList, canAfford, skillLv, recipeOwned } from '../game/logic';
import { startCraft, assistCraft, collectCraft, requestCraft, cancelRequest, recipeInfo } from '../game/actions';
import { fmtDuration } from '../game/time';
import Modal from './Modal';
import { t } from '../i18n';

const needChips = (need, inv) => Object.entries(need).map(([k, n]) => <span key={k} className={`chip ${(inv[k] || 0) >= n ? '' : 'lack'}`}>{ITEMS[k]?.emoji} {inv[k] || 0}/{n}</span>);
const outText = (r) => Object.entries(r.out).map(([k, v]) => (k === 'unlock' ? t("👗 prenda") : k === 'upgrade' ? t("⬆️ mejora") : `${ITEMS[k]?.emoji} ×${v}`)).join(' ');

const ADV_KEY = 'nc_craft_adv';
const readAdv = () => { try { return localStorage.getItem(ADV_KEY) === '1'; } catch { return false; } };

/** Taller: mesa de trabajo y estaciones, cola de trabajos compartida, ayuda y peticiones. */
export default function CraftPanel() {
  const tab0 = useGame((s) => s.craftTab) || 'bench';
  const [tab, setTab] = useState(tab0);
  const [adv, setAdv] = useState(readAdv);
  const toggleAdv = (v) => { setAdv(v); try { localStorage.setItem(ADV_KEY, v ? '1' : '0'); } catch { /* noop */ } };
  const couple = useGame((s) => s.couple);
  const decor = useGame((s) => s.decor);
  const crafts = useGame((s) => s.crafts);
  const uid = useGame((s) => s.user.uid);
  const now = useGame((s) => s.now);
  const players = couple.players || {};
  const inv = couple.inventory || {};
  const pu = useGame(partnerUid);
  const jobs = jobList(crafts).sort((a, b) => a.end - b.end);
  const requests = Object.values(crafts).filter((j) => j.state === 'request');
  const lv = skillLv(couple, 'craft');
  const placed = stationPlaced(decor, tab);
  const list = Object.entries(RECIPES).filter(([, r]) => r.station === tab);
  // Lo que se puede fabricar ahora (ingredientes y estación) va primero; el resto, en «Más recetas».
  const cards = list.map(([id, r]) => {
    const st = recipeStatus(couple, r), can = placed && st.ok && canAfford(inv, r.in);
    return { id, r, st, can, ok: can && jobs.length < CRAFT.slots };
  }).sort((a, b) => (b.can ? 1 : 0) - (a.can ? 1 : 0));
  const readyNow = cards.filter((c) => c.can), rest = cards.filter((c) => !c.can);

  // Taller sencillo: todas las recetas básicas, las que se pueden hacer ahora primero.
  const simple = Object.entries(SIMPLE_RECIPES).map(([id, r]) => {
    const owned = recipeOwned(couple, r), can = !owned && canAfford(inv, r.in);
    return { id, r, can, owned, ok: can && jobs.length < CRAFT.slots };
  }).sort((a, b) => (b.can ? 1 : 0) - (a.can ? 1 : 0) || (a.owned ? 1 : 0) - (b.owned ? 1 : 0));
  const renderSimple = ({ id, r, owned, ok }) => {
    const info = recipeInfo(id);
    return (
      <div key={id} className={`item ${owned ? 'locked' : ''}`}>
        <div className="emoji">{info.emoji}</div>
        <h3>{info.label} <small>{outText(r)}</small></h3>
        <div className="costs">{needChips(r.in, inv)}</div>
        <small className="hint">⏱️ {fmtDuration(r.dur * 1000)}</small>
        {owned ? <div className="hint">✅ {t("Ya la tienes")}</div>
          : <button className="btn primary big" disabled={!ok} onClick={() => startCraft(id)}>{t("Fabricar")}</button>}
      </div>
    );
  };

  const renderCard = ({ id, r, st, ok }) => {
    const info = recipeInfo(id), dec = DECOR[Object.keys(r.out)[0]];
    return (
      <div key={id} className={`item ${st.ok ? '' : 'locked'}`}>
        <div className="emoji">{info.emoji}</div>
        <h3>{info.label} <small>{outText(r)}</small></h3>
        {info.desc && <p>{info.desc}</p>}
        {dec && <p className="hint">{t("Se coloca con 🛋️ Decorar")}</p>}
        <div className="costs">{needChips(r.in, inv)}</div>
        <small className="hint">⏱️ {fmtDuration(craftDur(couple, r) * 1000)}</small>
        {st.ok ? (
          <div className="row">
            <button className="btn primary" disabled={!ok} onClick={() => startCraft(id)}>{t("Fabricar")}</button>
            {pu && <button className="btn ghost" title={t("Pedírselo a tu pareja")} onClick={() => requestCraft(id)}>🙏</button>}
          </div>
        ) : <div className="hint">🔒 {st.why}</div>}
      </div>
    );
  };

  return (
    <Modal title={t("🛠️ Taller")} wide>
      <p className="sub">{t("Elige algo, toca «Fabricar» y espera. Al terminar llega solo a la mochila. Los muebles se colocan con 🛋️ Decorar y la ropa está en el Vestidor.")}</p>
      <div className="vitals-line">{adv && <span>{SKILLS.craft.emoji} {t("Artesanía nivel {0}", [lv])}</span>}<span>{t("Trabajos: {0}/{1}", [jobs.length, CRAFT.slots])}</span></div>

      {(jobs.length > 0 || requests.length > 0) && (
        <div className="evcard">
          <b>{t("⏳ En marcha")}</b>
          {jobs.map((j) => {
            const info = recipeInfo(j.recipe), left = Math.max(0, j.end - now), done = left <= 0, pct = Math.min(100, ((now - j.start) / (j.end - j.start)) * 100);
            return (
              <div className="job" key={j.id}>
                <span className="npc">{info.emoji}</span>
                <div className="grow"><b>{info.label}</b> <small>{players[j.by]?.name || ''}</small>
                  <div className="vbar wide"><div><i style={{ width: `${pct}%` }} /></div></div>
                  <small>{done ? t("¡Listo!") : fmtDuration(left)}{j.assisted ? t(" · con ayuda 🤝") : ''}</small></div>
                {done ? <button className="btn primary" onClick={() => collectCraft(j.id)}>{t("Recoger")}</button>
                  : j.by !== uid && !j.assisted ? <button className="btn ghost" onClick={() => assistCraft(j.id)}>{t("🤝 Ayudar")}</button> : null}
              </div>
            );
          })}
          {requests.map((q) => {
            const info = recipeInfo(q.recipe), mine = q.by === uid, r = ALL_RECIPES[q.recipe];
            if (!r) return null;
            return (
              <div className="job" key={q.id}>
                <span className="npc">🙏</span>
                <div className="grow"><b>{mine ? t("Pediste: {0}", [info.label]) : t("{0} te pide: {1}", [players[q.by]?.name || t("Tu pareja"), info.label])}</b><small>{needChips(r.in, inv)}</small></div>
                {mine ? <button className="btn ghost" onClick={() => cancelRequest(q.id)}>{t("Cancelar")}</button>
                  : <button className="btn primary" disabled={!stationPlaced(decor, r.station) || !canAfford(inv, r.in)} onClick={() => startCraft(q.recipe, q.id)}>{t("Fabricar para tu pareja")}</button>}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid">{simple.map(renderSimple)}</div>

      <label className="row" style={{ marginTop: 14, gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={adv} onChange={(e) => toggleAdv(e.target.checked)} style={{ width: 22, height: 22 }} />
        <span>{t("Mostrar recetas avanzadas")}</span>
      </label>
      {adv && (
        <div style={{ marginTop: 8 }}>
          <p className="hint">{t("Estaciones, materiales intermedios, nivel de Artesanía y ayuda de tu pareja.")}</p>
      <div className="tabs">
        {Object.entries(STATIONS).map(([id, s]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{s.emoji} {s.label}</button>)}
      </div>
      <p className="sub">{STATIONS[tab].desc}</p>
      {!placed && <p className="warn">{t("⚠️ Aún no tenéis «{0}». Colócala con 🛋️ Decorar (cuesta recursos) y podréis usar sus recetas.", [STATIONS[tab].label])}</p>}

      {readyNow.length > 0 && <p className="hint">{t("✅ Puedes fabricar ahora: {0}", [readyNow.length])}</p>}
      <div className="grid">
        {readyNow.map(renderCard)}
      </div>
      {rest.length > 0 && (
        <details open={rest.length <= 6} style={{ marginTop: 10 }}>
          <summary className="hint">{t("Más recetas ({0})", [rest.length])}</summary>
          <div className="grid">{rest.map(renderCard)}</div>
        </details>
      )}
        </div>
      )}
    </Modal>
  );
}
