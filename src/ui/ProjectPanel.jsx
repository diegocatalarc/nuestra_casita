import { useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { ITEMS } from '../game/constants';
import { PROJECTS, projectProgress, projectReady } from '../game/story/projects';
import { contribute, syncProjects } from '../game/actions';
import Modal from './Modal';
import { t } from '../i18n';

/** Panel de un proyecto del pueblo (store.projectId): materiales, aportes con botones grandes y progreso compartido. */
export default function ProjectPanel() {
  const id = useGame((s) => s.projectId);
  const couple = useGame((s) => s.couple);
  const p = PROJECTS[id];
  const pr = p && projectProgress(couple, id);
  // si las dos personas aportaron lo último a la vez, quien tenga el panel abierto lo remata
  useEffect(() => { if (pr?.complete && !couple?.projects?.[id]?.done) syncProjects(); }, [pr?.complete, couple?.projects, id]);
  if (!p) return null;
  const inv = couple.inventory || {};
  const ready = projectReady(couple, id);
  const flags = p.unlocks;
  return (
    <Modal title={`${p.emoji} ${p.label}`}>
      <p className="sub">{p.blurb}</p>
      <div className="bar" style={{ height: 18, margin: '8px 0 4px' }} aria-label={t("Progreso")}>
        <div style={{ width: `${Math.round(pr.pct * 100)}%`, height: '100%', background: pr.done ? '#4f9a4a' : 'var(--rose)', borderRadius: 'inherit', transition: 'width .4s' }} />
      </div>
      <small>{pr.done ? t("¡Terminado!") : t("{0} de {1} materiales entre los dos", [pr.have, pr.total])}</small>
      {!ready.ok && <p className="sub" style={{ color: '#b0493a', fontWeight: 700 }}>{ready.reason === 'pieces' ? t("🕰️ Faltan piezas del reloj: {0}/{1}", [ready.have, ready.need]) : t("🏮 Antes hay que arreglar la torre del reloj")}</p>}
      <div style={{ display: 'grid', gap: 10, margin: '12px 0' }}>
        {pr.items.map((r) => {
          const mine = inv[r.item] || 0, can = Math.min(mine, r.left);
          return (
            <div key={r.item} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fff', border: '2px solid var(--line)', borderRadius: 14, padding: '8px 12px' }}>
              <span style={{ fontSize: 30 }}>{ITEMS[r.item]?.emoji}</span>
              <div style={{ flex: 1, minWidth: 120 }}>
                <b>{ITEMS[r.item]?.label || r.item}</b><br />
                <small>{r.left === 0 ? t("✔ Completo") : t("Llevamos {0}/{1} · tenemos {2} en la mochila", [r.have, r.need, mine])}</small>
              </div>
              {r.left > 0 && <button className="btn primary" style={{ minHeight: 52, minWidth: 150, fontSize: 17 }} disabled={!ready.ok || can <= 0} onClick={() => contribute(id, r.item, can)}>
                {can > 0 ? t("Aportar {0}", [can]) : t("Faltan")}
              </button>}
            </div>
          );
        })}
      </div>
      <div className="order" style={{ background: '#fff7e6' }}>
        <b>{t("Al terminar")}</b>
        <div>{p.gives}</div>
        {flags.length > 0 && pr.done && <div><small>{t("¡Ya desbloqueado!")}</small></div>}
      </div>
    </Modal>
  );
}
