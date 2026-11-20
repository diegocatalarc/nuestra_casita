// Proyectos compartidos del pueblo (ver docs/historia.md). Datos + funciones puras (sin React ni red).
// Estado en Firestore: couple.projects.<id> = { have: { item: n }, done: bool, doneAt: ms }.
// Si falta (partidas anteriores), el proyecto está «descuidado» y se puede reparar normalmente.
import { t } from '../../i18n';

/**
 * id · label · emoji · npc (vecino que lo pide) · site (id del edificio de TOWN_BUILDINGS/TOWN_LANDMARKS donde se ve)
 * cost: { item: n } con ítems que ya existen (recursos, cultivos, pescado, platos, materiales de crafteo)
 * unlocks: flags que se concederán en couple.story.flags
 * needs: requisitos para poder aportar { pieces: n } (piezas del reloj) · { project: id } (otro proyecto terminado)
 * blurb: texto corto del panel · gives: qué cambia al terminar
 */
export const PROJECTS = {
  fountain: { id: 'fountain', label: t("Fuente de la plaza"), emoji: '⛲', npc: 'remedios', site: 'square',
    cost: { stone: 10, clay: 6, flower: 5 }, unlocks: ['town:fountain'],
    blurb: t("La fuente lleva años seca. Con piedra, arcilla y unas flores volverá a cantar."), gives: t("La fuente vuelve a manar agua en la plaza.") },
  bakery: { id: 'bakery', label: t("Panadería de Rosa"), emoji: '🥖', npc: 'rosa', site: 'bakery',
    cost: { plank: 8, brick: 6, tomato: 6, egg: 6 }, unlocks: ['shop:bakery'],
    blurb: t("El horno está frío y las persianas bajadas. Rosa solo necesita arreglarlo todo y huevos para empezar."), gives: t("La panadería abre: vende pan y da un extra de energía.") },
  store: { id: 'store', label: t("Tienda de Tomás"), emoji: '🏪', npc: 'tomas', site: 'store',
    cost: { plank: 10, cloth: 6, lettuce: 8, thread: 4 }, unlocks: ['shop:store'],
    blurb: t("Tomás siempre está «a punto de cerrar». Ayudadle a levantar la persiana de verdad."), gives: t("La tienda reabre con las semillas del día.") },
  school_garden: { id: 'school_garden', label: t("Huerto de la escuela"), emoji: '🍎', npc: 'celia', site: 'school',
    cost: { wood: 8, rope: 3, strawberry: 6, sunflower: 3 }, unlocks: ['town:school_garden'],
    blurb: t("A los tres alumnos de Celia les encantaría plantar cosas que crezcan rápido y tener unos columpios."), gives: t("El huerto de la escuela se llena de plantas y los columpios vuelven a funcionar.") },
  cafe: { id: 'cafe', label: t("Café del Puente"), emoji: '🍵', npc: 'luna', site: 'cafe',
    cost: { plank: 8, paint: 3, milk: 4, trout: 3 }, unlocks: ['town:cafe'],
    blurb: t("Luna sueña con un café con rincón de arte. Faltan mesas, pintura y algo rico que servir."), gives: t("El café abre con luz cálida, sombrillas y un rincón de arte.") },
  clock: { id: 'clock', label: t("Torre del reloj"), emoji: '🕰️', npc: 'inigo', site: 'clock',
    cost: { ingot: 3, glass: 2, thread: 4, crystal: 2 }, unlocks: ['town:clock'], needs: { pieces: 5 },
    blurb: t("Con las cinco piezas del reloj reunidas, Íñigo puede volver a darle cuerda."), gives: t("El reloj vuelve a andar: las manecillas se mueven.") },
  festival: { id: 'festival', label: t("Festival de las Luces"), emoji: '🏮', npc: 'remedios', site: 'square',
    cost: { fabric: 4, paint: 4, flower: 10, pie: 2, crystal: 3 }, unlocks: ['event:festival'], needs: { project: 'clock' },
    blurb: t("Farolillos, telas y tartas para la gran noche en que el reloj vuelva a marcar la Hora de las Cartas."), gives: t("La plaza se llena de farolillos para el festival.") },
};
export const PROJECT_IDS = Object.keys(PROJECTS);
/** Proyectos que se ven en cada edificio/lugar del pueblo */
export const PROJECT_BY_SITE = Object.fromEntries(PROJECT_IDS.filter((id) => id !== 'festival').map((id) => [PROJECTS[id].site, id]));

const num = (v) => (Number.isFinite(v) && v > 0 ? v : 0);

/** Lo aportado hasta ahora (nunca negativo ni NaN; tolera estado ausente) */
export const projectHave = (state, id) => state?.projects?.[id]?.have || {};

/** ¿Se cumplen los requisitos para poder aportar? */
export function projectReady(state, id) {
  const p = PROJECTS[id];
  if (!p) return { ok: false, reason: 'unknown' };
  const n = p.needs;
  if (n?.pieces && num(state?.story?.pieces) < n.pieces) return { ok: false, reason: 'pieces', have: num(state?.story?.pieces), need: n.pieces };
  if (n?.project && !projectDone(state, n.project)) return { ok: false, reason: 'project', need: n.project };
  return { ok: true };
}

/**
 * Progreso puro de un proyecto.
 * → { total, have, pct (0-1), items:[{item, need, have, left}], complete, done, ready }
 * `complete` = todos los costes cubiertos (aunque aún no se haya escrito `done`); `done` = complete o marcado hecho.
 */
export function projectProgress(state, id) {
  const p = PROJECTS[id];
  if (!p) return null;
  const have = projectHave(state, id);
  const items = Object.entries(p.cost).map(([item, need]) => {
    const h = Math.min(need, num(have[item]));
    return { item, need, have: h, left: need - h };
  });
  const total = items.reduce((a, i) => a + i.need, 0);
  const got = items.reduce((a, i) => a + i.have, 0);
  const complete = items.every((i) => i.left === 0);
  const done = !!state?.projects?.[id]?.done || complete;
  return { id, total, have: got, pct: done ? 1 : got / total, items, complete, done, ready: projectReady(state, id).ok };
}

/** ¿Está terminado? (sirve para el mundo y para las condiciones `{type:'project', id}`) */
export const projectDone = (state, id) => !!state?.projects?.[id]?.done || !!projectProgress(state, id)?.complete;

/** Cuánto puede aportar esta persona de `item`: min(pedido, mochila, lo que falta) */
export function contributable(state, id, item, n, inventory) {
  const pr = projectProgress(state, id);
  const row = pr?.items.find((i) => i.item === item);
  if (!row || pr.done) return 0;
  return Math.max(0, Math.floor(Math.min(num(n), num(inventory?.[item]), row.left)));
}
