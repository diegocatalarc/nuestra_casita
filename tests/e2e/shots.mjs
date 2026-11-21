// Capturas de la escena fija de la casita para comparar el aspecto antes/después.
// Uso: npm run shots -- [--label despues] [--root <copia del repo>] [--set quick|full] [--only nombre,nombre]
//  · --label  carpeta de salida: shots/<label>/ (fuera de git)
//  · --root   otra copia del repo (p. ej. un `git archive` del commit base con node_modules enlazado) para sacar las «antes»
//  · --set    quick = 4 capturas; full (por defecto) = horas 6/12/18/22 en primavera y verano, mediodía en otoño e invierno,
//             lluvia, nieve, tormenta y el iPad táctil emulado.
// Hora, estación y clima se cambian EN CALIENTE sobre el objeto DEBUG de game/time.js (solo servidor de desarrollo), así no
// hay que arrancar el juego de nuevo en cada captura. La semilla de la casita (4242) y Math.random son fijos, como en perf.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { ROOT, launch, newContext, watchErrors, freePort } from './harness.mjs';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const LABEL = opt('label', 'despues');
const TARGET = path.resolve(opt('root', ROOT));
const SET = opt('set', 'full');
const ONLY = opt('only', '') ? opt('only', '').split(',') : null;
const OUT = path.join(ROOT, 'shots', LABEL);
fs.mkdirSync(OUT, { recursive: true });

const EDGE = { px: -22, pz: -22, zoom: 30 };
// [nombre, hora, estación, clima, cámara?]
const DESKTOP = [
  ['h06-primavera', 6, 0, 'clear'], ['h12-primavera', 12, 0, 'clear'], ['h18-primavera', 18, 0, 'clear'], ['h22-primavera', 22, 0, 'clear'],
  ['h06-verano', 6, 1, 'clear'], ['h12-verano', 12, 1, 'clear'], ['h18-verano', 18, 1, 'clear'], ['h22-verano', 22, 1, 'clear'],
  ['h12-otono', 12, 2, 'clear'], ['h18-otono', 18, 2, 'clear'], ['h12-invierno', 12, 3, 'clear'],
  ['h12-lluvia', 12, 0, 'rain'], ['h12-nieve', 12, 3, 'snow'], ['h18-tormenta', 18, 1, 'storm'],
  // cámara arrastrada hasta el borde del mapa y alejada: se ve el cielo/horizonte que rodea el diorama (y el agua)
  ['borde-h06', 6, 0, 'clear', EDGE], ['borde-h12', 12, 1, 'clear', EDGE], ['borde-h18', 18, 2, 'clear', EDGE], ['borde-h22', 22, 0, 'clear', EDGE], ['borde-lluvia', 12, 0, 'rain', EDGE],
  ['agua-h12', 12, 1, 'clear', { px: 8, pz: 16, zoom: 62 }], ['agua-h18', 18, 1, 'clear', { px: 8, pz: 16, zoom: 62 }],
];
const QUICK = [['h12-primavera', 12, 0, 'clear'], ['h18-verano', 18, 1, 'clear'], ['h22-primavera', 22, 0, 'clear'], ['h12-otono', 12, 2, 'clear']];
const IPAD_ALTA = [['ipad-alta-h12-primavera', 12, 0, 'clear'], ['ipad-alta-h18-otono', 18, 2, 'clear']];
const IPAD = [['ipad-h12-primavera', 12, 0, 'clear'], ['ipad-h18-otono', 18, 2, 'clear'], ['ipad-h22-verano', 22, 1, 'clear']];

const PROFILES = {
  desktop: { ctx: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }, fx: '1', shots: SET === 'quick' ? QUICK : DESKTOP },
  ipadAlta: { ctx: null, fx: '1', shots: SET === 'quick' ? [] : IPAD_ALTA }, // iPad con «Calidad gráfica: Alta» (nc_fx=1)
  ipad: {
    ctx: {
      viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
    fx: null, shots: SET === 'quick' ? [] : IPAD,
  },
};

function initScript({ fx }) {
  let a = 0x9e3779b9; // Math.random determinista: la casita de demo y el avatar salen siempre iguales
  Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  try { if (fx === null) localStorage.removeItem('nc_fx'); else localStorage.setItem('nc_fx', fx); } catch { /* noop */ }
}

async function run(browser, url, key) {
  const prof = PROFILES[key];
  const list = prof.shots.filter(([n]) => !ONLY || ONLY.includes(n));
  if (!list.length) return;
  const ctx = await newContext(browser, prof.ctx || PROFILES.ipad.ctx);
  await ctx.addInitScript(initScript, { fx: prof.fx });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto(`${url}/?hour=12&weather=clear&season=0&debug=1`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder="Tu nombre"]', 'Tester');
  await page.click('button.btn.big:not(.primary)');
  await page.click('button:has-text("Crear")');
  await page.waitForSelector('.code', { timeout: 180000 });
  await page.click('.btn.primary.big');
  await page.waitForSelector('text=Empezar', { timeout: 180000 });
  await page.click('.btn.primary.big:has-text("Empezar")');
  await page.waitForSelector('canvas', { timeout: 180000 });
  await page.waitForFunction(() => !!window.__nc?.runtime?.me && !!window.__gl && !!window.__r3f, null, { timeout: 180000 });
  await page.waitForSelector('.toolbar', { timeout: 180000 });
  await page.evaluate(() => { const g = window.__nc.useGame.getState(); return window.__nc.backend.getBackend().write(g.coupleId, [{ op: 'patch', data: { seed: 4242 } }]); });
  await page.waitForFunction(() => window.__nc.useGame.getState().world?.seed === 4242, null, { timeout: 180000 });
  // sin interfaz encima: se ve la escena sola
  await page.addStyleTag({ content: '.toolbar, .hud, .hud *, .topbar, .bottombar, .joystick { visibility: hidden !important; }' });
  for (const [name, hour, season, weather, cam] of list) {
    await page.evaluate(async ([h, s, w]) => {
      const m = await import('/src/game/time.js');
      m.DEBUG.hour = h; m.DEBUG.season = s; m.DEBUG.weather = w;
    }, [hour, season, weather]);
    await page.evaluate((c) => { const t = window.__camTarget; t.px = c?.px ?? 0; t.pz = c?.pz ?? 0; t.zoom = c?.zoom ?? 46; t.off = 0; }, cam);
    await page.waitForFunction((s) => window.__nc.useGame.getState().env?.season === s, season, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(key.startsWith('ipad') ? 9000 : 7000); // transiciones de luz, terreno nuevo, precalentamiento, lluvia/nieve
    const file = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: file });
    const info = await page.evaluate(() => ({ calls: window.__gl.info.render.calls, tris: window.__gl.info.render.triangles }));
    console.log(`${name}: ${file}  (último render: ${info.calls} llamadas, ${info.tris} triángulos)`);
  }
  if (errors.length) console.log(`[${key}] errores de página:`, errors.slice(0, 5));
  await ctx.close();
}

async function main() {
  const port = await freePort();
  const server = await createServer({ root: TARGET, logLevel: 'error', server: { host: '127.0.0.1', port, strictPort: true } });
  await server.listen();
  const url = `http://127.0.0.1:${port}`;
  const browser = await launch();
  try {
    await run(browser, url, 'desktop');
    await run(browser, url, 'ipad');
    await run(browser, url, 'ipadAlta');
  } finally { await browser.close(); await server.close(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
