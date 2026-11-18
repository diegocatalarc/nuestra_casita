// Avisos del navegador (funcionan con la pestaña abierta en segundo plano; para avisos con la app cerrada haría falta FCM + Cloud Functions).
export const notifSupported = () => typeof Notification !== 'undefined';
export const notifState = () => (notifSupported() ? Notification.permission : 'unsupported');
export async function askNotify() {
  if (!notifSupported()) return 'unsupported';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}
export function notify(title, body) {
  try {
    if (notifSupported() && Notification.permission === 'granted' && document.hidden) new Notification(title, { body, tag: 'nuestra-casita' });
  } catch { /* noop */ }
}
