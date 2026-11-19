import { useGame } from '../store/gameStore';
import { ITEMS, AVATAR_OPTS } from '../game/constants';
import { dailyOrders, dayUTC, msToNextDay, canAfford, weeklyStatus, sourceHint, DAILY_BONUS } from '../game/logic';
import { completeOrder, contributeWeekly } from '../game/actions';
import { fmtDuration } from '../game/time';
import Modal from './Modal';
import { t } from '../i18n';

const LINES = [
  [t("¡Buenas! ¿Podéis ayudarme con esto?"), t("Me haría muchísima falta, ¡gracias!"), t("Os lo pagaré bien, lo prometo.")],
  [t("Hoy tengo un antojo especial…"), t("Si me lo traéis, os lo agradeceré siempre."), t("Es para una receta de la abuela.")],
  [t("Paso por aquí poco tiempo…"), t("Pago mejor que nadie, ya veréis."), t("¡Qué casita tan bonita! Necesito esto:")],
];
const cosLabel = (k) => { const [cat, i] = k.split(':'); const map = { hat: 'hats', glasses: 'glasses', neck: 'neck', back: 'back', topStyle: 'topStyles' }; return AVATAR_OPTS[map[cat]]?.[+i] || k; };

/** Tablón de pedidos: 4 encargos diarios iguales para las dos personas. */
export default function OrdersPanel() {
  const couple = useGame((s) => s.couple);
  const now = useGame((s) => s.now);
  const inv = couple.inventory || {};
  const day = dayUTC(now);
  const done = couple.orders?.[day] || {};
  const season = useGame((s) => s.env.season);
  const uid = useGame((s) => s.user.uid);
  const orders = dailyOrders(couple.seed, day, season);
  const nDone = orders.filter((o) => done[o.slot]).length;
  const week = weeklyStatus(couple, now, season);
  const kitchen = useGame((s) => Object.values(s.buildings).some((b) => b.type === 'kitchen'));
  const players = couple.players || {};

  return (
    <Modal title={t("📋 Tablón de pedidos")} wide>
      <p className="sub">{t("Cada día hay 4 pedidos nuevos, de temporada e iguales para los dos. Entregad con la mochila compartida.")} <b>{t("Nuevos en {0}", [fmtDuration(msToNextDay(now))])}</b></p>
      <div className="order big" style={{ marginBottom: 12, borderColor: '#e8788f' }}>
        <div className="o-head"><span className="npc">📦</span><div><b>{t("Pedido grande de la semana")}</b><small>{t("Entre los dos · pagan más")}</small></div></div>
        <div className="costs">
          {Object.entries(week.need).map(([k, n]) => {
            const left = n - week.given[k], have = inv[k] || 0, hint = left > 0 && have < left ? sourceHint(k, season) : null;
            return (
              <div key={k} className="need-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`chip ${left <= 0 ? '' : 'lack'}`}>{ITEMS[k].emoji} {week.given[k]}/{n}</span>
                <small>{t("Tú: {0}", [week.mine(uid)[k] || 0])}</small>
                {left > 0 && have > 0 && !week.claimed && <button className="btn primary" onClick={() => contributeWeekly(k)}>{t("Aportar {0}", [Math.min(left, have)])}</button>}
                {hint && <small className="hint">{hint.emoji} {hint.text}</small>}
              </div>
            );
          })}
        </div>
        <div className="rewards"><span className="chip">🪙 {week.coins}</span><span className="chip">💗 {week.hearts}</span></div>
        {week.claimed && <div className="done-tag">{t("✅ ¡Completado entre los dos!")}</div>}
      </div>
      <div className="order-bar" style={{ margin: '4px 0 12px' }}>
        <div className="bar"><div style={{ width: `${(nDone / orders.length) * 100}%`, background: '#e8788f' }} /></div>
        <small>{done.bonus ? t("✅ Bonus del día cobrado") : t("Completad los 4 y ganad +{0} 🪙 +{1} 💗", [DAILY_BONUS.coins, DAILY_BONUS.hearts])} · <b>{nDone}/{orders.length}</b></small>
      </div>
      <div className="orders">
        {orders.map((o) => {
          const by = done[o.slot];
          const ok = canAfford(inv, o.need);
          return (
            <div key={o.slot} className={`order ${by ? 'done' : ''} ${o.visitor ? 'visitor' : ''}`}>
              <div className="o-head"><span className="npc">{o.npc.emoji}</span><div><b>{o.npc.name}</b><small>{o.visitor ? t("✨ Visitante") : o.npc.role}</small></div></div>
              <p className="say">“{LINES[o.slot % 3][o.line]}”</p>
              <div className="costs">
                {Object.entries(o.need).map(([k, n]) => {
                  const lack = (inv[k] || 0) < n, hint = lack && !by ? sourceHint(k, season) : null;
                  return <span key={k} className="need-row"><span className={`chip ${lack ? 'lack' : ''}`}>{ITEMS[k].emoji} {inv[k] || 0}/{n}</span>{hint && <small className="hint">{hint.emoji} {hint.text}</small>}</span>;
                })}
              </div>
              <div className="rewards">
                <span className="chip">🪙 {o.coins}</span><span className="chip">💗 {o.hearts}</span>
                {o.cos && <span className="chip rare" title={t("Prenda exclusiva")}>👗 {cosLabel(o.cos)}</span>}
              </div>
              {o.kitchen && !kitchen && !by && <small className="hint">{t("Necesitáis la Cocina para prepararlo")}</small>}
              {by ? <div className="done-tag">{t("✅ Entregado por {0}", [players[by]?.name || t("tu pareja")])}</div>
                : <button className="btn primary" disabled={!ok} onClick={() => completeOrder(o.slot)}>{ok ? t("Entregar") : t("Faltan cosas")}</button>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
