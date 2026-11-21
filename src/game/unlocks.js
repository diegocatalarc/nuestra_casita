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
  hand: 1, plant: 1, orders: 1, story: 1, inv: 1, help: 1, chat: 1,
  // Capítulo 2 — «Expediente de verano»: cocinar exige construir la cocina; aparecen hambre y energía
  today: 2, food: 2, sleep: 2, build: 2, avatar: 2, vitals: 2,
  // Capítulo 3 — «Otoño, pendiente de firma»: vender, cartas y pareja
  market: 3, mail: 3, quests: 3, hug: 3, wave: 3, decor: 3, emotes: 3,
  // Capítulo 4 — «El invierno inquilino»
  animals: 4, land: 4, craft: 4, market_shop: 4,
  // Capítulo 5 — «El color de todos los tiempos»: pesca, recuerdos y el pueblo
  fish: 5, mem: 5, explore: 5, market_up: 5,
  // Capítulo 6 — «La hora de las 6:10»
  dates: 6, events: 6, explore_diary: 6,
  // Capítulo 7 — «La estación que falta»
  family: 7,
};

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

/** ¿Está disponible la función `id`? Fuera del modo progresivo (o sin datos), todo lo está. */
export function isUnlocked(couple, id, opts) {
  if (!progressiveMode(couple, opts)) return true;
  const need = FEATURE_CHAPTER[id];
  return need === undefined || chapterOf(couple) >= need;
}

/** Ids de las funciones desbloqueadas ahora (para detectar las nuevas). */
export function unlockedIds(couple, opts) {
  return Object.keys(FEATURE_CHAPTER).filter((id) => isUnlocked(couple, id, opts));
}
