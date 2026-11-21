// Arnés de rendimiento reproducible.   Uso: npm run perf -- [--label antes] [--no-build] [--quick] [--dev] [--only desktop|ipad]
//
// Qué mide (todo sobre la build de producción servida con `vite preview`, o con `--dev` sobre el servidor de desarrollo):
//  · Escena: draw calls y triángulos por fotograma, geometrías/texturas/programas (fugas), tiempo de JS por fotograma
//    (suma de los useFrame y tiempo de gl.render), commits de React por segundo, tareas largas (>50 ms) y métricas CDP
//    (ScriptDuration, LayoutDuration, RecalcStyle…) por fotograma. En dos fases: cámara quieta 20 s y moviéndose 20 s,
//    en un viewport de escritorio y en un iPad táctil emulado (pointer:coarse, dpr 2, postproceso apagado por defecto).
//  · Carga: bytes de JS (gzip) del chunk de entrada y total, y tiempos relativos hasta la pantalla de acceso, la pantalla
//    de carga y el botón «Entrar» (mediana de varias cargas en frío).
//
// LIMITACIÓN: Chromium headless con render por software (swiftshader). Los tiempos absolutos de GPU NO valen; las
// métricas útiles son las independientes de la GPU (draw calls, triángulos, memoria, JS por fotograma, commits) y sirven
// para comparar antes/después en la MISMA máquina. Se fija Math.random para que la casita de demo (semilla) sea idéntica.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { build as viteBuild, preview as vitePreview } from 'vite';
import { ROOT, startVite, launch, newContext, watchErrors, freePort } from './harness.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const LABEL = opt('label', 'actual');
const QUICK = flag('quick');
const PHASE_MS = QUICK ? 6000 : 20000;
const WARMUP_MS = QUICK ? 2500 : 5000;
const LOAD_RUNS = QUICK ? 1 : 3;
const OUT_DIR = path.join(ROOT, 'perf-results');
fs.mkdirSync(OUT_DIR, { recursive: true });

const PROFILES = {
  desktop: { label: 'Escritorio 1024×640', ctx: { viewport: { width: 1024, height: 640 }, deviceScaleFactor: 1 }, fx: '1' },
  ipad: {
    label: 'iPad táctil 1024×768 @1x (el dpr real se limita a 1,5)',
    ctx: {
      viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
    fx: null, // sin nc_fx: en táctil el postproceso empieza apagado
  },
};

const pct = (arr, p) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const r2 = (n) => Math.round(n * 100) / 100;
const summ = (a) => ({ mean: r2(mean(a)), p50: r2(pct(a, 0.5)), p95: r2(pct(a, 0.95)), max: r2(a.length ? Math.max(...a) : 0) });

// ---------------------------------------------------------------- tamaños de build
function gz(file) { return zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length; }
function bundleSizes() {
  const dist = path.join(ROOT, 'dist');
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const entry = new Set();
  for (const m of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+\.js)"/g)) entry.add(m[1].replace(/^\//, ''));
  const files = fs.readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.js'));
  const all = files.map((f) => ({ file: `assets/${f}`, raw: fs.statSync(path.join(dist, 'assets', f)).size, gzip: gz(path.join(dist, 'assets', f)) }));
  const sum = (l, k) => l.reduce((a, b) => a + b[k], 0);
  const inEntry = all.filter((f) => entry.has(f.file));
  const css = fs.readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.css')).map((f) => gz(path.join(dist, 'assets', f)));
  return {
    entryChunks: inEntry.map((f) => `${f.file} ${f.gzip}`),
    entryJsGzip: sum(inEntry, 'gzip'), entryJsRaw: sum(inEntry, 'raw'),
    totalJsGzip: sum(all, 'gzip'), totalJsRaw: sum(all, 'raw'),
    lazyJsGzip: sum(all, 'gzip') - sum(inEntry, 'gzip'),
    cssGzip: css.reduce((a, b) => a + b, 0),
    chunks: all.sort((a, b) => b.gzip - a.gzip).map((f) => `${f.file} raw=${f.raw} gzip=${f.gzip}${entry.has(f.file) ? ' [entrada]' : ''}`),
  };
}

// ---------------------------------------------------------------- scripts dentro de la página
function initScript({ fx }) {
  // Math.random determinista (mulberry32): la semilla de la casita de demo sale siempre igual.
  let a = 0x9e3779b9;
  Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  try {
    if (fx === null) localStorage.removeItem('nc_fx'); else localStorage.setItem('nc_fx', fx);
  } catch { /* noop */ }
  window.__perf = { reactDom: 0, reactOther: 0, long: [] };
  // Gancho mínimo de React DevTools: cuenta commits (DOM vs R3F).
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true, isDisabled: false, renderers: new Map(),
    inject(r) { this.renderers.set(this.renderers.size + 1, r); return this.renderers.size; },
    onCommitFiberRoot(_id, root) { if (root?.containerInfo instanceof Element) window.__perf.reactDom++; else window.__perf.reactOther++; },
    onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, checkDCE() {},
  };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.long.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
  } catch { /* noop */ }
}

