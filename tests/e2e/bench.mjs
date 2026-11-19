// Medición orientativa de rendimiento: camina al jugador a velocidad constante
// durante 9 s y mide el tiempo entre fotogramas (requestAnimationFrame).
// Corre dos veces: normal y con &nofog (sin niebla de exploración).
// Uso: npm run bench
//
// LIMITACIÓN: Chromium headless con render por software (swiftshader, sin GPU).
// Los números NO son los de un iPad ni de un ordenador real; sirven para
// comparar dos configuraciones en la misma máquina y ver tendencias.
import { startVite, launch, newContext, startGame, watchErrors } from './harness.mjs';

const WARMUP_MS = 1500; // ignorar el arranque (compilación de shaders, primer montaje)
const WALK_MS = 9000;   // duración de la caminata medida
const SPEED = 2.0;      // unidades del mundo por segundo

/** Se ejecuta dentro de la página: mueve al jugador y devuelve los intervalos entre fotogramas. */
function walkAndSample({ warmup, walk, speed }) {
  return new Promise((resolve) => {
    const me = window.__nc.runtime.me;
    const x0 = me.x;
    const intervals = [];
    const t0 = performance.now();
    let last = t0;
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const elapsed = now - t0;
      if (elapsed >= warmup) me.x += speed * dt; // velocidad constante en unidades/s
      if (elapsed >= warmup) intervals.push(now);
      if (elapsed < warmup + walk) requestAnimationFrame(tick);
      else resolve({ ms: intervals.slice(1).map((v, i) => v - intervals[i]), dx: me.x - x0 });
    };
    requestAnimationFrame(tick);
  });
}

function stats(ms) {
  const s = [...ms].sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const p95 = s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
  return { frames: s.length, mean, p95, max: s[s.length - 1] };
}

async function measure(page, label) {
  // Pequeña pausa para que termine el montaje inicial antes de medir.
  await page.waitForTimeout(1000);
  const { ms, dx } = await page.evaluate(walkAndSample, { warmup: WARMUP_MS, walk: WALK_MS, speed: SPEED });
  const r = stats(ms);
  console.log(`${label.padEnd(10)} fotogramas=${String(r.frames).padStart(4)}  media=${r.mean.toFixed(1).padStart(7)} ms  p95=${r.p95.toFixed(1).padStart(7)} ms  máx=${r.max.toFixed(1).padStart(7)} ms  (recorrido ${dx.toFixed(1)} u)`);
  if (dx <= 0) console.log(`${label}: aviso, el jugador no se ha desplazado; la medición no es válida.`);
  return r;
}

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = watchErrors(page);

    console.log('Bench orientativo (render por software, sin GPU). Ventana medida: 9 s tras 1.5 s de calentamiento.\n');
    await startGame(page, vite.url);
    const normal = await measure(page, 'normal');

    // Recargar con &nofog: la sesión de la pestaña y la casita siguen en localStorage/sessionStorage.
    await page.goto(`${vite.url}/?hour=12&weather=clear&debug=1&nofog`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.toolbar', { timeout: 120_000 }).catch(async () => {
      // Si la recarga no retoma la partida, volver a entrar en demo.
      await startGame(page, vite.url);
    });
    const nofog = await measure(page, 'nofog');

    const pct = ((nofog.mean - normal.mean) / normal.mean) * 100;
    console.log(`\nComparación (media): nofog ${nofog.mean.toFixed(1)} ms vs normal ${normal.mean.toFixed(1)} ms → ${pct >= 0 ? '+' : ''}${pct.toFixed(1)} % (${pct <= 0 ? 'nofog más rápido' : 'nofog más lento'}).`);
    console.log('Ruido esperado ≈ ±5 % en esta máquina (ver docs/decisiones.md, sección de niebla).');
    if (errors.length) console.log(`Aviso: ${errors.length} error(es) de consola durante el bench.`);
  } finally {
    await browser.close();
    await vite.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
