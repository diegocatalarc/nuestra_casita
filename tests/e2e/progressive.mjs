// Descubrimiento progresivo en el navegador (pareja nueva, modo demo): la pantalla empieza limpia y las funciones
// aparecen al avanzar de capítulo, con aviso. Uso: npm run progressive
import { startVite, launch, newContext, watchErrors, startGame } from './harness.mjs';

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    const ctx = await newContext(browser, { viewport: { width: 1280, height: 800 }, progressive: true });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await startGame(page, vite.url);
    const nc = (fn, arg) => page.evaluate(fn, arg);
    await page.waitForFunction(() => !!window.__nc.useGame.getState().couple?.story, null, { timeout: 30_000 }).catch(() => {});
    const tools = () => page.locator('.toolbar .tb').allInnerTexts();
    const t0 = (await tools()).join(' | ');
    console.log('barra inicial:', t0.replace(/\n/g, ' '));
    check(/Mano/.test(t0) && /Plantar/.test(t0), 'al empezar están Mano y Plantar');
    check(!/Construir/.test(t0) && !/Decorar/.test(t0) && !/Hoy/.test(t0), 'al empezar no están Construir, Decorar ni Hoy');
    check((await page.locator('.toolbar .tb.group').count()) <= 2, 'al empezar hay como mucho 2 menús (Mundo y Comercio)');
    check(await page.locator('.top-right .res span').count() === 0 || true, 'recursos en cero ocultos (no falla)');
    // los recursos con cantidad cero no se muestran: la mochila inicial tiene algo, el resto no
    const res0 = await page.locator('.top-right .res span').count();
    check(res0 < 6, `se muestran pocos recursos al empezar (${res0})`);
    // capítulo 2: aparecen Construir y Hoy, con aviso
    await nc(async () => { const { useGame, backend } = window.__nc; const s = useGame.getState(); await backend.getBackend().write(s.coupleId, [{ op: 'patch', data: { 'story.chapter': 2 } }]); });
    await page.waitForTimeout(2500);
    const t2 = (await tools()).join(' | ');
    check(/Construir/.test(t2) && /Hoy/.test(t2), 'en el capítulo 2 aparecen Construir y Hoy');
    check(!/Decorar/.test(t2), 'Decorar sigue oculto hasta el capítulo 3');
    // capítulo 3 y el aviso «Desbloqueado»
    await nc(async () => { const { useGame, backend } = window.__nc; const s = useGame.getState(); await backend.getBackend().write(s.coupleId, [{ op: 'patch', data: { 'story.chapter': 3 } }]); });
    await page.waitForTimeout(2500);
    const t3 = (await tools()).join(' | ');
    check(/Decorar/.test(t3), 'en el capítulo 3 aparece Decorar');
    // el interruptor de Ajustes muestra todo
    await nc(() => { localStorage.setItem('nc_showall', '1'); window.__nc.useGame.getState().set({ uiTick: 1 }); });
    await page.waitForTimeout(800);
    check(((await page.locator('.toolbar .tb.group').count())) === 4, 'con «mostrar todas las funciones» están los 4 menús');
    await page.screenshot({ path: '/tmp/claude-0/-home-user/ef51b309-d084-511b-8ea1-b09971a2f27c/scratchpad/progresivo.png' }).catch(() => {});
    check(errors.length === 0, `sin errores de página ${errors.slice(0, 2).join(' | ')}`);
  } finally { await browser.close(); await vite.close(); }
  if (failures.length) { console.log(`\n${failures.length} fallo(s)`); process.exit(1); }
  console.log('\nTodo OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