/** Instrumenta renderer y useFrame; vuelca una muestra por fotograma en window.__perf.frames. */
function installProbes() {
  const gl = window.__gl, st = window.__r3f;
  const P = window.__perf;
  P.frames = []; P.ufMs = 0; P.renderMs = 0; P.renders = 0; P.ufNames = {};
  gl.info.autoReset = false;
  const orig = gl.render.bind(gl);
  gl.render = (s, c) => { const t = performance.now(); orig(s, c); P.renderMs += performance.now() - t; P.renders++; };
  const wrap = () => {
    for (const sub of st.internal.subscribers) {
      const ref = sub.ref;
      if (ref.__w) continue;
      let fn = ref.current; ref.__w = true;
      const id = (typeof fn === 'function' ? fn.toString().replace(/\s+/g, ' ').slice(0, 90) : '?') + ` #p${sub.priority}`;
      Object.defineProperty(ref, 'current', {
        get() { return (state, d, f) => { const t = performance.now(); try { return fn(state, d, f); } finally { const e = performance.now() - t; P.ufMs += e; P.ufNames[id] = (P.ufNames[id] || 0) + e; } }; },
        set(v) { fn = v; }, configurable: true,
      });
    }
    P.subs = st.internal.subscribers.length;
  };
  wrap(); setInterval(wrap, 400);
  let last = performance.now();
  const flush = (now) => {
    P.frames.push({
      t: now, dt: now - last, calls: gl.info.render.calls, tris: gl.info.render.triangles,
      geo: gl.info.memory.geometries, tex: gl.info.memory.textures, prog: gl.info.programs ? gl.info.programs.length : 0,
      uf: P.ufMs, render: P.renderMs, nrender: P.renders, rd: P.reactDom, ro: P.reactOther,
    });
    P.ufMs = 0; P.renderMs = 0; P.renders = 0; gl.info.reset(); last = now;
    requestAnimationFrame(flush);
  };
  requestAnimationFrame(flush);
}

/** Camina en vaivén horizontal (±7 u) durante `ms`; la cámara sigue al jugador. */
function walkFor({ ms, speed }) {
  return new Promise((resolve) => {
    const me = window.__nc.runtime.me;
    const x0 = me.x; let dir = 1, last = performance.now(); const t0 = last;
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      me.x += dir * speed * dt; me.moving = true;
      if (me.x > x0 + 7) dir = -1; else if (me.x < x0 - 7) dir = 1;
      if (now - t0 < ms) requestAnimationFrame(tick); else { me.moving = false; resolve(me.x - x0); }
    };
    requestAnimationFrame(tick);
  });
}

/** Zoom (rueda) y giro (Q/E) de la cámara a la vez, con el personaje quieto. */
function cameraFor({ ms }) {
  return new Promise((resolve) => {
    const ct = window.__camTarget; const t0 = performance.now();
    const tick = (now) => {
      const k = (now - t0) / ms;
      ct.zoom = 58 + Math.sin(k * Math.PI * 4) * 28;   // 30..86
      ct.off = Math.sin(k * Math.PI * 3) * 0.45;        // ±26°
      if (now - t0 < ms) requestAnimationFrame(tick); else { ct.zoom = 46; ct.off = 0; resolve(0); }
    };
    requestAnimationFrame(tick);
  });
}

