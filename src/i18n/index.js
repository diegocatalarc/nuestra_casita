// Idiomas: español (base, las claves del código) e inglés. Se detecta el idioma del dispositivo.
// Cambiar de idioma recarga la página (así todo el contenido se evalúa en el idioma elegido).
// Todos los ficheros src/i18n/en-*.js se fusionan solos: cada tema puede traer su propio diccionario sin tocar los demás.
// El diccionario inglés (~190 KB) se carga bajo demanda: solo se descarga si el idioma activo es inglés.
// Hay que esperar a `loadDictionary()` ANTES de importar módulos que llamen a t() al evaluarse (ver main.jsx).
const loaders = import.meta.glob(['./en.js', './en-*.js']);
const en = {};
let loaded = false;

const STORAGE = 'nc_lang';
export const LANGS = [{ id: 'es', label: 'Español' }, { id: 'en', label: 'English' }];

function detect() {
  try { const s = localStorage.getItem(STORAGE); if (s === 'es' || s === 'en') return s; } catch { /* noop */ }
  const list = (typeof navigator !== 'undefined' && (navigator.languages?.length ? navigator.languages : [navigator.language])) || [];
  for (const l of list) {
    const c = String(l || '').toLowerCase();
    if (c.startsWith('es')) return 'es';
    if (c.startsWith('en')) return 'en';
  }
  return 'en';
}

export const lang = detect();

/** Carga el diccionario inglés (no hace nada en español). Idempotente. Con `force` carga también en español (pruebas). */
export async function loadDictionary(force = false) {
  if ((lang !== 'en' && !force) || loaded) return;
  loaded = true;
  const mods = await Promise.all(Object.entries(loaders).sort(([a], [b]) => (a === './en.js' ? -1 : b === './en.js' ? 1 : 0)).map(([, f]) => f()));
  for (const m of mods) Object.assign(en, m.default);
}
if (typeof document !== 'undefined') document.documentElement.lang = lang;

const missing = (typeof window !== 'undefined' && (window.__i18nMissing = window.__i18nMissing || new Set())) || new Set();

/** t('Texto en español', [valores]) → texto en el idioma activo. Los {0},{1}… se sustituyen por los valores. */
export function t(key, vars) {
  let s = key;
  if (lang === 'en') {
    if (Object.prototype.hasOwnProperty.call(en, key)) s = en[key];
    else missing.add(key);
  }
  if (vars != null) {
    const a = Array.isArray(vars) ? vars : [vars];
    s = s.replace(/\{(\d+)\}/g, (m, i) => (a[i] !== undefined ? a[i] : m));
  }
  return s;
}

export function setLang(id) {
  try { localStorage.setItem(STORAGE, id); } catch { /* noop */ }
  location.reload();
}
