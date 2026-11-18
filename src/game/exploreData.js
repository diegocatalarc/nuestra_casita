// Datos de exploración: niebla, pueblo grande y rincones secretos. Se reexporta desde constants.js.
import { t } from '../i18n';

// =====================================================================
//  EXPLORACIÓN DEL MAPA: niebla, descubrimientos y pueblo grande
// =====================================================================
/** El mapa empieza cubierto de niebla; se descubre andando. chunk = lado (casillas) de cada celda de niebla. */
export const EXPLORE = { chunk: 4, radius: 7.5, base: { x: 20, z: 23, r: 15 }, discoverDist: 3.6 };
/** Zona del pueblo grande (en la Pradera del Este): se despeja de árboles y se pavimenta la Calle Mayor. */
export const TOWN = [51, 7, 79, 33];
export const TOWN_STREET = { z0: 23, z1: 25, x1: 79 };

/** Edificios del pueblo (decorativos; bloquean el paso). x,z = esquina; w,d = huella; style = modelo */
export const TOWN_BUILDINGS = [
  { id: 'bakery', emoji: '🥖', name: t("Panadería"), x: 52, z: 17, w: 3, d: 3, style: 'bakery', reward: { coins: 40, hearts: 3 }, hint: t("Huele a pan recién hecho desde la calle.") },
  { id: 'hall', emoji: '🏛️', name: t("Ayuntamiento"), x: 57, z: 12, w: 6, d: 4, style: 'hall', reward: { coins: 60, hearts: 4 }, hint: t("Un edificio señorial con columnas y bandera.") },
  { id: 'clock', emoji: '🕰️', name: t("Torre del reloj"), x: 65, z: 16, w: 2, d: 2, style: 'clock', reward: { coins: 50, hearts: 4 }, hint: t("Marca la hora de todo el pueblo.") },
  { id: 'school', emoji: '🏫', name: t("Escuela"), x: 68, z: 16, w: 5, d: 3, style: 'school', reward: { coins: 45, hearts: 3 }, hint: t("Se oyen risas de peques en el patio.") },
  { id: 'chapel', emoji: '⛪', name: t("Capilla"), x: 70, z: 8, w: 3, d: 4, style: 'chapel', reward: { coins: 50, hearts: 4 }, hint: t("Una capilla pequeña con un campanario blanco.") },
  { id: 'store', emoji: '🏪', name: t("Tienda general"), x: 52, z: 26, w: 4, d: 3, style: 'store', reward: { coins: 40, hearts: 3 }, hint: t("De todo un poco, desde clavos hasta caramelos.") },
  { id: 'cafe', emoji: '🍵', name: t("Café del Puente"), x: 58, z: 26, w: 3, d: 3, style: 'cafe', reward: { coins: 40, hearts: 4 }, hint: t("Una terraza con sombrillas junto a la calle.") },
  { id: 'cottageA', emoji: '🏠', name: t("Casita de campo"), x: 63, z: 26, w: 3, d: 3, style: 'cottage', plain: true },
  { id: 'cottageB', emoji: '🏡', name: t("Casita de campo"), x: 67, z: 26, w: 3, d: 3, style: 'cottage2', plain: true },
  { id: 'windmill', emoji: '🌬️', name: t("Molino"), x: 73, z: 27, w: 3, d: 3, style: 'windmill', reward: { coins: 60, hearts: 4 }, hint: t("Sus aspas giran despacio con el viento.") },
];
export const TOWN_LANDMARKS = [
  { id: 'square', emoji: '⛲', name: t("Plaza Mayor"), x: 60, z: 19.5, reward: { coins: 50, hearts: 5 }, hint: t("El corazón del pueblo, con su fuente.") },
  { id: 'orchard', emoji: '🍎', name: t("El huerto de manzanos"), x: 54, z: 10.5, reward: { coins: 40, hearts: 3 }, hint: t("Filas de manzanos con fruta madura.") },
  { id: 'playground', emoji: '🛝', name: t("El parque infantil"), x: 75.5, z: 20, reward: { coins: 35, hearts: 3 }, hint: t("Columpios y un tobogán detrás de la escuela.") },
];