/** Abre cada panel por el estado de la UI y mide hasta que su .modal está en el DOM (incluye cargar su chunk si es diferido). */
function openPanels({ ids }) {
  const g = window.__nc.useGame;
  const once = (id) => new Promise((resolve) => {
    const t0 = performance.now();
    let done = false;
    const fin = (ok) => { if (done) return; done = true; mo.disconnect(); resolve({ id, ms: ok ? performance.now() - t0 : -1 }); };
    const mo = new MutationObserver(() => { if (document.querySelector('.modal')) fin(true); });
    mo.observe(document.body, { childList: true, subtree: true });
    g.getState().set({ panel: id });
    setTimeout(() => fin(false), 8000);
  });
  const close = () => new Promise((r) => { g.getState().set({ panel: null }); setTimeout(r, 600); });
  return (async () => {
    const out = [];
    for (const id of ids) {
      const first = await once(id); await close();
      const second = await once(id); await close();
      out.push({ id, firstMs: Math.round(first.ms), repeatMs: Math.round(second.ms) });
    }
    return out;
  })();
}

// ---------------------------------------------------------------- medición de una fase
const CDP_KEYS = ['ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'TaskDuration', 'LayoutCount', 'RecalcStyleCount', 'JSHeapUsedSize'];
async function cdpMetrics(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  const o = {}; for (const m of metrics) o[m.name] = m.value; return o;
}

async function phase(page, cdp, name, mode) {
  const startIdx = await page.evaluate(() => window.__perf.frames.length);
  const t0 = await page.evaluate(() => performance.now());
  const m0 = await cdpMetrics(cdp);
  let moved = 0;
  if (mode === 'walk') moved = await page.evaluate(walkFor, { ms: PHASE_MS, speed: 2.5 });
  else if (mode === 'camera') await page.evaluate(cameraFor, { ms: PHASE_MS });
  else await page.waitForTimeout(PHASE_MS);
  const m1 = await cdpMetrics(cdp);
  const { frames, long, t1 } = await page.evaluate(([i]) => ({ frames: window.__perf.frames.slice(i), long: window.__perf.long.slice(), t1: performance.now() }), [startIdx]);
  const fr = frames.slice(1); // el primer fotograma acumula lo anterior
  const secs = (t1 - t0) / 1000;
  const nf = Math.max(1, fr.length);
  const d = (k) => (m1[k] - m0[k]);
  const lt = long.filter(([s]) => s >= t0 && s <= t1);
  const commits = (fr.at(-1)?.rd ?? 0) - (frames[0]?.rd ?? 0);
  const commitsR3F = (fr.at(-1)?.ro ?? 0) - (frames[0]?.ro ?? 0);
  const half = fr[Math.floor(fr.length / 2)] || fr[0];
  const geo0 = fr[0]?.geo, geo1 = fr.at(-1)?.geo, tex0 = fr[0]?.tex, tex1 = fr.at(-1)?.tex, pr0 = fr[0]?.prog, pr1 = fr.at(-1)?.prog;
  return {
    name, seconds: r2(secs), frames: fr.length, fps: r2(fr.length / secs), movedUnits: r2(moved),
    drawCalls: summ(fr.map((f) => f.calls / Math.max(1, f.nrender || 1) * (f.nrender || 1))),
    triangles: summ(fr.map((f) => f.tris)),
    renderPasses: r2(mean(fr.map((f) => f.nrender))),
    useFrameMs: summ(fr.map((f) => f.uf)),
    glRenderJsMs: summ(fr.map((f) => f.render)),
    jsPerFrameMs: summ(fr.map((f) => f.uf + f.render)),
    frameIntervalMs: summ(fr.map((f) => f.dt)),
    memory: { geometries: [geo0, geo1], textures: [tex0, tex1], programs: [pr0, pr1],
      // fuga = crecimiento sostenido: en la 2ª mitad de la fase siguen subiendo (las cachés se llenan al principio)
      growth: { geometries: geo1 - geo0, textures: tex1 - tex0, programs: pr1 - pr0 },
      leak: mode === 'idle' ? (geo1 > geo0 || tex1 > tex0 || pr1 > pr0) : (geo1 > half.geo || tex1 > half.tex || pr1 > half.prog) },
    reactCommitsPerSec: r2(commits / secs), r3fCommitsPerSec: r2(commitsR3F / secs),
    longTasks: lt.length, longTasksMs: r2(lt.reduce((a, [, du]) => a + du, 0)),
    cdpPerFrame: {
      scriptMs: r2((d('ScriptDuration') * 1000) / nf), layoutMs: r2((d('LayoutDuration') * 1000) / nf),
      recalcStyleMs: r2((d('RecalcStyleDuration') * 1000) / nf), taskMs: r2((d('TaskDuration') * 1000) / nf),
      layoutCount: r2(d('LayoutCount') / secs), recalcStyleCount: r2(d('RecalcStyleCount') / secs),
      mainThreadBusyPct: r2((d('TaskDuration') / secs) * 100),
    },
    heapMB: [r2(m0.JSHeapUsedSize / 1048576), r2(m1.JSHeapUsedSize / 1048576)],
  };
}

async function sceneProfile(browser, url, key) {
  const prof = PROFILES[key];
  const ctx = await newContext(browser, prof.ctx);
  await ctx.addInitScript(initScript, { fx: prof.fx });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  await page.goto(`${url}/?hour=12&weather=clear&debug=1`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder="Tu nombre"]', 'Tester');
  await page.click('button.btn.big:not(.primary)');
  await page.click('button:has-text("Crear")');
  await page.waitForSelector('.code', { timeout: 120000 });
  await page.click('.btn.primary.big');
  await page.waitForSelector('text=Empezar', { timeout: 120000 });
  await page.click('.btn.primary.big:has-text("Empezar")');
  await page.waitForSelector('canvas', { timeout: 120000 });
  await page.waitForFunction(() => !!window.__nc?.runtime?.me && !!window.__gl && !!window.__r3f, null, { timeout: 120000 });
  await page.waitForSelector('.toolbar', { timeout: 120000 });
  const seed = await page.evaluate(() => window.__nc.useGame.getState().couple?.seed);
  await page.waitForTimeout(WARMUP_MS); // compilación de shaders, primer montaje
  await page.evaluate(installProbes);
  await page.waitForTimeout(1500);
  const idle = await phase(page, cdp, 'quieta', 'idle');
  const move = await phase(page, cdp, 'movimiento', 'walk');
  const camera = await phase(page, cdp, 'zoom+giro', 'camera');
  const panels = await page.evaluate(openPanels, { ids: ['today', 'inventory', 'market', 'quests', 'orders', 'mailbox', 'help'] });
  const top = await page.evaluate(() => Object.entries(window.__perf.ufNames).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, Math.round(v)]));
  const subs = await page.evaluate(() => window.__perf.subs);
  const info = await page.evaluate(() => ({ dpr: devicePixelRatio, coarse: matchMedia('(pointer: coarse)').matches, fx: window.__nc.useGame.getState().quality, canvas: [document.querySelector('canvas').width, document.querySelector('canvas').height] }));
  await page.screenshot({ path: path.join(OUT_DIR, `${LABEL}-${key}.png`) });
  await ctx.close();
  return { profile: prof.label, seed, info, useFrameSubscribers: subs, idle, move, camera, panels, topUseFrameTotalMs: top, errors: errors.slice(0, 5) };
}

