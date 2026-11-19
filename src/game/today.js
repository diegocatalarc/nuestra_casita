// Funciones puras del panel "Hoy" (sin React ni red): resumen de lo que hay por hacer.
import { RECIPES, ITEMS } from './constants';
import { recipeStatus, canAfford, stationPlaced } from './logic';

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

/** Taller de hoy: una receta fabricable con la mochila; si no hay ninguna, la más cercana y lo que falta.
 *  Solo cuentan las recetas de estaciones ya colocadas y desbloqueadas. Devuelve { kind: 'ready'|'close'|'none', id?, lack? }.
 *  lack: [{ key, need, have, short }] ordenado por lo que más falta. */
export function craftSuggestion(couple, decor, recipes = RECIPES) {
  const inv = couple?.inventory || {};
  const usable = Object.entries(recipes).filter(([, r]) => stationPlaced(decor, r.station) && recipeStatus(couple, r).ok);
  const ready = usable.find(([, r]) => canAfford(inv, r.in));
  if (ready) return { kind: 'ready', id: ready[0] };
  let best = null;
  for (const [id, r] of usable) {
    const lack = Object.entries(r.in)
      .map(([key, need]) => ({ key, need, have: inv[key] || 0, short: need - (inv[key] || 0) }))
      .filter((x) => x.short > 0)
      .sort((a, b) => b.short - a.short);
    const missing = lack.reduce((a, x) => a + x.short, 0);
    if (!best || missing < best.missing) best = { id, lack, missing };
  }
  return best ? { kind: 'close', id: best.id, lack: best.lack } : { kind: 'none' };
}

/** Nombre y emoji de una receta (mismo criterio que recipeInfo de game/actions). */
export function recipeName(id, recipes = RECIPES) {
  const r = recipes[id];
  const k = Object.keys(r.out)[0];
  return { label: r.label || ITEMS[k]?.label || id, emoji: r.emoji || ITEMS[k]?.emoji || '🛠️' };
}
