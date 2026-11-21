// Dos ciudades, dos horas: zona horaria de cada persona (solo el nombre de la zona, p. ej. «America/Santiago»: nada de ubicación exacta).
// Funciones puras salvo localZone(). La zona de cada persona se guarda en couple.players.<uid>.tz (ver actions/base.js: syncTimezone).
import { t } from '../i18n';

const valid = (zone) => { try { new Intl.DateTimeFormat('en-US', { timeZone: zone }); return true; } catch { return false; } };

/** Zona horaria de este dispositivo, o null si no se puede saber. */
export function localZone() {
  try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; return z && valid(z) ? z : null; } catch { return null; }
}

/** «America/Argentina/Buenos_Aires» → «Buenos Aires». null para zonas sin ciudad (UTC, Etc/…). */
export function cityOf(zone) {
  if (!zone || !zone.includes('/') || /^Etc\//.test(zone)) return null;
  return zone.split('/').pop().replace(/_/g, ' ');
}

/** Minutos de adelanto de `zone` sobre UTC en el instante `date`. */
export function zoneOffset(zone, date = new Date()) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second); // Safari antiguo escribe «24» a medianoche
  return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Diferencia horaria absoluta en minutos entre dos zonas (0 si falta alguna o no es válida). */
export function minutesApart(a, b, date = new Date()) {
  if (!a || !b || !valid(a) || !valid(b)) return 0;
  return Math.abs(zoneOffset(a, date) - zoneOffset(b, date));
}

/** «HH:MM» en esa zona. */
export function clockText(zone, date = new Date()) {
  try { return new Intl.DateTimeFormat('es-ES', { timeZone: zone || undefined, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date).replace(/^24:/, '00:'); } catch { return '--:--'; }
}

/** 0 → «cero horas», 60 → «una hora», 180 → «3 horas», 210 → «3 horas y media», 195 → «3 h 15 min». */
export function diffText(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60), r = m % 60;
  if (m === 0) return t("cero horas");
  if (r === 0) return h === 1 ? t("una hora") : t("{0} horas", [h]);
  if (r === 30) return h === 0 ? t("media hora") : t("{0} horas y media", [h]);
  return t("{0} h {1} min", [h, r]);
}

/** Sustituye los marcadores de las escenas. ctx = { me: zona, partner: zona|null, date? }. Sin datos, textos genéricos. */
export function fillTokens(text, ctx = {}) {
  if (!text || !text.includes('{')) return text;
  const date = ctx.date || new Date();
  const mine = cityOf(ctx.me), theirs = cityOf(ctx.partner);
  const apart = ctx.me && ctx.partner ? diffText(minutesApart(ctx.me, ctx.partner, date)) : t("unas horas");
  // replace con regex (no replaceAll): compatible con iPads antiguos
  return text
    .replace(/\{tuCiudad\}/g, mine || t("tu ciudad"))
    .replace(/\{suCiudad\}/g, theirs || t("la suya"))
    .replace(/\{diferencia\}/g, apart);
}
