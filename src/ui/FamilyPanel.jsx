import { useState } from 'react';
import { useGame, partnerUid } from '../store/gameStore';
import { FAMILY } from '../game/constants';
import { familyStatus, childInfo } from '../game/logic';
import { proposeBaby, respondBaby, renameChild, childInteract } from '../game/actions';
import { fmtDuration, serverNow } from '../game/time';
import Modal from './Modal';
import { t } from '../i18n';

const Bar = ({ v, color }) => <div className="bar"><div style={{ width: `${Math.round(v * 100)}%`, background: color }} /></div>;
const Check = ({ ok, children }) => <li className={ok ? 'ok' : t("no")}>{ok ? '✅' : '⬜'} {children}</li>;

function ChildCard({ c }) {
  const now = useGame((s) => s.now);
  const [name, setName] = useState(c.name);
  const info = childInfo(c, now);
  return (
    <div className="child-card">
      <div className="emoji big">{info.stage.emoji}</div>
      <div className="child-main">
        <div className="row-name">
          <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== c.name && renameChild(c.id, name)} aria-label={t("Nombre")} />
          <span className="chip">{info.stage.label} · {info.ageDays < 1 ? `${Math.max(1, Math.floor(info.ageDays * 24))} h` : `${Math.floor(info.ageDays)} d`}</span>
        </div>
        <div className="stat-line"><small>{t("Hambre")}</small><Bar v={info.hunger} color="#e8a25c" /></div>
        <div className="stat-line"><small>{t("Felicidad")}</small><Bar v={info.happy} color="#f48aa8" /></div>
        <button className="btn primary" onClick={() => { useGame.getState().set({ panel: null }); childInteract(c.id); }}>{t("Ir a cuidar a")} {c.name}</button>
      </div>
    </div>
  );
}

export default function FamilyPanel() {
  const s = useGame();
  const fam = s.couple.family || {};
  const st = familyStatus(s);
  const children = Object.values(s.children).sort((a, b) => a.bornAt - b.bornAt);
  const other = partnerUid(s);
  const names = s.couple.players || {};
  const plan = fam.plan, due = fam.due;
  const mine = plan?.by === s.user.uid;

  return (
    <Modal title={t("👶 Familia")} wide>
      <p className="sub">{t("Un bebé llega solo cuando las dos personas lo deseáis. Cuidarlo da corazones, y crece en tiempo real.")}</p>

      {children.length > 0 && <div className="children">{children.map((c) => <ChildCard key={c.id} c={c} />)}</div>}

      {due && (
        <div className="box due">
          <h3>{t("🍼 ¡Esperáis un bebé!")}</h3>
          <p>{t("Llegará en")} <b>{fmtDuration(due.dueAt - serverNow())}</b>{t(". Preparad la cuna y dormid juntos 💤.")}</p>
          <Bar v={Math.min(1, 1 - (due.dueAt - serverNow()) / (due.dueAt - due.startedAt))} color="#f48aa8" />
        </div>
      )}

      {!due && plan && (
        <div className="box due">
          <h3>💌 {mine ? t("Propuesta enviada") : t("{0} quiere un bebé", [names[plan.by]?.name || t("Tu pareja")])}</h3>
          <p>{mine ? t("Esperando la respuesta de vuestra pareja.") : t("¿Os apetece daros esta alegría? Costará ") + FAMILY.cost + ' 💗.'}</p>
          <div className="row">
            {!mine && <button className="btn primary" onClick={() => respondBaby(true)}>{t("¡Sí, queremos!")}</button>}
            <button className="btn ghost" onClick={() => respondBaby(false)}>{mine ? t("Cancelar") : t("Ahora no")}</button>
          </div>
        </div>
      )}

      {!due && !plan && (
        <div className="box">
          <h3>{t("Tener un bebé")}</h3>
          <ul className="checks">
            <Check ok={st.hasBedroom}>{t("Construir un Dormitorio")}</Check>
            <Check ok={st.hasCrib}>{t("Colocar una Cuna 🍼 (Decorar)")}</Check>
            <Check ok={st.hearts}>{FAMILY.needHeartsTotal} {t("💗 acumulados (")}{s.couple.heartsTotal})</Check>
            <Check ok={st.money}>{FAMILY.cost} {t("💗 disponibles (")}{s.couple.hearts})</Check>
            <Check ok={st.space}>{t("Hasta")} {FAMILY.maxChildren} {t("peques (")}{st.kids})</Check>
          </ul>
          <button className="btn primary" disabled={!st.ok || !other} onClick={proposeBaby}>{t("Proponer a")} {names[other]?.name || t("mi pareja")}</button>
          {!other && <p className="hint">{t("Primero tiene que unirse vuestra pareja.")}</p>}
        </div>
      )}
    </Modal>
  );
}
