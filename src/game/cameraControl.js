// Estado de cámara controlable desde teclado, rueda, gestos táctiles y botones en pantalla.
export const MAX_OFF = Math.PI / 6; // giro máximo respecto a la vista base (±30°)
export const ZOOM_MIN = 24, ZOOM_MAX = 90;
export const camTarget = { zoom: 46, off: 0, px: 0, pz: 0 }; // px/pz: desplazamiento de la cámara respecto al personaje (arrastrar el mapa)
/** Mientras `until` esté en el futuro hay un gesto (pellizco, giro o arrastre) en curso o recién terminado: ignorar el clic que lo sigue (evita caminar al soltar). Siempre caduca solo. */
export const gesture = { until: 0 };
export const gestureActive = () => performance.now() < gesture.until;
export const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
export const PAN_MAX = 45;
export const recenter = () => { camTarget.px = 0; camTarget.pz = 0; };
export const zoomBy = (f) => { camTarget.zoom = clampZoom(camTarget.zoom * f); };
