// Funciones puras del panel "Hoy" (sin React ni red): resumen de lo que hay por hacer.

/** Estado de las misiones de pareja de hoy.
 *  log: questLog (clave `${fecha}_${idMisión}` → { answers: { uid: … } }). */
export function questsStatus(quests, log, date, uid, other) {
  const items = quests.map((q) => {
    const a = log?.[`${date}_${q.id}`]?.answers || {};
    return { id: q.id, title: q.title, mine: !!a[uid], theirs: !!(other && a[other]) };
  });
  return {
    items,
    total: items.length,
    mine: items.filter((i) => i.mine).length,
    theirs: items.filter((i) => i.theirs).length,
    pending: items.filter((i) => !i.mine).length,
    done: items.length > 0 && items.every((i) => i.mine),
  };
}

/** Meta semanal en curso: la primera sin reclamar (o la primera si están todas). */
export function currentGoal(goals, claimed, stats) {
  if (!goals?.length) return null;
  const g = goals.find((x) => !claimed?.[x.id]) || goals[0];
  const progress = Math.min(stats?.[g.metric] || 0, g.target);
  return {
    goal: g,
    progress,
    ready: progress >= g.target && !claimed?.[g.id],
    claimed: !!claimed?.[g.id],
    left: goals.filter((x) => !claimed?.[x.id]).length,
  };
}

/** Pedidos de hoy: entregados / total. done: { slot: uid }. */
export function ordersStatus(orders, done) {
  const total = orders?.length || 0;
  const n = (orders || []).filter((o) => done?.[o.slot]).length;
  return { done: n, total, all: total > 0 && n === total };
}

/** Qué ocurre hoy en el mundo: festival, estrellas (de noche) o visitante; null si nada. */
export function todayEvent(ev, hour, wished) {
  if (ev.festival) return { kind: 'festival', emoji: ev.festival.emoji, name: ev.festival.name };
  if (ev.meteor) return { kind: 'meteor', night: hour >= 21 || hour < 5, wished: !!wished };
  if (ev.visitor) return { kind: 'visitor', emoji: ev.visitor.emoji, name: ev.visitor.name, open: hour >= 7 && hour < 21 };
  return null;
}
