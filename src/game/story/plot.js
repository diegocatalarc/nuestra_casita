// Clima «de trama»: mientras un capítulo está activo, el valle puede forzar un tiempo concreto (el giro final: el clima eres tú).
// Determinista: depende solo del capítulo y de la hora de juego, así que las dos personas ven lo mismo y no toca la partida base.
// Si hay ?weather=… (pruebas) manda el parámetro de la URL.
export const plot = { chapter: null };

const CYCLE = ['clear', 'rain', 'snow', 'clear'];
/** Tiempo forzado por el capítulo n (1-based) a la hora h (0-24), o null si el capítulo no fuerza nada. */
export function plotWeather(chapter, hour = 12) {
  switch (chapter) {
    case 1: return hour < 11 ? 'rain' : 'clear';           // llovizna a medias: la primavera se arrepiente
    case 2: return 'clear';                                  // sequía: aquí no llueve, hay que regar
    case 4: return 'snow';                                   // el invierno inquilino
    case 5: return ['rain', 'snow', 'clear', 'storm'][Math.floor(hour / 6) % 4]; // todos los tiempos, cada 6 horas
    case 6: return 'clear';                                  // cielo despejado y el valle no lo soporta
    case 7: return CYCLE[Math.floor(hour / 6) % 4];          // las cuatro estaciones, una tras otra
    default: return null;                                    // capítulo 3 y fuera de la historia: clima normal
  }
}
