// Acciones de los proyectos del pueblo: aportar materiales y marcar terminado.
import { commit, st, toast, spend } from './core';
import { serverNow } from '../time';
import { PROJECTS, projectProgress, projectReady, contributable } from '../story/projects';
import { ITEMS } from '../constants';
import { t } from '../../i18n';

const inflight = new Set(); // evita dobles clics mientras se guarda (clave proyecto:item)

/** Ops que marcan el proyecto como terminado y conceden sus flags (todas idempotentes: sobrescriben con el mismo valor) */
function finishOps(id) {
  const p = PROJECTS[id];
  return [
    { op: 'patch', data: { [`projects.${id}.done`]: true, [`projects.${id}.doneAt`]: serverNow(), ...Object.fromEntries(p.unlocks.map((f) => [`story.flags.${f}`, true])) } },
  ];
}

/**
 * Aporta `n` unidades de `item` al proyecto. Descuenta de la mochila y suma a `have` con `inc`
 * (no sobrescribe objetos, así dos personas pueden aportar a la vez). Recorta a lo que falta y a lo que hay.
 */
export async function contribute(projectId, item, n = 1) {
  const s = st();
  const c = s.couple;
  const p = PROJECTS[projectId];
  if (!c || !p || !s.user) return false;
  if (!(item in p.cost)) return false;
  const ready = projectReady(c, projectId);
  if (!ready.ok) { toast(ready.reason === 'pieces' ? t("Faltan piezas del reloj ({0}/{1})", [ready.have, ready.need]) : t("Aún no se puede: terminad antes el proyecto anterior")); return false; }
  const key = `${s.user.uid}:${projectId}:${item}`;
  if (inflight.has(key)) return false;
  const amount = contributable(c, projectId, item, n, c.inventory);
  if (amount <= 0) { if ((c.inventory?.[item] || 0) <= 0) toast(t("No tenéis {0} en la mochila", [ITEMS[item]?.label || item])); return false; }
  inflight.add(key);
  try {
    const ops = [...spend({ [item]: amount }), { op: 'inc', field: `projects.${projectId}.have.${item}`, by: amount }];
    // ¿esta aportación completa el proyecto? (vista local; si la otra persona completa a la vez, `syncProjects` lo remata)
    const after = { ...c, projects: { ...c.projects, [projectId]: { ...c.projects?.[projectId], have: { ...c.projects?.[projectId]?.have, [item]: (c.projects?.[projectId]?.have?.[item] || 0) + amount } } } };
    const finishing = projectProgress(after, projectId).complete && !c.projects?.[projectId]?.done;
    if (finishing) ops.push(...finishOps(projectId));
    await commit(ops);
    if (finishing) { toast(t("¡{0} terminado!", [p.label])); st().addFx?.('🎉', 60, 19.5); }
    return true;
  } finally {
    setTimeout(() => inflight.delete(key), 350);
  }
}

/** Marca como terminados los proyectos cuyos costes ya están cubiertos (p. ej. si ambas personas aportaron lo último a la vez). Idempotente. */
export function syncProjects() {
  const s = st();
  const c = s.couple;
  if (!c || !s.user) return;
  const ops = [];
  for (const id of Object.keys(PROJECTS)) {
    const pr = projectProgress(c, id);
    const flagsMissing = pr.done && PROJECTS[id].unlocks.some((f) => !c.story?.flags?.[f]);
    if ((pr.complete && !c.projects?.[id]?.done) || (c.projects?.[id]?.done && flagsMissing)) ops.push(...finishOps(id));
  }
  if (ops.length) commit(ops);
}

