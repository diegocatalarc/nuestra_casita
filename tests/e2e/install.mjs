// Aviso de instalación en iPad («Para Bri 💗»): sale en iPad, no en escritorio, se pospone y no se repite. Uso: npm run install-prompt
import { startVite, launch, newContext, watchErrors, startGame } from './harness.mjs';

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    // iPad
    const ctx = await newContext(browser, { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, userAgent: IPAD_UA });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await startGame(page, vite.url);
    await page.waitForSelector('.install-prompt', { timeout: 40_000 }).catch(() => {});
    check(await page.locator('.install-prompt').count() === 1, 'en iPad aparece la tarjeta de instalación');
    check((await page.locator('.install-prompt').innerText().catch(() => '')).includes('Para Bri 💗'), 'el mensaje dice «Para Bri 💗»');
    check((await page.locator('.install-prompt').innerText().catch(() => '')).includes('Añadir a pantalla de inicio'), 'explica «Añadir a pantalla de inicio»');
    await page.screenshot({ path: '/tmp/claude-0/-home-user/ef51b309-d084-511b-8ea1-b09971a2f27c/scratchpad/instalar.png' }).catch(() => {});
    await page.evaluate(() => document.querySelector('.install-prompt .btn.primary')?.click());
    await page.waitForTimeout(500);
    check(await page.locator('.install-prompt').count() === 0, '«Entendido» la cierra');
    check(await page.evaluate(() => !!JSON.parse(localStorage.getItem('nc_install') || '{}').dismissedAt), 'se recuerda que se pospuso');
    // escritorio: no sale
    const ctx2 = await newContext(browser, { viewport: { width: 1280, height: 800 } });
    const p2 = await ctx2.newPage();
    await startGame(p2, vite.url);
    await p2.waitForTimeout(9000);
    check(await p2.locator('.install-prompt').count() === 0, 'en escritorio no aparece');
    check(errors.length === 0, `sin errores de página ${errors.slice(0, 2).join(' | ')}`);
  } finally { await browser.close(); await vite.close(); }
  if (failures.length) { console.log(`\n${failures.length} fallo(s)`); process.exit(1); }
  console.log('\nTodo OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
