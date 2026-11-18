import { ZONES, TILE } from '../constants';
import { serverNow } from '../time';
import { nodeBlocksTile, nodeAlive, canAfford, buildingAt } from '../logic';
import { idx } from '../worldGen';
import { sfx } from '../audio';
import { t } from '../../i18n';
import { goAndDo } from './base';
import { commit, doAnim, fx, heartOps, logActivity, spend, st, toast } from './core';

// =====================================================================
//  TERRENO: arar tierra y comprar ampliaciones
// =====================================================================
/** Convierte hierba o pradera en tierra de cultivo (en cualquier parte del terreno que ya sea vuestra). */
export function tillAt(tx, tz) {
  goAndDo(tx + 0.5, tz + 0.5, () => {
    const s = st(), key = `${tx}_${tz}`;
    const tl = s.world.tiles[idx(tx, tz)];
    if (tl === TILE.VOID) return toast(t("🔒 Terreno sin comprar"));
    if (tl !== TILE.GRASS && tl !== TILE.MEADOW) return toast(t("Solo se ara la hierba o la pradera"));
    if (tl === TILE.SOIL || s.soil[key]) return toast(t("Ya es tierra de cultivo"));
    if (buildingAt(s.buildings, tx, tz)) return toast(t("Hay un edificio encima"));
    if (nodeBlocksTile(s.world, tx, tz, s.nodes, serverNow()) || s.world.byTile.has(key) && nodeAlive(s.world.byTile.get(key), s.nodes, serverNow())) return toast(t("Hay algo en medio: recógelo primero"));
    doAnim('dig');
    commit([{ op: 'set', col: 'soil', id: key, data: { x: tx, z: tz, by: s.user.uid } }]);
    fx('🟫', tx + 0.5, tz + 0.5);
  }, 1.6);
}

/** Vuelve a dejar la tierra arada como hierba (si no hay nada plantado). */
export function untillAt(tx, tz) {
  const s = st(), key = `${tx}_${tz}`;
  if (!s.soil[key]) return toast(t("Solo se puede deshacer la tierra que habéis arado"));
  const c = s.crops[key];
  if (c && !c.harvested) return toast(t("Hay algo plantado"));
  commit([{ op: 'del', col: 'soil', id: key }]);
}

export const zoneOwned = (couple, id) => !!ZONES[id]?.free || !!couple?.zones?.[id];
export const zoneAvailable = (couple, id) => { const z = ZONES[id]; return !z.needs || z.needs.some((k) => zoneOwned(couple, k)); };

export function buyZone(id) {
  const s = st(), z = ZONES[id];
  if (!z || zoneOwned(s.couple, id)) return;
  if (!zoneAvailable(s.couple, id)) return toast(t("Primero necesitáis una ampliación vecina"));
  if ((s.couple.coins || 0) < z.coins) return toast(t("Faltan monedas 🪙"));
  if (!canAfford(s.couple.inventory, z.items)) return toast(t("Faltan materiales"));
  commit([{ op: 'inc', field: 'coins', by: -z.coins }, ...spend(z.items), { op: 'patch', data: { [`zones.${id}`]: true } }, ...heartOps(20)]);
  logActivity('zone', z.label);
  sfx('build');
  toast(t("🗺️ ¡Nuevo terreno: {0}! +20 💗", [z.label]));
}


