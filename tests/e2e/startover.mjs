// «Empezar una casita nueva»: desde Ajustes se sale de la casita y vuelve la pantalla de crear/unirse; al crear una nueva, la
// pareja es nueva (modo progresivo). Uso: npm run startover
import { startVite, launch, newContext, watchErrors, startGame } from './harness.mjs';

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    const ctx = await newContext(browser, { viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await startGame(page, vite.url);
    const nc = (fn, arg) => page.evaluate(fn, arg);
    await nc(() => window.__nc.useGame.getState().set({ panel: 'help' }));
    await page.waitForSelector('button:has-text("Empezar una casita nueva")', { timeout: 20_000 }).catch(() => {});
    check(await page.locator('button:has-text("Empezar una casita nueva")').count() === 1, 'Ajustes ofrece «Empezar una casita nueva»');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Empezar una casita nueva'))?.click());
    await page.waitForSelector('button:has-text("Sí, dejar esta casita")', { timeout: 10_000 }).catch(() => {});
    check(await page.locator('button:has-text("Sí, dejar esta casita")').count() === 1, 'pide confirmación antes de salir');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Cancelar'))?.click());
    await page.waitForTimeout(300);
    check(await nc(() => window.__nc.useGame.getState().phase) === 'game', '«Cancelar» no cambia nada');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Empezar una casita nueva'))?.click());
    await page.waitForTimeout(300);
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sí, dejar esta casita'))?.click());
    await page.waitForTimeout(1500);
    check(await nc(() => window.__nc.useGame.getState().phase) === 'setup', 'tras confirmar vuelve la pantalla de crear o unirse');
    check(await page.locator('button:has-text("Crear")').count() > 0, 'se puede crear una casita nueva');
    check(errors.length === 0, `sin errores de página ${errors.slice(0, 2).join(' | ')}`);
  } finally { await browser.close(); await vite.close(); }
  if (failures.length) { console.log(`\n${failures.length} fallo(s)`); process.exit(1); }
  console.log('\nTodo OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