/**
 * Descubrimientos por el camino. x,z = zona aproximada (se ajusta a tierra firme al generar el mundo).
 * kind = modelo (ver game/worldParts.js). reward: coins / hearts / item.
 */
export const POIS = [
  { id: 'stones', kind: 'stones', emoji: '🗿', name: t("Círculo de piedras"), x: 7, z: 9, reward: { coins: 40, hearts: 3 }, hint: t("Piedras antiguas dispuestas en círculo. Dicen que conceden deseos.") },
  { id: 'cabin', kind: 'cabin', emoji: '🏚️', name: t("Cabaña abandonada"), x: 6, z: 31, reward: { coins: 50, hearts: 2 }, hint: t("Alguien vivió aquí hace mucho. Queda una taza sobre la mesa.") },
  { id: 'glade', kind: 'glade', emoji: '✨', name: t("Claro de las luciérnagas"), x: 9, z: 42, reward: { hearts: 6 }, hint: t("Un claro mágico donde brillan luciérnagas incluso de día.") },
  { id: 'bigtree', kind: 'bigtree', emoji: '🌳', name: t("El árbol abuelo"), x: 16, z: 45, reward: { coins: 30, hearts: 4 }, hint: t("Un árbol enorme, el más viejo del valle.") },
  { id: 'camp', kind: 'camp', emoji: '⛺', name: t("Campamento"), x: 31, z: 40, reward: { coins: 40, hearts: 3 }, hint: t("Una tienda y una hoguera apagada junto al río.") },
  { id: 'lookout', kind: 'lookout', emoji: '🔭', name: t("Mirador del norte"), x: 45, z: 6, reward: { hearts: 5 }, hint: t("Desde aquí se ve casi todo el valle.") },
  { id: 'wagon', kind: 'wagon', emoji: '🛒', name: t("Carreta abandonada"), x: 28, z: 8, reward: { coins: 45, hearts: 2 }, hint: t("Una carreta con un cargamento olvidado.") },
  { id: 'well', kind: 'well', emoji: '⛲', name: t("Pozo antiguo"), x: 10, z: 20, reward: { coins: 35, hearts: 3 }, hint: t("Un pozo de piedra cubierto de musgo.") },
  { id: 'shrine', kind: 'shrine', emoji: '⛩️', name: t("Santuario del río"), x: 46, z: 34, reward: { coins: 30, hearts: 4 }, hint: t("Un pequeño santuario con ofrendas de flores.") },
  { id: 'grove', kind: 'grove', emoji: '🌸', name: t("Cerezos en flor"), x: 56, z: 37, reward: { hearts: 5 }, hint: t("Un bosquecillo de cerezos que nunca pierde sus flores.") },
  { id: 'fox', kind: 'fox', emoji: '🦊', name: t("La zorrera"), x: 76, z: 7, reward: { coins: 35, hearts: 4 }, hint: t("Una madriguera con huellas pequeñas alrededor.") },
  { id: 'lighthouse', kind: 'lighthouse', emoji: '🏮', name: t("Faro de la bahía"), x: 33, z: 75, reward: { coins: 80, hearts: 5 }, hint: t("Un faro blanco y rojo que vigila la bahía.") },
  { id: 'wreck', kind: 'wreck', emoji: '⚓', name: t("Barco encallado"), x: 20, z: 70, reward: { coins: 60, item: 'shell6' }, hint: t("Los restos de un barco medio hundido en la orilla.") },
  { id: 'meadow', kind: 'meadow', emoji: '🌼', name: t("Prado de flores del sur"), x: 12, z: 66, reward: { hearts: 5 }, hint: t("Un prado de flores de mil colores.") },
  { id: 'crystals', kind: 'crystals', emoji: '💎', name: t("Gruta de cristales"), x: 70, z: 56, reward: { coins: 70, item: 'crystal' }, hint: t("Cristales gigantes asoman entre las rocas.") },
];
/** Todo lo descubrible, con posición fija (los POIS se ajustan al generar el mundo) */
export const DISCOVERIES_FIXED = [...TOWN_BUILDINGS.filter((b) => !b.plain).map((b) => ({ ...b, x: b.x + b.w / 2, z: b.z + b.d + 1.4, town: true })), ...TOWN_LANDMARKS.map((l) => ({ ...l, town: true }))];
