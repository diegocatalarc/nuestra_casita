// Prueba táctil (emulada): pellizco = zoom, giro de dos dedos = girar cámara,
// y el jugador no debe caminar al soltar los gestos.
// Usa Input.dispatchTouchEvent de CDP sobre un contexto con hasTouch.
// NO sustituye a probarlo en un iPad real con Safari (ver docs/pruebas.md).
import { newContext, watchErrors, startGame } from './harness.mjs';

const CX = 512, CY = 384; // centro de un viewport 1024×768
const STEPS = 12;

/** Dos dedos: de la posición `from` a `to` en STEPS pasos. Cada punto = [x, y]. */
async function twoFingers(cdp, from, to) {
  const pts = (p) => p.map(([x, y], id) => ({ x, y, id }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(from) });
  for (let i = 1; i <= STEPS; i++) {
    const f = i / STEPS;
    const cur = from.map(([x0, y0], k) => [x0 + (to[k][0] - x0) * f, y0 + (to[k][1] - y0) * f]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(cur) });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/** Pareja de puntos a `r` px del centro, separados por `angle` radianes. */
const pair = (r, angle = 0) => [
  [CX + r * Math.cos(angle), CY + r * Math.sin(angle)],
  [CX - r * Math.cos(angle), CY - r * Math.sin(angle)],
];

export async function runTouch(browser, url, check) {
  const ctx = await newContext(browser, {
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await startGame(page, url);
  const cdp = await ctx.newCDPSession(page);

  check((await page.locator('.touchctl').count()) > 0, 'controles táctiles (.touchctl) presentes');

  const state = () => page.evaluate(() => ({
    zoom: window.__camTarget.zoom,
    off: window.__camTarget.off,
    x: window.__nc.runtime.me.x,
    z: window.__nc.runtime.me.z,
  }));

  // Pellizco: separar los dedos de 200 a 300 px → zoom sube.
  const s0 = await state();
  await twoFingers(cdp, pair(100), pair(150));
  await page.waitForTimeout(100);
  const s1 = await state();
  check(s1.zoom > s0.zoom * 1.15, `pellizco cambia el zoom (${s0.zoom.toFixed(1)} → ${s1.zoom.toFixed(1)})`);

  // Giro: 0.3 rad con los dos dedos → la cámara gira.
  await twoFingers(cdp, pair(100), pair(100, 0.3));
  await page.waitForTimeout(100);
  const s2 = await state();
  const dOff = Math.abs(s2.off - s1.off);
  check(dOff > 0.2, `giro de dos dedos cambia la cámara (Δoff = ${dOff.toFixed(3)})`);

  // Tras los gestos, esperar más que la ventana de 350 ms y comprobar que no ha caminado.
  await page.waitForTimeout(700);
  const s3 = await state();
  const moved = Math.hypot(s3.x - s2.x, s3.z - s2.z);
  check(moved < 0.01, `el jugador no camina al soltar los gestos (desplazamiento ${moved.toFixed(4)})`);

  check(errors.length === 0, `sin errores en la sesión táctil (${errors.length})`);
  if (errors.length) console.log(errors.map((e) => `   - ${e}`).join('\n'));
  await ctx.close();
}
