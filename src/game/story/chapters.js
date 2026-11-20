// «Libro I — Despertar el valle»: 7 capítulos, cada uno una Carta con 3 pasos y su recompensa (ver docs/historia.md).
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
    id: 'c1', title: t("Carta de bienvenida"), from: 'remedios', project: 'fountain',
    letter: t("Queridos recién llegados: soy Remedios, alcaldesa de este valle (y también jardinera, cartera y encargada de las goteras, porque aquí todo el mundo hace de todo). No sé cuántos kilómetros hay entre vuestras dos casas, pero el valle sí lo sabe, y por eso os esperaba. Os pido poco para empezar: venid a saludarme, plantad algo, cosechadlo y llevad vuestro primer pedido a alguien del Tablón. Con eso la fuente de la plaza volverá a cantar, y ya veréis que cuando el agua suena, el pueblo entero se asoma a la ventana."),
    steps: [
      { id: 'a', text: t("Saludad a Doña Remedios en el Ayuntamiento."), cond: { type: 'talk', npc: 'remedios' } },
      { id: 'b', text: t("Plantad y cosechad 3 cultivos (lechugas, zanahorias… lo que tengáis a mano)."), cond: { type: 'stat', metric: 'harvest', n: 3 } },
      { id: 'c', text: t("Entregad vuestro primer pedido del Tablón."), cond: { type: 'stat', metric: 'order', n: 1 } },
    ],
    reward: { coins: 100, hearts: 10, items: { wood: 10 }, unlock: 'village:lamps' },
  },
  {
    id: 'c2', title: t("El horno apagado"), from: 'rosa', project: 'bakery',
    letter: t("Hola, vecinos. Soy Rosa, la panadera. Heredé de mi abuela un horno precioso, una panadería que huele a ‘casi’ y ninguna receta. Lleva meses apagado, y no por falta de leña, sino de ganas. Me han dicho que vosotros sabéis hacer crecer cosas: si me traéis unas zanahorias para probar una masa dulce y un plato casero para estrenar el calor del horno, prometo que habrá pan para los dos. Y para vuestras dos casas, que he oído que están lejos."),
    steps: [
      { id: 'a', text: t("Conoced la panadería: hablad con Rosa."), cond: { type: 'talk', npc: 'rosa' } },
      { id: 'b', text: t("Llevad 4 zanahorias a Rosa para su masa."), cond: { type: 'deliver', item: 'carrot', n: 4 } },
      { id: 'c', text: t("Cocinad una tortilla en vuestra cocina y entregádsela a Rosa para estrenar el horno."), cond: { type: 'deliver', item: 'omelette', n: 1 } },
    ],
    reward: { coins: 150, hearts: 12, items: { pie: 1 }, unlock: 'shop:bakery', piece: 1 },
  },
  {
    id: 'c3', title: t("Cartas sin entregar"), from: 'tomas', project: 'store',
    letter: t("Buenas. Tomás, el de la tienda. Estoy a punto de cerrar, pero llevo diez años a punto de cerrar y aquí sigo. Os escribo porque guardo en un cajón unas cartas que nunca llegué a entregar (larga historia, mejor con algo caliente). Empecemos por lo fácil: escribíos tres cartas entre vosotros, que se note que van en serio, y luego venid los dos a la plaza a la vez para ayudarme a repartirlas. Ah, y vendedme algo, por favor: la caja está más triste que yo."),
    steps: [
      { id: 'a', text: t("Enviaos 3 cartas entre vosotros."), cond: { type: 'letter', n: 3 } },
      { id: 'b', text: t("Vended 6 cosechas para animar la caja de Tomás."), cond: { type: 'stat', metric: 'sell', n: 6 } },
      { id: 'c', text: t("Coincidid los dos en la plaza para repartir las cartas."), cond: { type: 'together', what: 'plaza' } },
    ],
    reward: { coins: 180, hearts: 15, items: { crystal: 1 }, unlock: 'shop:store', piece: 1 },
  },
  {
    id: 'c4', title: t("Tres alumnos y un huerto"), from: 'celia', project: 'school_garden',
    letter: t("Queridos vecinos: soy Celia, maestra de la escuela más pequeña del valle. Tres alumnos, una pizarra y mucha ilusión. Lola, Biel y Nuri quieren un huerto de ‘cosas que crecen rápido’, porque tienen la paciencia de un gato en una ventana. ¿Podéis enseñarles cómo se cosecha de verdad y traerles lechugas y zanahorias para sembrar? Ellos prometen cuidarlo; yo prometo que no lo regarán todo con el bote de la cola."),
    steps: [
      { id: 'a', text: t("Cosechad 5 cultivos para enseñar a los niños cómo se hace."), cond: { type: 'stat', metric: 'harvest', n: 5 } },
      { id: 'b', text: t("Llevad 3 lechugas al huerto de la escuela."), cond: { type: 'deliver', item: 'lettuce', n: 3 } },
      { id: 'c', text: t("Llevad 3 zanahorias al huerto de la escuela."), cond: { type: 'deliver', item: 'carrot', n: 3 } },
    ],
    reward: { coins: 200, hearts: 15, items: { sunflower: 2 }, unlock: 'school:swings', piece: 1 },
  },
  {
    id: 'c5', title: t("El color de la espera"), from: 'luna', project: 'cafe',
    letter: t("Hola, parejita. Llevo semanas mirando la misma colina y hoy me he dado cuenta de que me falta un color: el de la espera. Ese que tiene la tarde cuando alguien está lejos y uno mira por la ventana por si acaso. Para mezclarlo necesito recuerdos vuestros (guardad un par en el álbum) y un poco de río, así que id a pescar con Pablo: no habla mucho, pero con una caña en la mano es un poeta. Con eso y unos cuantos pedidos que dejen algo de caja, reabrimos el Café del Puente."),
    steps: [
      { id: 'a', text: t("Guardad 2 recuerdos en el álbum para que Luna los pinte."), cond: { type: 'stat', metric: 'memory', n: 2 } },
      { id: 'b', text: t("Pescad 4 peces en el río (Pablo sabe dónde pican)."), cond: { type: 'stat', metric: 'fish', n: 4 } },
      { id: 'c', text: t("Entregad 2 pedidos del Tablón para dejar caja en el café."), cond: { type: 'stat', metric: 'order', n: 2 } },
    ],
    reward: { coins: 250, hearts: 20, items: { crystal: 2 }, unlock: 'cafe:art', piece: 1 },
  },
  {
    id: 'c6', title: t("El corazón del reloj"), from: 'inigo', project: 'clock',
    letter: t("Estimados vecinos: les escribo desde la torre, con las manos limpias de grasa por primera vez en años, porque no me atrevo a tocar nada. Yo rompí el reloj. O eso llevo creyendo desde aquel invierno: perdí el muelle, el corazón de la maquinaria, y ya no sé ni dónde. Las demás piezas las tengo gracias a ustedes. Para seguir necesito latón y aceite fino (los pedidos del Tablón traen de todo) y que averigüen qué fue de ese muelle: pregunten a quien tenga la costumbre de guardar cosas. Cuando aparezca, quiero que lo coloquemos los tres… quiero decir, los dos y yo, a la vez."),
    steps: [
      { id: 'a', text: t("Entregad 3 pedidos del Tablón: Íñigo necesita latón y aceite fino."), cond: { type: 'stat', metric: 'order', n: 3 } },
      { id: 'b', text: t("Ganaos la confianza de Tomás (amistad nivel 3) y preguntadle qué guarda en su cajón."), cond: { type: 'friend', npc: 'tomas', level: 3 } },
      { id: 'c', text: t("Estad los dos a la vez en la torre del reloj para colocar el muelle."), cond: { type: 'together', what: 'clock' } },
    ],
    reward: { coins: 300, hearts: 25, items: { crystal: 3 }, unlock: 'clock:spring', piece: 1 },
  },
  {
    id: 'c7', title: t("La Hora de las Cartas"), from: 'remedios', project: 'clock',
    letter: t("Queridos míos: esta tarde, cuando el cielo se ponga del color de la mermelada, vamos a encender los farolillos. Quiero que estéis los dos en la plaza a la vez, aunque cada uno la vea desde su pantalla y su ventana. Primero hay que terminar la torre con las cinco piezas; luego, preparar la fiesta con unos cuantos pedidos; y al atardecer, darle cuerda al reloj entre los dos. Os debo una confesión y una carta, y las dos se leerán en voz alta. Gracias por haber llegado hasta aquí."),
    steps: [
      { id: 'a', text: t("Terminad la reparación de la torre del reloj con las cinco piezas."), cond: { type: 'project', id: 'clock' } },
      { id: 'b', text: t("Entregad 3 pedidos del Tablón para preparar la fiesta."), cond: { type: 'stat', metric: 'order', n: 3 } },
      { id: 'c', text: t("Al atardecer, estad los dos en la plaza para dar cuerda al reloj."), cond: { type: 'dusk' } },
    ],
    reward: { coins: 500, hearts: 40, items: { crystal: 5, rose: 3 }, unlock: 'decor:valleylanterns', flag: 'event:market', title: t("Guardianes de la Hora de las Cartas") },
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
/** Capítulo por número (1-based, como `couple.story.chapter`). */
export const chapterAt = (n) => CHAPTERS[n - 1] || null;
