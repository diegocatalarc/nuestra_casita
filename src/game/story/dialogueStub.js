// PROVISIONAL: diálogo genérico para que los vecinos hablen mientras no exista src/game/story/dialogue.js (chat de contenido).
// NO es contenido final. DialogueModal.jsx usa automáticamente `lineFor` de dialogue.js en cuanto exista y lo exporte.
import { t } from '../../i18n';
import { NEIGHBOR_LINES } from '../constants';
import { hashStr } from '../rng';

const LINES = {
  remedios: [t("«Bienvenidos al Valle. El reloj de la plaza aún duerme, pero ya se oyen pasos por las calles.»"), t("«Si necesitáis algo, mi puerta está abierta. Siempre.»"), t("«Hace años, cada atardecer, el pueblo encendía farolillos. Qué tiempos.»")],
  rosa: [t("«Recién hecho. ¿Notáis el olor? Es lo único que me queda de mi abuela.»"), t("«El pan tiene su momento, como todo. Ni antes ni después.»"), t("«Algún día me saldrá la receta de las dos mitades. Algún día.»")],
  inigo: [t("«Tic, tac… Casi puedo oírlo. Casi.»"), t("«Un reloj no es más que tiempo bien guardado.»"), t("«Perdonad si me distraigo: le estoy dando vueltas a una pieza que falta.»")],
  celia: [t("«Los peques quieren plantar cosas que crezcan rápido. ¡Como si yo supiera cómo!»"), t("«Enseñar es sembrar: nunca sabes qué florecerá ni cuándo.»"), t("«¿Habéis visto el huerto de la escuela? Aún le falta cariño.»")],
  tomas: [t("«Estoy a punto de cerrar. Bueno… siempre estoy a punto de cerrar.»"), t("«De todo un poco: clavos, caramelos y paciencia.»"), t("«Guardo algunas cosas desde hace años. Ya llegará su momento.»")],
};
const RAIN = t("«Menuda lluvia. Entrad un momento, que se os mojan hasta los pensamientos.»");

/** Una frase para `npcId`. ctx: { day, n (nº de frase en esta charla), hour, weather, friendLevel } */
export function lineFor(npcId, ctx = {}) {
  const pool = NEIGHBOR_LINES[npcId] || LINES[npcId] || [t("«Buenas. Qué bonito día para estar en el Valle.»")];
  const all = ctx.weather === 'rain' || ctx.weather === 'storm' ? [...pool, RAIN] : pool;
  return all[(hashStr(npcId + (ctx.day ?? '')) + (ctx.n || 0)) % all.length];
}
