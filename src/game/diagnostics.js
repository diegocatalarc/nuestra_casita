// Diagnóstico para pruebas en dispositivos reales (iPad, Firebase real): errores recientes, datos del dispositivo y medición de fluidez.
// Se pega en el chat con «⚙️ → Copiar informe». No incluye correos ni datos personales.
const MAX = 30;
const errors = [];
const clock = () => new Date().toISOString().slice(11, 19);

/** Anota un error en el registro circular (los últimos 30). */
export function logError(kind, msg) {
  errors.push(`${clock()} ${kind}: ${String(msg ?? '').replace(/\s+/g, ' ').slice(0, 200)}`);
  if (errors.length > MAX) errors.shift();
}
export const recentErrors = () => [...errors];
export const clearErrors = () => { errors.length = 0; };

let installed = false;
/** Engancha errores globales, promesas rechazadas y console.error (idempotente). */
export function installDiagnostics() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => logError('error', e.message));
  window.addEventListener('unhandledrejection', (e) => logError('promesa', e.reason?.message || e.reason));
  const ce = console.error;
  console.error = (...a) => { logError('console.error', a.map(String).join(' ')); ce.apply(console, a); };
}

export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';

export function deviceInfo() {
  if (typeof window === 'undefined') return {};
  const n = navigator, s = window.screen || {};
  let standalone = false;
  try { standalone = !!(n.standalone || window.matchMedia('(display-mode: standalone)').matches); } catch { /* noop */ }
  let touch = false;
  try { touch = window.matchMedia('(pointer: coarse)').matches; } catch { /* noop */ }
  return {
    ua: String(n.userAgent || '').slice(0, 120),
    screen: `${s.width}×${s.height} @${window.devicePixelRatio || 1}x`,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    touch, standalone, cores: n.hardwareConcurrency || null, memGb: n.deviceMemory || null,
    online: n.onLine !== false, lang: n.language,
  };
}

/** Resumen de un conjunto de duraciones de fotograma (ms). Puro, para poder probarlo. */
export function summarizeFrames(ms) {
  if (!ms.length) return { frames: 0, fps: 0, avg: 0, p95: 0, max: 0, long: 0 };
  const sorted = [...ms].sort((a, b) => a - b);
  const sum = ms.reduce((a, b) => a + b, 0);
  const avg = sum / ms.length;
  return {
    frames: ms.length, fps: Math.round((1000 / avg) * 10) / 10, avg: Math.round(avg * 10) / 10,
    p95: Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] * 10) / 10,
    max: Math.round(sorted[sorted.length - 1] * 10) / 10, long: ms.filter((d) => d > 100).length,
  };
}

/** Mide la fluidez real durante `ms` milisegundos (por defecto 5 s) con requestAnimationFrame. */
export function measureFps(ms = 5000) {
  return new Promise((resolve) => {
    const d = []; let last = performance.now(); const t0 = last;
    const step = (n) => { d.push(n - last); last = n; if (n - t0 < ms) requestAnimationFrame(step); else resolve(summarizeFrames(d.slice(1))); };
    requestAnimationFrame(step);
  });
}
