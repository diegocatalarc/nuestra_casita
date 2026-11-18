import { useGame } from '../store/gameStore';
import { ANIMALS, ITEMS, PET_TRAITS, PET_HELP, PET, BOND_LEVELS, PET_CONTEST } from '../game/constants';
import { animalStats, animalCapacity, petTrait, bondLevel, dayUTC } from '../game/logic';
import { adoptAnimal, trainPet, petHelp, enterContest, contestInfo } from '../game/actions';
import { fmtDuration } from '../game/time';
import Modal from './Modal';
import { t } from '../i18n';

const Bar = ({ v, color }) => <div className="bar"><div style={{ width: `${Math.round(v * 100)}%`, background: color }} /></div>;

export default function AnimalsPanel() {
  const couple = useGame((s) => s.couple);
  const animals = useGame((s) => s.animals);
  const now = useGame((s) => s.now);
  const buildings = useGame((s) => s.buildings);
  const list = Object.values(animals);
  const cap = animalCapacity(buildings), hasBarn = Object.values(buildings).some((b) => b.type === 'barn');
  return (
    <Modal title={t("🐾 Animales")} wide>
      <p className="sub">{t("Plazas:")} <b>{list.length}/{cap}</b>{hasBarn ? t(" · 🛖 el granero da de comer solo a los hambrientos") : t(" · un Granero da +6 plazas, vacas y ovejas")}{t(". Haz clic en ellos para recoger, alimentar o acariciar.")}</p>
      <div className="grid">
        {Object.entries(ANIMALS).map(([id, d]) => {
          const unlocked = couple.heartsTotal >= d.unlockAt;
          return (
            <div key={id} className={`item ${unlocked ? '' : 'locked'}`}>
              <div className="emoji">{d.emoji}</div>
              <h3>{d.label}</h3>
              <p>{t("Produce")} {d.prod.item === 'hearts' ? `${d.prod.amount} 💗` : `${ITEMS[d.prod.item].emoji} ${ITEMS[d.prod.item].label.toLowerCase()}`} {t("cada")} {d.prodMin} {t("min.")}</p>
              {unlocked && d.needsBarn && !hasBarn
                ? <div className="hint">{t("🛖 Necesita un Granero")}</div>
                : unlocked
                ? <button className="btn primary" disabled={couple.hearts < d.cost} onClick={() => adoptAnimal(id)}>{t("Adoptar ·")} {d.cost} 💗</button>
                : <div className="hint">{t("🔒 Con")} {d.unlockAt} {t("💗 acumulados (")}{couple.heartsTotal})</div>}
            </div>
          );
        })}
      </div>
      {list.length > 0 && (() => { const ci = contestInfo(now); return (
        <div className="evcard">
          <div className="ev-head"><span className="npc">🏆</span><div><b>{t("Concurso de mascotas")}</b><small>{ci.open ? t("¡Hoy es domingo! Apunta a una mascota.") : t("Todos los domingos")}</small></div></div>
          {ci.done ? <div className="done-tag">{t("✅ {0}: puesto {1} ({2} pts)", [ci.done.animal, ci.done.rank, ci.done.score])}</div> : <small className="hint">{t("Rivales de hoy: {0}", [ci.rivals.map((r) => `${r.name} ${r.score}`).join(' · ')])}</small>}
        </div>); })()}
      {list.length > 0 && <h3 className="sec">{t("Vuestros animales")}</h3>}
      <div className="list">
        {list.map((a) => {
          const s = animalStats(a, now);
          return (
            <div key={a.id} className="animal-row wrap">
              <span className="emoji">{ANIMALS[a.type].emoji}</span>
              <b>{a.name}</b>
              <div className="stat"><small>{t("Hambre")}</small><Bar v={s.hunger} color="#e8a25c" /></div>
              <div className="stat"><small>{t("Felicidad")}</small><Bar v={s.happy} color="#f48aa8" /></div>
              <div className="stat"><small>{t("Producción")}</small><span>{s.ready ? t("✨ ¡Lista!") : fmtDuration(s.readyIn)}</span></div>
              {(() => { const tr = PET_TRAITS[petTrait(a)], lv = bondLevel(a.bond), nx = BOND_LEVELS[lv], h = PET_HELP[a.type]; const ci = contestInfo(now); return (
                <div className="pet-extra">
                  <span className="chip" title={tr.desc}>{tr.emoji} {tr.label}</span>
                  <span className="chip" title={t("Vínculo")}>💞 {t("nivel {0}", [lv])}{nx ? ` · ${a.bond || 0}/${nx}` : ' ★'}</span>
                  <button className="btn ghost" onClick={() => trainPet(a.id)}>{t("🎾 Jugar")}</button>
                  <button className="btn ghost" disabled={lv < PET.helpLevel || a.helpDay === dayUTC(now)} onClick={() => petHelp(a.id)} title={h.label}>{a.helpDay === dayUTC(now) ? t("🤝 Ya ayudó hoy") : lv < PET.helpLevel ? t("🤝 Vínculo 2") : t("🤝 Pedir ayuda")}</button>
                  {ci.open && !ci.done && <button className="btn primary" onClick={() => enterContest(a.id)}>{t("🏆 Al concurso")}</button>}
                </div>); })()}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
