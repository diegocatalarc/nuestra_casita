// Reparto de la historia del Valle (ver docs/historia.md). Esqueleto: el chat de contenido lo enriquece; el resto solo lo LEE.
// `stops` = puntos aproximados (en casillas) donde el vecino está según el momento; hay que validarlos contra la colisión (ctx.blocked en game/movement.js).
// Campos descriptivos (bio, likesText, quirk, likes): los añade el chat de contenido; ids, edificios y stops NO se tocan.
// Marta, Pablo y Luna ya existen en constants.js (NEIGHBORS, STORIES, NEIGHBOR_LINES): sus casas y rutinas actuales están en scene/Village.jsx (WORK/SOCIAL).
import { t } from '../../i18n';

export const CAST = [
  { id: 'remedios', bio: t("Alcaldesa desde siempre y cartera por vocación. Habla con cariño, mezcla refranes y bromas, y guarda un secreto: durante años escribió una carta cada atardecer a alguien lejano."), likesText: t("Té con galletas, papel de carta y las tardes de otoño."), quirk: t("Repasa el buzón cada mañana ‘por si acaso’."), likes: ['cheese', 'pie', 'flower'], name: 'Doña Remedios', emoji: '🏛️', role: t("Alcaldesa"), building: 'hall', guide: true,
    stops: { work: { x: 60, z: 17.6 }, social: { x: 60, z: 20.6 }, home: { x: 60, z: 17.6 } }, hours: [8, 22],
    look: { skin: 1, hair: 6, hairColor: 6, topStyle: 2, top: 9, bottom: 5, shoes: 1, eyes: 1, mouth: 0, cheeks: 1, hat: 4 } },
  { id: 'marta', bio: t("Granjera veterana. Cocina para dos aunque ahora sea para una, y cuida el huerto como lo cuidaba con Anselmo."), likesText: t("Sopa caliente, tomates recién cogidos y el banco bajo el cerezo."), quirk: t("Siempre te guarda un trozo de lo que cocina."), likes: ['lettuce', 'carrot', 'tomato', 'pumpkin'], name: 'Marta', emoji: '👵', role: t("Granjera"), existing: true, hours: [7, 21] },
  { id: 'pablo', bio: t("Pescador de pocas palabras. Persigue a un koi dorado desde hace diez años y teme alejarse del río."), likesText: t("El amanecer, el silencio y el olor a pan de Rosa."), quirk: t("Habla con los peces y, a veces, con el río."), likes: ['trout', 'carp', 'grilled', 'sushi'], name: 'Pablo', emoji: '🧔', role: t("Pescador"), existing: true, hours: [6, 20] },
  { id: 'luna', bio: t("Pintora en busca del color de ‘lo que se echa de menos’. Pinta la misma colina cada mañana y siempre sale distinta."), likesText: t("La luz del atardecer, las flores y los cuadros sin terminar."), quirk: t("Pinta con los ojos cerrados cuando quiere ser sincera."), likes: ['flower', 'sunflower', 'lavender', 'jam'], name: 'Luna', emoji: '👩‍🎨', role: t("Pintora"), existing: true, hours: [9, 23] },
  { id: 'rosa', bio: t("Panadera por herencia. Tiene el horno de su abuela, pero no su receta: busca el ‘pan de las dos mitades’."), likesText: t("El olor a corteza tostada y repartir migas gratis."), quirk: t("Habla con la masa y le da los buenos días."), likes: ['carrot', 'egg', 'pie', 'jam'], name: 'Rosa', emoji: '🥖', role: t("Panadera"), building: 'bakery',
    stops: { work: { x: 53.5, z: 21.4 }, social: { x: 58, z: 21 }, home: { x: 53.5, z: 21.4 } }, hours: [6, 20],
    look: { skin: 2, hair: 3, hairColor: 2, topStyle: 1, top: 2, bottom: 3, shoes: 2, eyes: 0, mouth: 1, cheeks: 2 } },
  { id: 'inigo', bio: t("Relojero. Cree que rompió el Reloj de la Plaza el invierno en que perdió el ‘muelle del corazón’. Formal y tierno."), likesText: t("El tic-tac, el aceite fino y el silencio de la torre al amanecer."), quirk: t("Dice ‘tic, tac’ sin darse cuenta."), likes: ['crystal', 'clay', 'stone'], name: 'Íñigo', emoji: '🕰️', role: t("Relojero"), building: 'clock',
    stops: { work: { x: 66, z: 19.2 }, social: { x: 62, z: 21 }, home: { x: 66, z: 19.2 } }, hours: [8, 21],
    look: { skin: 3, hair: 1, hairColor: 0, topStyle: 0, top: 7, bottom: 2, shoes: 4, eyes: 3, mouth: 0, hat: 5 } },
  { id: 'celia', bio: t("Maestra de la escuela más pequeña del valle (Lola, Biel y Nuri) y hortelana. Cree que la paciencia también se siembra."), likesText: t("Las tizas, los charcos y las lechugas de ciclo corto."), quirk: t("Deja caer el compás para que los niños lo recojan."), likes: ['lettuce', 'carrot', 'strawberry'], name: 'Celia', emoji: '🍎', role: t("Maestra y hortelana"), building: 'school',
    stops: { work: { x: 70.5, z: 19.6 }, social: { x: 63, z: 21 }, home: { x: 70.5, z: 19.6 } }, hours: [8, 20],
    look: { skin: 1, hair: 7, hairColor: 4, topStyle: 3, top: 10, bottom: 4, shoes: 5, eyes: 2, mouth: 1, cheeks: 1 } },
  { id: 'tomas', bio: t("Tendero y molinero. Lleva diez años ‘a punto de cerrar’ y guarda en un cajón cartas que nunca entregó."), likesText: t("Los estantes ordenados, la harina nueva y las visitas tardías."), quirk: t("Nunca tira nada por si alguien todavía lo espera."), likes: ['mushroom', 'egg', 'milk'], name: 'Tomás', emoji: '🛍️', role: t("Tendero y molinero"), building: 'store',
    stops: { work: { x: 54, z: 25.6 }, social: { x: 61, z: 21 }, home: { x: 54, z: 25.6 } }, hours: [9, 21],
    look: { skin: 2, hair: 2, hairColor: 8, topStyle: 2, top: 1, bottom: 6, shoes: 0, eyes: 1, mouth: 0 } },
];
export const castById = Object.fromEntries(CAST.map((c) => [c.id, c]));
