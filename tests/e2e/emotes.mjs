// Dos jugadores en modo demo (dos pestañas del mismo navegador): A hace un emote y B lo ve (campo `anim` de la presencia).
// También comprueba que el chat llega de uno a otro. Uso: npm run emotes
import { startVite, launch, newContext, watchErrors, startGame } from './harness.mjs';

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    const ctx = await newContext(browser, { viewport: { width: 900, height: 640 } });
    const A = await ctx.newPage(); const errA = watchErrors(A);
    await startGame(A, vite.url, { name: 'Ana' });
    const code = await A.evaluate(() => window.__nc.useGame.getState().couple.inviteCode);
    check(/^[A-Z0-9]{6}$/.test(code || ''), `Ana crea la casita (código ${code})`);

    // B se une con el código
    const B = await ctx.newPage(); const errB = watchErrors(B);
    await B.goto(`${vite.url}/?hour=12&weather=clear&debug=1`, { waitUntil: 'domcontentloaded' });
    await B.fill('input[placeholder="Tu nombre"]', 'Beto');
    await B.click('button.btn.big:not(.primary)');
    await B.fill('input[placeholder="CÓDIGO"]', code);
    await B.click('button:has-text("Unirme")');
    await B.waitForSelector('text=Empezar', { timeout: 120_000 });
    await B.click('.btn.primary.big:has-text("Empezar")', { force: true, timeout: 90_000 });
    await B.waitForSelector('.toolbar', { timeout: 120_000 });
    await B.waitForFunction(() => !!window.__nc?.runtime?.me, null, { timeout: 60_000 });

    // Se ven mutuamente (presencia)
    const sees = (p) => p.waitForFunction(() => Object.values(window.__nc.runtime.others).some((o) => o.online), null, { timeout: 40_000 }).then(() => true).catch(() => false);
    check(await sees(A), 'Ana ve a Beto en línea');
    check(await sees(B), 'Beto ve a Ana en línea');

    // Emote de A → B lo ve
    const played = await A.evaluate(async () => { const m = await import('/src/game/emotes.js'); return m.playEmote('dance'); });
    check(played === true, 'Ana hace el emote «bailar»');
    const seen = await B.waitForFunction(() => Object.values(window.__nc.runtime.others).some((o) => o.anim === 'emo_dance'), null, { timeout: 15_000 }).then(() => true).catch(() => false);
    check(seen, 'Beto ve el emote de Ana (anim emo_dance en la presencia)');

    // Chat A → B
    await A.evaluate(async () => { await window.__nc.actions.sendChat('hola Beto'); });
    const got = await B.waitForFunction(() => Object.values(window.__nc.useGame.getState().chat).some((m) => m.text === 'hola Beto'), null, { timeout: 15_000 }).then(() => true).catch(() => false);
    check(got, 'el chat llega de Ana a Beto');

    check(errA.length + errB.length === 0, `sin errores en ninguna pestaña (${errA.length + errB.length})`);
    for (const e of [...errA, ...errB]) console.log(`   - ${e}`);
    await ctx.close();
  } finally { await browser.close(); await vite.close(); }
  if (failures.length) { console.log(`\n${failures.length} comprobación(es) fallida(s):\n - ${failures.join('\n - ')}`); process.exit(1); }
  console.log('\nTodo en verde.');
}
main().catch((e) => { console.error(e); process.exit(1); });
