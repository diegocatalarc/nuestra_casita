// «Libro I — El Valle Atrasado»: 7 capítulos, cada uno una Carta con 3 pasos y su recompensa (ver docs/historia.md).
// Las condiciones son declarativas: las evalúa el motor (story/conditions.js); aquí solo se describen.
//   stat {metric,n} · deliver {item,n} · talk {npc} · friend {npc,level} · project {id} · letter {n}
//   together {what:'plaza'|'bench'|'chat'|'clock'} · dusk · flag {id}
// Recompensa: { coins, hearts, items:{item:n}, unlock:'cosmético o flag', piece:1 } + opcionales `flag` (desbloqueo extra) y `title` (título honorífico).
// Ids de proyecto que se mencionan: fountain, bakery, store, school_garden, cafe, clock (los define el chat de Proyectos).
import { t } from '../../i18n';

export const CONDITION_TYPES = ['stat', 'deliver', 'talk', 'friend', 'project', 'letter', 'together', 'dusk', 'flag'];
export const STAT_METRICS = ['harvest', 'sell', 'order', 'fish', 'gather', 'feed', 'hug', 'memory', 'quest', 'build', 'date'];

export const CHAPTERS = [
  {
    id: 'c1', title: t("La primavera que no llegó"), from: 'remedios', project: 'fountain',
    letter: t("Queridos forasteros: la primavera lleva once años en trámite. Presentaos en el Ayuntamiento, plantad, cosechad y entregad un pedido; el Negociado de Estaciones exige papeleo hasta para florecer. Y no toquéis el reloj. Todavía. —Remedios"),
    steps: [
      { id: 'a', text: t("Presentaos a Doña Remedios en el Ayuntamiento (y no toquéis el reloj)."), cond: { type: 'talk', npc: 'remedios' } },
      { id: 'b', text: t("Plantad y cosechad 3 cultivos: la primavera necesita pruebas de que vais en serio."), cond: { type: 'stat', metric: 'harvest', n: 3 } },
      { id: 'c', text: t("Entregad vuestro primer pedido del Tablón para que el Negociado lo registre."), cond: { type: 'stat', metric: 'order', n: 1 } },
    ],
    reward: { coins: 100, hearts: 10, items: { wood: 10 }, unlock: 'village:lamps' },
  },
  {
    id: 'c2', title: t("Expediente de verano"), from: 'rosa', project: 'bakery',
    letter: t("Hola. Soy Rosa. Mi horno solo hornea lo que ya se ha comido. Traedme zanahorias y un plato casero para estrenar el calor: así habrá pan de hoy. —Rosa"),
    steps: [
      { id: 'a', text: t("Conoced a Rosa en la panadería: hornea solo lo que ya se comió."), cond: { type: 'talk', npc: 'rosa' } },
      { id: 'b', text: t("Llevad 4 zanahorias a Rosa para su masa dulce."), cond: { type: 'deliver', item: 'carrot', n: 4 } },
      { id: 'c', text: t("Cocinad una tortilla y entregádsela a Rosa para estrenar el horno."), cond: { type: 'deliver', item: 'omelette', n: 1 } },
    ],
    reward: { coins: 150, hearts: 12, items: { pie: 1 }, unlock: 'shop:bakery', piece: 1 },
  },
  {
    id: 'c3', title: t("Otoño, pendiente de firma"), from: 'tomas', project: 'store',
    letter: t("Buenas. Tomás. Guardo 214 cartas en un cajón y ninguna es para quien creéis. Escribíos tres cartas, vendedme algo y coincidid en la plaza. —Tomás"),
    steps: [
      { id: 'a', text: t("Enviaos 3 cartas entre vosotros."), cond: { type: 'letter', n: 3 } },
      { id: 'b', text: t("Vended 6 cosechas para animar la caja de Tomás."), cond: { type: 'stat', metric: 'sell', n: 6 } },
      { id: 'c', text: t("Coincidid los dos en la plaza para repartir las cartas."), cond: { type: 'together', what: 'plaza' } },
    ],
    reward: { coins: 180, hearts: 15, items: { crystal: 1 }, unlock: 'shop:store', piece: 1 },
  },
  {
    id: 'c4', title: t("El invierno inquilino"), from: 'celia', project: 'school_garden',
    letter: t("Queridos vecinos: soy Celia. Mis alumnos quieren un huerto de cosas que crecen rápido, con nieve y todo. Enseñadles a cosechar y traed lechugas y zanahorias. —Celia"),
    steps: [
      { id: 'a', text: t("Cosechad 5 cultivos para enseñar a los niños cómo se hace."), cond: { type: 'stat', metric: 'harvest', n: 5 } },
      { id: 'b', text: t("Llevad 3 lechugas al huerto de la escuela."), cond: { type: 'deliver', item: 'lettuce', n: 3 } },
      { id: 'c', text: t("Llevad 3 zanahorias al huerto de la escuela."), cond: { type: 'deliver', item: 'carrot', n: 3 } },
    ],
    reward: { coins: 200, hearts: 15, items: { sunflower: 2 }, unlock: 'school:swings', piece: 1 },
  },
  {
    id: 'c5', title: t("El color de todos los tiempos"), from: 'luna', project: 'cafe',
    letter: t("Hola, parejita. Me falta un color: el de todos los tiempos juntos. Necesito recuerdos vuestros y un poco de río. Id a pescar con Pablo. —Luna"),
    steps: [
      { id: 'a', text: t("Guardad 2 recuerdos en el álbum para que Luna los pinte."), cond: { type: 'stat', metric: 'memory', n: 2 } },
      { id: 'b', text: t("Pescad 4 peces en el río (Pablo sabe dónde pican)."), cond: { type: 'stat', metric: 'fish', n: 4 } },
      { id: 'c', text: t("Entregad 2 pedidos del Tablón para dejar caja en el café."), cond: { type: 'stat', metric: 'order', n: 2 } },
    ],
    reward: { coins: 250, hearts: 20, items: { crystal: 2 }, unlock: 'cafe:art', piece: 1 },
  },
  {
    id: 'c6', title: t("La hora de las 6:10"), from: 'inigo', project: 'clock',
    letter: t("Estimados forasteros: yo rompí el reloj. Perdí el muelle. Necesito latón, aceite fino y que averigüen qué fue de él. Vengan los dos a la torre. —Íñigo"),
    steps: [
      { id: 'a', text: t("Entregad 3 pedidos del Tablón: Íñigo necesita latón y aceite fino."), cond: { type: 'stat', metric: 'order', n: 3 } },
      { id: 'b', text: t("Ganaos la confianza de Tomás (amistad nivel 3) y preguntadle qué guarda en su cajón."), cond: { type: 'friend', npc: 'tomas', level: 3 } },
      { id: 'c', text: t("Estad los dos a la vez en la torre del reloj para colocar el muelle."), cond: { type: 'together', what: 'clock' } },
    ],
    reward: { coins: 300, hearts: 25, items: { crystal: 3 }, unlock: 'clock:spring', piece: 1 },
  },
  {
    id: 'c7', title: t("La estación que falta"), from: 'remedios', project: 'clock',
    letter: t("Queridos míos: esta tarde quiero veros a los dos en la plaza, a la vez. Os debo una confesión y el Funcionario os debe un expediente. Traigan paraguas. —Remedios"),
    steps: [
      { id: 'a', text: t("Terminad la reparación de la torre del reloj con las cinco piezas."), cond: { type: 'project', id: 'clock' } },
      { id: 'b', text: t("Entregad 3 pedidos del Tablón para preparar la fiesta."), cond: { type: 'stat', metric: 'order', n: 3 } },
      { id: 'c', text: t("Al atardecer, estad los dos en la plaza para dar cuerda al reloj."), cond: { type: 'dusk' } },
    ],
    reward: { coins: 500, hearts: 40, items: { crystal: 5, rose: 3 }, unlock: 'decor:valleylanterns', flag: 'event:market', title: t("Guardianes de la Estación que Falta") },
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
/** Capítulo por número (1-based, como `couple.story.chapter`). */
export const chapterAt = (n) => CHAPTERS[n - 1] || null;
