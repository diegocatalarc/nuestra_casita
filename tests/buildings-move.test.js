import { describe, it, expect } from 'vitest';
import { validateBuilding } from '../src/game/logic';
import { generateWorld } from '../src/game/worldGen';
import { BUILDINGS } from '../src/game/constants';

const world = generateWorld(1234);
const type = Object.keys(BUILDINGS).find((k) => !BUILDINGS[k].fixed);
const { w, d } = BUILDINGS[type];
// busca un hueco libre de hierba
function freeSpot() {
  for (let z = 10; z < 40; z++) for (let x = 10; x < 40; x++) if (validateBuilding(world, { buildings: {}, decor: {}, soil: {}, nodes: {} }, type, x, z, 0).ok) return { x, z };
  throw new Error('sin hueco');
}
describe('mover edificios', () => {
  const { x, z } = freeSpot();
  const st = { buildings: { b1: { type, x, z, w, d } }, decor: {}, soil: {}, nodes: {} };
  it('sin ignoreId, el edificio se solapa consigo mismo', () => {
    expect(validateBuilding(world, st, type, x, z, 0).ok).toBe(false);
  });
  it('con ignoreId, se puede recolocar encima de su propio sitio', () => {
    expect(validateBuilding(world, st, type, x, z, 0, 'b1').ok).toBe(true);
  });
  it('un edificio ajeno sigue bloqueando (por solape, no por otra causa)', () => {
    const st2 = { ...st, buildings: { ...st.buildings, b2: { type, x: x + 1, z, w, d } } };
    const r = validateBuilding(world, st2, type, x, z, 0, 'b1');
    expect(r.ok).toBe(false); expect(r.reason).toBe('Se solapa con otro edificio');
  });
  it('un cultivo sin cosechar bloquea el destino; cosechado, no', () => {
    const live = { ...st, buildings: {}, crops: { [`${x}_${z}`]: { x, z, harvested: false } } };
    expect(validateBuilding(world, live, type, x, z, 0).reason).toBe('Hay cultivos en medio');
    const done = { ...st, buildings: {}, crops: { [`${x}_${z}`]: { x, z, harvested: true } } };
    expect(validateBuilding(world, done, type, x, z, 0).ok).toBe(true);
  });
});
