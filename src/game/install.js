// Instalar como app en el iPad: Safari no ofrece un aviso automático, así que el juego lo pide él mismo (mensaje «Para Bri 💗»)
// con las instrucciones de «Añadir a pantalla de inicio». Funciones puras salvo load/save (localStorage con try/catch).
export const INSTALL_KEY = 'nc_install';
export const REOFFER_DAYS = 14;
const DAY = 86400000;

/** iPad (también iPadOS 13+, que se presenta como un Mac con pantalla táctil). `?ipad` en la URL lo fuerza (pruebas). */
export function isIpad(nav = typeof navigator !== 'undefined' ? navigator : {}, search = typeof location !== 'undefined' ? location.search : '') {
  if (search.includes('ipad')) return true;
  const ua = nav.userAgent || '';
  return /iPad/.test(ua) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints || 0) > 1);
}

/** ¿Ya se abrió desde la pantalla de inicio (modo app)? */
export function isStandalone(nav = typeof navigator !== 'undefined' ? navigator : {}, win = typeof window !== 'undefined' ? window : null) {
  try { return nav.standalone === true || !!win?.matchMedia?.('(display-mode: standalone)')?.matches; } catch { return false; }
}

/** state = { dismissedAt?: ms, never?: boolean }. Se ofrece en iPad, fuera del modo app, y de nuevo cada 14 días si se pospuso. */
export function shouldOffer({ ipad, standalone, state = {}, now = Date.now() }) {
  if (!ipad || standalone || state.never) return false;
  return !state.dismissedAt || now - state.dismissedAt >= REOFFER_DAYS * DAY;
}

export function loadInstallState() { try { return JSON.parse(localStorage.getItem(INSTALL_KEY) || '{}') || {}; } catch { return {}; } }
export function saveInstallState(patch) { try { localStorage.setItem(INSTALL_KEY, JSON.stringify({ ...loadInstallState(), ...patch })); } catch { /* noop */ } }
