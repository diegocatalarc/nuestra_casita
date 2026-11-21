import { hashStr, mulberry32 } from './rng';

// ---- Reloj de servidor (corregido por .info/serverTimeOffset en Firebase) ----
let offset = 0;
export const setServerOffset = (o) => { offset = o || 0; };
export const serverNow = () => Date.now() + offset;

// ---- Parámetros de depuración (?fast=30&hour=19&weather=rain&season=2) ----
const params = (() => {
  try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); }
})();
const num = (k) => (params.has(k) && params.get(k) !== '' ? Number(params.get(k)) : undefined);
export const DEBUG = { hour: num('hour'), season: num('season'), weather: params.get('weather') || undefined, fast: num('fast') };
export const TIME_SCALE = DEBUG.fast > 0 ? DEBUG.fast : 1; // acelera solo el crecimiento (para probar)

export const dateKey = (now = serverNow()) => new Date(now).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

const GAME_HOUR_MS = 60 * 1000; // 1 minuto real = 1 hora de juego
const SEASON_MS = 7 * 86400000; // 7 días reales por estación
const WEATHER_SLOT_MS = 8 * 60 * 1000;

/** Entorno del mundo (hora, estación, clima): igual para ambas personas. */
export function computeEnv(now, startedAt, seed = 1) {
  const origin = startedAt || now;
  const el = Math.max(0, now - origin);
  const total = 6 + el / GAME_HOUR_MS;
  const hour = DEBUG.hour ?? total % 24;
  const day = Math.floor(total / 24) + 1;
  const season = DEBUG.season ?? Math.floor(el / SEASON_MS) % 4;
  const slot = Math.floor(now / WEATHER_SLOT_MS);
  const r = mulberry32(hashStr(`w${seed}:${slot}`))();
  const rainP = [0.22, 0.1, 0.26, 0.2][season];
  let weather = 'clear';
  if (r < rainP) weather = season === 3 ? 'snow' : r < rainP * 0.4 ? 'storm' : 'rain';
  if (DEBUG.weather) weather = DEBUG.weather;
  return { now, hour, day, season, weather, slot };
}

export const fmtHour = (h) => {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export function fmtDuration(ms) {
  if (ms < 0) ms = 0;
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${m % 60} min`;
  return `${Math.floor(h / 24)} d`;
}
