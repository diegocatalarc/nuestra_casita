import { useState } from 'react';
import { useGame, partnerUid } from '../store/gameStore';
import { RECIPES, STATIONS, CRAFT, ITEMS, DECOR, SKILLS } from '../game/constants';
import { stationPlaced, recipeStatus, craftDur, jobList, canAfford, skillLv } from '../game/logic';
import { startCraft, assistCraft, collectCraft, requestCraft, cancelRequest, recipeInfo } from '../game/actions';
import { fmtDuration } from '../game/time';
import Modal from './Modal';
import { t } from '../i18n';

const needChips = (need, inv) => Object.entries(need).map(([k, n]) => <span key={k} className={`chip ${(inv[k] || 0) >= n ? '' : 'lack'}`}>{ITEMS[k]?.emoji} {inv[k] || 0}/{n}</span>);
const outText = (r) => Object.entries(r.out).map(([k, v]) => (k === 'unlock' ? t("👗 prenda") : k === 'upgrade' ? t("⬆️ mejora") : `${ITEMS[k]?.emoji} ×${v}`)).join(' ');

/** Taller: mesa de trabajo y estaciones, cola de trabajos compartida, ayuda y peticiones. */
export default function CraftPanel() {
  const tab0 = useGame((s) => s.craftTab) || 'bench';
  const [tab, setTab] = useState(tab0);
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
      <p className="sub"><b>{t("¿Para qué sirve?")}</b> {t("Convierte materiales en muebles, ropa y mejoras para el bote, el pico y el anzuelo. Los muebles se colocan luego con 🛋️ Decorar.")}</p>
      <div className="vitals-line"><span>{SKILLS.craft.emoji} {t("Artesanía nivel {0}", [lv])}</span><span>{t("Trabajos: {0}/{1}", [jobs.length, CRAFT.slots])}</span></div>

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
            const info = recipeInfo(q.recipe), mine = q.by === uid, r = RECIPES[q.recipe];
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
    </Modal>
  );
}
