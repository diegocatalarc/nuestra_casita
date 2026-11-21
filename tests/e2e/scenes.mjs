// Escenas narradas en el navegador (modo demo): el prólogo y la intro salen solos, se avanza tocando, aparece la guía
// de objetivo, al hablar con el vecino objetivo se ve el recuadro de misión y al completar el capítulo sale la recompensa.
// Uso: npm run scenes
import { startVite, launch, newContext, watchErrors, startGame } from './harness.mjs';

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    const ctx = await newContext(browser, { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, scenes: true });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await startGame(page, vite.url);
    const nc = (fn, arg) => page.evaluate(fn, arg);
    // toque directo sobre la escena (sin esperas de «actionability»: el renderizado por software va lento)
    const tap = async () => { await page.evaluate(() => document.querySelector('.story-scene')?.click()); await page.waitForTimeout(350); };

    // 1) Prólogo: tarjeta de libro y páginas del narrador
    await page.waitForSelector('.story-scene', { timeout: 30_000 }).catch(() => {});
    check(await page.locator('.story-scene').count() === 1, 'el prólogo aparece solo al empezar');
    check((await page.locator('.ss-card').innerText().catch(() => '')).includes('Despertar el valle'), 'la primera pantalla es la tarjeta del libro');
    await page.screenshot({ path: '/tmp/claude-0/-home-user/ef51b309-d084-511b-8ea1-b09971a2f27c/scratchpad/scene-card.png' }).catch(() => {});
    // avanzar tocando hasta que cambie la escena (prólogo: tarjeta + 4 páginas; luego tarjeta del capítulo 1)
    let sawChapterCard = false;
    for (let i = 0; i < 20; i++) {
      const card = await page.locator('.ss-card h1').first().innerText().catch(() => '');
      if (card.includes('Carta de bienvenida')) { sawChapterCard = true; break; }
      await tap();
    }
    check(sawChapterCard, 'tras el prólogo llega la intro del capítulo 1 con su tarjeta');
    for (let i = 0; i < 10 && await page.locator('.story-scene').count(); i++) {
      await tap();
    }
    check(await page.locator('.story-scene').count() === 0, 'las escenas se cierran al terminar');

    // 2) Guía de objetivo
    check(await page.locator('.objective').count() === 1, 'aparece la guía de objetivo');
    check((await page.locator('.objective').innerText()).includes('Doña Remedios'), 'el objetivo inicial es saludar a Doña Remedios');
    await page.screenshot({ path: '/tmp/claude-0/-home-user/ef51b309-d084-511b-8ea1-b09971a2f27c/scratchpad/objective.png' }).catch(() => {});

    // 3) Hablar con ella: recuadro de misión en el diálogo y, al cumplirse el paso, escena de reacción
    await nc(async () => { const m = await import('/src/ui/DialogueModal.jsx'); m.openDialogue('remedios'); });
    await page.waitForTimeout(900);
    check((await page.locator('[role="dialog"]').innerText()).includes('Ahora'), 'el diálogo muestra la misión actual');
    await nc(async () => { const m = await import('/src/ui/DialogueModal.jsx'); m.closeDialogue(); });
    await page.waitForSelector('.story-scene', { timeout: 15_000 }).catch(() => {});
    check((await page.locator('.ss-say').innerText().catch(() => '')).includes('Ya estáis aquí') || (await page.locator('.ss-say').count()) > 0, 'cumplir el paso dispara su escena de reacción');
    await nc(() => window.__nc.useGame.getState().set({}));
    for (let i = 0; i < 6 && await page.locator('.story-scene').count(); i++) { await tap(); }

    // 4) Completar el capítulo → cierre con recompensa
    await nc(async () => {
      const { useGame, backend, logic } = window.__nc; const s = useGame.getState(); const wk = logic.weekKey(Date.now());
      await backend.getBackend().write(s.coupleId, [{ op: 'inc', field: `stats.${wk}.harvest`, by: 3 }, { op: 'inc', field: `stats.${wk}.order`, by: 1 }]);
    });
    await page.waitForSelector('.ss-card.reward', { timeout: 40_000 }).catch(async () => {
      for (let i = 0; i < 8 && !(await page.locator('.ss-card.reward').count()); i++) { await tap(); }
    });
    check(await page.locator('.ss-card.reward').count() === 1, 'al completar el capítulo sale la tarjeta de recompensa');
    const coins0 = await nc(() => window.__nc.useGame.getState().couple.coins || 0);
    await page.evaluate(() => document.querySelector('.ss-card.reward button')?.click());
    await page.waitForTimeout(1500);
    check(await nc(() => !!window.__nc.useGame.getState().couple.story.claimed?.c1), 'recibir la recompensa reclama el capítulo 1');
    check((await nc(() => window.__nc.useGame.getState().couple.coins || 0)) > coins0, 'las monedas de la recompensa llegan');

    // 5) Empieza el capítulo 2 con su intro
    await page.waitForSelector('.story-scene', { timeout: 15_000 }).catch(() => {});
    check((await page.locator('.ss-card h1').first().innerText().catch(() => '')).includes('El horno apagado'), 'después llega la intro del capítulo 2');

    check(errors.length === 0, `sin errores de página ${errors.slice(0, 2).join(' | ')}`);
  } finally { await browser.close(); await vite.close(); }
  if (failures.length) { console.log(`\n${failures.length} fallo(s)`); process.exit(1); }
  console.log('\nTodo OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