// ---------------------------------------------------------------- carga
async function loadProfile(browser, url) {
  const runs = [];
  for (let i = 0; i < LOAD_RUNS; i++) {
    const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 }, boot: true });
    await ctx.addInitScript(initScript, { fx: '0' });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 });
    const T0 = Date.now();
    await page.goto(`${url}/?hour=12&weather=clear&debug=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder="Tu nombre"]', { timeout: 120000 });
    const tLogin = Date.now() - T0;
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0] || {};
      const res = performance.getEntriesByType('resource').filter((r) => /\.js(\?|$)/.test(r.name));
      return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime, jsReq: res.length, jsBytes: res.reduce((a, r) => a + (r.encodedBodySize || 0), 0) };
    });
    await page.fill('input[placeholder="Tu nombre"]', 'Tester');
    await page.click('button.btn.big:not(.primary)');
    await page.click('button:has-text("Crear")');
    await page.waitForSelector('.code', { timeout: 120000 });
    const T1 = Date.now();
    await page.click('.btn.primary.big');
    await page.waitForSelector('.loading-screen', { timeout: 120000 });
    const tLoading = Date.now() - T1;
    const jsAtAvatar = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => /\.js(\?|$)/.test(r.name)).length);
    await page.waitForSelector('.loading-screen button', { timeout: 120000 });
    const tEnter = Date.now() - T1; // con swiftshader suele toparse en los 15 s de seguridad: solo valen comparaciones relativas
    const jsAtEnter = jsAtAvatar;
    runs.push({ tLoginMs: tLogin, tLoadingScreenMs: tLoading, tEnterMs: tEnter, ...nav, jsAtAvatar, jsAtEnter });
    await ctx.close();
  }
  const med = (k) => pct(runs.map((r) => r[k]), 0.5);
  return { runs: LOAD_RUNS, cpuThrottle: 2, tLoginMs: med('tLoginMs'), tLoadingScreenMs: med('tLoadingScreenMs'), tEnterMs: med('tEnterMs'), fcpMs: r2(med('fcp')), jsRequests: med('jsReq'), jsBytesEncoded: med('jsBytes'), raw: runs };
}

// ---------------------------------------------------------------- principal
async function main() {
  const only = opt('only', null);
  let server, url;
  if (flag('dev')) {
    server = await startVite(); url = server.url;
  } else {
    if (!flag('no-build')) {
      console.log('Compilando (vite build)…');
      const r = spawnSync('npx', ['vite', 'build', '--logLevel', 'error'], { cwd: ROOT, stdio: 'inherit' });
      if (r.status !== 0) throw new Error('falló el build');
    }
    const port = await freePort();
    const pv = await vitePreview({ root: ROOT, logLevel: 'error', preview: { host: '127.0.0.1', port, strictPort: true } });
    url = `http://127.0.0.1:${port}`;
    server = { close: () => new Promise((res) => pv.httpServer.close(res)) };
  }
  void viteBuild;
  const result = { label: LABEL, date: new Date().toISOString(), mode: flag('dev') ? 'dev' : 'build', phaseSeconds: PHASE_MS / 1000, note: 'Render por software (swiftshader): solo valen las comparaciones en la misma máquina y las métricas independientes de GPU.' };
  if (!flag('dev')) result.bundle = bundleSizes();
  const browser = await launch();
  try {
    result.load = await loadProfile(browser, url);
    console.log('carga:', JSON.stringify({ ...result.load, raw: undefined }));
    for (const key of Object.keys(PROFILES)) {
      if (only && only !== key) continue;
      console.log(`escena ${key}…`);
      result[key] = await sceneProfile(browser, url, key);
      const s = result[key];
      for (const ph of [s.idle, s.move, s.camera]) console.log(`  ${ph.name.padEnd(10)} fps=${ph.fps} calls p50=${ph.drawCalls.p50} tris p50=${ph.triangles.p50} jsFrame p50/p95=${ph.jsPerFrameMs.p50}/${ph.jsPerFrameMs.p95} ms commits/s=${ph.reactCommitsPerSec} longtasks=${ph.longTasks} geo=${ph.memory.geometries} tex=${ph.memory.textures} leak=${ph.memory.leak}`);
      console.log('  paneles (1ª/2ª apertura, ms):', s.panels.map((p) => `${p.id}=${p.firstMs}/${p.repeatMs}`).join(' '));
    }
  } finally {
    await browser.close();
    await server.close();
  }
  const file = path.join(OUT_DIR, `${LABEL}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(`\nResultados: ${path.relative(ROOT, file)}`);
  if (result.bundle) console.log(`JS entrada gzip=${result.bundle.entryJsGzip} total gzip=${result.bundle.totalJsGzip}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
