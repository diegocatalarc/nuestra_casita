// Estado de cámara controlable desde teclado, rueda, gestos táctiles y botones en pantalla.
export const MAX_OFF = Math.PI / 6; // giro máximo respecto a la vista base (±30°)
export const ZOOM_MIN = 24, ZOOM_MAX = 90;
export const camTarget = { zoom: 46, off: 0 };
/** Mientras `until` esté en el futuro hay un gesto de dos dedos en curso: ignorar los toques sueltos (evita caminar al soltar el pellizco). */
export const gesture = { until: 0 };
export const gestureActive = () => performance.now() < gesture.until;
export const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
export const zoomBy = (f) => { camTarget.zoom = clampZoom(camTarget.zoom * f); };
