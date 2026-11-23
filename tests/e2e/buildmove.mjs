// Mover un edificio ya construido + la guía de misión no tapa el HUD en pantalla estrecha. Uso: npm run buildmove
import { startVite, launch, newContext, watchErrors, startGame } from './harness.mjs';

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`); };

async function main() {
  const vite = await startVite();
  const browser = await launch();
  try {
    const ctx = await newContext(browser, { viewport: { width: 820, height: 1100 } });
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await startGame(page, vite.url);
    const r = await page.evaluate(async () => {
      const { useGame } = window.__nc, a = window.__nc.actions, lg = window.__nc.logic;
      const c = useGame.getState().couple;
      const big = Object.fromEntries(Object.keys(c.inventory || {}).map((k) => [k, 999]));
      useGame.setState({ couple: { ...c, inventory: { ...c.inventory, ...big, wood: 999, stone: 999, plank: 999, brick: 999, fiber: 999 } } });
      const s = () => useGame.getState();
      const type = 'barn' in (window.__nc.BUILDINGS || {}) ? 'barn' : null;
      return { hasType: !!type, keys: Object.keys(a).filter((k) => /Building/.test(k)), lg: Object.keys(lg || {}).includes('validateBuilding') };
    });
    check(r.keys.includes('moveBuilding'), 'la acción moveBuilding existe (' + r.keys.join(',') + ')');
    const mv = await page.evaluate(async () => {
      const { useGame } = window.__nc, a = window.__nc.actions, lg = window.__nc.logic;
      const g = () => useGame.getState();
      const spots = [];
      const type = 'workshop';
      const def = (await import('/src/game/constants.js')).BUILDINGS;
      const tp = def[type] && !def[type].fixed ? type : Object.keys(def).find((k) => !def[k].fixed);
      for (let z = 8; z < 40 && spots.length < 2; z++) for (let x = 8; x < 40 && spots.length < 2; x++) if (lg.validateBuilding(g().world, g(), tp, x, z, Date.now()).ok && !spots.some((p) => Math.abs(p.x - x) < 8 && Math.abs(p.z - z) < 8)) spots.push({ x, z });
      a.placeBuilding(tp, spots[0].x, spots[0].z);
      await new Promise((r) => setTimeout(r, 800));
      const id = Object.keys(g().buildings).find((k) => g().buildings[k].type === tp);
      if (!id) return { err: 'no se construyó', inv: g().couple.inventory };
      const bx = g().buildings[id];
      const lampId = 'testdecor1';
      a.commit([{ op: 'set', col: 'decor', id: lampId, data: { type: 'lamp', x: bx.x + 0.5, z: bx.z + 0.5, rot: 0, variant: 0 } }]);
      await new Promise((r) => setTimeout(r, 500));
      a.moveBuilding(id, spots[1].x, spots[1].z);
      await new Promise((r) => setTimeout(r, 800));
      const b = g().buildings[id];
      const carried = !!g().decor.testdecor1 && Math.abs(g().decor.testdecor1.x - (spots[1].x + 0.5)) < 0.01;
      const h0 = { ...g().buildings.house };
      a.moveBuilding('house', 30, 30);
      await new Promise((r) => setTimeout(r, 300));
      return { carried, moved: b.x === spots[1].x && b.z === spots[1].z, houseStill: g().buildings.house.x === h0.x && g().buildings.house.z === h0.z, to: spots[1], now: { x: b.x, z: b.z } };
    });
    console.log(JSON.stringify(mv));
    check(mv.moved, 'moveBuilding cambia el edificio de sitio');
    check(mv.carried, 'la decoración de dentro se va con el edificio');
    check(mv.houseStill, 'la casa no se mueve');
    const fx2 = await page.evaluate(async () => {
      const { useGame, runtime, actions: a } = window.__nc;
      const g = () => useGame.getState();
      const bid = Object.keys(g().buildings).find((k) => g().buildings[k].type !== 'house' && k !== 'house');
      // monedas negativas se corrigen a 0
      useGame.setState({ couple: { ...g().couple, coins: -50 } });
      a.healCoins(); await new Promise((r) => setTimeout(r, 600));
      const coinsOk = !(g().couple.coins < 0);
      // dormir en una cama de edificio: seguirla al moverse
      const house = g().buildings.house;
      const spot = { id: 'house:0', x: house.x + 0.95, z: house.z + 1.3, rot: 0 };
      runtime.me.sleeping = true; runtime.me.sleepSpot = spot;
      useGame.setState({ buildings: { ...g().buildings, house: { ...house, x: house.x + 3 } } });
      a.checkSleepTogether();
      const followed = runtime.me.sleepSpot.x === spot.x + 3;
      useGame.setState({ buildings: { ...g().buildings, house } });
      runtime.me.sleeping = false; runtime.me.sleepSpot = null;
      return { coinsOk, followed, bid: !!bid };
    });
    check(fx2.coinsOk, 'monedas negativas se corrigen a 0');
    check(fx2.followed, 'quien duerme en un edificio lo sigue si se mueve');
    await page.screenshot({ path: '/tmp/claude-0/-home-user/ef51b309-d084-511b-8ea1-b09971a2f27c/scratchpad/obj820.png' });
    const ov = await page.evaluate(() => {
      const o = document.querySelector('.objective')?.getBoundingClientRect();
      const others = ['.resbar', '.chips', '.vitals', '.topbar', '.hud-right'].map((q) => [q, document.querySelector(q)?.getBoundingClientRect()]).filter(([, r]) => r);
      const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      return { obj: o && { l: o.left, t: o.top, r: o.right, b: o.bottom }, overlaps: o ? others.filter(([, r]) => hit(o, r)).map(([q]) => q) : [] };
    });
    console.log(JSON.stringify(ov));
    check(!!ov.obj, 'hay guía de misión');
    check(ov.obj && ov.obj.r < 820 / 2 + 40, 'la guía queda en el lado izquierdo (no centrada sobre el HUD)');
    check(ov.overlaps.length === 0, `la guía no se solapa con otros elementos (${ov.overlaps})`);
    check(errors.length === 0, `sin errores de página ${errors.slice(0, 2).join(' | ')}`);
  } finally { await browser.close(); await vite.close(); }
  if (failures.length) { console.log(`\n${failures.length} fallo(s)`); process.exit(1); }
  console.log('\nTodo OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
