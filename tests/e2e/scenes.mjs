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
    const ctx = await newContext(browser, { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, scenes: true, boot: true });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    const nc = (fn, arg) => page.evaluate(fn, arg);
    // toque directo sobre la escena (sin esperas de «actionability»: el renderizado por software va lento)
    const tap = async () => { await page.evaluate(() => document.querySelector('.story-scene')?.click()); await page.waitForTimeout(350); };
    const onLoading = async () => {
      check(await page.locator('.loading-screen').count() === 1, 'se ve la pantalla de carga');
      await page.waitForSelector('.loading-screen button', { timeout: 90_000 }).catch(() => {});
      check(await page.locator('.loading-screen button').count() === 1, 'la carga acaba pidiendo pulsar «Entrar al valle»');
      await page.waitForTimeout(4000);
      check(await page.locator('.loading-screen button').count() === 1, 'el botón «Entrar» no desaparece al cabo de unos segundos (sin parpadeos de listo/cargando)');
      check(await page.evaluate(() => { const h = document.querySelectorAll('.loading-screen'); return h.length === 1 && getComputedStyle(h[0]).zIndex >= 100000000; }), 'la pantalla de carga queda por encima de las etiquetas del mundo');
      check(await page.locator('.story-scene').count() === 0, 'las escenas no empiezan hasta entrar');
      await page.screenshot({ path: '/tmp/claude-0/-home-user/ef51b309-d084-511b-8ea1-b09971a2f27c/scratchpad/loading.png' }).catch(() => {});
      await page.evaluate(() => document.querySelector('.loading-screen button')?.click());
      await page.waitForTimeout(500);
      check(await page.locator('.loading-screen').count() === 0, 'al entrar desaparece la pantalla de carga');
    };
    // El prólogo es lo PRIMERO que se ve (antes del editor de avatar)
    const beforeAvatar = async () => {
    await page.waitForSelector('.story-scene', { timeout: 30_000 }).catch(() => {});
    check(await page.locator('.story-scene').count() === 1, 'el prólogo aparece solo, antes del editor de avatar');
    check((await page.locator('.ss-card').innerText().catch(() => '')).includes('El Valle Atrasado'), 'la primera pantalla es la tarjeta del libro');
    await page.screenshot({ path: '/tmp/claude-0/-home-user/ef51b309-d084-511b-8ea1-b09971a2f27c/scratchpad/scene-card.png' }).catch(() => {});
    // avanzar tocando hasta que cambie la escena (prólogo: tarjeta + 4 páginas; luego tarjeta del capítulo 1)
    let sawChapterCard = false;
    for (let i = 0; i < 20; i++) {
      const card = await page.locator('.ss-card h1').first().innerText().catch(() => '');
      if (card.includes('La primavera que no llegó')) { sawChapterCard = true; break; }
      await tap();
    }
    check(sawChapterCard, 'tras el prólogo llega la intro del capítulo 1 con su tarjeta');
    for (let i = 0; i < 10 && await page.locator('.story-scene').count(); i++) {
      await tap();
    }
    check(await page.locator('.story-scene').count() === 0, 'las escenas se cierran al terminar');

    };
    await startGame(page, vite.url, { onLoading, beforeAvatar });

    // 2) Guía de objetivo
    check(await page.locator('.objective').count() === 1, 'aparece la guía de objetivo');
    check((await page.locator('.objective').innerText()).includes('Doña Remedios'), 'el objetivo inicial es presentarse a Doña Remedios');
    await page.screenshot({ path: '/tmp/claude-0/-home-user/ef51b309-d084-511b-8ea1-b09971a2f27c/scratchpad/objective.png' }).catch(() => {});

    // 3) Hablar con ella: recuadro de misión en el diálogo y, al cumplirse el paso, escena de reacción
    await nc(async () => { const m = await import('/src/ui/DialogueModal.jsx'); m.openDialogue('remedios'); });
    await page.waitForTimeout(900);
    // al abrir el diálogo con Remedios el paso «saludar» se cumple al instante, así que no queda misión pendiente con ella
    check((await page.locator('[role="dialog"]').innerText()).includes('Doña Remedios'), 'el diálogo con Doña Remedios se abre');
    await nc(async () => { const m = await import('/src/ui/DialogueModal.jsx'); m.closeDialogue(); });
    await page.waitForSelector('.story-scene', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2500); // el texto se escribe solo
    check((await page.locator('.ss-say').innerText().catch(() => '')).includes('forasteros en prácticas'), 'cumplir el paso dispara su escena de reacción');
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
    check((await page.locator('.ss-card h1').first().innerText().catch(() => '')).includes('Expediente de verano'), 'después llega la intro del capítulo 2');

    // 6) Dos ciudades: la escena del reloj (cap. 6) muestra las dos horas y la zona se guarda en la entrada propia
    await page.waitForTimeout(1500);
    for (let i = 0; i < 8 && await page.locator('.story-scene').count(); i++) await tap(); // cierra lo que haya en pantalla
    check(!!(await nc(() => window.__nc.useGame.getState().couple.players?.[window.__nc.useGame.getState().user.uid]?.tz)), 'la zona horaria de la persona se guarda en couple.players.<uid>.tz');
    await nc(async () => { const m = await import('/src/game/story/director.js'); m.replayScene('c6.outro'); });
    await page.waitForSelector('.story-scene', { timeout: 10_000 }).catch(() => {});
    for (let i = 0; i < 4 && !(await page.locator('.ss-clocks').count()); i++) await tap();
    check(await page.locator('.ss-clocks').count() === 1, 'la escena del reloj muestra las dos horas');
    check(/\d\d:\d\d/.test(await page.locator('.ss-clocks').innerText().catch(() => '')), 'los relojes muestran una hora HH:MM');
    for (let i = 0; i < 6 && await page.locator('.story-scene').count(); i++) await tap();

    check(errors.length === 0, `sin errores de página ${errors.slice(0, 2).join(' | ')}`);
  } finally { await browser.close(); await vite.close(); }
  if (failures.length) { console.log(`\n${failures.length} fallo(s)`); process.exit(1); }
  console.log('\nTodo OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
