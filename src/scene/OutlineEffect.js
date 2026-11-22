import { Effect, EffectAttribute } from 'postprocessing';
import { Uniform, Color, Vector2 } from 'three';

/**
 * Contorno global (postproceso) con SOLO la profundidad: sin NormalPass, sin segundo render de la escena.
 *  · Silueta: un píxel es borde si algún vecino a `uThick` píxeles está MÁS CERCA que él por encima de `uSil` unidades de mundo
 *    (se dibuja por fuera del objeto, también contra el cielo, que no escribe profundidad). Las pendientes suaves (orillas,
 *    colinas) y el agua (casi plana) no cuentan: solo saltos reales de profundidad.
 *    La prueba usa pares simétricos (2d - d(+r) - d(-r)): un plano inclinado (tejado, ladera) se cancela y no da falsas líneas.
 *    Las sombras NO dan líneas (no están en la profundidad). (Se probó también un contorno de pliegues internos por segunda
 *    diferencia: ensuciaba los tejados con bandas de cuantización de la profundidad, se descartó.)
 *  · Nitidez: realce ligero (unsharp de 4 muestras) con `uSharp`.
 * Anchos en píxeles del búfer: el grosor es constante con el zoom. Color marrón cálido, nunca negro.
 * Ajuste: uThick, uSil, uStrength, uSharp (ver docs/visual.md).
 */
const frag = `
uniform vec3 uColor;
uniform float uThick, uSil, uStrength, uSharp, uRange;
float dz(vec2 uv) { return readDepth(uv) * uRange; }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 col = inputColor.rgb;
  if (uSharp > 0.0) {
    vec2 o = texelSize * 1.0;
    vec3 b = (texture2D(inputBuffer, uv + vec2(o.x, 0.0)).rgb + texture2D(inputBuffer, uv - vec2(o.x, 0.0)).rgb
            + texture2D(inputBuffer, uv + vec2(0.0, o.y)).rgb + texture2D(inputBuffer, uv - vec2(0.0, o.y)).rgb) * 0.25;
    vec3 det = texture2D(inputBuffer, uv).rgb - b;
    col += sign(det) * max(abs(det) - 0.03, 0.0) * uSharp; // «coring»: no realza el ruido fino (sombras, grano)
  }
  float d = dz(uv);
  // silueta: fracción de 16 muestras (2 anillos de 8) con un vecino MÁS CERCA; la fracción crece al acercarse al borde,
  // así el trazo sale con antialiasing aunque la profundidad no lo tenga
  float cnt = 0.0;
  for (int k = 0; k < 4; k++) {
    float a = float(k) * 0.7853982;
    vec2 o = vec2(cos(a), sin(a)) * texelSize;
    // pares simétricos ±r: una pendiente (plano inclinado) se cancela; un escalón de profundidad no
    cnt += step(uSil, 2.0 * d - dz(uv + o * uThick) - dz(uv - o * uThick));
#ifndef OUTLINE_LITE
    cnt += step(uSil, 2.0 * d - dz(uv + o * uThick * 0.5) - dz(uv - o * uThick * 0.5));
#endif
  }
#ifdef OUTLINE_LITE
  float sil = smoothstep(0.05, 0.5, cnt / 4.0);
#else
  float sil = smoothstep(0.05, 0.5, cnt / 8.0);
#endif
  float e = clamp(sil * uStrength, 0.0, 1.0);
  outputColor = vec4(mix(col, uColor, e), inputColor.a);
}`;

export class OutlineEffect extends Effect {
  constructor({ color = '#33201a', thick = 2.0, sil = 0.42, strength = 0.95, sharp = 0.35, lite = false } = {}) {  // lite: la mitad de lecturas de profundidad (calidad «media»)
    super('OutlineEffect', frag, {
      defines: new Map(lite ? [['OUTLINE_LITE', '1']] : []),
      attributes: EffectAttribute.DEPTH | EffectAttribute.CONVOLUTION,
      uniforms: new Map([
        ['uColor', new Uniform(new Color(color))], ['uThick', new Uniform(thick)], ['uSil', new Uniform(sil)],
        ['uStrength', new Uniform(strength)], ['uSharp', new Uniform(sharp)], ['uRange', new Uniform(999.9)],
      ]),
    });
    this.size = new Vector2();
  }
  /** Grosor del trazo en píxeles del búfer. */
  setView(thick) { this.uniforms.get('uThick').value = thick; }
}
