import { START_HEARTS, START_INVENTORY, HOUSE } from './constants';

export const SCHEMA_VERSION = 1;
export const COLLECTIONS = ['crops', 'buildings', 'decor', 'animals', 'memories', 'nodes', 'questLog', 'children', 'mailbox', 'activity', 'chat', 'soil', 'gifts', 'crafts'];

export function initialCouple(uid, name, code) {
  return {
    schemaVersion: SCHEMA_VERSION,
    members: [uid],
    inviteCode: code,
    seed: Math.floor(Math.random() * 900000) + 1000,
    startedAt: Date.now(),
    hearts: START_HEARTS,
    heartsTotal: START_HEARTS,
    inventory: { ...START_INVENTORY },
    players: { [uid]: { name } },
    daily: {},
  };
}

export const HOUSE_DOC = { type: 'house', x: HOUSE.x, z: HOUSE.z, w: HOUSE.w, d: HOUSE.d, builtAt: 0 };

export function genCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

/** Firestore no admite `undefined`. */
export function clean(o) {
  return JSON.parse(JSON.stringify(o, (k, v) => (v === undefined ? null : v)));
}
