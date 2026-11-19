// Test de humo: arranca el juego en demo y comprueba que no hay errores al
// abrir cada panel, el chat y la prueba táctil. Uso: npm run smoke
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, startVite, launch, newContext, watchErrors, startGame } from './harness.mjs';
import { runTouch } from './touch.mjs';

// Ids de panel tomados de HUD.jsx ({panel === 'x' && <...>}), para no mantener una lista a mano.
function panelIds() {
  const src = readFileSync(path.join(ROOT, 'src/ui/HUD.jsx'), 'utf8');
  return [...new Set([...src.matchAll(/\{panel === '(\w+)' && </g)].map((m) => m[1]))];
}

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    // --- Flujo de arranque + paneles + chat (escritorio) ---
    const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    const t0 = Date.now();
    await startGame(page, vite.url);
    console.log(`Juego arrancado en ${((Date.now() - t0) / 1000).toFixed(1)} s`);

    check(errors.length === 0, `arranque sin errores (${errors.length})`);
    check(await page.locator('canvas').count() > 0, 'canvas 3D presente');
    check(await page.locator('.toolbar').count() > 0, 'HUD (barra de herramientas) presente');

    const ids = panelIds();
    console.log(`Paneles a abrir (${ids.length}): ${ids.join(', ')}`);
    for (const id of ids) {
      const before = errors.length;
      await page.evaluate((p) => window.__nc.useGame.getState().set({ panel: p }), id);
      await page.waitForTimeout(400);
      const opened = await page.evaluate(() => window.__nc.useGame.getState().panel);
      const newErrors = errors.slice(before);
      check(opened === id && newErrors.length === 0, `panel '${id}' abre sin errores${newErrors.length ? `: ${newErrors.join(' | ')}` : ''}`);
      await page.evaluate(() => window.__nc.useGame.getState().set({ panel: null }));
      await page.waitForTimeout(150);
    }

    // Hoy / tutorial: el panel 'today' debe mostrar su contenido.
    await page.evaluate(() => window.__nc.useGame.getState().set({ panel: 'today' }));
    await page.waitForSelector('.today', { timeout: 10_000 }).catch(() => {});
    check(await page.locator('.today').count() > 0, "panel 'today' (Hoy) muestra su contenido");
    await page.evaluate(() => window.__nc.useGame.getState().set({ panel: null }));

    // Chat
    const beforeChat = errors.length;
    await page.click('.chatfab');
    await page.waitForSelector('.chatdock', { timeout: 10_000 }).catch(() => {});
    check(await page.locator('.chatdock').count() > 0 && errors.length === beforeChat, 'chat (.chatfab) se abre sin errores');
    await page.click('.chatdock .chat-head .x').catch(() => {});

    check(errors.length === 0, `sin errores en toda la sesión de escritorio (${errors.length})`);
    if (errors.length) console.log(errors.map((e) => `   - ${e}`).join('\n'));
    await ctx.close();

    // --- Prueba táctil (contexto nuevo con hasTouch) ---
    await runTouch(browser, vite.url, check);
  } finally {
    await browser.close();
    await vite.close();
  }
  if (failures.length) {
    console.error(`\n${failures.length} comprobación(es) fallida(s):\n- ${failures.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log('\nSmoke OK');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
