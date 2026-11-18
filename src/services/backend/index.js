// Selector de backend. El resto del juego solo conoce la interfaz (getBackend()).
export const CLOUD_CONFIGURED = !!import.meta.env.VITE_FIREBASE_API_KEY;

let current = null;

export async function loadBackend(mode) {
  current = mode === 'cloud'
    ? (await import('./firebaseBackend.js')).default
    : (await import('./localBackend.js')).default;
  return current;
}

export function getBackend() {
  if (!current) throw new Error('Backend no inicializado');
  return current;
}
