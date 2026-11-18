import { t } from '../i18n';

// Traduce errores de Firebase a mensajes accionables en español.
export function explainError(e) {
  const code = e?.code || '';
  const msg = String(e?.message || e || '');
  const host = typeof location !== 'undefined' ? location.hostname : '';
  if (code === 'auth/unauthorized-domain') return t("Este dominio no está autorizado. En Firebase: Authentication → Configuración → Dominios autorizados → añade «{0}».", [host]);
  if (code === 'auth/operation-not-allowed') return t("El inicio de sesión con Google no está activado. En Firebase: Authentication → Método de acceso → Google → Habilitar.");
  if (code === 'auth/popup-blocked') return t("El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para esta página y vuelve a intentarlo.");
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return t("Se cerró la ventana de Google antes de terminar. Inténtalo de nuevo.");
  if (code === 'auth/network-request-failed' || code === 'unavailable') return t("Sin conexión con Firebase. Revisa tu internet e inténtalo otra vez.");
  if (code === 'permission-denied' || /permission|insufficient/i.test(msg)) return t("Firebase rechazó la operación (permisos). Revisa que hayas publicado las reglas de Firestore y de Realtime Database.");
  if (code === 'failed-precondition' && /index/i.test(msg)) return t("Firestore necesita un índice. Abre el enlace del error de la consola del navegador.");
  if (/Firestore API has not been used|not been enabled|NOT_FOUND/i.test(msg)) return t("Falta crear la base de datos. En Firebase: Firestore Database → Crear base de datos.");
  if (/database.*(url|not)/i.test(msg) && /realtime|rtdb|url/i.test(msg)) return t("Revisa la URL de Realtime Database (VITE_FIREBASE_DATABASE_URL).");
  return msg.slice(0, 220) || t("Error desconocido");
}
