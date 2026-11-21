// Estado mutable de alta frecuencia (60 fps). Vive fuera de React/zustand a propósito.
import { SPAWN } from './constants';
import { sfx } from './audio';

export const me = {
  x: SPAWN.x, z: SPAWN.z, rot: 0, moving: false,
  act: null, actUntil: 0, // animación de acción (water, harvest, build, wave, love…)
  path: [], pending: null, insideId: null,
  sleeping: false, sleepSpot: null, tired: false,
  boat: false, passenger: null, // en el bote (passenger = uid de quien lo lleva)
  fish: null, // {x, z, state: 'wait'|'bite', biteAt, missAt} mientras pescas
};

/** Cámara: guiñada actual (la usa el movimiento relativo a la cámara) */
export const cam = { yaw: Math.PI / 4, zoom: 46 };

/** Jugadores remotos: uid → {x,z,rot,anim,tx,tz,trot,name,online,t,inside} */
export const others = {};
/** Posición viva de cada vecino del Valle (la escribe scene/Npcs.jsx; la lee la guía de objetivos). */
export const npcPos = {};
/** Vecino al que apunta el objetivo de la historia (scene/Npcs.jsx le pone un marcador). */
export const goal = { npc: null };

/** Ids de edificios con alguien dentro (para desvanecer techos) */
export const occupied = new Set();

export function doAnim(name, ms = 900) {
  me.act = name;
  sfx(name);
  me.actUntil = performance.now() + ms;
}

export function currentAnim() {
  if (me.act && performance.now() < me.actUntil) return me.act;
  if (me.fish) return 'fish';
  if (me.boat) return me.moving && !me.passenger ? 'row' : 'sit';
  return me.moving ? 'walk' : 'idle';
}

export function remoteAnim(p) {
  return p.anim || 'idle';
}
