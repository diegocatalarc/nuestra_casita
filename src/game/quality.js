// Calidad gráfica: escalones y regulador automático (lógica pura; el componente que lo usa es scene/QualityGovernor.jsx).
// Si el juego va a tirones, baja un escalón (alta → media → normal) en vez de dejar a la persona sufriendo.
export const TIERS = ['normal', 'media', 'alta'];
/** Resolución máxima (píxeles por píxel CSS) por escalón (nunca sube al bajar de escalón): en pantallas Retina render a 2× cuesta 4× los píxeles. */
export const DPR_CAP = { normal: 1.25, media: 1.25, alta: 1.25 };
/** Mediana de tiempo por fotograma (ms) por encima de la cual se considera «a tirones» (< ~38 fps). */
export const SLOW_MS = 26;
/** Si la persona eligió el escalón a mano, solo se baja con un rendimiento claramente injugable (< ~25 fps). */
export const SEVERE_MS = 40;
export const MIN_SAMPLES = 90;
/** Ventanas de medida por escalón (después se da por bueno y no se vuelve a medir). */
export const MAX_WINDOWS = 4;
/** Espera tras entrar en el juego (y tras cada bajada) antes de medir, en ms. */
export const SETTLE_MS = 3000;

export function median(xs) {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Escalón inmediatamente inferior, o null si ya es el más bajo. */
export const stepDown = (tier) => { const i = TIERS.indexOf(tier); return i > 0 ? TIERS[i - 1] : null; };

/** Decide con las muestras (ms por fotograma): esperar, dar por bueno o bajar. Las pestañas ocultas no se miden (dt enorme). */
export function decide({ samples, tier, manual = false }) {
  const clean = samples.filter((ms) => ms > 0 && ms < 250); // fuera los parones de pestaña en segundo plano
  if (clean.length < MIN_SAMPLES) return { action: 'wait' };
  if (median(clean) <= (manual ? SEVERE_MS : SLOW_MS)) return { action: 'ok' };
  const to = stepDown(tier);
  return to ? { action: 'down', to, ms: Math.round(median(clean)) } : { action: 'ok' };
}
