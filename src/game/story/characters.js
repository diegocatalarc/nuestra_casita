// Reparto de la historia del Valle (ver docs/historia.md). Esqueleto: el chat de contenido lo enriquece; el resto solo lo LEE.
// `stops` = puntos aproximados (en casillas) donde el vecino está según el momento; hay que validarlos contra la colisión (ctx.blocked en game/movement.js).
// Marta, Pablo y Luna ya existen en constants.js (NEIGHBORS, STORIES, NEIGHBOR_LINES): sus casas y rutinas actuales están en scene/Village.jsx (WORK/SOCIAL).
import { t } from '../../i18n';

export const CAST = [
  { id: 'remedios', name: 'Doña Remedios', emoji: '🏛️', role: t("Alcaldesa"), building: 'hall', guide: true,
    stops: { work: { x: 60, z: 17.6 }, social: { x: 60, z: 20.6 }, home: { x: 60, z: 17.6 } }, hours: [8, 22],
    look: { skin: 1, hair: 6, hairColor: 6, topStyle: 2, top: 9, bottom: 5, shoes: 1, eyes: 1, mouth: 0, cheeks: 1, hat: 4 } },
  { id: 'marta', name: 'Marta', emoji: '👵', role: t("Granjera"), existing: true, hours: [7, 21] },
  { id: 'pablo', name: 'Pablo', emoji: '🧔', role: t("Pescador"), existing: true, hours: [6, 20] },
  { id: 'luna', name: 'Luna', emoji: '👩‍🎨', role: t("Pintora"), existing: true, hours: [9, 23] },
  { id: 'rosa', name: 'Rosa', emoji: '🥖', role: t("Panadera"), building: 'bakery',
    stops: { work: { x: 53.5, z: 21.4 }, social: { x: 58, z: 21 }, home: { x: 53.5, z: 21.4 } }, hours: [6, 20],
    look: { skin: 2, hair: 3, hairColor: 2, topStyle: 1, top: 2, bottom: 3, shoes: 2, eyes: 0, mouth: 1, cheeks: 2 } },
  { id: 'inigo', name: 'Íñigo', emoji: '🕰️', role: t("Relojero"), building: 'clock',
    stops: { work: { x: 66, z: 19.2 }, social: { x: 62, z: 21 }, home: { x: 66, z: 19.2 } }, hours: [8, 21],
    look: { skin: 3, hair: 1, hairColor: 0, topStyle: 0, top: 7, bottom: 2, shoes: 4, eyes: 3, mouth: 0, hat: 5 } },
  { id: 'celia', name: 'Celia', emoji: '🍎', role: t("Maestra y hortelana"), building: 'school',
    stops: { work: { x: 70.5, z: 19.6 }, social: { x: 63, z: 21 }, home: { x: 70.5, z: 19.6 } }, hours: [8, 20],
    look: { skin: 1, hair: 7, hairColor: 4, topStyle: 3, top: 10, bottom: 4, shoes: 5, eyes: 2, mouth: 1, cheeks: 1 } },
  { id: 'tomas', name: 'Tomás', emoji: '🛍️', role: t("Tendero y molinero"), building: 'store',
    stops: { work: { x: 54, z: 25.6 }, social: { x: 61, z: 21 }, home: { x: 54, z: 25.6 } }, hours: [9, 21],
    look: { skin: 2, hair: 2, hairColor: 8, topStyle: 2, top: 1, bottom: 6, shoes: 0, eyes: 1, mouth: 0 } },
];
export const castById = Object.fromEntries(CAST.map((c) => [c.id, c]));
