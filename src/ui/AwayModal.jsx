import { useGame } from '../store/gameStore';
import { fmtDuration, serverNow } from '../game/time';
import Modal from './Modal';
import { t } from '../i18n';

const LINES = {
  harvest: (n) => t("🧺 Cosechó {0} {1}", [n, n === 1 ? t("cultivo") : t("cultivos")]),
  build: (n, l) => t("🔨 Construyó {0}", [l.join(', ') || n + t(" cosa(s)")]),
  adopt: (n, l) => t("🐾 Adoptó a {0}", [l.join(', ') || n + ' animal(es)']),
  memory: (n) => t("🖼️ Guardó {0} {1} en la sala", [n, n === 1 ? t("recuerdo") : t("recuerdos")]),
  quest: (n) => t("💌 Respondió {0} {1}", [n, n === 1 ? t("misión") : t("misiones")]),
  hug: () => t("🤗 Os abrazasteis"),
  cook: (n, l) => t("🍳 Cocinó {0}", [l.join(', ') || t("algo rico")]),
  letter: (n) => t("📬 Te dejó {0} {1} en el buzón", [n, n === 1 ? t("carta") : t("cartas")]),
  baby: () => t("👶 ¡Novedades en la familia!"),
  care: () => t("🧸 Cuidó al peque"),
  date: (n, l) => t("💞 Tuvisteis una cita: {0}", [l.join(', ')]),
  gift: () => t("🎁 Encontró un regalo escondido"),
  zone: (n, l) => t("🗺️ Compró terreno: {0}", [l.join(', ')]),
  order: (n, l) => t("📋 Entregó {0} pedido(s) del Tablón", [n]),
  fish: (n, l) => t("🎣 Pescó algo especial: {0}", [l.join(', ')]),
  boat: () => t("⛵ Construyó el bote"),
  sleepTogether: () => t("💤 Dormisteis juntos"),
};

export default function AwayModal() {
  const away = useGame((s) => s.away);
  const partner = useGame((s) => s.partner);
  const set = useGame.getState().set;
  if (!away) return null;
  const close = () => set({ away: null });
  const who = partner.name || t("Tu pareja");
  return (
    <Modal title={t("🏡 Mientras no estabas…")} onClose={close}>
      <p className="sub">{t("Han pasado {0} desde tu última visita.", [fmtDuration(serverNow() - away.since)])}</p>
      {away.events.length > 0 && (
        <>
          <h3>{who} {t("ha estado ocupada/o")}</h3>
          <ul className="away-list">{away.events.map((e) => <li key={e.kind}>{(LINES[e.kind] || ((n) => t("✨ {0} novedad(es)", [n])))(e.count, e.labels)}</li>)}</ul>
        </>
      )}
      {(away.ready || away.hungryAnimals || away.hungryKids || away.mail > 0) && (
        <>
          <h3>{t("Os espera en la casita")}</h3>
          <ul className="away-list">
            {away.mail > 0 && <li>📬 {away.mail} {away.mail === 1 ? t("carta sin leer") : t("cartas sin leer")}</li>}
            {away.ready > 0 && <li>🥬 {away.ready} {away.ready === 1 ? t("cultivo listo") : t("cultivos listos")} {t("para cosechar")}</li>}
            {away.hungryAnimals > 0 && <li>🐔 {away.hungryAnimals} {away.hungryAnimals === 1 ? t("animal con hambre") : t("animales con hambre")}</li>}
            {away.hungryKids > 0 && <li>🍼 {away.hungryKids} {away.hungryKids === 1 ? t("peque con hambre") : t("peques con hambre")}</li>}
          </ul>
        </>
      )}
      <div className="row end">
        {away.mail > 0 && <button className="btn ghost" onClick={() => set({ away: null, panel: 'mailbox' })}>{t("Abrir buzón")}</button>}
        <button className="btn primary" onClick={close}>{t("¡Vamos!")}</button>
      </div>
    </Modal>
  );
}
