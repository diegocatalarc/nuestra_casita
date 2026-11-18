import { useGame } from '../store/gameStore';
import { ITEMS, AVATAR_OPTS } from '../game/constants';
import { dailyOrders, dayUTC, msToNextDay, canAfford } from '../game/logic';
import { completeOrder } from '../game/actions';
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
  const orders = dailyOrders(couple.seed, day);
  const kitchen = useGame((s) => Object.values(s.buildings).some((b) => b.type === 'kitchen'));
  const players = couple.players || {};

  return (
    <Modal title={t("📋 Tablón de pedidos")} wide>
      <p className="sub">{t("Cada día hay 4 pedidos nuevos, iguales para los dos. Entregad con la mochila compartida.")} <b>{t("Nuevos en {0}", [fmtDuration(msToNextDay(now))])}</b></p>
      <div className="orders">
        {orders.map((o) => {
          const by = done[o.slot];
          const ok = canAfford(inv, o.need);
          return (
            <div key={o.slot} className={`order ${by ? 'done' : ''} ${o.visitor ? 'visitor' : ''}`}>
              <div className="o-head"><span className="npc">{o.npc.emoji}</span><div><b>{o.npc.name}</b><small>{o.visitor ? t("✨ Visitante") : o.npc.role}</small></div></div>
              <p className="say">“{LINES[o.slot % 3][o.line]}”</p>
              <div className="costs">
                {Object.entries(o.need).map(([k, n]) => <span key={k} className={`chip ${(inv[k] || 0) >= n ? '' : 'lack'}`}>{ITEMS[k].emoji} {inv[k] || 0}/{n}</span>)}
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
