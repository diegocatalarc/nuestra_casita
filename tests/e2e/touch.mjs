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

  // --- Toque en el suelo vacío (regresión: tras un gesto, los toques en el suelo dejaron de funcionar) ---
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
  const toScreen = (x, z) => page.evaluate(([x, z]) => { const c = window.__cam; const v = c.position.clone().set(x, 0, z).project(c); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, [x, z]);
  await page.evaluate(() => { const r = window.__nc.runtime; r.me.x = 17; r.me.z = 22; r.me.path = []; });
  await page.waitForTimeout(1500);
  const a0 = await state();
  await send('touchStart', [await toScreen(a0.x + 4, a0.z + 1)]); await page.waitForTimeout(60); await send('touchEnd', []);
  await page.waitForTimeout(2500);
  const a1 = await state();
  check(Math.hypot(a1.x - a0.x, a1.z - a0.z) > 0.5, 'tocar el suelo vacío mueve al personaje');

  await twoFingers(cdp, pair(100), pair(140)); // un gesto…
  await page.waitForTimeout(700);
  const a2 = await state();
  await send('touchStart', [await toScreen(a2.x - 4, a2.z - 1)]); await page.waitForTimeout(60); await send('touchEnd', []);
  await page.waitForTimeout(2500);
  const a3 = await state();
  check(Math.hypot(a3.x - a2.x, a3.z - a2.z) > 0.5, 'tocar el suelo vuelve a funcionar tras un gesto de dos dedos');

  // --- Arrastrar con un dedo = mover la cámara por el mapa ---
  await page.evaluate(() => { const r = window.__nc.runtime; r.me.path = []; r.me.pending = null; });
  await page.waitForTimeout(800);
  await send('touchStart', [[500, 400]]);
  for (let k = 1; k <= 8; k++) { await send('touchMove', [[500 - k * 20, 400 + k * 5]]); await page.waitForTimeout(30); }
  await send('touchEnd', []);
  await page.waitForTimeout(400);
  const pan = await page.evaluate(() => ({ px: window.__camTarget.px, pz: window.__camTarget.pz, path: window.__nc.runtime.me.path.length }));
  check(Math.abs(pan.px) + Math.abs(pan.pz) > 0.8 && pan.path === 0, `arrastrar con un dedo mueve la cámara sin caminar (px ${pan.px.toFixed(2)}, pz ${pan.pz.toFixed(2)})`);

  // --- Plantar tocando la tierra ---
  await page.evaluate(() => { window.__camTarget.px = 0; window.__camTarget.pz = 0; const r = window.__nc.runtime; r.me.x = 17; r.me.z = 24; window.__nc.useGame.getState().setTool('plant', {}); window.__nc.useGame.setState({ seedSel: 'lettuce' }); });
  await page.waitForTimeout(2500);
  await send('touchStart', [await toScreen(14.5, 26.5)]); await page.waitForTimeout(60); await send('touchEnd', []);
  await page.waitForTimeout(3500);
  const crops = await page.evaluate(() => Object.keys(window.__nc.useGame.getState().crops).length);
  check(crops >= 1, `plantar tocando la tierra funciona (cultivos: ${crops})`);

  check(errors.length === 0, `sin errores en la sesión táctil (${errors.length})`);
  if (errors.length) console.log(errors.map((e) => `   - ${e}`).join('\n'));
  await ctx.close();
}
