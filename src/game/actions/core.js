import { useGame } from '../../store/gameStore';
import { getBackend } from '../../services/backend';
import { HEART_RULES, VITALS } from '../constants';
import { serverNow, dateKey } from '../time';
import { newId, vitals, weekKey } from '../logic';
import { me, doAnim as rawAnim } from '../runtime';
import { explainError } from '../errors';
import { t } from '../../i18n';

export const st = () => useGame.getState();

export const statOp = (metric, n = 1) => ({ op: 'inc', field: `stats.${weekKey(serverNow())}.${metric}`, by: n });

/** Registro de actividad (alimenta el resumen "mientras no estabas") */
export function logActivity(kind, label = '') {
  const s = st();
  if (!s.user || !s.coupleId) return;
  commit([{ op: 'set', col: 'activity', id: newId('e'), data: { by: s.user.uid, kind, label, at: serverNow() } }]);
}

/** Escribe energía y saciedad actuales (con marca de tiempo) y campos extra del jugador. */
export function vitalsPatch(v, extra = {}) {
  const uid = st().user.uid, now = serverNow();
  const d = { [`players.${uid}.energy`]: v.energy, [`players.${uid}.energyAt`]: now, [`players.${uid}.full`]: v.full, [`players.${uid}.fullAt`]: now };
  for (const [k, val] of Object.entries(extra)) d[`players.${uid}.${k}`] = val;
  return { op: 'patch', data: d };
}
export const myVitals = () => { const s = st(); return vitals(s.couple?.players?.[s.user.uid], serverNow()); };

/** Animación + coste de energía de la acción */
export function doAnim(name, ms) {
  rawAnim(name, ms);
  const cost = VITALS.actionCost[name];
  if (cost && !me.sleeping) {
    const v = myVitals();
    getBackend().write(st().coupleId, [vitalsPatch({ ...v, energy: Math.max(0, v.energy - cost) })]).catch(() => {});
  }
}
export const toast = (t) => st().toast(t);
export const fx = (t, x, z) => st().addFx(t, x, z);

// Colecciones cuyas acciones dependen de "¿sigue listo?": cosechar, recolectar, ordeñar…
// Se reflejan en el store al instante. Si no, entre el clic y el snapshot de la nube (cientos de ms o más)
// el mismo cultivo/recurso/animal seguiría "listo" y se podría cobrar varias veces.
const OPTIMISTIC = ['crops', 'nodes', 'animals'];

function applyLocal(col, id, data) {
  const prev = st()[col]?.[id];
  useGame.setState((s) => ({ [col]: { ...s[col], [id]: { ...(s[col]?.[id] || { id }), ...data } } }));
  return prev;
}
function revertLocal(col, id, prev) {
  useGame.setState((s) => { const next = { ...s[col] }; if (prev) next[id] = prev; else delete next[id]; return { [col]: next }; });
}

export function commit(ops) {
  if (!ops.length) return Promise.resolve();
  const undo = [];
  for (const o of ops) if (o.op === 'set' && OPTIMISTIC.includes(o.col)) undo.push([o.col, o.id, applyLocal(o.col, o.id, o.data)]);
  return getBackend().write(st().coupleId, ops).catch((e) => {
    for (const [col, id, prev] of undo.reverse()) revertLocal(col, id, prev); // no se guardó: se deshace
    console.error(e);
    toast(t("No se pudo guardar: ") + explainError(e));
  });
}

export const spend = (cost, mult = 1) => Object.entries(cost).map(([k, v]) => ({ op: 'inc', field: `inventory.${k}`, by: -v * mult }));
export const gain = (item, n) => ({ op: 'inc', field: `inventory.${item}`, by: n });
export const xpOp = (skill, n) => ({ op: 'inc', field: `skills.${skill}`, by: n });
export const coinOp = (n) => ({ op: 'inc', field: 'coins', by: n });
export const heartOps = (n) => (n ? [{ op: 'inc', field: 'hearts', by: n }, { op: 'inc', field: 'heartsTotal', by: n }] : []);

/** Corazones con límite diario por persona y tipo de acción. */
export function earn(kind, amount) {
  const s = st();
  const uid = s.user.uid, date = dateKey();
  const day = s.couple?.daily?.[uid];
  const cur = day?.date === date ? day[kind] || 0 : 0;
  const rule = HEART_RULES[kind];
  const n = amount ?? rule.each;
  if (!n || cur + n > rule.cap) return { ops: [], n: 0 };
  const ops = heartOps(n);
  ops.push({ op: 'patch', data: day?.date === date ? { [`daily.${uid}.${kind}`]: cur + n } : { [`daily.${uid}`]: { date, [kind]: cur + n } } });
  return { ops, n };
}

// ---------- Movimiento hacia un objetivo y acción al llegar ----------
