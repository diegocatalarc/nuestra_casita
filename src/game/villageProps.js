// Props fijos del pueblo viejo (junto a la casa). Rectángulos [x0, z0, x1, z1] en casillas.
// Sirven para (1) impedir construir encima y (2) ocultar el prop si una partida antigua ya tiene un edificio ahí.
export const VILLAGE_PROPS = {
  cobbles: [41, 16.8, 46.2, 21.2],
  fountain: [42.4, 17.9, 44.6, 20.1],
  benchA: [40.7, 18.9, 41.7, 20.3],
  benchB: [45.3, 17.9, 46.3, 19.3],
  stall: [39.6, 19.8, 41.6, 21.4],
};
// Los que bloquean obras nuevas (los adoquines son solo suelo).
export const VILLAGE_SOLID = ['fountain', 'benchA', 'benchB', 'stall'];

const hit = (r, b) => b.x < r[2] && b.x + b.w > r[0] && b.z < r[3] && b.z + b.d > r[1];
/** ¿Sigue libre el prop (ningún edificio del jugador encima)? */
export const propFree = (id, buildings) => !Object.values(buildings || {}).some((b) => hit(VILLAGE_PROPS[id], b));
/** ¿Un edificio nuevo en (x,z,w,d) pisaría un prop sólido del pueblo? */
export const touchesVillageProp = (x, z, w, d) => VILLAGE_SOLID.some((id) => hit(VILLAGE_PROPS[id], { x, z, w, d }));
