import { useGame, partnerUid } from '../store/gameStore';
import { dailyQuests, weeklyGoals, weekKey, dailyOrders, eventsFor, dayUTC } from '../game/logic';
import { dateKey } from '../game/time';
import { questsStatus, currentGoal, ordersStatus, todayEvent, craftSuggestion, recipeName } from '../game/today';
import { ITEMS } from '../game/constants';
import Modal from './Modal';
import { t } from '../i18n';
import './today.css';

const open = (panel) => useGame.getState().set({ panel });

function Card({ icon, title, doText, state, to, label, cls = '', go }) {
  return (
    <div className={`t-card ${cls}`}>
      <div className="t-top"><b>{icon} {title}</b></div>
      <p className="t-do">{doText}</p>
      {state && <p className="t-state">{state}</p>}
      {(to || go) && <button className="btn primary t-go" onClick={go || (() => open(to))}>{label}</button>}
    </div>
  );
}

/** "¿Qué hago hoy?": un único sitio con misiones, meta semanal, pedidos y evento del día. */
export default function TodayPanel() {
  const couple = useGame((s) => s.couple);
  const uid = useGame((s) => s.user.uid);
  const other = useGame((s) => partnerUid(s));
  const questLog = useGame((s) => s.questLog);
  const now = useGame((s) => s.now);
  const env = useGame((s) => s.env);
  const decor = useGame((s) => s.decor);
  const players = couple.players || {};
  const partner = (other && players[other]?.name) || t("Tu pareja");
  const day = dayUTC(now);

  // 1) Misiones de pareja
  const q = questsStatus(dailyQuests(dateKey(now)), questLog, dateKey(now), uid, other);
  const quests = (
    <Card icon="💌" title={t("Misiones de pareja")} to="quests"
      cls={q.done ? 'ok' : ''}
      label={q.done ? t("Ver respuestas") : t("Responder")}
      doText={q.done ? t("¡Hoy ya habéis respondido!") : t("Responde las preguntas de hoy y compártelas con tu pareja.")}
      state={`${t("Tú: {0}/{1}", [q.mine, q.total])} · ${t("{0}: {1}/{2}", [partner, q.theirs, q.total])}`} />
  );

  // 2) Meta semanal
  const g = currentGoal(weeklyGoals(now), couple.goalsClaimed?.[weekKey(now)], couple.stats?.[weekKey(now)]);
  const goal = g && (
    <Card icon="🎯" title={t("Meta de la semana")} to="quests"
      cls={g.ready ? 'hot' : g.left === 0 ? 'ok' : ''}
      label={g.ready ? t("Reclamar premio") : t("Ver metas")}
      doText={g.left === 0 ? t("¡Todas las metas de la semana reclamadas!") : g.goal.text}
      state={g.left === 0 ? null : `${g.progress}/${g.goal.target} · +${g.goal.reward} 💗${g.ready ? ' · ' + t("¡Lista para reclamar!") : ''}`} />
  );

  // 3) Pedidos
  const o = ordersStatus(dailyOrders(couple.seed, day, env.season), couple.orders?.[day]);
  const orders = (
    <Card icon="📋" title={t("Pedidos del tablón")} to="orders"
      cls={o.all ? 'ok' : ''}
      label={o.all ? t("Ver tablón") : t("Ir al tablón")}
      doText={o.all ? t("¡Todos los pedidos de hoy entregados!") : t("Entrega cosecha, pescado o platos a los vecinos para ganar 🪙.")}
      state={t("{0}/{1} entregados", [o.done, o.total])} />
  );

  // 3b) Taller: una receta fabricable con la mochila, o la más cercana (y lo que falta)
  const sug = craftSuggestion(couple, decor);
  const goCraft = () => useGame.getState().set({ panel: 'craft', craftTab: 'bench' });
  const craft = (() => {
    if (sug.kind === 'ready') {
      const r = recipeName(sug.id);
      return { icon: '🛠️', title: t("Taller"), cls: 'hot', doText: t("Hoy podéis fabricar: {0}. ¡Ya tenéis los materiales!", [`${r.emoji} ${r.label}`]), state: null, label: t("Ir al Taller") };
    }
    if (sug.kind === 'close') {
      const r = recipeName(sug.id);
      const lack = sug.lack.map((x) => `${x.short} ${ITEMS[x.key]?.emoji || ''} ${ITEMS[x.key]?.label || x.key}`).join(' · ');
      return { icon: '🛠️', title: t("Taller"), cls: '', doText: t("Lo más cercano: {0}.", [`${r.emoji} ${r.label}`]), state: t("Te faltan: {0}", [lack]), label: t("Ir al Taller") };
    }
    return { icon: '🛠️', title: t("Taller"), cls: '', doText: t("Nada que fabricar hoy"), state: t("Consigue materiales (cultivos, pesca, recolección) y vuelve a mirar."), label: t("Ir al Taller") };
  })();
  const workshop = <Card icon={craft.icon} title={craft.title} go={goCraft} label={craft.label} doText={craft.doText} state={craft.state} cls={craft.cls} />;

  // 4) Evento de hoy
  const e = todayEvent(eventsFor(couple.seed, now, env.season), env.hour, couple.events?.[day]?.wish?.[uid]);
  let ev = null;
  if (e?.kind === 'festival') ev = { icon: e.emoji, title: e.name, doText: t("¡Hoy hay festival en la plaza! Jugad y reclamad premios."), state: null, label: t("Ir al festival"), cls: 'hot' };
  else if (e?.kind === 'meteor') ev = { icon: '🌠', title: t("Lluvia de estrellas"), doText: e.night ? (e.wished ? t("Ya pediste tu deseo esta noche ✨") : t("¡Es la hora! Pide un deseo.")) : t("Esta noche (a partir de las 21:00) caerán estrellas fugaces."), state: null, label: t("Ver eventos"), cls: e.night && !e.wished ? 'hot' : '' };
  else if (e?.kind === 'visitor') ev = { icon: e.emoji, title: e.name, doText: e.open ? t("Hay un visitante en la plaza: tiene un pedido especial.") : t("Un visitante llega a la plaza entre las 7:00 y las 21:00."), state: null, label: t("Ver eventos"), cls: '' };

  return (
    <Modal title={t("☀️ Hoy")} wide>
      <div className="today">
        <p className="sub">{t("Lo que podéis hacer hoy, en un solo sitio.")}</p>
        {quests}
        {goal}
        {orders}
        {workshop}
        {ev ? <Card icon={ev.icon} title={ev.title} to="events" label={ev.label} doText={ev.doText} state={ev.state} cls={ev.cls} />
          : <div className="t-card"><div className="t-top"><b>🎪 {t("Evento de hoy")}</b></div><p className="t-none">{t("Nada hoy")}</p></div>}
      </div>
    </Modal>
  );
}
