// Prueba de integración de la historia en el navegador (modo demo): el motor arranca solo, los paneles abren,
// se aporta a un proyecto hasta completarlo (y se ve en el estado), y se reclama el capítulo 1.
// Uso: npm run story
import { startVite, launch, newContext, watchErrors, startGame } from './harness.mjs';

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    const ctx = await newContext(browser, { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await startGame(page, vite.url);
    const nc = (fn, arg) => page.evaluate(fn, arg);

    // 1) La historia arranca sola
    await page.waitForFunction(() => !!window.__nc.useGame.getState().couple?.story, null, { timeout: 30_000 }).catch(() => {});
    check(await nc(() => !!window.__nc.useGame.getState().couple?.story), 'la historia se inicializa sola (couple.story)');

    // 2) Paneles
    for (const p of ['story', 'today', 'project']) {
      await nc((p) => window.__nc.useGame.getState().set({ panel: p, projectId: p === 'project' ? 'fountain' : null }), p);
      await page.waitForTimeout(500);
      check(await page.locator('.modal').count() > 0, `el panel «${p}» se abre`);
    }
    await nc(() => window.__nc.useGame.getState().set({ panel: null }));

    // 3) Hoy muestra la tarjeta de historia
    await nc(() => window.__nc.useGame.getState().set({ panel: 'today' }));
    await page.waitForTimeout(400);
    check((await page.locator('.today').innerText()).includes('Historia del Valle'), 'Hoy muestra la tarjeta «Historia del Valle»');
    await nc(() => window.__nc.useGame.getState().set({ panel: null }));

    // 4) Aportar a la fuente hasta completarla (dos «personas»: el aporte usa inc)
    await nc(async () => {
      const { useGame, backend } = window.__nc; const s = useGame.getState();
      await backend.getBackend().write(s.coupleId, [{ op: 'inc', field: 'inventory.stone', by: 20 }, { op: 'inc', field: 'inventory.clay', by: 20 }, { op: 'inc', field: 'inventory.flower', by: 20 }]);
    });
    await page.waitForTimeout(500);
    for (const [item, n] of [['stone', 10], ['clay', 6], ['flower', 5]]) await nc(([i, n]) => window.__nc.actions.contribute('fountain', i, n), [item, n]);
    await page.waitForTimeout(1200);
    check(await nc(() => !!window.__nc.useGame.getState().couple.projects?.fountain?.done), 'la fuente queda terminada tras aportar todo');
    check(await nc(() => !!window.__nc.useGame.getState().couple.story?.flags?.['town:fountain']), 'terminar la fuente concede su flag');

    // 5) Capítulo 1: hablar con Remedios + 3 cosechas + 1 pedido → reclamar
    // hablar con Doña Remedios como lo hace el juego: abrir su diálogo (marca el paso «talk»)
    await nc(async () => { const m = await import('/src/ui/DialogueModal.jsx'); m.openDialogue('remedios'); });
    await page.waitForTimeout(800);
    check(await page.locator('[role="dialog"]').count() > 0, 'el diálogo con Doña Remedios se abre');
    check(await nc(() => !!window.__nc.useGame.getState().couple.story.steps?.c1?.a?.done), 'hablar con Remedios completa el paso 1 del capítulo 1');
    await nc(async () => { const m = await import('/src/ui/DialogueModal.jsx'); m.closeDialogue(); });
    await nc(async () => {
      const { useGame, backend, logic } = window.__nc; const s = useGame.getState(); const wk = logic.weekKey(Date.now());
      await backend.getBackend().write(s.coupleId, [{ op: 'inc', field: `stats.${wk}.harvest`, by: 3 }, { op: 'inc', field: `stats.${wk}.order`, by: 1 }]);
    });
    await page.waitForFunction(() => { const s = window.__nc.useGame.getState(); const c = s.couple?.story?.steps || {}; return Object.keys(c.c1 || {}).length >= 3; }, null, { timeout: 20_000 }).catch(() => {});
    const coins0 = await nc(() => window.__nc.useGame.getState().couple.coins || 0);
    await nc(() => window.__nc.actions.claimStoryChapter('c1'));
    await nc(() => window.__nc.actions.claimStoryChapter('c1')); // doble clic: no debe pagar dos veces
    await page.waitForTimeout(1200);
    const after = await nc(() => { const c = window.__nc.useGame.getState().couple; return { chapter: c.story.chapter, coins: c.coins || 0, claimed: !!c.story.claimed?.c1 }; });
    check(after.claimed && after.chapter === 2, `el capítulo 1 se reclama y se pasa al 2 (capítulo ${after.chapter})`);
    check(after.coins - coins0 === 100, `la recompensa se paga UNA sola vez (+${after.coins - coins0} monedas, esperado +100)`);

    check(errors.length === 0, `sin errores en toda la sesión (${errors.length})`);
    if (errors.length) console.log(errors.map((e) => `   - ${e}`).join('\n'));
    await ctx.close();
  } finally { await browser.close(); await vite.close(); }
  if (failures.length) { console.log(`\n${failures.length} comprobación(es) fallida(s):\n - ${failures.join('\n - ')}`); process.exit(1); }
  console.log('\nTodo en verde.');
}
main().catch((e) => { console.error(e); process.exit(1); });
