// Condiciones declarativas de los pasos de la historia (contrato en docs/historia.md). Funciones PURAS, sin red ni React.
// evalCondition(cond, state, ctx) → { done, progress, target }
//   state = estado del store (usa state.couple); ctx = { base, marked, chapterId, stepId }
//     ctx.base   = couple.story.base (contadores al empezar el capítulo)
//     ctx.marked = el paso ya está marcado como hecho en couple.story.steps (lo escriben las acciones)
import { friendLevel, friendPts } from '../logic';

/** Tipos de condición que se calculan solos a partir del estado (el tick los marca como hechos). */
export const AUTO_TYPES = ['stat', 'letter', 'friend', 'project', 'flag'];
/** Tipos que exigen una acción o presencia (completeStep / detección de presencia). */
export const ACTION_TYPES = ['deliver', 'talk', 'together', 'dusk'];

/** Total acumulado de una métrica: suma de couple.stats.<semana>.<métrica> de todas las semanas. */
export function totalStat(couple, metric) {
  let n = 0;
  for (const w of Object.values(couple?.stats || {})) n += (w && w[metric]) || 0;
  return n;
}

/** Totales de TODAS las métricas conocidas (para guardar la base al empezar un capítulo). */
export function totalsSnapshot(couple) {
  const out = {};
  for (const w of Object.values(couple?.stats || {})) {
    for (const [k, v] of Object.entries(w || {})) if (typeof v === 'number') out[k] = (out[k] || 0) + v;
  }
  return out;
}

const res = (done, progress, target) => ({ done: !!done, progress: Math.max(0, Math.min(progress, target)), target });

export function evalCondition(cond, state, ctx = {}) {
  const couple = state?.couple;
  const marked = !!ctx.marked;
  switch (cond?.type) {
    case 'stat': {
      const target = cond.n || 1;
      const got = totalStat(couple, cond.metric) - (ctx.base?.[cond.metric] || 0);
      return res(marked || got >= target, marked ? target : got, target);
    }
    case 'letter': {
      const target = cond.n || 1;
      const got = totalStat(couple, 'letter') - (ctx.base?.letter || 0);
      return res(marked || got >= target, marked ? target : got, target);
    }
    case 'deliver': {
      const target = cond.n || 1;
      const have = couple?.inventory?.[cond.item] || 0;
      return res(marked, marked ? target : have, target); // done solo cuando se entrega (completeStep)
    }
    case 'talk':
      return res(marked, marked ? 1 : 0, 1);
    case 'friend': {
      const lv = friendLevel(friendPts(couple, cond.npc));
      return res(marked || lv >= cond.level, marked ? cond.level : lv, cond.level);
    }
    case 'project': {
      const ok = !!couple?.projects?.[cond.id]?.done;
      return res(marked || ok, marked || ok ? 1 : 0, 1);
    }
    case 'together':
    case 'dusk':
      return res(marked, marked ? 1 : 0, 1);
    case 'flag': {
      const ok = !!couple?.story?.flags?.[cond.id];
      return res(marked || ok, marked || ok ? 1 : 0, 1);
    }
    default:
      return res(marked, marked ? 1 : 0, 1); // condición desconocida: solo se completa a mano
  }
}

// ---------- Presencia (together / dusk) ----------
export const PLACES = {
  plaza: { x: 60, z: 19.5, r: 9 },   // Plaza Mayor (exploreData: 'square')
  clock: { x: 65, z: 16, r: 6 },     // Torre del reloj
  benchA: { x: 41.2, z: 19.6, r: 3 },
  benchB: { x: 45.8, z: 18.6, r: 3 },
};
const near = (p, place) => !!p && Math.hypot(p.x - place.x, p.z - place.z) <= place.r;
export const isDusk = (hour) => hour >= 18 && hour < 21;

/**
 * ¿Se cumple ahora una condición de presencia? Puro: recibe lo observado.
 * obs = { meOnline, partner: { online, x, z }, me: { x, z }, hour, chatOpen }
 */
export function presenceMet(cond, obs) {
  if (!obs || !obs.partner?.online) return false;
  if (cond.type === 'dusk') return isDusk(obs.hour);
  if (cond.type !== 'together') return false;
  switch (cond.what) {
    case 'plaza': return near(obs.me, PLACES.plaza) && near(obs.partner, PLACES.plaza);
    case 'clock': return near(obs.me, PLACES.clock) && near(obs.partner, PLACES.clock);
    case 'bench': return [PLACES.benchA, PLACES.benchB].some((b) => near(obs.me, b) && near(obs.partner, b));
    case 'chat': return !!obs.chatOpen; // las dos personas conectadas con el chat abierto
    default: return false;
  }
}
