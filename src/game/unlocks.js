// Descubrimiento progresivo: las funciones del juego aparecen según el capítulo de la historia en que está la pareja,
// para no abrumar al empezar. Lógica PURA (sin React). Ver docs/decisiones.md («Descubrimiento progresivo»).
//  · Las parejas creadas ANTES de LEGACY_BEFORE conservan todo visible (sin migración ni sorpresas).
//  · Ajustes → «Mostrar todas las funciones» (por dispositivo) lo desactiva para quien lo prefiera.
//  · `?progressive` en la URL (o localStorage nc_progressive='1') fuerza el modo progresivo (pruebas).
import { CHAPTERS } from './story/chapters';

/** Parejas creadas antes de esta fecha (UTC) ven todo desde el principio. */
export const LEGACY_BEFORE = Date.UTC(2026, 10, 22);

/** Capítulo (1-based) a partir del cual está disponible cada función. */
export const FEATURE_CHAPTER = {
  // Capítulo 1 — «La primavera que no llegó»: sembrar, cosechar y entregar un pedido
  hand: 1, plant: 1, orders: 1, story: 1, help: 1, chat: 1,
  // Capítulo 2 — «Expediente de verano»: cocinar exige construir la cocina; aparecen hambre y energía
  today: 2, food: 2, sleep: 2, build: 2, avatar: 2, vitals: 2, inv: 2,
  animals: 2, // las gallinas son la única fuente de huevos: la tortilla del capítulo 2 los necesita (si se gastan los iniciales)
  // Capítulo 3 — «Otoño, pendiente de firma»: vender, cartas y pareja
  market: 3, mail: 3, quests: 3, hug: 3, wave: 3, decor: 3, emotes: 3,
  // Capítulo 4 — «El invierno inquilino»
  land: 4, craft: 4, market_shop: 4,
  // Capítulo 5 — «El color de todos los tiempos»: pesca, recuerdos y el pueblo
  fish: 5, mem: 5, explore: 5, market_up: 5,
  // Capítulo 6 — «La hora de las 6:10»
  dates: 6, events: 6, explore_diary: 6,
  // Capítulo 7 — «La estación que falta»
  family: 7,
};

/** Función que da acceso a cada objeto que la historia pide entregar (se comprueba en tests: nunca un callejón sin salida). */
export const ITEM_SOURCE = { carrot: 'plant', lettuce: 'plant', omelette: 'food', egg: 'animals' };

/** Función que exige cada métrica de las condiciones `stat` de los capítulos (se comprueba en tests). */
export const METRIC_FEATURE = { harvest: 'plant', sell: 'market', order: 'orders', fish: 'fish', memory: 'mem', letter: 'mail', feed: 'animals', hug: 'hug', build: 'build', quest: 'quests', gather: 'hand', date: 'dates' };

const flag = (k) => { try { return typeof localStorage !== 'undefined' && localStorage.getItem(k) === '1'; } catch { return false; } };
const urlFlag = () => { try { return typeof location !== 'undefined' && location.search.includes('progressive'); } catch { return false; } };

/** ¿Esta pareja juega en modo progresivo (pantalla limpia al principio)? */
export function progressiveMode(couple, { showAll = flag('nc_showall'), force = flag('nc_progressive') || urlFlag() } = {}) {
  if (!couple) return false;
  if (showAll && !force) return false;
  if (force) return true;
  return (couple.startedAt || 0) >= LEGACY_BEFORE;
}

/** Capítulo actual (1-based); 99 cuando el libro está terminado. Sin historia aún: 1. */
export function chapterOf(couple) {
  const n = couple?.story?.chapter || 1;
  return n > CHAPTERS.length ? 99 : n;
}

/**
 * Funciones que una pareja YA usa, deducidas de su partida (para la pantalla limpia de partidas existentes: nunca se oculta lo que ya
 * tienes, p. ej. un hijo o los animales). ev = { animals, children, buildings (sin la casa), decor, memories, quests, mails, fish,
 * zones, discovered, dates, crafted, sold, hugs, ordered }: recuentos (números).
 */
export function evidenceFeatures(ev = {}) {
  const out = new Set();
  const has = (k) => (ev[k] || 0) > 0;
  if (has('animals')) out.add('animals');
  if (has('children')) out.add('family');
  if (has('buildings')) { out.add('build'); out.add('food'); out.add('sleep'); }
  if (has('decor')) out.add('decor');
  if (has('crafted')) out.add('craft');
  if (has('sold')) { out.add('market'); out.add('market_shop'); out.add('market_up'); out.add('events'); }
  if (has('fish')) out.add('fish');
  if (has('memories')) out.add('mem');
  if (has('quests')) out.add('quests');
  if (has('mails')) out.add('mail');
  if (has('hugs')) { out.add('hug'); out.add('wave'); out.add('emotes'); }
  if (has('dates')) { out.add('dates'); out.add('events'); }
  if (has('discovered')) { out.add('explore'); out.add('explore_diary'); }
  if (has('zones')) out.add('land'); // `couple.zones` solo guarda las zonas de pago (las gratuitas no se escriben)
  if (has('familyPlan')) out.add('family');
  return out;
}

/** ¿Está disponible la función `id`? Fuera del modo progresivo (o sin datos), todo lo está. `opts.evidence`: Set de evidenceFeatures. */
/** Una partida existente (anterior a LEGACY_BEFORE) siempre conserva lo básico de la vida diaria. */
const LEGACY_BASICS = ['today', 'inv', 'vitals', 'avatar', 'food', 'sleep'];
export function isUnlocked(couple, id, opts) {
  if (!progressiveMode(couple, opts)) return true;
  if (opts?.evidence?.has(id)) return true;
  if ((couple?.startedAt || 0) < LEGACY_BEFORE && LEGACY_BASICS.includes(id)) return true;
  const need = FEATURE_CHAPTER[id];
  return need === undefined || chapterOf(couple) >= need;
}

/** Ids de las funciones desbloqueadas ahora (para detectar las nuevas). */
export function unlockedIds(couple, opts) {  // opts incluye `evidence` si se quiere respetar lo ya usado
  return Object.keys(FEATURE_CHAPTER).filter((id) => isUnlocked(couple, id, opts));
}
